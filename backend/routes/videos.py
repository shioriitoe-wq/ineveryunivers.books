import os
import json
import uuid
from pathlib import Path

import requests
from flask import Blueprint, jsonify, request
from database.database import get_connection
from routes.authorization import filter_accessible_rows, resource_is_accessible
from routes.user_auth import _current_user_id
from routes.admin_users import require_permission

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


def _storage():
    url = os.getenv("SUPABASE_URL", "").rstrip("/")
    key = os.getenv("SUPABASE_SECRET_KEY", "")
    if not url or not key:
        raise RuntimeError("Supabase Storage není nakonfigurováno.")
    return url, key


def _video(row):
    item = dict(row)
    item["published"] = bool(item.get("published"))
    for field in ("tracks", "books", "characters"):
        item[field] = item.get(field) or []
    for field in ("genre_tags", "mood_tags"):
        value = item.get(field) or "[]"
        if isinstance(value, str):
            try: value = json.loads(value)
            except (TypeError, ValueError): value = []
        item[field] = value if isinstance(value, list) else []
    return item


@videos_bp.route("/api/admin/videos/upload-url", methods=["POST"])
@require_permission("content.manage")
def create_upload_url():
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
        upload_url = signed if signed and signed.startswith("http") else (f"{supabase_url}{signed}" if signed else f"{supabase_url}/storage/v1/object/upload/sign/{BUCKET}/{path}?token={token}")
        public_url = f"{supabase_url}/storage/v1/object/public/{BUCKET}/{path}"
        return jsonify({"upload_url": upload_url, "public_url": public_url, "storage_path": path, "mime_type": mime}), 200
    except (requests.RequestException, RuntimeError, ValueError) as exc:
        return jsonify({"message": str(exc) or "Chyba při přípravě nahrávání."}), 502




@videos_bp.route("/api/admin/videos/poster-upload-url", methods=["POST"])
@require_permission("content.manage")
def create_poster_upload_url():
    data = request.get_json(silent=True) or {}
    filename = Path(str(data.get("filename", ""))).name
    ext = Path(filename).suffix.lower()
    mime = str(data.get("mime_type", "")).lower()
    size = int(data.get("size", 0) or 0)
    allowed_images = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}
    if ext not in allowed_images or allowed_images[ext] != mime:
        return jsonify({"message": "Povolené obrázky jsou JPG, PNG a WebP."}), 400
    if size < 1 or size > 5 * 1024 * 1024:
        return jsonify({"message": "Obrázek může mít maximálně 5 MB."}), 413
    try:
        supabase_url, key = _storage()
        path = f"video-posters/{uuid.uuid4().hex}{ext}"
        endpoint = f"{supabase_url}/storage/v1/object/upload/sign/{BUCKET}/{path}"
        response = requests.post(endpoint, headers={"Authorization": f"Bearer {key}", "apikey": key, "Content-Type": "application/json"}, json={"upsert": False}, timeout=30)
        if not response.ok:
            return jsonify({"message": "Nepodařilo se připravit nahrání obrázku.", "storage_status": response.status_code}), 502
        payload = response.json()
        signed = payload.get("signedURL") or payload.get("signedUrl")
        token = payload.get("token")
        if not signed and not token:
            return jsonify({"message": "Úložiště nevrátilo nahrávací odkaz."}), 502
        upload_url = signed if signed and signed.startswith("http") else (f"{supabase_url}{signed}" if signed else f"{supabase_url}/storage/v1/object/upload/sign/{BUCKET}/{path}?token={token}")
        public_url = f"{supabase_url}/storage/v1/object/public/{BUCKET}/{path}"
        return jsonify({"upload_url": upload_url, "public_url": public_url, "storage_path": path, "mime_type": mime}), 200
    except (requests.RequestException, RuntimeError, ValueError) as exc:
        return jsonify({"message": str(exc) or "Chyba při přípravě nahrávání obrázku."}), 502


