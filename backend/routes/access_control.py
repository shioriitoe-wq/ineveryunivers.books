"""Owner-protected API for hierarchical access resources."""
from flask import Blueprint, jsonify, request

from routes.authorization import require_permission
from services.access_control_service import get_access_control_admin_data, save_access_resource
from services.access_catalog_service import get_synced_access_catalog

access_control_bp = Blueprint("access_control", __name__)


@access_control_bp.get("/api/admin/access-control")
@require_permission("settings.manage")
def admin_access_control():
    return jsonify(get_access_control_admin_data())


@access_control_bp.post("/api/admin/access-control/resources")
@require_permission("settings.manage")
def create_or_update_access_resource():
    payload = request.get_json(silent=True) or {}
    try:
        resource = save_access_resource(payload, getattr(request, "user_id", None))
        return jsonify({"message": "Přístupové pravidlo bylo uloženo.", "resource": resource})
    except ValueError as error:
        return jsonify({"message": str(error)}), 400


@access_control_bp.get("/api/admin/access-control/catalog")
@require_permission("settings.manage")
def admin_access_control_catalog():
    try:
        return jsonify(get_synced_access_catalog())
    except Exception:
        # Keep internal database details out of the API response.
        return jsonify({"message": "Katalog obsahu se nepodařilo načíst. Zkontroluj migrace databáze."}), 500
