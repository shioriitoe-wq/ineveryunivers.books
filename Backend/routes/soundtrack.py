import json
import re
import unicodedata
import os
import uuid
from pathlib import Path

import requests
from flask import Blueprint, jsonify, request
from database.database import get_connection
from routes.admin_permissions import verify_admin_token

soundtracks_bp = Blueprint("soundtracks", __name__)


def _track_query(where_clause="", order_clause=""):
    return f"""
        SELECT
            mt.id,
            mt.title,
            mt.slug,
            mt.artist,
            mt.book_id,
            b.title AS book_title,
            b.cover_url AS book_cover_url,
            mt.volume_id,
            v.title AS volume_title,
            v.number AS volume_number,
            v.cover_url AS volume_cover_url,
            mt.character_names,
            mt.audio_url,
            mt.cover_url,
            mt.duration_seconds,
            mt.mood_tags,
            mt.genre_tags,
            mt.scene,
            mt.description,
            mt.author_comment,
            mt.lyrics_lines,
            mt.allow_download,
            mt.published,
            mt.sort_order,
            mt.created_at
        FROM music_tracks mt
        LEFT JOIN books b ON b.id = mt.book_id
        LEFT JOIN volumes v ON v.id = mt.volume_id
        {where_clause}
        {order_clause}
    """


def _serialize_track(row):
    if row is None:
        return None

    result = dict(row)

    for field in ("mood_tags", "genre_tags", "character_names"):
        value = result.get(field)
        if value is None:
            result[field] = []
        elif isinstance(value, str):
            try:
                parsed = json.loads(value)
                result[field] = parsed if isinstance(parsed, list) else [value]
            except (json.JSONDecodeError, TypeError):
                result[field] = [item.strip() for item in value.split(",") if item.strip()]

    value = result.get("lyrics_lines")
    if value is None:
        result["lyrics_lines"] = []
    elif isinstance(value, str):
        try:
            parsed = json.loads(value)
            result["lyrics_lines"] = parsed if isinstance(parsed, list) else []
        except (json.JSONDecodeError, TypeError):
            result["lyrics_lines"] = []

    # Convert older plain-text lyric rows into the newer bilingual row shape.
    normalized_lyrics = []
    for line in result.get("lyrics_lines", []):
        if isinstance(line, str):
            normalized_lyrics.append({
                "text_original": line,
                "text_en": line,
                "text_cs": "",
                "start_ms": None,
                "end_ms": None,
            })
        elif isinstance(line, dict):
            original = line.get("text_original", line.get("text_en", line.get("en", "")))
            translated = line.get("text_cs", line.get("cs", ""))
            normalized_lyrics.append({
                **line,
                "text_original": original if isinstance(original, str) else "",
                "text_en": original if isinstance(original, str) else "",
                "text_cs": translated if isinstance(translated, str) else "",
                "start_ms": line.get("start_ms", line.get("startMs")),
                "end_ms": line.get("end_ms", line.get("endMs")),
            })
    result["lyrics_lines"] = normalized_lyrics

    for field in ("allow_download", "published"):
        result[field] = bool(result.get(field))

    return result


def _admin_authorized():
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return False

    return verify_admin_token(header[7:].strip())


def _slugify(value):
    value = unicodedata.normalize("NFKD", value)
    value = "".join(char for char in value if not unicodedata.combining(char))
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-") or "soundtrack"


def _string_value(data, field, default=""):
    value = data.get(field, default)
    if value is None:
        return ""
    if not isinstance(value, str):
        raise ValueError(f"Pole {field} musí být text.")
    return value.strip()


def _tag_list(value, field):
    if value is None or value == "":
        return []

    if isinstance(value, str):
        values = value.split(",")
    elif isinstance(value, list):
        values = value
    else:
        raise ValueError(f"Pole {field} musí být seznam nebo text.")

    result = []
    for item in values:
        if not isinstance(item, str):
            raise ValueError(f"Položky v {field} musí být text.")
        item = item.strip()
        if item and item not in result:
            result.append(item)

    return result



def _lyrics_list(value):
    if value is None or value == "":
        return []

    if isinstance(value, str):
        return value.splitlines()

    if isinstance(value, list):
        if all(isinstance(line, str) for line in value):
            return value
        if all(isinstance(line, dict) for line in value):
            return value

    raise ValueError(
        "Text písně musí být seznam řádků nebo text."
    )



