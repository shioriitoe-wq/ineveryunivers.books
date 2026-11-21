"""Hierarchical access-resource administration for InEveryUnivers."""
from database.database import get_connection

VALID_TYPES = {
    "section", "page", "panel", "book", "volume", "part", "chapter",
    "character", "video", "track", "community_item", "other",
}
VALID_MODES = {"inherit", "public", "authenticated", "roles", "users", "locked", "hidden", "profile"}


def _resource_dict(row):
    return {
        "id": int(row["id"]),
        "resource_key": row["resource_key"],
        "label": row["label"],
        "resource_type": row["resource_type"],
        "parent_resource_id": int(row["parent_resource_id"]) if row["parent_resource_id"] is not None else None,
        "parent_resource_key": row["parent_resource_key"],
        "is_active": bool(row["is_active"]),
        "access_mode": row["access_mode"] or "inherit",
        "allowed_roles": list(row["allowed_roles"] or []),
        "allowed_users": list(row["allowed_users"] or []),
        "access_profile_id": int(row["access_profile_id"]) if row.get("access_profile_id") is not None else None,
        "access_profile_key": row.get("access_profile_key"),
        "locked_message": row["locked_message"] or "Tento obsah je momentálně uzamčen.",
        "available_from": row["available_from"].isoformat() if row["available_from"] else None,
        "available_until": row["available_until"].isoformat() if row["available_until"] else None,
        "updated_at": row["updated_at"].isoformat() if row["updated_at"] else None,
    }


def _resource_select(cursor, resource_id=None):
    sql = """
        SELECT r.id, r.resource_key, r.label, r.resource_type,
               r.parent_resource_id, parent.resource_key AS parent_resource_key,
               r.is_active, r.updated_at,
               ar.access_mode, ar.available_from, ar.available_until,
               ar.access_profile_id, ap.profile_key AS access_profile_key,
               ar.locked_message,
               COALESCE((
                   SELECT array_agg(role.role_key ORDER BY role.role_key)
                   FROM access_rule_roles rr
                   JOIN app_roles role ON role.id = rr.role_id
                   WHERE rr.access_rule_id = ar.id
               ), ARRAY[]::text[]) AS allowed_roles,
               COALESCE((
                   SELECT array_agg(u.id ORDER BY u.id)
                   FROM access_rule_users ru
                   JOIN app_users u ON u.id = ru.user_id
                   WHERE ru.access_rule_id = ar.id
               ), ARRAY[]::bigint[]) AS allowed_users
        FROM access_resources r
        LEFT JOIN access_resources parent ON parent.id = r.parent_resource_id
        LEFT JOIN access_rules ar ON ar.resource_id = r.id
        LEFT JOIN access_profiles ap ON ap.id = ar.access_profile_id
    """
    if resource_id is not None:
        cursor.execute(sql + " WHERE r.id = ? ORDER BY r.label", (resource_id,))
    else:
        cursor.execute(sql + " ORDER BY r.resource_type, r.label")
    rows = cursor.fetchall()
    return [_resource_dict(row) for row in rows]


def get_access_control_admin_data():
    connection = get_connection()
    try:
        cursor = connection.cursor()
        resources = _resource_select(cursor)
        cursor.execute("SELECT role_key, label FROM app_roles ORDER BY label")
        roles = [{"value": row["role_key"], "label": row["label"]} for row in cursor.fetchall()]
        cursor.execute("SELECT id, profile_key, label, description FROM access_profiles WHERE is_active = TRUE ORDER BY id")
        profiles = [{"id": int(row["id"]), "value": row["profile_key"], "label": row["label"], "description": row["description"]} for row in cursor.fetchall()]
        cursor.execute(
            """SELECT id, username, display_name
               FROM app_users
               WHERE account_status = 'active'
               ORDER BY COALESCE(NULLIF(display_name, ''), username), id"""
        )
        users = [{
            "id": int(row["id"]),
            "label": (row["display_name"] or row["username"]) + f" (ID {row['id']})",
        } for row in cursor.fetchall()]
        return {"resources": resources, "roles": roles, "users": users, "profiles": profiles}
    finally:
        connection.close()


