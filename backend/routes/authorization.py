"""Central authorization helpers for InEveryUnivers.

This module is the single decision point for:
- functional permissions (role grants + per-user allow/deny overrides)
- hierarchical content access (access_resources + access_rules)

The helpers do not create or modify database records.
"""
from functools import wraps

from flask import jsonify, request

from database.database import get_connection
from routes.user_auth import _current_user_id, require_user


def user_roles(cursor, user_id):
    """Return all role keys assigned to a user."""
    if user_id is None:
        return []
    cursor.execute(
        """
        SELECT COALESCE(array_agg(r.role_key ORDER BY r.role_key), ARRAY[]::text[]) AS roles
        FROM app_user_roles ur
        JOIN app_roles r ON r.id = ur.role_id
        WHERE ur.user_id = ?
        """,
        (user_id,),
    )
    row = cursor.fetchone()
    return list(row["roles"] or []) if row else []


def is_owner(cursor, user_id):
    return "owner" in user_roles(cursor, user_id)


def has_permission(cursor, user_id, permission_key):
    """Check a functional permission.

    Precedence:
      1. Owner bypass.
      2. An explicit per-user entry (granted TRUE or FALSE).
      3. A grant inherited from any assigned role.
      4. Deny by default.

    Account/session validity is checked by require_user before protected
    endpoints call this helper.
    """
    if user_id is None or not isinstance(permission_key, str) or not permission_key:
        return False

    if is_owner(cursor, user_id):
        return True

    cursor.execute(
        """
        SELECT up.granted
        FROM app_user_permissions up
        JOIN app_permissions p ON p.id = up.permission_id
        WHERE up.user_id = ? AND p.permission_key = ?
        LIMIT 1
        """,
        (user_id, permission_key),
    )
    user_override = cursor.fetchone()
    if user_override is not None:
        return bool(user_override["granted"])

    cursor.execute(
        """
        SELECT EXISTS (
            SELECT 1
            FROM app_user_roles ur
            JOIN app_role_permissions rp ON rp.role_id = ur.role_id
            JOIN app_permissions p ON p.id = rp.permission_id
            WHERE ur.user_id = ? AND p.permission_key = ?
        ) AS allowed
        """,
        (user_id, permission_key),
    )
    row = cursor.fetchone()
    return bool(row and row["allowed"])


def require_permission(permission_key):
    """Flask decorator for endpoints requiring a functional permission."""
    def decorator(function):
        @wraps(function)
        @require_user
        def wrapped(*args, **kwargs):
            connection = get_connection()
            try:
                cursor = connection.cursor()
                allowed = has_permission(cursor, request.user_id, permission_key)
            finally:
                connection.close()

            if not allowed:
                return jsonify({"message": "K této části webu nemáš oprávnění."}), 403
            return function(*args, **kwargs)
        return wrapped
    return decorator


