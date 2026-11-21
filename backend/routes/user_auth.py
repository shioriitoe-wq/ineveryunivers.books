"""User registration, login, session and profile API for ineveryunivers.books."""

import hashlib
import re
import secrets
from datetime import datetime, timedelta, timezone
from functools import wraps

from flask import Blueprint, g, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

from database.database import get_connection

user_auth_bp = Blueprint("user_auth", __name__)

SESSION_DAYS = 30
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
USERNAME_RE = re.compile(r"^[\w.-]{3,30}$", re.UNICODE)


def _token_hash(token):
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _public_user(row):
    return {
        "id": row["id"],
        "email": row["email"],
        "username": row["username"],
        "display_name": row["display_name"] or "",
        "avatar_url": row["avatar_url"] or "",
        "account_status": row["account_status"],
        "roles": row.get("roles", []),
        "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
    }


def _load_user(cursor, user_id):
    cursor.execute(
        """
        SELECT u.id, u.email, u.username, u.display_name, u.avatar_url,
               u.account_status, u.created_at,
               COALESCE(array_agg(DISTINCT r.role_key) FILTER (WHERE r.role_key IS NOT NULL), ARRAY[]::text[]) AS roles
        FROM app_users u
        LEFT JOIN app_user_roles ur ON ur.user_id = u.id
        LEFT JOIN app_roles r ON r.id = ur.role_id
        WHERE u.id = ?
        GROUP BY u.id
        """,
        (user_id,),
    )
    return cursor.fetchone()


def _current_user_id():
    """Resolve the bearer session once per HTTP request.

    The central site guard and the route handler both need the current user.
    Previously each call repeated the same remote session SELECT and updated
    last_seen_at again. Flask's request-local ``g`` safely shares this result
    only within the current request; it is never cached across users/requests.
    """
    if hasattr(g, "_ineveryunivers_user_id_resolved"):
        return g._ineveryunivers_user_id

    g._ineveryunivers_user_id_resolved = True
    g._ineveryunivers_user_id = None

    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None
    token = header[7:].strip()
    if not token or len(token) > 512:
        return None

    token_hash = _token_hash(token)
    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute(
            """
            SELECT s.user_id
            FROM app_user_sessions s
            JOIN app_users u ON u.id = s.user_id
            WHERE s.token_hash = ?
              AND s.revoked_at IS NULL
              AND s.expires_at > NOW()
              AND u.account_status = 'active'
            LIMIT 1
            """,
            (token_hash,),
        )
        row = cursor.fetchone()
        if row:
            g._ineveryunivers_user_id = row["user_id"]
            cursor.execute(
                "UPDATE app_user_sessions SET last_seen_at = NOW() WHERE token_hash = ?",
                (token_hash,),
            )
            connection.commit()
        return g._ineveryunivers_user_id
    finally:
        connection.close()


def require_user(function):
    @wraps(function)
    def wrapped(*args, **kwargs):
        user_id = _current_user_id()
        if user_id is None:
            return jsonify({"message": "Pro pokračování se přihlas."}), 401
        request.user_id = user_id
        return function(*args, **kwargs)
    return wrapped


def _issue_session(cursor, user_id):
    token = secrets.token_urlsafe(48)
    cursor.execute(
        """
        INSERT INTO app_user_sessions
            (user_id, token_hash, expires_at, user_agent, ip_address)
        VALUES (?, ?, NOW() + (? * INTERVAL '1 day'), ?, ?)
        """,
        (
            user_id,
            _token_hash(token),
            SESSION_DAYS,
            (request.headers.get("User-Agent") or "")[:500],
            request.remote_addr,
        ),
    )
    return token


