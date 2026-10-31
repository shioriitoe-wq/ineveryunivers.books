import os
import uuid
from pathlib import Path

import requests
from flask import Blueprint, jsonify, request
from database.database import get_connection
from routes.admin_permissions import verify_admin_token

videos_bp = Blueprint("videos", __name__)
BUCKET = "ineveryunivers-media"
MAX_VIDEO_SIZE = 50 * 1024 * 1024
ALLOWED = {
    ".mp4": {"video/mp4"},
    ".webm": {"video/webm"},
    ".mov": {"video/quicktime"},
    ".avi": {"video/x-msvideo", "video/avi", "application/octet-stream"},
    ".mkv": {"video/x-matroska", "application/octet-stream"},
}


def _admin():
    header = request.headers.get("Authorization", "")
    return header.startswith("Bearer ") and verify_admin_token(header[7:].strip())


def _storage():
    url = os.getenv("SUPABASE_URL", "").rstrip("/")
    key = os.getenv("SUPABASE_SECRET_KEY", "")
    if not url or not key:
        raise RuntimeError("Supabase Storage není nakonfigurováno.")
    return url, key


def _video(row):
    item = dict(row)
    item["published"] = bool(item.get("published"))
    item["tracks"] = item.get("tracks") or []
    item["books"] = item.get("books") or []
    return item


@videos_bp.route("/api/admin/videos/upload-url", methods=["POST"])
def create_upload_url():
    if not _admin():
        return jsonify({"message": "Přihlášení administrátora je vyžadováno."}), 401
    data = request.get_json(silent=True) or {}
    filename = Path(str(data.get("filename", ""))).name
    ext = Path(filename).suffix.lower()
    mime = str(data.get("mime_type", "application/octet-stream")).lower()
    size = int(data.get("size", 0) or 0)
    if ext not in ALLOWED:
        return jsonify({"message": "Povolené formáty: MP4, WebM, MOV, AVI a MKV."}), 400
    if mime not in ALLOWED[ext]:
        return jsonify({"message": "Typ souboru neodpovídá příponě."}), 400
    if size < 1 or size > MAX_VIDEO_SIZE:
        return jsonify({"message": "Video musí mít maximálně 50 MB."}), 413

    try:
        supabase_url, key = _storage()
        path = f"videos/{uuid.uuid4().hex}{ext}"
        endpoint = f"{supabase_url}/storage/v1/object/upload/sign/{BUCKET}/{path}"
        response = requests.post(endpoint, headers={"Authorization": f"Bearer {key}", "apikey": key, "Content-Type": "application/json"}, json={"upsert": False}, timeout=30)
        if not response.ok:
            return jsonify({"message": "Nepodařilo se připravit zabezpečené nahrávání.", "storage_status": response.status_code}), 502
        payload = response.json()
        signed = payload.get("signedURL") or payload.get("signedUrl")
        token = payload.get("token")
        if not signed and not token:
            return jsonify({"message": "Úložiště nevrátilo nahrávací odkaz."}), 502
        if signed and signed.startswith("http"):
            upload_url = signed
        elif signed:
            upload_url = f"{supabase_url}{signed}"
        else:
            upload_url = f"{supabase_url}/storage/v1/object/upload/sign/{BUCKET}/{path}?token={token}"
        public_url = f"{supabase_url}/storage/v1/object/public/{BUCKET}/{path}"
        return jsonify({"upload_url": upload_url, "public_url": public_url, "storage_path": path, "mime_type": mime}), 200
    except (requests.RequestException, RuntimeError, ValueError) as exc:
        return jsonify({"message": str(exc) or "Chyba při přípravě nahrávání."}), 502


@videos_bp.route("/api/admin/videos", methods=["GET"])
def admin_list_videos():
    if not _admin():
        return jsonify({"message": "Přihlášení administrátora je vyžadováno."}), 401
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT v.id, v.title, v.description, v.storage_path, v.public_url, v.mime_type,
                   v.file_size, v.duration_seconds, v.published, v.sort_order, v.created_at,
                   COALESCE((SELECT json_agg(json_build_object('id', t.id, 'title', t.title, 'role', a.role))
                     FROM media_video_tracks a JOIN music_tracks t ON t.id=a.track_id WHERE a.video_id=v.id), '[]'::json) AS tracks,
                   COALESCE((SELECT json_agg(json_build_object('id', b.id, 'title', b.title, 'volume_id', a.volume_id))
                     FROM media_video_books a JOIN books b ON b.id=a.book_id WHERE a.video_id=v.id), '[]'::json) AS books
            FROM media_videos v ORDER BY v.sort_order, v.created_at DESC
        """)
        return jsonify([_video(r) for r in cur.fetchall()])
    finally:
        conn.close()


@videos_bp.route("/api/admin/videos", methods=["POST"])
def create_video():
    if not _admin():
        return jsonify({"message": "Přihlášení administrátora je vyžadováno."}), 401
    data = request.get_json(silent=True) or {}
    title = str(data.get("title", "")).strip()
    path = str(data.get("storage_path", "")).strip()
    url = str(data.get("public_url", "")).strip()
    mime = str(data.get("mime_type", "")).strip()
    size = int(data.get("file_size", 0) or 0)
    if not title or not path.startswith("videos/") or not url or not mime or size < 1 or size > MAX_VIDEO_SIZE:
        return jsonify({"message": "Doplň název a platné údaje nahraného videa."}), 400
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""INSERT INTO media_videos (title, description, storage_path, public_url, mime_type, file_size, duration_seconds, published, sort_order)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id""",
          (title, str(data.get("description", "")), path, url, mime, size, int(data.get("duration_seconds", 0) or 0), bool(data.get("published", False)), int(data.get("sort_order", 0) or 0)))
        row = cur.fetchone(); conn.commit()
        return jsonify({"id": row[0], "message": "Video bylo přidáno do knihovny."}), 201
    except Exception:
        conn.rollback(); raise
    finally:
        conn.close()