def get_resource_access_decision(cursor, user_id, resource_key):
    """Return a presentation-safe access decision for one resource.

    status is one of: active, locked, hidden.
    - active: the caller may receive the resource payload.
    - locked: the caller may see a lock card/message, never the protected payload.
    - hidden: the resource must not be listed or disclosed.

    Every explicit ancestor rule is cumulative: a child can narrow but never loosen its parent's restriction. No rule keeps existing public behavior.
    Inactive resources/ancestors and unknown keys are hidden. Time-window
    restrictions and ordinary audience restrictions are locked. An explicit
    hidden rule is hidden for users outside its allow-list.
    """
    hidden = {
        "status": "hidden", "allowed": False,
        "locked_message": None, "resource_key": resource_key,
    }
    if not isinstance(resource_key, str) or not resource_key.strip():
        return hidden

    cursor.execute(
        """
        WITH RECURSIVE resource_chain AS (
            SELECT r.id, r.resource_key, r.parent_resource_id, r.is_active,
                   0 AS depth, ARRAY[r.id] AS visited
            FROM access_resources r
            WHERE r.resource_key = ?
            UNION ALL
            SELECT parent.id, parent.resource_key, parent.parent_resource_id,
                   parent.is_active, child.depth + 1,
                   child.visited || parent.id
            FROM access_resources parent
            JOIN resource_chain child ON child.parent_resource_id = parent.id
            WHERE NOT parent.id = ANY(child.visited) AND child.depth < 50
        )
        SELECT chain.id, chain.resource_key, chain.is_active, chain.depth,
               rule.id AS access_rule_id, rule.access_mode,
               rule.access_profile_id, rule.available_from, rule.available_until,
               rule.locked_message,
               ((rule.available_from IS NULL OR NOW() >= rule.available_from)
                AND (rule.available_until IS NULL OR NOW() < rule.available_until)) AS within_window
        FROM resource_chain chain
        LEFT JOIN access_rules rule ON rule.resource_id = chain.id
        ORDER BY chain.depth ASC
        """,
        (resource_key.strip(),),
    )
    chain = cursor.fetchall()
    if not chain:
        return hidden

    roles = user_roles(cursor, user_id) if user_id is not None else []
    if "owner" in roles:
        return {"status": "active", "allowed": True,
                "locked_message": None, "resource_key": resource_key}

    # A restriction on any ancestor must never be loosened by a more permissive
    # rule on a child. Child rules may narrow access further, but cannot reopen
    # a book/volume/part that an ancestor has locked or hidden.
    if any(not bool(row["is_active"]) for row in chain):
        return hidden

    explicit_rules = [
        row for row in chain
        if row["access_mode"] and row["access_mode"] != "inherit"
    ]
    if not explicit_rules:
        return {"status": "active", "allowed": True,
                "locked_message": None, "resource_key": resource_key}

    for rule in explicit_rules:
        message = (rule.get("locked_message") or
                   "Tento obsah je momentálně uzamčen.")
        mode = rule["access_mode"]

        if not bool(rule["within_window"]):
            return {"status": "locked", "allowed": False,
                    "locked_message": message, "resource_key": resource_key}

        if mode == "public":
            allowed = True
        elif mode == "authenticated":
            allowed = user_id is not None
        elif mode == "locked":
            allowed = False
        elif user_id is None:
            allowed = False
        elif mode in ("roles", "hidden"):
            cursor.execute(
                """SELECT EXISTS (
                       SELECT 1 FROM access_rule_roles arr
                       JOIN app_user_roles ur ON ur.role_id = arr.role_id
                       WHERE arr.access_rule_id = ? AND ur.user_id = ?
                   ) OR EXISTS (
                       SELECT 1 FROM access_rule_users aru
                       WHERE aru.access_rule_id = ? AND aru.user_id = ?
                   ) AS allowed""",
                (rule["access_rule_id"], user_id,
                 rule["access_rule_id"], user_id),
            )
            result = cursor.fetchone()
            allowed = bool(result and result["allowed"])
        elif mode == "profile":
            cursor.execute(
                """SELECT (
                       EXISTS (
                           SELECT 1 FROM access_profiles ap
                           JOIN access_profile_roles apr ON apr.profile_id = ap.id
                           JOIN app_user_roles ur ON ur.role_id = apr.role_id
                           WHERE ap.id = ? AND ap.is_active = TRUE AND ur.user_id = ?
                       ) OR EXISTS (
                           SELECT 1 FROM access_profiles ap
                           JOIN access_profile_users apu ON apu.profile_id = ap.id
                           WHERE ap.id = ? AND ap.is_active = TRUE AND apu.user_id = ?
                       )
                   ) AS allowed""",
                (rule["access_profile_id"], user_id,
                 rule["access_profile_id"], user_id),
            )
            result = cursor.fetchone()
            allowed = bool(result and result["allowed"])
        elif mode == "users":
            cursor.execute(
                """SELECT EXISTS (
                       SELECT 1 FROM access_rule_users
                       WHERE access_rule_id = ? AND user_id = ?
                   ) AS allowed""",
                (rule["access_rule_id"], user_id),
            )
            result = cursor.fetchone()
            allowed = bool(result and result["allowed"])
        else:
            return hidden

        if not allowed:
            if mode == "hidden":
                return hidden
            return {"status": "locked", "allowed": False,
                    "locked_message": message, "resource_key": resource_key}

    return {"status": "active", "allowed": True,
            "locked_message": None, "resource_key": resource_key}


def can_access_resource(cursor, user_id, resource_key):
    """Backward-compatible boolean access check for protected API routes."""
    return bool(get_resource_access_decision(cursor, user_id, resource_key)["allowed"])


def require_resource_access(resource_key):
    """Flask decorator for endpoints serving a protected content resource."""
    def decorator(function):
        @wraps(function)
        def wrapped(*args, **kwargs):
            # Resource rules can explicitly allow public access, so guests must
            # be evaluated too instead of being rejected by require_user first.
            request.user_id = _current_user_id()
            connection = get_connection()
            try:
                cursor = connection.cursor()
                allowed = can_access_resource(cursor, request.user_id, resource_key)
            finally:
                connection.close()

            if not allowed:
                return jsonify({"message": "K tomuto obsahu nemáš přístup."}), 403
            return function(*args, **kwargs)
        return wrapped
    return decorator


