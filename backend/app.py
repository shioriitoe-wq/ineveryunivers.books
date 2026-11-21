from pathlib import Path
from dotenv import load_dotenv

_BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(_BACKEND_DIR / ".env", override=False)
load_dotenv(_BACKEND_DIR.parent / ".env", override=False)

from flask import Flask
from flask_cors import CORS

from routes.books import books_bp
from routes.characters import characters_bp
from routes.aeil import aeil_bp
from routes.vespera_characters import vespera_characters_bp 
from routes.soundtrack import soundtracks_bp
from routes.videos import videos_bp
from routes.admin_auth import admin_auth_bp
from routes.user_auth import user_auth_bp
from routes.admin_users import admin_users_bp
from routes.private_messages import private_messages_bp
from routes.notifications import notifications_bp
from routes.site_settings import site_settings_bp
from routes.access_control import access_control_bp
from routes.authorization import has_permission, user_roles
from services.site_settings_service import (
    get_runtime_site_settings, get_section_runtime_setting, is_feature_enabled,
)

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 26 * 1024 * 1024

# CENTRAL_API_PERMISSION_GUARD
# All API mutations require an authenticated user and a server-side functional
# permission. Dedicated user-administration endpoints enforce their own
# permission decorators in routes/admin_users.py.
from flask import jsonify, request
from database.database import get_connection
from routes.user_auth import _current_user_id




def _central_section_for_path(path):
    """Map existing API routes to the matching central section key."""
    if path.startswith("/api/admin/site-settings"):
        return None  # Keep the owner control plane available for recovery.
    if path.startswith("/api/community/members"):
        return "fans"
    if path.startswith("/api/community/"):
        return "community"
    if path.startswith("/api/messages/"):
        return "private_messages"
    if path.startswith("/api/notifications"):
        return "notifications"
    if path.startswith(("/api/videos", "/api/admin/videos")):
        return "filmoteka"
    if path.startswith(("/api/soundtracks", "/api/admin/soundtracks", "/api/admin/media/upload")):
        return "soundtrack"
    if path.startswith("/api/books"):
        return "books"
    if path.startswith(("/api/auth/profile", "/api/auth/change-password", "/api/auth/badges")):
        return "accounts"
    if path.startswith("/api/admin/"):
        return "administration"
    return None


def _central_section_denial(section_key, user_id):
    """Use the shared short-lived section snapshot instead of another SELECT."""
    section = get_section_runtime_setting(section_key)
    if not section:
        # Unknown/unconfigured sections retain legacy behavior.
        return None

    status = section["status"]
    allowed_roles = list(section["allowed_roles"] or [])
    message = section["locked_message"] or "Tato část webu je momentálně uzamčená."
    if status == "active":
        return None

    # Role lookup is needed only for restricted sections. The session itself
    # has already been resolved and cached in Flask g for this request.
    roles = []
    if user_id is not None:
        connection = get_connection()
        try:
            roles = user_roles(connection.cursor(), user_id)
        finally:
            connection.close()

    if "owner" in roles:
        return None
    if status == "authenticated" and user_id is not None:
        return None
    if status == "roles" and any(role in allowed_roles for role in roles):
        return None
    return jsonify({
        "message": message,
        "section_key": section_key,
        "section_status": status,
    }), 403