def _integer_value(data, field, default=0, minimum=0):
    value = data.get(field, default)
    if value in (None, ""):
        value = default
    if isinstance(value, bool):
        raise ValueError(f"Pole {field} musí být celé číslo.")
    try:
        number = int(value)
    except (ValueError, TypeError):
        raise ValueError(f"Pole {field} musí být celé číslo.")
    if number < minimum:
        raise ValueError(f"Pole {field} nesmí být menší než {minimum}.")
    return number


def _boolean_value(data, field, default=False):
    value = data.get(field, default)
    if isinstance(value, bool):
        return value
    if value in (1, "1", "true", "True", "on", "yes"):
        return True
    if value in (0, "0", "false", "False", "off", "no", "", None):
        return False
    raise ValueError(f"Pole {field} musí být pravdivostní hodnota.")



def _track_values(data):
    if not isinstance(data, dict):
        raise ValueError("Očekávám objekt s údaji o skladbě.")

    title = _string_value(data, "title")
    if not title:
        raise ValueError("Název skladby je povinný.")

    slug = _slugify(_string_value(data, "slug") or title)
    artist = _string_value(data, "artist")
    audio_url = _string_value(data, "audio_url")
    cover_url = _string_value(data, "cover_url")

    raw_book_id = data.get("book_id")
    if raw_book_id in (None, ""):
        book_id = None
    else:
        try:
            book_id = int(raw_book_id)
        except (ValueError, TypeError):
            raise ValueError("Vybraná kniha nemá platné ID.")
        if book_id <= 0:
            raise ValueError("ID knihy musí být kladné číslo.")

    raw_volume_id = data.get("volume_id")
    if raw_volume_id in (None, ""):
        volume_id = None
    else:
        try:
            volume_id = int(raw_volume_id)
        except (ValueError, TypeError):
            raise ValueError("Vybraný díl nemá platné ID.")
        if volume_id <= 0:
            raise ValueError("ID dílu musí být kladné číslo.")

    raw_characters = data.get("character_names", [])
    character_names = _tag_list(raw_characters, "character_names")

    raw_lyrics = data.get("lyrics_lines")
    lyrics_lines = _lyrics_list(raw_lyrics)

    normalized_lyrics = []
    for line in lyrics_lines:
        if isinstance(line, str):
            normalized_lyrics.append({
                "text_original": line,
                "text_cs": "",
                "start_ms": None,
                "end_ms": None,
            })
        elif isinstance(line, dict):
            original = line.get("text_original", line.get("text_en", line.get("en", "")))
            translated = line.get("text_cs", line.get("cs", ""))
            if not isinstance(original, str) or not isinstance(translated, str):
                raise ValueError("Texty řádků písně musí být text.")
            start_ms = line.get("start_ms", line.get("startMs"))
            end_ms = line.get("end_ms", line.get("endMs"))

            def parse_time(value, field):
                if value in (None, ""):
                    return None
                if isinstance(value, bool):
                    raise ValueError(f"Čas {field} musí být nezáporné celé číslo.")
                try:
                    number = int(value)
                except (ValueError, TypeError):
                    raise ValueError(f"Čas {field} musí být nezáporné celé číslo.")
                if number < 0:
                    raise ValueError(f"Čas {field} nesmí být záporný.")
                return number

            normalized_lyrics.append({
                "text_original": original,
                "text_cs": translated,
                "start_ms": parse_time(start_ms, "začátku"),
                "end_ms": parse_time(end_ms, "konce"),
            })
        else:
            raise ValueError("Řádek textu musí být text nebo objekt.")

    return {
        "title": title,
        "slug": slug,
        "artist": artist,
        "book_id": book_id,
        "volume_id": volume_id,
        "character_names": character_names,
        "audio_url": audio_url,
        "cover_url": cover_url,
        "duration_seconds": _integer_value(data, "duration_seconds"),
        "mood_tags": _tag_list(data.get("mood_tags"), "mood_tags"),
        "genre_tags": _tag_list(data.get("genre_tags"), "genre_tags"),
        "scene": _string_value(data, "scene"),
        "description": _string_value(data, "description"),
        "author_comment": _string_value(data, "author_comment"),
        "lyrics_lines": normalized_lyrics,
        "allow_download": _boolean_value(data, "allow_download"),
        "published": _boolean_value(data, "published"),
        "sort_order": _integer_value(data, "sort_order"),
    }



def _slug_exists(cursor, slug, exclude_id=None):
    if exclude_id is None:
        cursor.execute(
            "SELECT id FROM music_tracks WHERE slug = ?",
            (slug,),
        )
    else:
        cursor.execute(
            "SELECT id FROM music_tracks WHERE slug = ? AND id <> ?",
            (slug, exclude_id),
        )
    return cursor.fetchone() is not None