def filter_accessible_rows(cursor, rows, resource_key_for_row, user_id):
    """Filter a collection of resources with one recursive SQL query.

    The previous implementation called ``can_access_resource`` once per row.
    Each call performed a recursive resource lookup and, for signed-in users,
    another role lookup. On a remote PostgreSQL database this became an N+1
    round-trip bottleneck for books with many chapters or characters.

    This implementation preserves the same rules while resolving all resource
    chains, nearest explicit rules, active ancestors, and membership checks in
    one database round trip. Unknown resources remain denied and owner access
    still requires the resource to exist, matching ``can_access_resource``.
    """
    if not rows:
        return []

    row_keys = []
    for row in rows:
        key = resource_key_for_row(row)
        if isinstance(key, str) and key.strip():
            row_keys.append(key.strip())

    if not row_keys:
        return []

    # Keep first-seen order while avoiding duplicate VALUES entries.
    keys = list(dict.fromkeys(row_keys))
    values_sql = ", ".join("(?)" for _ in keys)

    cursor.execute(
        f"""
        WITH RECURSIVE requested(resource_key) AS (
            VALUES {values_sql}
        ),
        context AS (
            SELECT ?::bigint AS user_id
        ),
        resource_chain AS (
            SELECT requested.resource_key AS requested_key,
                   r.id, r.parent_resource_id, r.is_active,
                   0 AS depth, ARRAY[r.id] AS visited
            FROM requested
            JOIN access_resources r ON r.resource_key = requested.resource_key

            UNION ALL

            SELECT child.requested_key, parent.id, parent.parent_resource_id,
                   parent.is_active, child.depth + 1,
                   child.visited || parent.id
            FROM resource_chain child
            JOIN access_resources parent ON parent.id = child.parent_resource_id
            WHERE NOT parent.id = ANY(child.visited)
              AND child.depth < 50
        ),
        chain_status AS (
            SELECT requested_key, BOOL_AND(is_active) AS all_active
            FROM resource_chain
            GROUP BY requested_key
        ),
        rule_summary AS (
            SELECT
                chain.requested_key,
                BOOL_OR(
                    NOT (
                        (rule.available_from IS NULL OR NOW() >= rule.available_from)
                        AND (rule.available_until IS NULL OR NOW() < rule.available_until)
                    )
                    OR CASE
                        WHEN rule.access_mode = 'public' THEN FALSE
                        WHEN rule.access_mode = 'authenticated' THEN context.user_id IS NULL
                        WHEN rule.access_mode = 'locked' THEN TRUE
                        WHEN rule.access_mode IN ('roles', 'hidden') THEN NOT (
                            EXISTS (
                                SELECT 1 FROM access_rule_roles arr
                                JOIN app_user_roles ur ON ur.role_id = arr.role_id
                                WHERE arr.access_rule_id = rule.id
                                  AND ur.user_id = context.user_id
                            )
                            OR EXISTS (
                                SELECT 1 FROM access_rule_users aru
                                WHERE aru.access_rule_id = rule.id
                                  AND aru.user_id = context.user_id
                            )
                        )
                        WHEN rule.access_mode = 'profile' THEN NOT (
                            EXISTS (
                                SELECT 1 FROM access_profile_roles apr
                                JOIN app_user_roles ur ON ur.role_id = apr.role_id
                                JOIN access_profiles ap ON ap.id = apr.profile_id
                                    AND ap.is_active = TRUE
                                WHERE apr.profile_id = rule.access_profile_id
                                  AND ur.user_id = context.user_id
                            )
                            OR EXISTS (
                                SELECT 1 FROM access_profile_users apu
                                JOIN access_profiles ap ON ap.id = apu.profile_id
                                    AND ap.is_active = TRUE
                                WHERE apu.profile_id = rule.access_profile_id
                                  AND apu.user_id = context.user_id
                            )
                        )
                        WHEN rule.access_mode = 'users' THEN NOT EXISTS (
                            SELECT 1 FROM access_rule_users aru
                            WHERE aru.access_rule_id = rule.id
                              AND aru.user_id = context.user_id
                        )
                        ELSE TRUE
                    END
                ) AS denied
            FROM resource_chain chain
            JOIN access_rules rule ON rule.resource_id = chain.id
            CROSS JOIN context
            WHERE rule.access_mode IS NOT NULL
              AND rule.access_mode <> 'inherit'
            GROUP BY chain.requested_key
        )
        SELECT requested.resource_key,
               CASE
                   WHEN chain_status.requested_key IS NULL THEN FALSE
                   WHEN EXISTS (
                       SELECT 1
                       FROM app_user_roles owner_ur
                       JOIN app_roles owner_role ON owner_role.id = owner_ur.role_id
                       WHERE owner_ur.user_id = context.user_id
                         AND owner_role.role_key = 'owner'
                   ) THEN TRUE
                   WHEN NOT chain_status.all_active THEN FALSE
                   WHEN COALESCE(rule_summary.denied, FALSE) THEN FALSE
                   ELSE TRUE
               END AS allowed
        FROM requested
        CROSS JOIN context
        LEFT JOIN chain_status
          ON chain_status.requested_key = requested.resource_key
        LEFT JOIN rule_summary
          ON rule_summary.requested_key = requested.resource_key
        """,
        tuple(keys) + (user_id,),
    )

    allowed_keys = {
        result["resource_key"]
        for result in cursor.fetchall()
        if bool(result["allowed"])
    }

    return [
        row
        for row in rows
        if (resource_key_for_row(row) or "").strip() in allowed_keys
    ]


def resource_is_accessible(cursor, resource_key, user_id):
    return can_access_resource(cursor, user_id, resource_key)
