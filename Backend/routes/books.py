from flask import Blueprint, jsonify, request
from database.database import get_connection

books_bp = Blueprint("books", __name__)


def book_from_row(row):
    return {
        "id": row["id"],
        "title": row["title"],
        "status": row["status"],
        "type": row["type"],
        "parent_id": row["parent_id"],
        "uses_volumes": bool(row["uses_volumes"]),
        "uses_parts": bool(row["uses_parts"]),
    }


def book_exists(cursor, book_id):
    cursor.execute("SELECT id FROM books WHERE id = ?", (book_id,))
    return cursor.fetchone() is not None


@books_bp.route("/api/books", methods=["GET"])
def get_books():
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute("SELECT * FROM books ORDER BY id")
    rows = cursor.fetchall()
    connection.close()
    return jsonify([book_from_row(row) for row in rows])


@books_bp.route("/api/books/<int:book_id>", methods=["GET"])
def get_book(book_id):
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute("SELECT * FROM books WHERE id = ?", (book_id,))
    row = cursor.fetchone()
    connection.close()

    if row is None:
        return jsonify({"message": "Kniha nebyla nalezena."}), 404

    return jsonify(book_from_row(row))


@books_bp.route("/api/books", methods=["POST"])
def add_book():
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()

    if not title:
        return jsonify({"message": "Název knihy je povinný."}), 400

    status = data.get("status", "Rozpracováno")
    book_type = data.get("type", "standalone")
    parent_id = data.get("parent_id")
    uses_volumes = 1 if data.get("uses_volumes") else 0
    uses_parts = 1 if data.get("uses_parts") else 0

    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute(
        """
        INSERT INTO books
            (title, status, type, parent_id, uses_volumes, uses_parts)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (title, status, book_type, parent_id, uses_volumes, uses_parts),
    )
    book_id = cursor.lastrowid
    connection.commit()
    connection.close()

    return jsonify({"id": book_id, "message": "Kniha byla přidána."}), 201


@books_bp.route("/api/books/<int:book_id>", methods=["PUT"])
def update_book(book_id):
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()

    if not title:
        return jsonify({"message": "Název knihy je povinný."}), 400

    status = data.get("status", "Rozpracováno")
    book_type = data.get("type", "standalone")
    parent_id = data.get("parent_id")
    uses_volumes = 1 if data.get("uses_volumes") else 0
    uses_parts = 1 if data.get("uses_parts") else 0

    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute(
        """
        UPDATE books
        SET title = ?, status = ?, type = ?, parent_id = ?,
            uses_volumes = ?, uses_parts = ?
        WHERE id = ?
        """,
        (title, status, book_type, parent_id, uses_volumes, uses_parts, book_id),
    )

    if cursor.rowcount == 0:
        connection.close()
        return jsonify({"message": "Kniha nebyla nalezena."}), 404

    connection.commit()
    connection.close()
    return jsonify({"message": "Kniha byla upravena."})


@books_bp.route("/api/books/<int:book_id>", methods=["DELETE"])
def delete_book(book_id):
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute("DELETE FROM books WHERE id = ?", (book_id,))
    deleted = cursor.rowcount
    connection.commit()
    connection.close()

    if deleted == 0:
        return jsonify({"message": "Kniha nebyla nalezena."}), 404

    return jsonify({"message": "Kniha byla smazána."})


# -------------------- DÍLY --------------------

@books_bp.route("/api/books/<int:book_id>/volumes", methods=["GET"])
def get_volumes(book_id):
    connection = get_connection()
    cursor = connection.cursor()

    if not book_exists(cursor, book_id):
        connection.close()
        return jsonify({"message": "Kniha nebyla nalezena."}), 404

    cursor.execute(
        "SELECT * FROM volumes WHERE book_id = ? ORDER BY number IS NULL, number, id",
        (book_id,),
    )
    rows = cursor.fetchall()
    connection.close()

    return jsonify([dict(row) for row in rows])


@books_bp.route("/api/books/<int:book_id>/volumes", methods=["POST"])
def add_volume(book_id):
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()

    if not title:
        return jsonify({"message": "Název dílu je povinný."}), 400

    connection = get_connection()
    cursor = connection.cursor()

    if not book_exists(cursor, book_id):
        connection.close()
        return jsonify({"message": "Kniha nebyla nalezena."}), 404

    cursor.execute(
        "INSERT INTO volumes (book_id, number, title) VALUES (?, ?, ?)",
        (book_id, data.get("number"), title),
    )
    volume_id = cursor.lastrowid
    connection.commit()

    cursor.execute("SELECT * FROM volumes WHERE id = ?", (volume_id,))
    row = cursor.fetchone()
    connection.close()

    return jsonify(dict(row)), 201


@books_bp.route("/api/books/<int:book_id>/volumes/<int:volume_id>", methods=["PUT"])
def update_volume(book_id, volume_id):
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()

    if not title:
        return jsonify({"message": "Název dílu je povinný."}), 400

    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute(
        """
        UPDATE volumes
        SET number = ?, title = ?
        WHERE id = ? AND book_id = ?
        """,
        (data.get("number"), title, volume_id, book_id),
    )

    if cursor.rowcount == 0:
        connection.close()
        return jsonify({"message": "Díl nebyl nalezen."}), 404

    connection.commit()
    connection.close()
    return jsonify({"message": "Díl byl upraven."})


@books_bp.route("/api/books/<int:book_id>/volumes/<int:volume_id>", methods=["DELETE"])
def delete_volume(book_id, volume_id):
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute(
        "DELETE FROM volumes WHERE id = ? AND book_id = ?",
        (volume_id, book_id),
    )
    deleted = cursor.rowcount
    connection.commit()
    connection.close()

    if deleted == 0:
        return jsonify({"message": "Díl nebyl nalezen."}), 404

    return jsonify({"message": "Díl byl smazán."})


# -------------------- ČÁSTI --------------------

@books_bp.route("/api/books/<int:book_id>/parts", methods=["GET"])
def get_parts(book_id):
    connection = get_connection()
    cursor = connection.cursor()

    if not book_exists(cursor, book_id):
        connection.close()
        return jsonify({"message": "Kniha nebyla nalezena."}), 404

    cursor.execute(
        "SELECT * FROM parts WHERE book_id = ? ORDER BY number IS NULL, number, id",
        (book_id,),
    )
    rows = cursor.fetchall()
    connection.close()

    return jsonify([dict(row) for row in rows])


@books_bp.route("/api/books/<int:book_id>/parts", methods=["POST"])
def add_part(book_id):
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()

    if not title:
        return jsonify({"message": "Název části je povinný."}), 400

    connection = get_connection()
    cursor = connection.cursor()

    if not book_exists(cursor, book_id):
        connection.close()
        return jsonify({"message": "Kniha nebyla nalezena."}), 404

    volume_id = data.get("volume_id")
    if volume_id is not None:
        cursor.execute(
            "SELECT id FROM volumes WHERE id = ? AND book_id = ?",
            (volume_id, book_id),
        )
        if cursor.fetchone() is None:
            connection.close()
            return jsonify({"message": "Díl nepatří k této knize."}), 400

    cursor.execute(
        """
        INSERT INTO parts (book_id, volume_id, number, title)
        VALUES (?, ?, ?, ?)
        """,
        (book_id, volume_id, data.get("number"), title),
    )
    part_id = cursor.lastrowid
    connection.commit()

    cursor.execute("SELECT * FROM parts WHERE id = ?", (part_id,))
    row = cursor.fetchone()
    connection.close()

    return jsonify(dict(row)), 201


@books_bp.route("/api/books/<int:book_id>/parts/<int:part_id>", methods=["PUT"])
def update_part(book_id, part_id):
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()

    if not title:
        return jsonify({"message": "Název části je povinný."}), 400

    volume_id = data.get("volume_id")
    connection = get_connection()
    cursor = connection.cursor()

    if volume_id is not None:
        cursor.execute(
            "SELECT id FROM volumes WHERE id = ? AND book_id = ?",
            (volume_id, book_id),
        )
        if cursor.fetchone() is None:
            connection.close()
            return jsonify({"message": "Díl nepatří k této knize."}), 400

    cursor.execute(
        """
        UPDATE parts
        SET volume_id = ?, number = ?, title = ?
        WHERE id = ? AND book_id = ?
        """,
        (volume_id, data.get("number"), title, part_id, book_id),
    )

    if cursor.rowcount == 0:
        connection.close()
        return jsonify({"message": "Část nebyla nalezena."}), 404

    connection.commit()
    connection.close()
    return jsonify({"message": "Část byla upravena."})


@books_bp.route("/api/books/<int:book_id>/parts/<int:part_id>", methods=["DELETE"])
def delete_part(book_id, part_id):
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute(
        "DELETE FROM parts WHERE id = ? AND book_id = ?",
        (part_id, book_id),
    )
    deleted = cursor.rowcount
    connection.commit()
    connection.close()

    if deleted == 0:
        return jsonify({"message": "Část nebyla nalezena."}), 404

    return jsonify({"message": "Část byla smazána."})


# -------------------- KAPITOLY --------------------

def _chapter_payload(row):
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


def _validate_chapter_structure(cursor, book_id, volume_id, part_id):
    if volume_id is not None:
        cursor.execute(
            "SELECT id FROM volumes WHERE id = ? AND book_id = ?",
            (volume_id, book_id),
        )
        if cursor.fetchone() is None:
            return "Díl nepatří k této knize."

    if part_id is not None:
        cursor.execute(
            "SELECT id, volume_id FROM parts WHERE id = ? AND book_id = ?",
            (part_id, book_id),
        )
        part = cursor.fetchone()
        if part is None:
            return "Část nepatří k této knize."
        if volume_id is not None and part["volume_id"] is not None and part["volume_id"] != volume_id:
            return "Vybraná část nepatří do vybraného dílu."

    return None


@books_bp.route("/api/books/<int:book_id>/chapters", methods=["GET"])
def get_chapters(book_id):
    connection = get_connection()
    cursor = connection.cursor()

    if not book_exists(cursor, book_id):
        connection.close()
        return jsonify({"message": "Kniha nebyla nalezena."}), 404

    cursor.execute(
        """
        SELECT * FROM chapters
        WHERE book_id = ?
        ORDER BY number, id
        """,
        (book_id,),
    )
    rows = cursor.fetchall()
    connection.close()

    return jsonify([_chapter_payload(row) for row in rows])


@books_bp.route("/api/books/<int:book_id>/chapters", methods=["POST"])
def add_chapter(book_id):
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    content_html = data.get("content_html") or ""
    status = data.get("status", "concept")

    if not title:
        return jsonify({"message": "Název kapitoly je povinný."}), 400

    try:
        number = int(data.get("number"))
    except (TypeError, ValueError):
        return jsonify({"message": "Číslo kapitoly je povinné."}), 400

    volume_id = data.get("volume_id")
    part_id = data.get("part_id")
    if volume_id == "" or volume_id is None:
        volume_id = None
    else:
        volume_id = int(volume_id)
    if part_id == "" or part_id is None:
        part_id = None
    else:
        part_id = int(part_id)

    if status not in {"concept", "published"}:
        status = "concept"

    connection = get_connection()
    cursor = connection.cursor()

    if not book_exists(cursor, book_id):
        connection.close()
        return jsonify({"message": "Kniha nebyla nalezena."}), 404

    structure_error = _validate_chapter_structure(cursor, book_id, volume_id, part_id)
    if structure_error:
        connection.close()
        return jsonify({"message": structure_error}), 400

    cursor.execute(
        """
        INSERT INTO chapters
            (book_id, volume_id, part_id, number, title, content_html, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (book_id, volume_id, part_id, number, title, content_html, status),
    )
    chapter_id = cursor.lastrowid
    connection.commit()

    cursor.execute("SELECT * FROM chapters WHERE id = ?", (chapter_id,))
    row = cursor.fetchone()
    connection.close()

    return jsonify(_chapter_payload(row)), 201


@books_bp.route("/api/books/<int:book_id>/chapters/<int:chapter_id>", methods=["PUT"])
def update_chapter(book_id, chapter_id):
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    content_html = data.get("content_html") or ""
    status = data.get("status", "concept")

    if not title:
        return jsonify({"message": "Název kapitoly je povinný."}), 400

    try:
        number = int(data.get("number"))
    except (TypeError, ValueError):
        return jsonify({"message": "Číslo kapitoly je povinné."}), 400

    volume_id = data.get("volume_id")
    part_id = data.get("part_id")
    if volume_id == "" or volume_id is None:
        volume_id = None
    else:
        volume_id = int(volume_id)
    if part_id == "" or part_id is None:
        part_id = None
    else:
        part_id = int(part_id)

    if status not in {"concept", "published"}:
        status = "concept"

    connection = get_connection()
    cursor = connection.cursor()

    structure_error = _validate_chapter_structure(cursor, book_id, volume_id, part_id)
    if structure_error:
        connection.close()
        return jsonify({"message": structure_error}), 400

    cursor.execute(
        """
        UPDATE chapters
        SET volume_id = ?, part_id = ?, number = ?, title = ?,
            content_html = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND book_id = ?
        """,
        (volume_id, part_id, number, title, content_html, status, chapter_id, book_id),
    )

    if cursor.rowcount == 0:
        connection.close()
        return jsonify({"message": "Kapitola nebyla nalezena."}), 404

    connection.commit()
    cursor.execute("SELECT * FROM chapters WHERE id = ?", (chapter_id,))
    row = cursor.fetchone()
    connection.close()

    return jsonify(_chapter_payload(row))


@books_bp.route("/api/books/<int:book_id>/chapters/<int:chapter_id>", methods=["DELETE"])
def delete_chapter(book_id, chapter_id):
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute(
        "DELETE FROM chapters WHERE id = ? AND book_id = ?",
        (chapter_id, book_id),
    )
    deleted = cursor.rowcount
    connection.commit()
    connection.close()

    if deleted == 0:
        return jsonify({"message": "Kapitola nebyla nalezena."}), 404

    return jsonify({"message": "Kapitola byla smazána."})
