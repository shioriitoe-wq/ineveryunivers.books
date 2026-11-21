import hmac
import os
from datetime import timedelta

from flask import Blueprint, current_app, jsonify, request
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

admin_auth_bp = Blueprint("admin_auth", __name__)


def _serializer():
    secret = os.getenv("ADMIN_TOKEN_SECRET") or os.getenv("SECRET_KEY")
    if not secret:
        raise RuntimeError("Chybí ADMIN_TOKEN_SECRET nebo SECRET_KEY.")
    return URLSafeTimedSerializer(secret, salt="ineveryunivers-admin-auth")


def _token_max_age():
    try:
        return int(os.getenv("ADMIN_TOKEN_MAX_AGE", "28800"))
    except ValueError:
        return 28800


@admin_auth_bp.route("/api/admin/login", methods=["POST"])
def admin_login():
    configured_password = os.getenv("ADMIN_PASSWORD")
    if not configured_password:
        current_app.logger.error("Není nastavená proměnná ADMIN_PASSWORD.")
        return jsonify({"message": "Přihlášení není nakonfigurováno."}), 503

    data = request.get_json(silent=True) or {}
    supplied_password = data.get("password", "")

    if (
        not isinstance(supplied_password, str)
        or not hmac.compare_digest(
            supplied_password.encode("utf-8"),
            configured_password.encode("utf-8"),
        )
    ):
        return jsonify({"message": "Nesprávné heslo."}), 401

    try:
        token = _serializer().dumps({"admin": True})
    except RuntimeError:
        current_app.logger.error("Není nastaven tajný klíč pro přihlašovací token.")
        return jsonify({"message": "Přihlášení není nakonfigurováno."}), 503

    return jsonify({
        "token": token,
        "expires_in": _token_max_age(),
    })


@admin_auth_bp.route("/api/admin/check", methods=["GET"])
def admin_check():
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return jsonify({"authenticated": False}), 401

    token = header[7:].strip()
    try:
        payload = _serializer().loads(token, max_age=_token_max_age())
    except (BadSignature, SignatureExpired, RuntimeError):
        return jsonify({"authenticated": False}), 401

    if payload.get("admin") is not True:
        return jsonify({"authenticated": False}), 401

    return jsonify({"authenticated": True})