@videos_bp.route("/api/admin/videos", methods=["GET"])
@require_permission("content.manage")
def admin_list_videos():
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT v.id, v.title, v.description, v.storage_path, v.public_url, v.mime_type,
                   v.file_size, v.duration_seconds, v.published, v.sort_order, v.created_at,
                   v.author_comment, v.poster_url, v.genre_tags, v.mood_tags,
                   COALESCE((SELECT json_agg(json_build_object('id', t.id, 'title', t.title, 'role', a.role))
                     FROM media_video_tracks a JOIN music_tracks t ON t.id=a.track_id WHERE a.video_id=v.id), '[]'::json) AS tracks,
                   COALESCE((SELECT json_agg(json_build_object('id', b.id, 'title', b.title, 'volume_id', a.volume_id, 'volume_title', vol.title, 'volume_number', vol.number))
                     FROM media_video_books a JOIN books b ON b.id=a.book_id LEFT JOIN volumes vol ON vol.id=a.volume_id WHERE a.video_id=v.id), '[]'::json) AS books,
                   COALESCE((SELECT json_agg(json_build_object('id', c.id, 'name', c.name, 'book_id', c.book_id))
                     FROM media_video_characters a JOIN characters c ON c.id=a.character_id WHERE a.video_id=v.id), '[]'::json) AS characters
            FROM media_videos v ORDER BY v.sort_order, v.created_at DESC
        """)
        return jsonify([_video(r) for r in cur.fetchall()])
    finally:
        conn.close()


@videos_bp.route("/api/admin/videos", methods=["POST"])
@require_permission("content.manage")
def create_video():
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
@require_permission("content.manage")
def update_video(video_id):
    data = request.get_json(silent=True) or {}
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("UPDATE media_videos SET title=?, description=?, author_comment=?, poster_url=?, genre_tags=?, mood_tags=?, duration_seconds=?, published=?, sort_order=?, updated_at=NOW() WHERE id=?",
          (str(data.get("title", "")).strip(), str(data.get("description", "")), str(data.get("author_comment", "")), str(data.get("poster_url", "")), json.dumps(data.get("genre_tags", []) or [], ensure_ascii=False), json.dumps(data.get("mood_tags", []) or [], ensure_ascii=False), int(data.get("duration_seconds", 0) or 0), bool(data.get("published", False)), int(data.get("sort_order", 0) or 0), video_id))
        if cur.rowcount == 0:
            return jsonify({"message": "Video nebylo nalezeno."}), 404
        conn.commit(); return jsonify({"message": "Video bylo upraveno."})
    except Exception:
        conn.rollback(); raise
    finally:
        conn.close()


@videos_bp.route("/api/admin/videos/<int:video_id>/assignments", methods=["PUT"])
@require_permission("content.manage")
def update_assignments(video_id):
    data = request.get_json(silent=True) or {}
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM media_videos WHERE id=?", (video_id,))
        if not cur.fetchone():
            return jsonify({"message": "Video nebylo nalezeno."}), 404
        books = data.get("books", []) or []
        book_ids = {int(item["id"]) for item in books}
        character_ids = {int(item["id"]) for item in (data.get("characters", []) or [])}
        if character_ids:
            placeholders = ",".join("?" for _ in character_ids)
            cur.execute(f"SELECT id, book_id FROM characters WHERE id IN ({placeholders})", tuple(character_ids))
            valid = {int(row[0]): int(row[1]) for row in cur.fetchall()}
            if set(valid) != character_ids or any(book_id not in book_ids for book_id in valid.values()):
                return jsonify({"message": "Každá přiřazená postava musí patřit k jedné z přiřazených knih."}), 400
        cur.execute("DELETE FROM media_video_tracks WHERE video_id=?", (video_id,))
        cur.execute("DELETE FROM media_video_books WHERE video_id=?", (video_id,))
        cur.execute("DELETE FROM media_video_characters WHERE video_id=?", (video_id,))
        for item in data.get("tracks", []) or []:
            role = item.get("role", "karaoke")
            if role not in ("karaoke", "story"):
                role = "karaoke"
            cur.execute("INSERT INTO media_video_tracks (video_id, track_id, role) VALUES (?, ?, ?) ON CONFLICT DO NOTHING", (video_id, int(item["id"]), role))
        for item in books:
            cur.execute("INSERT INTO media_video_books (video_id, book_id, volume_id) VALUES (?, ?, ?) ON CONFLICT DO NOTHING", (video_id, int(item["id"]), int(item["volume_id"]) if item.get("volume_id") else None))
        for character_id in character_ids:
            cur.execute("INSERT INTO media_video_characters (video_id, character_id) VALUES (?, ?) ON CONFLICT DO NOTHING", (video_id, character_id))
        conn.commit(); return jsonify({"message": "Přiřazení videa byla uložena."})
    except Exception:
        conn.rollback(); raise
    finally:
        conn.close()


@videos_bp.route("/api/admin/videos/<int:video_id>", methods=["DELETE"])
@require_permission("content.manage")
def delete_video(video_id):
    conn = get_connection()
    try:
        cur = conn.cursor(); cur.execute("SELECT storage_path FROM media_videos WHERE id=?", (video_id,)); row = cur.fetchone()
        if not row:
            return jsonify({"message": "Video nebylo nalezeno."}), 404
        path = row[0]
        cur.execute("SELECT COUNT(*) FROM media_video_tracks WHERE video_id=?", (video_id,)); track_refs = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM media_video_books WHERE video_id=?", (video_id,)); book_refs = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM media_video_characters WHERE video_id=?", (video_id,)); character_refs = cur.fetchone()[0]
        if track_refs or book_refs or character_refs:
            return jsonify({"message": "Nejprve odeber všechna přiřazení videa."}), 409
        supabase_url, key = _storage()
        response = requests.delete(f"{supabase_url}/storage/v1/object/{BUCKET}", headers={"Authorization": f"Bearer {key}", "apikey": key, "Content-Type": "application/json"}, json={"prefixes": [path]}, timeout=30)
        if not response.ok:
            return jsonify({"message": "Soubor v úložišti se nepodařilo odstranit."}), 502
        cur.execute("DELETE FROM media_videos WHERE id=?", (video_id,)); conn.commit()
        return jsonify({"message": "Video bylo odstraněno z knihovny i úložiště."})
    except Exception:
        conn.rollback(); raise
    finally:
        conn.close()


def _video_contexts_accessible(cur, video_id, user_id):
    """A public video is available only when every linked context is available."""
    # Every linked context must be accessible. A video attached to a specific
    # volume is not public merely because its parent book is public.
    cur.execute(
        "SELECT book_id, volume_id FROM media_video_books WHERE video_id = ?",
        (video_id,),
    )
    for relation in cur.fetchall():
        if relation["book_id"] is not None and not resource_is_accessible(
            cur, f"book:{relation['book_id']}", user_id
        ):
            return False
        if relation["volume_id"] is not None and not resource_is_accessible(
            cur, f"volume:{relation['volume_id']}", user_id
        ):
            return False

    for table, column, prefix in (
        ("media_video_characters", "character_id", "character"),
        ("media_video_tracks", "track_id", "track"),
    ):
        cur.execute(f"SELECT {column} AS resource_id FROM {table} WHERE video_id = ?", (video_id,))
        for relation in cur.fetchall():
            if not resource_is_accessible(cur, f"{prefix}:{relation['resource_id']}", user_id):
                return False
    return True


def _public_payload(cur, rows, user_id=None):
    result = []
    for row in rows:
        item = dict(row)
        cur.execute("""SELECT b.id, b.title, a.volume_id, vol.title AS volume_title, vol.number AS volume_number FROM media_video_books a
                       JOIN books b ON b.id=a.book_id LEFT JOIN volumes vol ON vol.id=a.volume_id WHERE a.video_id=? ORDER BY b.title""", (item["id"],))
        book_rows = filter_accessible_rows(cur, cur.fetchall(), lambda x: "book:" + str(x["id"]), user_id)
        item["books"] = [dict(x) for x in book_rows]
        cur.execute("""SELECT c.id, c.name, c.book_id FROM media_video_characters a
                       JOIN characters c ON c.id=a.character_id WHERE a.video_id=? ORDER BY c.name""", (item["id"],))
        character_rows = filter_accessible_rows(cur, cur.fetchall(), lambda x: "character:" + str(x["id"]), user_id)
        item["characters"] = [dict(x) for x in character_rows]
        item["published"] = bool(item.get("published"))
        result.append(item)
    return result


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
        rows = cur.fetchall()
        user_id = _current_user_id()
        rows = filter_accessible_rows(cur, rows, lambda row: "video:" + str(row["id"]), user_id)
        rows = [row for row in rows if _video_contexts_accessible(cur, row["id"], user_id)]
        return jsonify(_public_payload(cur, rows, user_id))
    finally:
        conn.close()