@app.before_request
def enforce_central_site_availability():
    """Enforce site status, section access, and implemented feature switches."""
    # CORS preflight requests contain no application data. They must be answered
    # by Flask-CORS without opening PostgreSQL connections or running access
    # checks; doing so used to add several remote DB round trips before every
    # browser request with Authorization/JSON headers.
    if request.method == "OPTIONS":
        return None

    if not request.path.startswith("/api/"):
        return None

    # Public status must always be readable so the frontend can render the
    # maintenance/locked screen. The owner settings API remains a recovery path.
    if request.path == "/api/site-settings/public" or request.path.startswith("/api/admin/site-settings"):
        return None

    # Session recovery/logout must remain possible during downtime.
    if request.path in ("/api/auth/me", "/api/auth/logout"):
        return None

    path = request.path

    # Feature flags are enforced on the corresponding server routes, not only
    # represented by frontend switches.
    if path == "/api/auth/register":
        runtime = get_runtime_site_settings()
        if runtime["site_status"] != "active":
            return jsonify({"message": "Registrace jsou během odstávky webu pozastavené."}), 503
        if not is_feature_enabled("user_registration"):
            return jsonify({"message": "Registrace nových členů jsou momentálně vypnuté."}), 403
        return None

    if path == "/api/auth/login":
        if not is_feature_enabled("user_login"):
            return jsonify({"message": "Přihlašování je momentálně vypnuté."}), 403
        # Login remains available during downtime so an allowed operator can sign in.
        return None

    if path.startswith("/api/messages/"):
        if not is_feature_enabled("private_messages"):
            return jsonify({"message": "Soukromé zprávy jsou momentálně vypnuté."}), 403
        if path.endswith("/report") and not is_feature_enabled("private_message_reports"):
            return jsonify({"message": "Nahlašování soukromých zpráv je momentálně vypnuté."}), 403

    runtime = get_runtime_site_settings()
    status = runtime["site_status"]
    user_id = _current_user_id()

    if status != "active":
        roles = []
        if user_id is not None:
            connection = get_connection()
            try:
                roles = user_roles(connection.cursor(), user_id)
            finally:
                connection.close()
        role_set = set(roles)
        allowed = (
            (runtime["allow_admin_access"] and bool({"owner", "admin"} & role_set))
            or (runtime["allow_moderator_access"] and "moderator" in role_set)
            or (runtime["allow_beta_tester_access"] and "beta_tester" in role_set)
        )
        if not allowed:
            messages = {
                "maintenance": "Web je momentálně v údržbě.",
                "locked": "Přístup na web je momentálně uzamčený.",
                "inactive": "Web je momentálně nedostupný.",
            }
            status_code = 423 if status == "locked" else 503
            return jsonify({
                "message": messages.get(status, "Web je momentálně nedostupný."),
                "site_status": status,
                "maintenance_title": runtime.get("maintenance_title") or "",
                "maintenance_message": runtime.get("maintenance_message") or "",
            }), status_code

    section_key = _central_section_for_path(path)
    if section_key:
        return _central_section_denial(section_key, user_id)

    return None


@app.before_request
def protect_api_mutations_by_permission():
    if not request.path.startswith("/api/") or request.method in ("GET", "HEAD", "OPTIONS"):
        return None

    if (request.path.startswith("/api/auth/")
            or request.path.startswith("/api/admin/users")
            or request.path.startswith("/api/messages/")
            or request.path.startswith("/api/notifications")
            or request.path.startswith("/api/moderation/private-message-reports")):

        return None

    user_id = _current_user_id()
    if user_id is None:
        return jsonify({"message": "Pro tuto akci se přihlas svým účtem."}), 401

    # Temporary compatibility mapping. In the next pass, route-specific
    # permissions will replace this broad legacy mapping endpoint by endpoint.
    if request.path.startswith("/api/community/") or request.path.startswith("/api/moderation/"):
        permission_key = "community.manage"
    elif request.path.startswith("/api/beta/"):
        permission_key = "beta.center.access"
    else:
        permission_key = "content.manage"

    connection = get_connection()
    try:
        cursor = connection.cursor()
        if not has_permission(cursor, user_id, permission_key):
            return jsonify({"message": "K této akci nemáš oprávnění."}), 403
    finally:
        connection.close()

    return None


# Povolení komunikace frontend ↔ backend
# Funguje pro localhost i Vercel.
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": "*"
        }
    },
methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
allow_headers=["Content-Type", "Authorization"],
)


app.register_blueprint(books_bp)
app.register_blueprint(characters_bp)
app.register_blueprint(aeil_bp)
app.register_blueprint(vespera_characters_bp)
app.register_blueprint(soundtracks_bp)
app.register_blueprint(videos_bp)
app.register_blueprint(admin_auth_bp)
app.register_blueprint(user_auth_bp)
app.register_blueprint(admin_users_bp)
app.register_blueprint(private_messages_bp)
app.register_blueprint(notifications_bp)
app.register_blueprint(site_settings_bp)
app.register_blueprint(access_control_bp)


@app.route("/")
def home():
    return {
        "message": "Backend běží!",
        "project": "ineveryunivers.books"
    }


if __name__ == "__main__":
    app.run(debug=True)