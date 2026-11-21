"""Role-protected user administration endpoints."""
from functools import wraps
import json

from flask import Blueprint, jsonify, request

from database.database import get_connection
from routes.authorization import has_permission, require_permission
from routes.notifications import create_notification

admin_users_bp = Blueprint("admin_users", __name__)


def _roles_for_user(cursor, user_id):
    cursor.execute(
        """SELECT COALESCE(array_agg(r.role_key ORDER BY r.role_key), ARRAY[]::text[]) AS roles
           FROM app_user_roles ur JOIN app_roles r ON r.id = ur.role_id
           WHERE ur.user_id = ?""",
        (user_id,),
    )
    return cursor.fetchone()["roles"] or []


def _actor_roles(cursor, user_id):
    return _roles_for_user(cursor, user_id)


def _has_permission(cursor, user_id, permission_key):
    # Backwards-compatible alias for existing checks in this module.
    return has_permission(cursor, user_id, permission_key)


def _user_row(cursor, user_id):
    cursor.execute(
        """SELECT u.id, u.email, u.username, u.display_name, u.avatar_url,
                  u.account_status, u.email_verified_at, u.last_login_at, u.created_at,
                  COALESCE(array_agg(DISTINCT r.role_key) FILTER (WHERE r.role_key IS NOT NULL), ARRAY[]::text[]) AS roles
           FROM app_users u
           LEFT JOIN app_user_roles ur ON ur.user_id = u.id
           LEFT JOIN app_roles r ON r.id = ur.role_id
           WHERE u.id = ? GROUP BY u.id""",
        (user_id,),
    )
    row = cursor.fetchone()
    if not row:
        return None
    return {
        "id": row["id"], "email": row["email"], "username": row["username"],
        "display_name": row["display_name"], "avatar_url": row["avatar_url"],
        "account_status": row["account_status"], "roles": row["roles"] or [],
        "email_verified_at": row["email_verified_at"].isoformat() if row["email_verified_at"] else None,
        "last_login_at": row["last_login_at"].isoformat() if row["last_login_at"] else None,
        "created_at": row["created_at"].isoformat() if row["created_at"] else None,
    }


@admin_users_bp.route("/api/admin/users/summary", methods=["GET"])
@require_permission("users.view")
def users_summary():
    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute(
            """SELECT COUNT(*) AS total,
                      COUNT(*) FILTER (WHERE account_status = 'active') AS active,
                      COUNT(*) FILTER (WHERE account_status = 'pending') AS pending,
                      COUNT(*) FILTER (WHERE account_status = 'suspended') AS suspended,
                      COUNT(*) FILTER (WHERE account_status = 'disabled') AS disabled,
                      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS new_last_7_days
               FROM app_users"""
        )
        row = cursor.fetchone()
        return jsonify({"summary": {key: row[key] for key in row.keys()}})
    finally:
        connection.close()