@videos_bp.route("/api/admin/videos/<int:video_id>", methods=["PUT"])
def update_video(video_id):
    if not _admin():
        return jsonify({"message": "Přihlášení administrátora je vyžadováno."}), 401
    data = request.get_json(silent=True) or {}
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("UPDATE media_videos SET title=?, description=?, duration_seconds=?, published=?, sort_order=?, updated_at=NOW() WHERE id=?",
          (str(data.get("title", "")).strip(), str(data.get("description", "")), int(data.get("duration_seconds", 0) or 0), bool(data.get("published", False)), int(data.get("sort_order", 0) or 0), video_id))
        if cur.rowcount == 0: return jsonify({"message": "Video nebylo nalezeno."}), 404
        conn.commit(); return jsonify({"message": "Video bylo upraveno."})
    except Exception:
        conn.rollback(); raise
    finally: conn.close()


@videos_bp.route("/api/admin/videos/<int:video_id>/assignments", methods=["PUT"])
def update_assignments(video_id):
    if not _admin(): return jsonify({"message": "Přihlášení administrátora je vyžadováno."}), 401
    data = request.get_json(silent=True) or {}
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM media_videos WHERE id=?", (video_id,))
        if not cur.fetchone(): return jsonify({"message": "Video nebylo nalezeno."}), 404
        cur.execute("DELETE FROM media_video_tracks WHERE video_id=?", (video_id,))
        cur.execute("DELETE FROM media_video_books WHERE video_id=?", (video_id,))
        for item in data.get("tracks", []):
            role = item.get("role", "karaoke")
            if role not in ("karaoke", "story"): role = "karaoke"
            cur.execute("INSERT INTO media_video_tracks (video_id, track_id, role) VALUES (?, ?, ?) ON CONFLICT DO NOTHING", (video_id, int(item["id"]), role))
        for item in data.get("books", []):
            cur.execute("INSERT INTO media_video_books (video_id, book_id, volume_id) VALUES (?, ?, ?) ON CONFLICT DO NOTHING", (video_id, int(item["id"]), int(item["volume_id"]) if item.get("volume_id") else None))
        conn.commit(); return jsonify({"message": "Přiřazení videa byla uložena."})
    except Exception:
        conn.rollback(); raise
    finally: conn.close()


@videos_bp.route("/api/admin/videos/<int:video_id>", methods=["DELETE"])
def delete_video(video_id):
    if not _admin(): return jsonify({"message": "Přihlášení administrátora je vyžadováno."}), 401
    conn = get_connection()
    try:
        cur = conn.cursor(); cur.execute("SELECT storage_path FROM media_videos WHERE id=?", (video_id,)); row = cur.fetchone()
        if not row: return jsonify({"message": "Video nebylo nalezeno."}), 404
        path = row[0]
        cur.execute("SELECT COUNT(*) FROM media_video_tracks WHERE video_id=?", (video_id,)); track_refs = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM media_video_books WHERE video_id=?", (video_id,)); book_refs = cur.fetchone()[0]
        if track_refs or book_refs: return jsonify({"message": "Nejprve odeber všechna přiřazení videa."}), 409
        supabase_url, key = _storage()
        response = requests.delete(f"{supabase_url}/storage/v1/object/{BUCKET}", headers={"Authorization": f"Bearer {key}", "apikey": key, "Content-Type": "application/json"}, json={"prefixes": [path]}, timeout=30)
        if not response.ok: return jsonify({"message": "Soubor v úložišti se nepodařilo odstranit."}), 502
        cur.execute("DELETE FROM media_videos WHERE id=?", (video_id,)); conn.commit()
        return jsonify({"message": "Video bylo odstraněno z knihovny i úložiště."})
    except Exception:
        conn.rollback(); raise
    finally: conn.close()


@videos_bp.route("/api/videos", methods=["GET"])
def public_videos():
    book_id = request.args.get("book_id", type=int)
    track_id = request.args.get("track_id", type=int)
    conn = get_connection()
    try:
        cur = conn.cursor()
        if track_id:
            cur.execute("""SELECT v.*, a.role FROM media_videos v JOIN media_video_tracks a ON a.video_id=v.id
              WHERE v.published=TRUE AND a.track_id=? ORDER BY v.sort_order, v.id""", (track_id,))
        elif book_id:
            cur.execute("""SELECT DISTINCT v.*, 'story' AS role FROM media_videos v JOIN media_video_books a ON a.video_id=v.id
              WHERE v.published=TRUE AND a.book_id=? ORDER BY v.sort_order, v.id""", (book_id,))
        else:
            cur.execute("SELECT v.*, 'story' AS role FROM media_videos v WHERE v.published=TRUE ORDER BY v.sort_order, v.id")
        return jsonify([dict(r) for r in cur.fetchall()])
    finally: conn.close()