@user_auth_bp.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "")
    username = data.get("username", "")
    display_name = data.get("display_name", "")
    password = data.get("password", "")

    if not all(isinstance(value, str) for value in (email, username, display_name, password)):
        return jsonify({"message": "Vyplněné údaje nemají správný formát."}), 400

    email = email.strip().lower()
    username = username.strip()
    display_name = display_name.strip()

    if len(email) > 254 or not EMAIL_RE.fullmatch(email):
        return jsonify({"message": "Zadej platnou e-mailovou adresu."}), 400
    if not USERNAME_RE.fullmatch(username):
        return jsonify({"message": "Uživatelské jméno musí mít 3–30 znaků (písmena, čísla, tečka, pomlčka nebo podtržítko)."}), 400
    if len(password) < 10 or len(password) > 256:
        return jsonify({"message": "Heslo musí mít alespoň 10 znaků a nejvýše 256 znaků."}), 400
    if len(display_name) > 60:
        return jsonify({"message": "Zobrazované jméno může mít nejvýše 60 znaků."}), 400

    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute(
            """
            INSERT INTO app_users (email, username, display_name, password_hash, account_status)
            VALUES (?, ?, ?, ?, 'active')
            RETURNING id
            """,
            (email, username, display_name or username, generate_password_hash(password)),
        )
        user_id = cursor.fetchone()["id"]
        cursor.execute(
            "INSERT INTO app_user_roles (user_id, role_id) SELECT ?, id FROM app_roles WHERE role_key = 'member'",
            (user_id,),
        )
        cursor.execute(
            "INSERT INTO app_user_badges (user_id, badge_id) SELECT ?, id FROM app_badges WHERE badge_key = 'first_steps' ON CONFLICT DO NOTHING",
            (user_id,),
        )
        token = _issue_session(cursor, user_id)
        # Import locally: notifications depends on require_user from this module.
        from routes.notifications import create_notification
        create_notification(cursor, user_id, "welcome", "Vítej v ineveryunivers.books", "Tvůj účet je připravený. Můžeš si upravit profil a poznávat ostatní členy komunity.", "/account", {})
        connection.commit()
        user = _load_user(cursor, user_id)
        from services.email_service import send_email
        send_email(email, "Vítej v ineveryunivers.books", f"Ahoj {display_name or username},\n\nVítej v ineveryunivers.books! Tvůj účet byl úspěšně vytvořen.\n\nPo přihlášení si můžeš upravit profil, prohlížet komunitu a komunikovat s ostatními členy.\n\nTým ineveryunivers.books")
        return jsonify({"user": _public_user(user), "token": token, "expires_in_days": SESSION_DAYS}), 201
    except Exception as error:
        connection.rollback()
        # PostgreSQL unique violation: do not expose SQL or account existence details.
        if getattr(error, "pgcode", None) == "23505":
            return jsonify({"message": "Tento e-mail nebo uživatelské jméno už někdo používá."}), 409
        raise
    finally:
        connection.close()


@user_auth_bp.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    identifier = data.get("identifier", "")
    password = data.get("password", "")
    if not isinstance(identifier, str) or not isinstance(password, str) or not identifier.strip() or not password:
        return jsonify({"message": "Vyplň e-mail nebo uživatelské jméno a heslo."}), 400

    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute(
            "SELECT id, password_hash, account_status FROM app_users WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?) LIMIT 1",
            (identifier.strip(), identifier.strip()),
        )
        row = cursor.fetchone()
        if not row or not check_password_hash(row["password_hash"], password):
            return jsonify({"message": "Neplatné přihlašovací údaje."}), 401
        if row["account_status"] != "active":
            return jsonify({"message": "Tento účet není aktivní. Pokud potřebuješ pomoc, kontaktuj správce webu."}), 403

        token = _issue_session(cursor, row["id"])
        cursor.execute("UPDATE app_users SET last_login_at = NOW(), updated_at = NOW() WHERE id = ?", (row["id"],))
        connection.commit()
        user = _load_user(cursor, row["id"])
        return jsonify({"user": _public_user(user), "token": token, "expires_in_days": SESSION_DAYS})
    finally:
        connection.close()


@user_auth_bp.route("/api/auth/me", methods=["GET"])
@require_user
def me():
    connection = get_connection()
    try:
        user = _load_user(connection.cursor(), request.user_id)
        return jsonify({"user": _public_user(user)})
    finally:
        connection.close()


