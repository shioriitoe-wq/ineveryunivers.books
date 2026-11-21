"""Owner-protected API for central site settings."""
from flask import Blueprint, jsonify, request

from routes.authorization import require_permission
from services.site_settings_service import (
    get_admin_settings,
    get_public_settings,
    update_feature_flag,
    update_section_settings,
    update_site_settings,
)

site_settings_bp = Blueprint("site_settings", __name__)


@site_settings_bp.get("/api/site-settings/public")
def public_site_settings():
    return jsonify(get_public_settings())


@site_settings_bp.get("/api/admin/site-settings")
@require_permission("settings.manage")
def admin_site_settings():
    return jsonify(get_admin_settings())


@site_settings_bp.put("/api/admin/site-settings")
@require_permission("settings.manage")
def save_site_settings():
    payload = request.get_json(silent=True) or {}
    try:
        site = update_site_settings(payload.get("site", {}))
        return jsonify({"message": "Nastavení webu bylo uloženo.", "site": site})
    except ValueError as error:
        return jsonify({"message": str(error)}), 400


@site_settings_bp.put("/api/admin/site-settings/sections")
@require_permission("settings.manage")
def save_site_sections():
    payload = request.get_json(silent=True) or {}
    try:
        sections = update_section_settings(payload.get("sections"))
        return jsonify({"message": "Nastavení sekcí bylo uloženo.", "sections": sections})
    except ValueError as error:
        return jsonify({"message": str(error)}), 400


@site_settings_bp.put("/api/admin/site-settings/features/<feature_key>")
@require_permission("settings.manage")
def save_site_feature(feature_key):
    payload = request.get_json(silent=True) or {}
    try:
        feature = update_feature_flag(feature_key, payload.get("is_enabled"))
        return jsonify({"message": "Nastavení funkce bylo uloženo.", "feature": feature})
    except ValueError as error:
        return jsonify({"message": str(error)}), 400