def _unique_slug(cursor, slug, exclude_id=None):
    candidate = slug
    suffix = 2

    while _slug_exists(cursor, candidate, exclude_id):
        candidate = f"{slug}-{suffix}"
        suffix += 1

    return candidate


@soundtracks_bp.route("/api/soundtracks", methods=["GET"])
def list_soundtracks():
    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute(
            _track_query(
                "WHERE mt.published = TRUE",
                "ORDER BY mt.sort_order ASC, mt.title ASC, mt.id ASC",
            )
        )
        return jsonify([_serialize_track(row) for row in cursor.fetchall()])
    finally:
        connection.close()


@soundtracks_bp.route("/api/soundtracks/<string:slug>", methods=["GET"])
def get_soundtrack(slug):
    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute(
            _track_query("WHERE mt.published = TRUE AND mt.slug = ?"),
            (slug,),
        )
        row = cursor.fetchone()

        if row is None:
            return jsonify({"message": "Skladba nebyla nalezena."}), 404

        return jsonify(_serialize_track(row))
    finally:
        connection.close()


@soundtracks_bp.route("/api/admin/soundtracks", methods=["GET"])
def admin_list_soundtracks():
    if not _admin_authorized():
        return jsonify({"message": "Přihlášení administrátora je vyžadováno."}), 401

    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute(
            _track_query(
                "",
                "ORDER BY mt.sort_order ASC, mt.title ASC, mt.id ASC",
            )
        )
        return jsonify([_serialize_track(row) for row in cursor.fetchall()])
    finally:
        connection.close()


@soundtracks_bp.route("/api/admin/soundtracks", methods=["POST"])
def admin_create_soundtrack():
    data = request.get_json(silent=True)
    try:
        values = _track_values(data)
    except ValueError as error:
        return jsonify({"message": str(error)}), 400

    connection = get_connection()
    try:
        cursor = connection.cursor()
        values["slug"] = _unique_slug(cursor, values["slug"])

        cursor.execute(
            """
            INSERT INTO music_tracks (
                title, slug, artist, book_id, volume_id, character_names,
                audio_url, cover_url, duration_seconds, mood_tags, genre_tags,
                scene, description, author_comment, lyrics_lines,
                allow_download, published, sort_order
            )
            VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?, ?, ?
            )
            RETURNING id
            """,
            (
                values["title"],
                values["slug"],
                values["artist"],
                values["book_id"],
                values["volume_id"],
                values["character_names"],
                values["audio_url"],
                values["cover_url"],
                values["duration_seconds"],
                values["mood_tags"],
                values["genre_tags"],
                values["scene"],
                values["description"],
                values["author_comment"],
                json.dumps(values["lyrics_lines"], ensure_ascii=False),
                values["allow_download"],
                values["published"],
                values["sort_order"],
            ),
        )
        row = cursor.fetchone()
        connection.commit()
        return jsonify({
            "message": "Skladba byla vytvořena.",
            "id": row["id"],
            "slug": values["slug"],
        }), 201
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


@soundtracks_bp.route("/api/admin/soundtracks/<int:track_id>", methods=["PUT"])
def admin_update_soundtrack(track_id):
    data = request.get_json(silent=True)
    try:
        values = _track_values(data)
    except ValueError as error:
        return jsonify({"message": str(error)}), 400

    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT id FROM music_tracks WHERE id = ?", (track_id,))
        if cursor.fetchone() is None:
            return jsonify({"message": "Skladba nebyla nalezena."}), 404

        values["slug"] = _unique_slug(cursor, values["slug"], track_id)

        cursor.execute(
            """
            UPDATE music_tracks
            SET
                title = ?,
                slug = ?,
                artist = ?,
                book_id = ?,
                volume_id = ?,
                character_names = ?,
                audio_url = ?,
                cover_url = ?,
                duration_seconds = ?,
                mood_tags = ?,
                genre_tags = ?,
                scene = ?,
                description = ?,
                author_comment = ?,
                lyrics_lines = ?::jsonb,
                allow_download = ?,
                published = ?,
                sort_order = ?,
                updated_at = NOW()
            WHERE id = ?
            """,
            (
                values["title"],
                values["slug"],
                values["artist"],
                values["book_id"],
                values["volume_id"],
                values["character_names"],
                values["audio_url"],
                values["cover_url"],
                values["duration_seconds"],
                values["mood_tags"],
                values["genre_tags"],
                values["scene"],
                values["description"],
                values["author_comment"],
                json.dumps(values["lyrics_lines"], ensure_ascii=False),
                values["allow_download"],
                values["published"],
                values["sort_order"],
                track_id,
            ),
        )
        connection.commit()
        return jsonify({
            "message": "Skladba byla upravena.",
            "id": track_id,
            "slug": values["slug"],
        })
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