@user_auth_bp.route("/api/auth/logout", methods=["POST"])
@require_user
def logout():
    token = request.headers.get("Authorization", "")[7:].strip()
    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute(
            "UPDATE app_user_sessions SET revoked_at = NOW() WHERE token_hash = ? AND user_id = ? AND revoked_at IS NULL",
            (_token_hash(token), request.user_id),
        )
        connection.commit()
        return jsonify({"message": "Byl/a jsi odhlášen/a."})
    finally:
        connection.close()


@user_auth_bp.route("/api/auth/profile", methods=["PUT"])
@require_user
def update_profile():
    data = request.get_json(silent=True) or {}
    display_name = data.get("display_name")
    avatar_url = data.get("avatar_url")
    if display_name is not None and (not isinstance(display_name, str) or len(display_name.strip()) > 60):
        return jsonify({"message": "Zobrazované jméno může mít nejvýše 60 znaků."}), 400
    if avatar_url is not None and (not isinstance(avatar_url, str) or len(avatar_url) > 2048 or (avatar_url and not avatar_url.startswith(("https://", "http://")))):
        return jsonify({"message": "Adresa avataru musí být platná HTTP(S) adresa."}), 400

    fields, values = [], []
    if display_name is not None:
        fields.append("display_name = ?")
        values.append(display_name.strip())
    if avatar_url is not None:
        fields.append("avatar_url = ?")
        values.append(avatar_url.strip())
    if not fields:
        return jsonify({"message": "Nebyly zadány žádné změny."}), 400
    fields.append("updated_at = NOW()")

    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute(f"UPDATE app_users SET {', '.join(fields)} WHERE id = ?", tuple(values + [request.user_id]))
        connection.commit()
        user = _load_user(cursor, request.user_id)
        return jsonify({"user": _public_user(user)})
    finally:
        connection.close()

@user_auth_bp.route("/api/auth/change-password", methods=["POST"])
@require_user
def change_password():
    data = request.get_json(silent=True) or {}
    current_password = data.get("current_password", "")
    new_password = data.get("new_password", "")
    if not isinstance(current_password, str) or not isinstance(new_password, str):
        return jsonify({"message": "Zadané údaje nemají správný formát."}), 400
    if len(new_password) < 10 or len(new_password) > 256:
        return jsonify({"message": "Nové heslo musí mít alespoň 10 znaků a nejvýše 256 znaků."}), 400
    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT password_hash FROM app_users WHERE id = ?", (request.user_id,))
        row = cursor.fetchone()
        if not row or not check_password_hash(row["password_hash"], current_password):
            return jsonify({"message": "Současné heslo není správné."}), 400
        cursor.execute("UPDATE app_users SET password_hash = ?, updated_at = NOW() WHERE id = ?", (generate_password_hash(new_password), request.user_id))
        current_token = request.headers.get("Authorization", "")[7:].strip()
        cursor.execute("UPDATE app_user_sessions SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL AND token_hash <> ?", (request.user_id, _token_hash(current_token)))
        connection.commit()
        return jsonify({"message": "Heslo bylo změněno. Ostatní přihlášená zařízení byla odhlášena."})
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


@user_auth_bp.route("/api/auth/badges", methods=["GET"])
@require_user
def my_badges():
    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute("""SELECT b.badge_key,b.title,b.description,b.icon,b.rarity,b.is_hidden,
                          ub.awarded_at, (ub.user_id IS NOT NULL) AS earned
                   FROM app_badges b LEFT JOIN app_user_badges ub
                     ON ub.badge_id=b.id AND ub.user_id=?
                   WHERE b.is_active=TRUE AND (b.is_hidden=FALSE OR ub.user_id IS NOT NULL)
                   ORDER BY earned DESC,b.created_at ASC""", (request.user_id,))
        badges=[]
        for row in cursor.fetchall():
            badges.append({"badge_key":row["badge_key"],"title":row["title"],"description":row["description"],"icon":row["icon"],"rarity":row["rarity"],"earned":bool(row["earned"]),"awarded_at":row["awarded_at"].isoformat() if row["awarded_at"] else None})
        return jsonify({"badges":badges})
    finally:
        connection.close()

