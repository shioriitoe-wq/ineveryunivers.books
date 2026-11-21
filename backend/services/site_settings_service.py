"""Database-backed central site settings with short-lived runtime caching."""
import time
from datetime import datetime

from database.database import get_connection
from threading import Lock

_RUNTIME_CACHE_LOCK = Lock()
_RUNTIME_CACHE_FILL_LOCK = Lock()
_RUNTIME_CACHE_TTL = 1.0
_RUNTIME_CACHE = {
    "site": None,
    "site_at": 0.0,
    "sections": {},
    "sections_at": {},
}


def _invalidate_site_cache():
    with _RUNTIME_CACHE_LOCK:
        _RUNTIME_CACHE["site"] = None
        _RUNTIME_CACHE["site_at"] = 0.0


def _invalidate_section_cache(section_keys=None):
    with _RUNTIME_CACHE_LOCK:
        if section_keys is None:
            _RUNTIME_CACHE["sections"].clear()
            _RUNTIME_CACHE["sections_at"].clear()
            return
        for section_key in section_keys:
            _RUNTIME_CACHE["sections"].pop(section_key, None)
            _RUNTIME_CACHE["sections_at"].pop(section_key, None)

SITE_SETTING_FIELDS = {
    "site_status",
    "maintenance_title",
    "maintenance_message",
    "maintenance_background_url",
    "expected_restore_at",
    "allow_admin_access",
    "allow_moderator_access",
    "allow_beta_tester_access",
}
VALID_SITE_STATUSES = {"active", "maintenance", "locked", "inactive"}
VALID_SECTION_STATUSES = {"active", "inactive", "locked", "authenticated", "roles"}


def _iso(value):
    return value.isoformat() if value is not None and hasattr(value, "isoformat") else value


def _site_dict(row):
    if not row:
        return None
    return {
        "site_status": row["site_status"],
        "maintenance_title": row["maintenance_title"],
        "maintenance_message": row["maintenance_message"],
        "maintenance_background_url": row["maintenance_background_url"],
        "expected_restore_at": _iso(row["expected_restore_at"]),
        "allow_admin_access": bool(row["allow_admin_access"]),
        "allow_moderator_access": bool(row["allow_moderator_access"]),
        "allow_beta_tester_access": bool(row["allow_beta_tester_access"]),
        "updated_at": _iso(row["updated_at"]),
    }


def _section_dict(row):
    return {
        "section_key": row["section_key"],
        "label": row["label"],
        "status": row["status"],
        "allowed_roles": list(row["allowed_roles"] or []),
        "locked_message": row["locked_message"],
        "updated_at": _iso(row["updated_at"]),
    }


def _feature_dict(row):
    return {
        "feature_key": row["feature_key"],
        "label": row["label"],
        "description": row["description"],
        "implementation_status": row["implementation_status"],
        "is_enabled": bool(row["is_enabled"]),
        "updated_at": _iso(row["updated_at"]),
    }


def get_admin_settings():
    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT * FROM site_settings WHERE id = 1")
        site = _site_dict(cursor.fetchone())
        cursor.execute("SELECT * FROM site_section_settings ORDER BY section_key")
        sections = [_section_dict(row) for row in cursor.fetchall()]
        cursor.execute("SELECT * FROM site_feature_flags ORDER BY feature_key")
        features = [_feature_dict(row) for row in cursor.fetchall()]
        return {"site": site, "sections": sections, "features": features}
    finally:
        connection.close()


def get_public_settings():
    """Return only information needed to render public availability states."""
    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute(
            """SELECT site_status, maintenance_title, maintenance_message,
                      maintenance_background_url, expected_restore_at,
                      updated_at
               FROM site_settings WHERE id = 1"""
        )
        row = cursor.fetchone()
        site = None
        if row:
            site = {
                "site_status": row["site_status"],
                "maintenance_title": row["maintenance_title"],
                "maintenance_message": row["maintenance_message"],
                "maintenance_background_url": row["maintenance_background_url"],
                "expected_restore_at": _iso(row["expected_restore_at"]),
                "updated_at": _iso(row["updated_at"]),
            }
        cursor.execute(
            """SELECT section_key, status, allowed_roles, locked_message
               FROM site_section_settings ORDER BY section_key"""
        )
        sections = [{
            "section_key": row["section_key"],
            "status": row["status"],
            "allowed_roles": list(row["allowed_roles"] or []),
            "locked_message": row["locked_message"],
        } for row in cursor.fetchall()]
        return {"site": site, "sections": sections}
    finally:
        connection.close()