@soundtracks_bp.route("/api/admin/soundtracks/<int:track_id>", methods=["DELETE"])
def admin_delete_soundtrack(track_id):
    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute("DELETE FROM music_tracks WHERE id = ?", (track_id,))
        if cursor.rowcount == 0:
            connection.rollback()
            return jsonify({"message": "Skladba nebyla nalezena."}), 404

        connection.commit()
        return jsonify({"message": "Skladba byla odstraněna."})
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()

@soundtracks_bp.route("/api/admin/soundtracks/upload", methods=["POST"])
@soundtracks_bp.route("/api/admin/media/upload", methods=["POST"])
def admin_upload_media_file():
    if not _admin_authorized():
        return jsonify({"message": "Přihlášení administrátora je vyžadováno."}), 401

    uploaded_file = request.files.get("file")
    file_type = request.form.get("type", "").strip().lower()

    if not uploaded_file or not uploaded_file.filename:
        return jsonify({"message": "Nebyl vybrán žádný soubor."}), 400

    allowed_types = {
        "audio": {
            "extensions": {".mp3"},
            "mimetypes": {"audio/mpeg", "audio/mp3"},
            "folder": "music",
            "max_size": 25 * 1024 * 1024,
        },
        "cover": {
            "extensions": {".jpg", ".jpeg", ".png", ".webp"},
            "mimetypes": {"image/jpeg", "image/png", "image/webp"},
            "folder": "covers",
            "max_size": 5 * 1024 * 1024,
        },
        "book_cover": {
            "extensions": {".jpg", ".jpeg", ".png", ".webp"},
            "mimetypes": {"image/jpeg", "image/png", "image/webp"},
            "folder": "book-covers",
            "max_size": 5 * 1024 * 1024,
        },
        "volume_cover": {
            "extensions": {".jpg", ".jpeg", ".png", ".webp"},
            "mimetypes": {"image/jpeg", "image/png", "image/webp"},
            "folder": "volume-covers",
            "max_size": 5 * 1024 * 1024,
        },
    }

    if file_type not in allowed_types:
        return jsonify({"message": "Typ musí být audio, cover, book_cover nebo volume_cover."}), 400

    config = allowed_types[file_type]
    extension = Path(uploaded_file.filename).suffix.lower()

    if extension not in config["extensions"]:
        return jsonify({"message": "Tento formát souboru není povolen."}), 400

    if uploaded_file.mimetype not in config["mimetypes"]:
        return jsonify({"message": "Typ souboru neodpovídá povolenému formátu."}), 400

    file_bytes = uploaded_file.read(config["max_size"] + 1)

    if not file_bytes:
        return jsonify({"message": "Soubor je prázdný."}), 400

    if len(file_bytes) > config["max_size"]:
        return jsonify({"message": "Soubor překračuje povolenou velikost."}), 413

    supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    supabase_key = os.getenv("SUPABASE_SECRET_KEY", "")

    if not supabase_url or not supabase_key:
        return jsonify({"message": "Úložiště není nakonfigurováno."}), 500

    object_path = f'{config["folder"]}/{uuid.uuid4().hex}{extension}'
    upload_url = (
        f"{supabase_url}/storage/v1/object/"
        f"ineveryunivers-media/{object_path}"
    )

    try:
        response = requests.post(
            upload_url,
            headers={
                "Authorization": f"Bearer {supabase_key}",
                "apikey": supabase_key,
                "Content-Type": uploaded_file.mimetype,
                "x-upsert": "false",
            },
            data=file_bytes,
            timeout=60,
        )

        if not response.ok:
            return jsonify({
                "message": "Nahrávání do úložiště selhalo.",
                "status": response.status_code,
            }), 502

        public_url = (
            f"{supabase_url}/storage/v1/object/public/"
            f"ineveryunivers-media/{object_path}"
        )

        return jsonify({
            "message": "Soubor byl nahrán.",
            "url": public_url,
            "path": object_path,
            "type": file_type,
        }), 201

    except requests.RequestException:
        return jsonify({
            "message": "Úložiště se nepodařilo kontaktovat."
        }), 502