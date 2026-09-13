from flask import Blueprint, jsonify, request

from database.database import get_connection


aeil_bp = Blueprint("aeil", __name__)
AEIL_BOOK_ID = 2


def ensure_aeil_chapter_settings(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS aeil_chapter_settings (
            chapter_id INTEGER PRIMARY KEY,
            character_id INTEGER NOT NULL,
            FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
            FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
        )
    """)


def character_payload(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "header_image": row["header_image"],
        "main_image": row["main_image"],
        "hover_image": row["hover_image"],
        "main_video": row["main_video"],
        "chapter_background": row["chapter_background"],
        "race": row["race"],
        "published": row["published"],
    }


def chapter_payload(row):
    return {
        "id": row["id"],
        "book_id": row["book_id"],
        "volume_id": row["volume_id"],
        "part_id": row["part_id"],
        "number": row["number"],
        "title": row["title"],
        "content_html": row["content_html"],
        "status": row["status"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def get_aeil_chapter(cursor, chapter_id):
    cursor.execute(
        "SELECT * FROM chapters WHERE id = ? AND book_id = ?",
        (chapter_id, AEIL_BOOK_ID),
    )
    return cursor.fetchone()


def load_narrator_row(cursor, chapter_id):
    cursor.execute("""
        SELECT
            s.character_id,
            c.id,
            c.name,
            c.header_image,
            c.main_image,
            c.hover_image,
            c.main_video,
            c.chapter_background,
            c.race,
            c.published
        FROM aeil_chapter_settings s
        JOIN characters c ON c.id = s.character_id
        WHERE s.chapter_id = ? AND c.book_id = ?
    """, (chapter_id, AEIL_BOOK_ID))
    return cursor.fetchone()


@aeil_bp.route("/api/aeil/chapters/<int:chapter_id>/narrator", methods=["GET"])
def get_chapter_narrator(chapter_id):
    connection = get_connection()
    cursor = connection.cursor()
    ensure_aeil_chapter_settings(cursor)

    if get_aeil_chapter(cursor, chapter_id) is None:
        connection.close()
        return jsonify({"message": "AEIL kapitola nebyla nalezena."}), 404

    row = load_narrator_row(cursor, chapter_id)
    connection.close()

    if row is None:
        return jsonify({"chapter_id": chapter_id, "character_id": None, "character": None})

    return jsonify({
        "chapter_id": chapter_id,
        "character_id": row["character_id"],
        "character": character_payload(row),
    })


@aeil_bp.route("/api/aeil/chapters/<int:chapter_id>/narrator", methods=["PUT"])
def set_chapter_narrator(chapter_id):
    data = request.get_json(silent=True) or {}
    character_id = data.get("character_id")

    if character_id in (None, ""):
        return jsonify({"message": "Vypravěč musí být vybrán."}), 400

    try:
        character_id = int(character_id)
    except (TypeError, ValueError):
        return jsonify({"message": "Neplatné ID vypravěče."}), 400

    connection = get_connection()
    cursor = connection.cursor()
    ensure_aeil_chapter_settings(cursor)

    if get_aeil_chapter(cursor, chapter_id) is None:
        connection.close()
        return jsonify({"message": "AEIL kapitola nebyla nalezena."}), 404

    cursor.execute(
        "SELECT id FROM characters WHERE id = ? AND book_id = ?",
        (character_id, AEIL_BOOK_ID),
    )
    if cursor.fetchone() is None:
        connection.close()
        return jsonify({"message": "Vybraná postava nepatří do AEIL."}), 400

    cursor.execute(
        "SELECT chapter_id FROM aeil_chapter_settings WHERE chapter_id = ?",
        (chapter_id,),
    )
    exists = cursor.fetchone() is not None

    if exists:
        cursor.execute(
            "UPDATE aeil_chapter_settings SET character_id = ? WHERE chapter_id = ?",
            (character_id, chapter_id),
        )
    else:
        cursor.execute(
            "INSERT INTO aeil_chapter_settings (chapter_id, character_id) VALUES (?, ?)",
            (chapter_id, character_id),
        )

    connection.commit()
    row = load_narrator_row(cursor, chapter_id)
    connection.close()

    return jsonify({
        "chapter_id": chapter_id,
        "character_id": row["character_id"],
        "character": character_payload(row),
    })


@aeil_bp.route("/api/aeil/chapters/<int:chapter_id>/narrator", methods=["DELETE"])
def delete_chapter_narrator(chapter_id):
    connection = get_connection()
    cursor = connection.cursor()
    ensure_aeil_chapter_settings(cursor)

    if get_aeil_chapter(cursor, chapter_id) is None:
        connection.close()
        return jsonify({"message": "AEIL kapitola nebyla nalezena."}), 404

    cursor.execute(
        "DELETE FROM aeil_chapter_settings WHERE chapter_id = ?",
        (chapter_id,),
    )
    connection.commit()
    connection.close()

    return jsonify({"chapter_id": chapter_id, "character_id": None, "character": None})


@aeil_bp.route("/api/aeil/characters/<int:character_id>/chapters", methods=["GET"])
def get_character_chapters(character_id):
    connection = get_connection()
    cursor = connection.cursor()
    ensure_aeil_chapter_settings(cursor)

    cursor.execute(
        "SELECT id FROM characters WHERE id = ? AND book_id = ?",
        (character_id, AEIL_BOOK_ID),
    )
    if cursor.fetchone() is None:
        connection.close()
        return jsonify({"message": "AEIL postava nebyla nalezena."}), 404

    cursor.execute("""
        SELECT
            c.id, c.book_id, c.volume_id, c.part_id, c.number,
            c.title, c.content_html, c.status, c.created_at, c.updated_at
        FROM chapters c
        JOIN aeil_chapter_settings s ON s.chapter_id = c.id
        WHERE c.book_id = ? AND s.character_id = ?
        ORDER BY c.number IS NULL, c.number, c.id
    """, (AEIL_BOOK_ID, character_id))

    rows = cursor.fetchall()
    connection.close()
    return jsonify([chapter_payload(row) for row in rows])