def update_site_settings(values):
    if not isinstance(values, dict):
        raise ValueError("Nastavení musí být objekt.")
    unknown = set(values) - SITE_SETTING_FIELDS
    if unknown:
        raise ValueError("Neznámé položky nastavení: " + ", ".join(sorted(unknown)))
    if not values:
        return get_admin_settings()["site"]

    clean = dict(values)
    if "site_status" in clean and (not isinstance(clean["site_status"], str) or clean["site_status"] not in VALID_SITE_STATUSES):
        raise ValueError("Neplatný provozní stav webu.")
    for key in ("maintenance_title", "maintenance_message", "maintenance_background_url"):
        if key in clean:
            if not isinstance(clean[key], str):
                raise ValueError(f"Položka {key} musí být text.")
            max_len = 2000 if key == "maintenance_message" else 500
            clean[key] = clean[key].strip()[:max_len]
    for key in ("allow_admin_access", "allow_moderator_access", "allow_beta_tester_access"):
        if key in clean and not isinstance(clean[key], bool):
            raise ValueError(f"Položka {key} musí být boolean.")
    if "expected_restore_at" in clean and clean["expected_restore_at"]:
        raw = clean["expected_restore_at"]
        if not isinstance(raw, str):
            raise ValueError("Termín obnovení musí být ISO datum a čas nebo null.")
        try:
            clean["expected_restore_at"] = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        except ValueError as exc:
            raise ValueError("Termín obnovení nemá platný formát ISO.") from exc
    elif "expected_restore_at" in clean:
        clean["expected_restore_at"] = None

    columns = list(clean)
    assignments = ", ".join(f"{column} = ?" for column in columns)
    params = [clean[column] for column in columns]
    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute(
            f"UPDATE site_settings SET {assignments}, updated_at = NOW() WHERE id = 1",
            tuple(params),
        )
        connection.commit()
        _invalidate_site_cache()
        cursor.execute("SELECT * FROM site_settings WHERE id = 1")
        return _site_dict(cursor.fetchone())
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def update_section_settings(items):
    if not isinstance(items, list) or not items:
        raise ValueError("Očekávám neprázdné pole sekcí.")
    connection = get_connection()
    try:
        cursor = connection.cursor()
        updated = []
        for item in items:
            if not isinstance(item, dict) or not isinstance(item.get("section_key"), str):
                raise ValueError("Každá sekce musí obsahovat section_key.")
            key = item["section_key"].strip()
            status = item.get("status")
            if not isinstance(status, str) or status not in VALID_SECTION_STATUSES:
                raise ValueError(f"Neplatný stav sekce {key}.")
            roles = item.get("allowed_roles", [])
            if not isinstance(roles, list) or any(not isinstance(role, str) for role in roles):
                raise ValueError(f"Neplatný seznam rolí u sekce {key}.")
            if status == "roles" and not roles:
                raise ValueError(f"Sekce {key} vyžaduje alespoň jednu povolenou roli.")
            message = item.get("locked_message", "Tato část webu je momentálně uzamčená.")
            if not isinstance(message, str):
                raise ValueError(f"Zpráva sekce {key} musí být text.")
            cursor.execute(
                """UPDATE site_section_settings
                   SET status = ?, allowed_roles = ?, locked_message = ?, updated_at = NOW()
                   WHERE section_key = ? RETURNING *""",
                (status, roles, message.strip()[:1000], key),
            )
            row = cursor.fetchone()
            if not row:
                raise ValueError(f"Neznámá sekce: {key}.")
            updated.append(_section_dict(row))
        connection.commit()
        _invalidate_section_cache([item['section_key'].strip() for item in items])
        return updated
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def update_feature_flag(feature_key, is_enabled):
    if not isinstance(feature_key, str) or not feature_key.strip():
        raise ValueError("Chybí identifikátor funkce.")
    if not isinstance(is_enabled, bool):
        raise ValueError("is_enabled musí být boolean.")
    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute(
            """UPDATE site_feature_flags
               SET is_enabled = ?, updated_at = NOW()
               WHERE feature_key = ? AND implementation_status = 'ready'
               RETURNING *""",
            (is_enabled, feature_key.strip()),
        )
        row = cursor.fetchone()
        if not row:
            cursor.execute(
                "SELECT implementation_status FROM site_feature_flags WHERE feature_key = ?",
                (feature_key.strip(),),
            )
            existing = cursor.fetchone()
            if existing and existing["implementation_status"] == "preparing":
                raise ValueError("Tato funkce je pouze připravená a zatím ji nelze zapnout.")
            raise ValueError("Neznámá funkce.")
        connection.commit()
        return _feature_dict(row)
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()