def save_access_resource(payload, actor_user_id):
    if not isinstance(payload, dict):
        raise ValueError("Očekávám objekt nastavení zdroje.")
    key = payload.get("resource_key")
    label = payload.get("label")
    resource_type = payload.get("resource_type")
    mode = payload.get("access_mode", "inherit")
    parent_key = payload.get("parent_resource_key") or None
    if not isinstance(key, str) or not key.strip() or len(key.strip()) > 180:
        raise ValueError("Identifikátor musí mít 1 až 180 znaků.")
    if not isinstance(label, str) or not label.strip() or len(label.strip()) > 180:
        raise ValueError("Název musí mít 1 až 180 znaků.")
    if resource_type not in VALID_TYPES:
        raise ValueError("Neplatný typ chráněného obsahu.")
    if mode not in VALID_MODES:
        raise ValueError("Neplatný režim přístupu.")
    roles = payload.get("allowed_roles", [])
    users = payload.get("allowed_users", [])
    if not isinstance(roles, list) or any(not isinstance(x, str) for x in roles):
        raise ValueError("Seznam rolí nemá platný formát.")
    if not isinstance(users, list) or any(not str(x).isdigit() for x in users):
        raise ValueError("Seznam uživatelů musí obsahovat číselná ID.")
    if mode == "roles" and not roles and not users:
        raise ValueError("Pro tento režim vyber alespoň jednu povolenou roli nebo uživatele.")
    if mode == "users" and not users:
        raise ValueError("Vyber alespoň jednoho povoleného uživatele.")
    profile_key = payload.get("access_profile_key") or None
    if mode == "profile" and not isinstance(profile_key, str):
        raise ValueError("Vyber přístupový profil.")
    message = payload.get("locked_message", "Tento obsah je momentálně uzamčen.")
    if not isinstance(message, str):
        raise ValueError("Zpráva při uzamčení musí být text.")
    message = message.strip()[:1000] or "Tento obsah je momentálně uzamčen."
    available_from = payload.get("available_from") or None
    available_until = payload.get("available_until") or None
    is_active = payload.get("is_active", True)
    if not isinstance(is_active, bool):
        raise ValueError("Stav zdroje musí být boolean.")

    connection = get_connection()
    try:
        cursor = connection.cursor()
        parent_id = None
        if parent_key:
            cursor.execute("SELECT id FROM access_resources WHERE resource_key = ?", (parent_key,))
            parent = cursor.fetchone()
            if not parent:
                raise ValueError("Nadřazený obsah nebyl nalezen.")
            parent_id = int(parent["id"])
            cursor.execute("SELECT id FROM access_resources WHERE resource_key = ?", (key.strip(),))
            existing = cursor.fetchone()
            if existing and int(existing["id"]) == parent_id:
                raise ValueError("Obsah nemůže být sám sobě nadřazený.")

        cursor.execute(
            """INSERT INTO access_resources
                   (resource_key, label, resource_type, parent_resource_id, is_active, updated_at)
               VALUES (?, ?, ?, ?, ?, NOW())
               ON CONFLICT (resource_key) DO UPDATE SET
                   label = EXCLUDED.label,
                   resource_type = EXCLUDED.resource_type,
                   parent_resource_id = EXCLUDED.parent_resource_id,
                   is_active = EXCLUDED.is_active,
                   updated_at = NOW()
               RETURNING id""",
            (key.strip(), label.strip(), resource_type, parent_id, is_active),
        )
        resource_id = int(cursor.fetchone()["id"])

        # Prevent cycles in the resource tree.
        cursor.execute(
            """WITH RECURSIVE descendants(id, parent_resource_id, depth) AS (
                   SELECT id, parent_resource_id, 0 FROM access_resources WHERE id = ?
                   UNION ALL
                   SELECT child.id, child.parent_resource_id, d.depth + 1
                   FROM access_resources child
                   JOIN descendants d ON child.parent_resource_id = d.id
                   WHERE d.depth < 50
               )
               SELECT EXISTS(SELECT 1 FROM descendants WHERE id = ?) AS cycle""",
            (resource_id, parent_id if parent_id is not None else -1),
        )
        if bool(cursor.fetchone()["cycle"]):
            raise ValueError("Toto zařazení by vytvořilo cyklus v hierarchii.")

        cursor.execute(
            """INSERT INTO access_rules
                   (resource_id, access_mode, access_profile_id, available_from, available_until, locked_message,
                    updated_by, updated_at)
               VALUES (?, ?, (SELECT id FROM access_profiles WHERE profile_key = ?), ?, ?, ?, ?, NOW())
               ON CONFLICT (resource_id) DO UPDATE SET
                   access_mode = EXCLUDED.access_mode,
                   access_profile_id = EXCLUDED.access_profile_id,
                   available_from = EXCLUDED.available_from,
                   available_until = EXCLUDED.available_until,
                   locked_message = EXCLUDED.locked_message,
                   updated_by = EXCLUDED.updated_by,
                   updated_at = NOW()
               RETURNING id""",
            (resource_id, mode, profile_key, available_from, available_until, message, actor_user_id),
        )
        rule_id = int(cursor.fetchone()["id"])
        if mode == "profile":
            cursor.execute("SELECT id FROM access_profiles WHERE profile_key = ? AND is_active = TRUE", (profile_key,))
            if not cursor.fetchone():
                raise ValueError("Vybraný přístupový profil neexistuje nebo není aktivní.")

        cursor.execute("DELETE FROM access_rule_roles WHERE access_rule_id = ?", (rule_id,))
        cursor.execute("DELETE FROM access_rule_users WHERE access_rule_id = ?", (rule_id,))
        if roles:
            cursor.execute(
                """INSERT INTO access_rule_roles (access_rule_id, role_id)
                   SELECT ?, id FROM app_roles WHERE role_key = ANY(?)""",
                (rule_id, roles),
            )
            cursor.execute(
                "SELECT COUNT(*) AS count FROM access_rule_roles WHERE access_rule_id = ?",
                (rule_id,),
            )
            if int(cursor.fetchone()["count"]) != len(set(roles)):
                raise ValueError("Některá vybraná role neexistuje.")
        if users:
            ids = list(dict.fromkeys(int(x) for x in users))
            cursor.execute(
                """INSERT INTO access_rule_users (access_rule_id, user_id)
                   SELECT ?, id FROM app_users WHERE id = ANY(?) AND account_status = 'active'""",
                (rule_id, ids),
            )
            cursor.execute(
                "SELECT COUNT(*) AS count FROM access_rule_users WHERE access_rule_id = ?",
                (rule_id,),
            )
            if int(cursor.fetchone()["count"]) != len(ids):
                raise ValueError("Některý vybraný uživatel neexistuje nebo není aktivní.")

        cursor.execute(
            """INSERT INTO access_change_log
                   (resource_id, changed_by, action, old_values, new_values)
               VALUES (?, ?, 'resource_saved', '{}'::jsonb, jsonb_build_object(
                   'resource_key', ?, 'access_mode', ?
               ))""",
            (resource_id, actor_user_id, key.strip(), mode),
        )
        connection.commit()
        return _resource_select(cursor, resource_id)[0]
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()