@admin_users_bp.route("/api/admin/users", methods=["GET"])
@require_permission("users.view")
def list_users():
    search = (request.args.get("q") or "").strip()[:100]
    status = (request.args.get("status") or "").strip()
    role = (request.args.get("role") or "").strip()
    try:
        page = max(1, min(int(request.args.get("page", "1")), 100000))
        per_page = max(10, min(int(request.args.get("per_page", "25")), 100))
    except ValueError:
        return jsonify({"message": "Neplatné stránkování."}), 400
    if status and status not in {"active", "pending", "suspended", "disabled"}:
        return jsonify({"message": "Neplatný stav účtu."}), 400
    if role and role not in {"owner", "admin", "moderator", "member", "beta_tester"}:
        return jsonify({"message": "Neplatná role."}), 400

    where, params = [], []
    if search:
        where.append("(u.email ILIKE ? OR u.username ILIKE ? OR u.display_name ILIKE ?)")
        params.extend([f"%{search}%"] * 3)
    if status:
        where.append("u.account_status = ?")
        params.append(status)
    if role:
        where.append("EXISTS (SELECT 1 FROM app_user_roles ur2 JOIN app_roles r2 ON r2.id = ur2.role_id WHERE ur2.user_id = u.id AND r2.role_key = ?)")
        params.append(role)
    clause = (" WHERE " + " AND ".join(where)) if where else ""
    offset = (page - 1) * per_page

    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute(f"SELECT COUNT(*) AS total FROM app_users u{clause}", tuple(params))
        total = cursor.fetchone()["total"]
        cursor.execute(
            f"""SELECT u.id, u.email, u.username, u.display_name, u.avatar_url,
                       u.account_status, u.created_at, u.last_login_at,
                       COALESCE(array_agg(DISTINCT r.role_key) FILTER (WHERE r.role_key IS NOT NULL), ARRAY[]::text[]) AS roles
                FROM app_users u LEFT JOIN app_user_roles ur ON ur.user_id = u.id
                LEFT JOIN app_roles r ON r.id = ur.role_id {clause}
                GROUP BY u.id ORDER BY u.created_at DESC LIMIT ? OFFSET ?""",
            tuple(params + [per_page, offset]),
        )
        users = []
        for row in cursor.fetchall():
            users.append({
                "id": row["id"], "email": row["email"], "username": row["username"],
                "display_name": row["display_name"], "avatar_url": row["avatar_url"],
                "account_status": row["account_status"], "roles": row["roles"] or [],
                "created_at": row["created_at"].isoformat() if row["created_at"] else None,
                "last_login_at": row["last_login_at"].isoformat() if row["last_login_at"] else None,
            })
        return jsonify({"users": users, "page": page, "per_page": per_page, "total": total, "pages": (total + per_page - 1) // per_page})
    finally:
        connection.close()


@admin_users_bp.route("/api/admin/users/<int:user_id>", methods=["GET"])
@require_permission("users.view")
def get_user(user_id):
    connection = get_connection()
    try:
        user = _user_row(connection.cursor(), user_id)
        if not user:
            return jsonify({"message": "Uživatel nebyl nalezen."}), 404
        return jsonify({"user": user})
    finally:
        connection.close()


@admin_users_bp.route("/api/admin/users/<int:user_id>/status", methods=["PATCH"])
@require_permission("users.manage")
def update_user_status(user_id):
    data = request.get_json(silent=True) or {}
    status = data.get("account_status")
    if status not in {"active", "pending", "suspended", "disabled"}:
        return jsonify({"message": "Neplatný stav účtu."}), 400
    if user_id == request.user_id:
        return jsonify({"message": "Svůj vlastní účet nemůžeš tímto způsobem změnit."}), 400

    connection = get_connection()
    try:
        cursor = connection.cursor()
        if not _has_permission(cursor, request.user_id, "users.manage"):
            return jsonify({"message": "Nemáš oprávnění."}), 403
        actor_roles = _actor_roles(cursor, request.user_id)
        target_roles = _roles_for_user(cursor, user_id)
        if not target_roles and not _user_row(cursor, user_id):
            return jsonify({"message": "Uživatel nebyl nalezen."}), 404
        if "owner" in target_roles:
            return jsonify({"message": "Účet vlastníka nelze pozastavit ani vypnout. Nejprve je nutné bezpečně převést roli vlastníka."}), 409
        cursor.execute("UPDATE app_users SET account_status = ?, updated_at = NOW() WHERE id = ?", (status, user_id))
        cursor.execute("UPDATE app_user_sessions SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL", (user_id,))
        cursor.execute(
            "INSERT INTO app_user_admin_log (actor_user_id, target_user_id, action, details) VALUES (?, ?, 'status_changed', jsonb_build_object('account_status', ?))",
            (request.user_id, user_id, status),
        )
        connection.commit()
        return jsonify({"user": _user_row(cursor, user_id), "message": "Stav účtu byl změněn. Přihlášené relace uživatele byly ukončeny."})
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


@admin_users_bp.route("/api/admin/users/<int:user_id>/roles", methods=["PUT"])
@require_permission("roles.manage")
def update_user_roles(user_id):
    data = request.get_json(silent=True) or {}
    roles = data.get("roles")
    allowed = {"owner", "admin", "moderator", "member", "beta_tester"}
    if not isinstance(roles, list) or not roles or any(role not in allowed for role in roles) or len(set(roles)) != len(roles):
        return jsonify({"message": "Vyber alespoň jednu platnou roli."}), 400

    connection = get_connection()
    try:
        cursor = connection.cursor()
        actor_roles = _actor_roles(cursor, request.user_id)
        actor_is_owner = "owner" in actor_roles
        actor_is_admin = "admin" in actor_roles
        if not actor_is_owner and not actor_is_admin:
            return jsonify({"message": "Role může spravovat pouze vlastník nebo administrátor."}), 403
        if user_id == request.user_id:
            return jsonify({"message": "Své vlastní role nemůžeš měnit tímto formulářem."}), 400
        cursor.execute("SELECT id FROM app_users WHERE id = ? FOR UPDATE", (user_id,))
        if not cursor.fetchone():
            return jsonify({"message": "Uživatel nebyl nalezen."}), 404
        current_roles = _roles_for_user(cursor, user_id)
        if "owner" in current_roles:
            return jsonify({"message": "Role vlastníka nelze měnit běžným formulářem správy uživatelů."}), 409
        # Administrators may manage ordinary roles, but cannot grant/revoke admin or owner.
        if not actor_is_owner:
            privileged = {"owner", "admin"}
            if privileged.intersection(roles) or privileged.intersection(current_roles):
                return jsonify({"message": "Administrátor nemůže přidělovat ani měnit role administrátora či vlastníka."}), 403
        cursor.execute("DELETE FROM app_user_roles WHERE user_id = ?", (user_id,))
        cursor.execute("INSERT INTO app_user_roles (user_id, role_id, assigned_by) SELECT ?, id, ? FROM app_roles WHERE role_key = ANY(?)", (user_id, request.user_id, roles))
        cursor.execute("INSERT INTO app_user_admin_log (actor_user_id, target_user_id, action, details) VALUES (?, ?, 'roles_changed', jsonb_build_object('roles', ?::jsonb))", (request.user_id, user_id, __import__('json').dumps(roles)))
        create_notification(cursor, user_id, "roles_changed", "Změna role účtu", "Role tvého účtu byly aktualizovány.", "/account?tab=notifications", {"roles": roles})
        connection.commit()
        return jsonify({"user": _user_row(cursor, user_id), "message": "Role byly aktualizovány."})
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


@admin_users_bp.route("/api/admin/users/<int:user_id>/audit", methods=["GET"])
@require_permission("users.view")
def user_audit(user_id):
    connection = get_connection()
    try:
        cursor = connection.cursor()
        if not _user_row(cursor, user_id):
            return jsonify({"message": "Uživatel nebyl nalezen."}), 404
        cursor.execute(
            """SELECT l.id, l.action, l.details, l.created_at,
                      actor.username AS actor_username
               FROM app_user_admin_log l
               LEFT JOIN app_users actor ON actor.id = l.actor_user_id
               WHERE l.target_user_id = ?
               ORDER BY l.created_at DESC
               LIMIT 50""",
            (user_id,),
        )
        events = []
        for row in cursor.fetchall():
            events.append({
                "id": row["id"],
                "action": row["action"],
                "details": row["details"] or {},
                "created_at": row["created_at"].isoformat() if row["created_at"] else None,
                "actor_username": row["actor_username"] or "Systém",
            })
        return jsonify({"events": events})
    finally:
        connection.close()


@admin_users_bp.route("/api/admin/users/<int:user_id>/permissions", methods=["GET"])
@require_permission("users.view")
def get_user_permissions(user_id):
    connection = get_connection()
    try:
        cursor = connection.cursor()
        if not _user_row(cursor, user_id):
            return jsonify({"message": "Uživatel nebyl nalezen."}), 404

        cursor.execute(
            """
            SELECT
                p.permission_key,
                p.label,
                p.description,
                EXISTS (
                    SELECT 1
                    FROM app_user_roles ur
                    JOIN app_role_permissions rp ON rp.role_id = ur.role_id
                    WHERE ur.user_id = ?
                      AND rp.permission_id = p.id
                ) AS role_granted,
                EXISTS (
                    SELECT 1
                    FROM app_user_roles ur
                    JOIN app_roles r ON r.id = ur.role_id
                    WHERE ur.user_id = ? AND r.role_key = 'owner'
                ) AS is_owner,
                up.granted AS user_override
            FROM app_permissions p
            LEFT JOIN app_user_permissions up
              ON up.permission_id = p.id AND up.user_id = ?
            ORDER BY p.permission_key
            """,
            (user_id, user_id, user_id),
        )
        permissions = []
        for row in cursor.fetchall():
            override = row["user_override"]
            role_granted = bool(row["role_granted"])
            is_target_owner = bool(row["is_owner"])
            effective = True if is_target_owner else (bool(override) if override is not None else role_granted)
            permissions.append({
                "permission_key": row["permission_key"],
                "label": row["label"],
                "description": row["description"],
                "role_granted": role_granted,
                "user_override": override,
                "effective": effective,
                "source": (
                    "owner" if is_target_owner
                    else "individual_allow" if override is True
                    else "individual_deny" if override is False
                    else "role" if role_granted
                    else "none"
                ),
            })
        return jsonify({"permissions": permissions})
    finally:
        connection.close()


@admin_users_bp.route("/api/admin/users/<int:user_id>/permissions", methods=["PUT"])
@require_permission("roles.manage")
def update_user_permissions(user_id):
    # Individual overrides can grant powerful access, so only an owner may edit them.
    connection = get_connection()
    try:
        cursor = connection.cursor()
        actor_roles = _actor_roles(cursor, request.user_id)
        if "owner" not in actor_roles:
            return jsonify({"message": "Individuální oprávnění může měnit pouze vlastník."}), 403

        if not _user_row(cursor, user_id):
            return jsonify({"message": "Uživatel nebyl nalezen."}), 404

        data = request.get_json(silent=True) or {}
        overrides = data.get("overrides")
        if not isinstance(overrides, list):
            return jsonify({"message": "Očekáván seznam individuálních oprávnění."}), 400

        normalized = {}
        for item in overrides:
            if not isinstance(item, dict):
                return jsonify({"message": "Neplatný záznam oprávnění."}), 400
            key = item.get("permission_key")
            granted = item.get("granted")
            if not isinstance(key, str) or not key.strip() or type(granted) is not bool:
                return jsonify({"message": "Každé oprávnění musí obsahovat klíč a hodnotu granted true/false."}), 400
            if key in normalized:
                return jsonify({"message": "Oprávnění je v požadavku uvedeno vícekrát."}), 400
            normalized[key] = granted

        if len(normalized) > 100:
            return jsonify({"message": "Příliš mnoho individuálních oprávnění."}), 400

        if normalized:
            cursor.execute(
                "SELECT permission_key FROM app_permissions WHERE permission_key = ANY(?)",
                (list(normalized.keys()),),
            )
            known = {row["permission_key"] for row in cursor.fetchall()}
            unknown = set(normalized) - known
            if unknown:
                return jsonify({"message": "Neznámé oprávnění: " + ", ".join(sorted(unknown))}), 400

        cursor.execute("DELETE FROM app_user_permissions WHERE user_id = ?", (user_id,))
        for permission_key, granted in normalized.items():
            cursor.execute(
                """
                INSERT INTO app_user_permissions
                    (user_id, permission_id, granted, granted_by, granted_at)
                SELECT ?, id, ?, ?, NOW()
                FROM app_permissions
                WHERE permission_key = ?
                """,
                (user_id, granted, request.user_id, permission_key),
            )

        create_notification(cursor, user_id, "permissions_changed", "Změna oprávnění účtu", "Individuální oprávnění tvého účtu byla aktualizována.", "/account?tab=notifications")
        cursor.execute(
            """
            INSERT INTO app_user_admin_log
                (actor_user_id, target_user_id, action, details)
            VALUES (?, ?, 'permissions_changed', jsonb_build_object('overrides', ?::jsonb))
            """,
            (request.user_id, user_id, json.dumps(
                [{"permission_key": key, "granted": value} for key, value in normalized.items()],
                ensure_ascii=False,
            )),
        )
        connection.commit()
        return jsonify({"message": "Individuální oprávnění byla uložena."})
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


@admin_users_bp.route("/api/admin/badges", methods=["GET"])
@require_permission("users.view")
def list_badges():
    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT badge_key,title,description,icon,rarity,is_hidden,is_active FROM app_badges ORDER BY created_at ASC")
        return jsonify({"badges":[dict(row) for row in cursor.fetchall()]})
    finally:
        connection.close()


@admin_users_bp.route("/api/admin/users/<int:user_id>/badges", methods=["GET"])
@require_permission("users.view")
def get_user_badges(user_id):
    connection = get_connection()
    try:
        cursor = connection.cursor()
        if not _user_row(cursor, user_id):
            return jsonify({"message":"Uživatel nebyl nalezen."}), 404
        cursor.execute("""SELECT b.badge_key,b.title,b.description,b.icon,b.rarity,ub.awarded_at
                          FROM app_user_badges ub JOIN app_badges b ON b.id=ub.badge_id
                          WHERE ub.user_id=? ORDER BY ub.awarded_at DESC""", (user_id,))
        badges=[]
        for row in cursor.fetchall():
            badges.append({"badge_key":row["badge_key"],"title":row["title"],"description":row["description"],"icon":row["icon"],"rarity":row["rarity"],"awarded_at":row["awarded_at"].isoformat() if row["awarded_at"] else None})
        return jsonify({"badges":badges})
    finally:
        connection.close()


@admin_users_bp.route("/api/admin/users/<int:user_id>/badges", methods=["POST"])
@require_permission("users.manage")
def award_user_badge(user_id):
    data = request.get_json(silent=True) or {}
    badge_key = data.get("badge_key")
    if not isinstance(badge_key, str) or not badge_key.strip():
        return jsonify({"message":"Vyber platný odznak."}), 400
    connection = get_connection()
    try:
        cursor = connection.cursor()
        if not _user_row(cursor, user_id):
            return jsonify({"message":"Uživatel nebyl nalezen."}), 404
        cursor.execute("SELECT id FROM app_badges WHERE badge_key=? AND is_active=TRUE", (badge_key.strip(),))
        badge = cursor.fetchone()
        if not badge:
            return jsonify({"message":"Odznak nebyl nalezen."}), 404
        cursor.execute("INSERT INTO app_user_badges(user_id,badge_id,awarded_by) VALUES(?,?,?) ON CONFLICT(user_id,badge_id) DO NOTHING", (user_id,badge["id"],request.user_id))
        cursor.execute("INSERT INTO app_user_admin_log(actor_user_id,target_user_id,action,details) VALUES(?,?, 'badge_awarded', jsonb_build_object('badge_key',?))", (request.user_id,user_id,badge_key.strip()))
        connection.commit()
        return jsonify({"message":"Odznak byl uživateli přidělen."})
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


@admin_users_bp.route("/api/admin/users/<int:user_id>/badges/<badge_key>", methods=["DELETE"])
@require_permission("users.manage")
def revoke_user_badge(user_id, badge_key):
    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute("DELETE FROM app_user_badges ub USING app_badges b WHERE ub.badge_id=b.id AND ub.user_id=? AND b.badge_key=?", (user_id,badge_key))
        if cursor.rowcount:
            cursor.execute("INSERT INTO app_user_admin_log(actor_user_id,target_user_id,action,details) VALUES(?,?, 'badge_revoked', jsonb_build_object('badge_key',?))", (request.user_id,user_id,badge_key))
        connection.commit()
        return jsonify({"message":"Odznak byl odebrán."})
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()