def get_runtime_site_settings():
    """Return a short-lived, single-flight snapshot for request-time guards."""
    now = time.monotonic()
    with _RUNTIME_CACHE_LOCK:
        cached = _RUNTIME_CACHE["site"]
        cached_at = _RUNTIME_CACHE["site_at"]
    if cached is not None and now - cached_at < _RUNTIME_CACHE_TTL:
        return dict(cached)

    # Only one concurrent request performs the cache-fill query. Others reuse
    # its result rather than issuing identical SELECTs to remote Neon.
    with _RUNTIME_CACHE_FILL_LOCK:
        now = time.monotonic()
        with _RUNTIME_CACHE_LOCK:
            cached = _RUNTIME_CACHE["site"]
            cached_at = _RUNTIME_CACHE["site_at"]
        if cached is not None and now - cached_at < _RUNTIME_CACHE_TTL:
            return dict(cached)

        connection = get_connection()
        try:
            cursor = connection.cursor()
            cursor.execute(
                """SELECT site_status, allow_admin_access,
                          allow_moderator_access, allow_beta_tester_access,
                          maintenance_title, maintenance_message
                   FROM site_settings WHERE id = 1"""
            )
            row = cursor.fetchone()
            if not row:
                result = {
                    "site_status": "active",
                    "allow_admin_access": True,
                    "allow_moderator_access": False,
                    "allow_beta_tester_access": False,
                    "maintenance_title": "",
                    "maintenance_message": "",
                }
            else:
                result = {
                    "site_status": row["site_status"],
                    "allow_admin_access": bool(row["allow_admin_access"]),
                    "allow_moderator_access": bool(row["allow_moderator_access"]),
                    "allow_beta_tester_access": bool(row["allow_beta_tester_access"]),
                    "maintenance_title": row["maintenance_title"],
                    "maintenance_message": row["maintenance_message"],
                }
        finally:
            connection.close()

        with _RUNTIME_CACHE_LOCK:
            _RUNTIME_CACHE["site"] = dict(result)
            _RUNTIME_CACHE["site_at"] = time.monotonic()
        return result


def get_section_runtime_setting(section_key):
    """Return one section gate from a one-second, single-flight cache."""
    now = time.monotonic()
    with _RUNTIME_CACHE_LOCK:
        cached = _RUNTIME_CACHE["sections"].get(section_key)
        cached_at = _RUNTIME_CACHE["sections_at"].get(section_key, 0.0)
    if section_key in _RUNTIME_CACHE["sections"] and now - cached_at < _RUNTIME_CACHE_TTL:
        return dict(cached) if cached is not None else None

    with _RUNTIME_CACHE_FILL_LOCK:
        now = time.monotonic()
        with _RUNTIME_CACHE_LOCK:
            cached = _RUNTIME_CACHE["sections"].get(section_key)
            cached_at = _RUNTIME_CACHE["sections_at"].get(section_key, 0.0)
            has_cached = section_key in _RUNTIME_CACHE["sections"]
        if has_cached and now - cached_at < _RUNTIME_CACHE_TTL:
            return dict(cached) if cached is not None else None

        connection = get_connection()
        try:
            cursor = connection.cursor()
            cursor.execute(
                "SELECT status, allowed_roles, locked_message FROM site_section_settings WHERE section_key = ?",
                (section_key,),
            )
            row = cursor.fetchone()
            result = None if not row else {
                "status": row["status"],
                "allowed_roles": list(row["allowed_roles"] or []),
                "locked_message": row["locked_message"],
            }
        finally:
            connection.close()

        with _RUNTIME_CACHE_LOCK:
            _RUNTIME_CACHE["sections"][section_key] = result
            _RUNTIME_CACHE["sections_at"][section_key] = time.monotonic()
        return dict(result) if result is not None else None


def is_feature_enabled(feature_key):
    """Return True only for a known, implemented, enabled feature."""
    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute(
            """SELECT is_enabled, implementation_status
               FROM site_feature_flags WHERE feature_key = ?""",
            (feature_key,),
        )
        row = cursor.fetchone()
        return bool(
            row
            and row["implementation_status"] == "ready"
            and row["is_enabled"]
        )
    finally:
        connection.close()
