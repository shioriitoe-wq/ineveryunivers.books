from flask import Blueprint, jsonify, request

from database.database import get_connection
from routes.authorization import filter_accessible_rows, resource_is_accessible, require_permission, has_permission
from routes.user_auth import _current_user_id


books_bp = Blueprint("books", __name__)


# =========================================================
# POMOCNÉ FUNKCE – KNIHY
# =========================================================

def book_from_row(row):

    return {
        "id": row["id"],
        "title": row["title"],
        "status": row["status"],
        "type": row["type"],
        "parent_id": row["parent_id"],
        # The field is present after the cover migration. .get keeps this
        # serializer compatible with older local SQLite databases as well.
        "cover_url": (row.get("cover_url") or ""),
        "cover_position_x": float(row.get("cover_position_x") or 0),
        "cover_position_y": float(row.get("cover_position_y") or 0),
        "cover_scale": float(row.get("cover_scale") or 1),

        "uses_volumes": bool(
            row["uses_volumes"]
        ),

        "uses_parts": bool(
            row["uses_parts"]
        ),
    }


def clean_cover_url(value):
    if value is None:
        return ""
    if not isinstance(value, str):
        raise ValueError("Adresa obálky musí být text.")
    value = value.strip()
    if len(value) > 2048:
        raise ValueError("Adresa obálky je příliš dlouhá.")
    return value


def book_exists(cursor, book_id):

    cursor.execute(
        "SELECT id FROM books WHERE id = ?",
        (book_id,)
    )

    return cursor.fetchone() is not None


# =========================================================
# KNIHY
# =========================================================

@books_bp.route(
    "/api/books",
    methods=["GET"]
)
def get_books():

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        "SELECT * FROM books ORDER BY id"
    )

    rows = cursor.fetchall()
    rows = filter_accessible_rows(cursor, rows, lambda row: "book:" + str(row["id"]), _current_user_id())

    connection.close()

    return jsonify([book_from_row(row) for row in rows])


@books_bp.route(
    "/api/books/<int:book_id>",
    methods=["GET"]
)
def get_book(book_id):

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT *
        FROM books
        WHERE id = ?
        """,
        (book_id,)
    )

    row = cursor.fetchone()
    if row is not None:
        # Discover/repair the structural access chain before evaluating the
        # book. This keeps older books created before the access catalog
        # migration protected by the same parent rule as newly discovered ones.
        _ensure_book_access_catalog(cursor, book_id)

    allowed = row is not None and resource_is_accessible(
        cursor, "book:" + str(book_id), _current_user_id()
    )

    connection.commit()
    connection.close()

    if row is None or not allowed:
        return jsonify({
            "message": "Kniha nebyla nalezena."
        }), 404

    return jsonify(
        book_from_row(row)
    )


@books_bp.route(
    "/api/books",
    methods=["POST"]
)
@require_permission("content.manage")
def add_book():

    data = request.get_json() or {}

    title = (
        data.get("title") or ""
    ).strip()

    if not title:
        return jsonify({
            "message": "Název knihy je povinný."
        }), 400

    try:
        cover_url = clean_cover_url(data.get("cover_url", ""))
    except ValueError as error:
        return jsonify({"message": str(error)}), 400

    status = data.get(
        "status",
        "Rozpracováno"
    )

    book_type = data.get(
        "type",
        "standalone"
    )

    parent_id = data.get(
        "parent_id"
    )

    uses_volumes = (
        1
        if data.get("uses_volumes")
        else 0
    )

    uses_parts = (
        1
        if data.get("uses_parts")
        else 0
    )

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT INTO books
            (
                title,
                status,
                type,
                parent_id,
                uses_volumes,
                uses_parts,
                cover_url
            )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            title,
            status,
            book_type,
            parent_id,
            uses_volumes,
            uses_parts,
            cover_url
        )
    )

    book_id = cursor.lastrowid

    connection.commit()
    connection.close()

    return jsonify({
        "id": book_id,
        "message": "Kniha byla přidána."
    }), 201


@books_bp.route(
    "/api/books/<int:book_id>",
    methods=["PUT"]
)
@require_permission("content.manage")
def update_book(book_id):

    data = request.get_json() or {}

    title = (
        data.get("title") or ""
    ).strip()

    if not title:
        return jsonify({
            "message": "Název knihy je povinný."
        }), 400

    cover_url_supplied = "cover_url" in data
    try:
        cover_url = clean_cover_url(data.get("cover_url", "")) if cover_url_supplied else ""
    except ValueError as error:
        return jsonify({"message": str(error)}), 400
    crop_supplied = any(k in data for k in ("cover_position_x", "cover_position_y", "cover_scale"))
    crop_x = max(-100.0, min(100.0, float(data.get("cover_position_x", 0))))
    crop_y = max(-100.0, min(100.0, float(data.get("cover_position_y", 0))))
    crop_scale = max(1.0, min(4.0, float(data.get("cover_scale", 1))))

    status = data.get(
        "status",
        "Rozpracováno"
    )

    book_type = data.get(
        "type",
        "standalone"
    )

    parent_id = data.get(
        "parent_id"
    )

    uses_volumes = (
        1
        if data.get("uses_volumes")
        else 0
    )

    uses_parts = (
        1
        if data.get("uses_parts")
        else 0
    )

    connection = get_connection()
    cursor = connection.cursor()

    if cover_url_supplied:
        cursor.execute(
            """
            UPDATE books
            SET
                title = ?,
                status = ?,
                type = ?,
                parent_id = ?,
                uses_volumes = ?,
                uses_parts = ?,
                cover_url = ?,
                cover_position_x = ?,
                cover_position_y = ?,
                cover_scale = ?
            WHERE id = ?
            """,
            (
                title,
                status,
                book_type,
                parent_id,
                uses_volumes,
                uses_parts,
                cover_url,
                crop_x,
                crop_y,
                crop_scale,
                book_id,
            ),
        )
    else:
        cursor.execute(
            """
            UPDATE books
            SET
                title = ?,
                status = ?,
                type = ?,
                parent_id = ?,
                uses_volumes = ?,
                uses_parts = ?
            WHERE id = ?
            """,
            (
                title,
                status,
                book_type,
                parent_id,
                uses_volumes,
                uses_parts,
                book_id,
            ),
        )

    if crop_supplied and not cover_url_supplied:
        cursor.execute(
            "UPDATE books SET cover_position_x = ?, cover_position_y = ?, cover_scale = ? WHERE id = ?",
            (crop_x, crop_y, crop_scale, book_id),
        )

    if cursor.rowcount == 0:

        connection.close()

        return jsonify({
            "message": "Kniha nebyla nalezena."
        }), 404

    connection.commit()
    connection.close()

    return jsonify({
        "message": "Kniha byla upravena."
    })


@books_bp.route(
    "/api/books/<int:book_id>",
    methods=["DELETE"]
)
@require_permission("content.manage")
def delete_book(book_id):

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        DELETE FROM books
        WHERE id = ?
        """,
        (book_id,)
    )

    deleted = cursor.rowcount

    connection.commit()
    connection.close()

    if deleted == 0:

        return jsonify({
            "message": "Kniha nebyla nalezena."
        }), 404

    return jsonify({
        "message": "Kniha byla smazána."
    })


# =========================================================
# DÍLY
# =========================================================

@books_bp.route(
    "/api/books/<int:book_id>/volumes",
    methods=["GET"]
)
def get_volumes(book_id):

    connection = get_connection()
    cursor = connection.cursor()
    user_id = _current_user_id()
    _ensure_book_access_catalog(cursor, book_id)
    if not resource_is_accessible(cursor, "book:" + str(book_id), user_id):
        connection.close()
        return jsonify({"message": "K tomuto obsahu nemáš přístup."}), 403

    if not book_exists(
        cursor,
        book_id
    ):

        connection.close()

        return jsonify({
            "message": "Kniha nebyla nalezena."
        }), 404

    cursor.execute(
        """
        SELECT *
        FROM volumes
        WHERE book_id = ?

        ORDER BY
            number IS NULL,
            number,
            id
        """,
        (book_id,)
    )

    rows = cursor.fetchall()
    rows = filter_accessible_rows(cursor, rows, lambda row: "volume:" + str(row["id"]), user_id)

    connection.commit()
    connection.close()

    return jsonify([
        dict(row)
        for row in rows
    ])


@books_bp.route(
    "/api/books/<int:book_id>/volumes",
    methods=["POST"]
)
@require_permission("content.manage")
def add_volume(book_id):

    data = request.get_json() or {}

    title = (
        data.get("title") or ""
    ).strip()

    if not title:

        return jsonify({
            "message": "Název dílu je povinný."
        }), 400

    try:
        cover_url = clean_cover_url(data.get("cover_url", ""))
    except ValueError as error:
        return jsonify({"message": str(error)}), 400

    connection = get_connection()
    cursor = connection.cursor()

    if not book_exists(
        cursor,
        book_id
    ):

        connection.close()

        return jsonify({
            "message": "Kniha nebyla nalezena."
        }), 404

    cursor.execute(
        """
        INSERT INTO volumes
            (
                book_id,
                number,
                title,
                cover_url
            )
        VALUES (?, ?, ?, ?)
        """,
        (
            book_id,
            data.get("number"),
            title,
            cover_url,
        )
    )

    volume_id = cursor.lastrowid

    connection.commit()

    cursor.execute(
        """
        SELECT *
        FROM volumes
        WHERE id = ?
        """,
        (volume_id,)
    )

    row = cursor.fetchone()

    connection.close()

    return jsonify(
        dict(row)
    ), 201


@books_bp.route(
    "/api/books/<int:book_id>/volumes/<int:volume_id>",
    methods=["PUT"]
)
@require_permission("content.manage")
def update_volume(
    book_id,
    volume_id
):

    data = request.get_json() or {}

    title = (
        data.get("title") or ""
    ).strip()

    if not title:

        return jsonify({
            "message": "Název dílu je povinný."
        }), 400

    cover_url_supplied = "cover_url" in data
    try:
        cover_url = clean_cover_url(data.get("cover_url", "")) if cover_url_supplied else ""
    except ValueError as error:
        return jsonify({"message": str(error)}), 400
    crop_supplied = any(k in data for k in ("cover_position_x", "cover_position_y", "cover_scale"))
    crop_x = max(-100.0, min(100.0, float(data.get("cover_position_x", 0))))
    crop_y = max(-100.0, min(100.0, float(data.get("cover_position_y", 0))))
    crop_scale = max(1.0, min(4.0, float(data.get("cover_scale", 1))))

    connection = get_connection()
    cursor = connection.cursor()

    if cover_url_supplied:
        cursor.execute(
            """
            UPDATE volumes
            SET
                number = ?,
                title = ?,
                cover_url = ?,
                cover_position_x = ?,
                cover_position_y = ?,
                cover_scale = ?
            WHERE id = ? AND book_id = ?
            """,
            (
                data.get("number"),
                title,
                cover_url,
                crop_x,
                crop_y,
                crop_scale,
                volume_id,
                book_id,
            ),
        )
    else:
        cursor.execute(
            """
            UPDATE volumes
            SET number = ?, title = ?
            WHERE id = ? AND book_id = ?
            """,
            (
                data.get("number"),
                title,
                volume_id,
                book_id,
            ),
        )

    if crop_supplied and not cover_url_supplied:
        cursor.execute(
            "UPDATE volumes SET cover_position_x = ?, cover_position_y = ?, cover_scale = ? WHERE id = ? AND book_id = ?",
            (crop_x, crop_y, crop_scale, volume_id, book_id),
        )

    if cursor.rowcount == 0:

        connection.close()

        return jsonify({
            "message": "Díl nebyl nalezen."
        }), 404

    connection.commit()
    connection.close()

    return jsonify({
        "message": "Díl byl upraven."
    })


@books_bp.route(
    "/api/books/<int:book_id>/volumes/<int:volume_id>",
    methods=["DELETE"]
)
@require_permission("content.manage")
def delete_volume(
    book_id,
    volume_id
):

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        DELETE FROM volumes

        WHERE
            id = ?
            AND book_id = ?
        """,
        (
            volume_id,
            book_id
        )
    )

    deleted = cursor.rowcount

    connection.commit()
    connection.close()

    if deleted == 0:

        return jsonify({
            "message": "Díl nebyl nalezen."
        }), 404

    return jsonify({
        "message": "Díl byl smazán."
    })


# =========================================================
# ČÁSTI
# =========================================================

def normalize_theme(theme):

    allowed_themes = {
        "summer",
        "autumn",
        "winter",
        "spring",
    }

    if theme in allowed_themes:
        return theme

    return "summer"


def part_from_row(row):

    return {
        "id": row["id"],
        "book_id": row["book_id"],
        "volume_id": row["volume_id"],
        "number": row["number"],
        "title": row["title"],

        # NOVÉ
        "theme": normalize_theme(
            row["theme"]
        ),
    }


@books_bp.route(
    "/api/books/<int:book_id>/parts",
    methods=["GET"]
)
def get_parts(book_id):

    connection = get_connection()
    cursor = connection.cursor()
    user_id = _current_user_id()
    _ensure_book_access_catalog(cursor, book_id)
    if not resource_is_accessible(cursor, "book:" + str(book_id), user_id):
        connection.close()
        return jsonify({"message": "K tomuto obsahu nemáš přístup."}), 403

    if not book_exists(
        cursor,
        book_id
    ):

        connection.close()

        return jsonify({
            "message": "Kniha nebyla nalezena."
        }), 404

    cursor.execute(
        """
        SELECT *
        FROM parts
        WHERE book_id = ?

        ORDER BY
            number IS NULL,
            number,
            id
        """,
        (book_id,)
    )

    rows = cursor.fetchall()
    rows = filter_accessible_rows(cursor, rows, lambda row: "part:" + str(row["id"]), user_id)

    connection.commit()
    connection.close()

    return jsonify([
        part_from_row(row)
        for row in rows
    ])


@books_bp.route(
    "/api/books/<int:book_id>/parts",
    methods=["POST"]
)
@require_permission("content.manage")
def add_part(book_id):

    data = request.get_json() or {}

    title = (
        data.get("title") or ""
    ).strip()

    if not title:

        return jsonify({
            "message": "Název části je povinný."
        }), 400

    connection = get_connection()
    cursor = connection.cursor()

    if not book_exists(
        cursor,
        book_id
    ):

        connection.close()

        return jsonify({
            "message": "Kniha nebyla nalezena."
        }), 404

    volume_id = data.get(
        "volume_id"
    )

    if volume_id in (
        "",
        None
    ):

        volume_id = None

    else:

        try:
            volume_id = int(
                volume_id
            )

        except (
            TypeError,
            ValueError
        ):

            connection.close()

            return jsonify({
                "message": "Neplatný díl."
            }), 400

    if volume_id is not None:

        cursor.execute(
            """
            SELECT id
            FROM volumes

            WHERE
                id = ?
                AND book_id = ?
            """,
            (
                volume_id,
                book_id
            )
        )

        if cursor.fetchone() is None:

            connection.close()

            return jsonify({
                "message":
                    "Díl nepatří k této knize."
            }), 400

    theme = normalize_theme(
        data.get("theme")
    )

    cursor.execute(
        """
        INSERT INTO parts
            (
                book_id,
                volume_id,
                number,
                title,
                theme
            )

        VALUES (?, ?, ?, ?, ?)
        """,
        (
            book_id,
            volume_id,
            data.get("number"),
            title,
            theme
        )
    )

    part_id = cursor.lastrowid

    connection.commit()

    cursor.execute(
        """
        SELECT *
        FROM parts
        WHERE id = ?
        """,
        (part_id,)
    )

    row = cursor.fetchone()

    connection.close()

    return jsonify(
        part_from_row(row)
    ), 201


@books_bp.route(
    "/api/books/<int:book_id>/parts/<int:part_id>",
    methods=["PUT"]
)
@require_permission("content.manage")
def update_part(
    book_id,
    part_id
):

    data = request.get_json() or {}

    title = (
        data.get("title") or ""
    ).strip()

    if not title:

        return jsonify({
            "message": "Název části je povinný."
        }), 400

    volume_id = data.get(
        "volume_id"
    )

    if volume_id in (
        "",
        None
    ):

        volume_id = None

    else:

        try:
            volume_id = int(
                volume_id
            )

        except (
            TypeError,
            ValueError
        ):

            return jsonify({
                "message": "Neplatný díl."
            }), 400

    theme = normalize_theme(
        data.get("theme")
    )

    connection = get_connection()
    cursor = connection.cursor()

    if volume_id is not None:

        cursor.execute(
            """
            SELECT id
            FROM volumes

            WHERE
                id = ?
                AND book_id = ?
            """,
            (
                volume_id,
                book_id
            )
        )

        if cursor.fetchone() is None:

            connection.close()

            return jsonify({
                "message":
                    "Díl nepatří k této knize."
            }), 400

    cursor.execute(
        """
        UPDATE parts

        SET
            volume_id = ?,
            number = ?,
            title = ?,
            theme = ?

        WHERE
            id = ?
            AND book_id = ?
        """,
        (
            volume_id,
            data.get("number"),
            title,
            theme,
            part_id,
            book_id
        )
    )

    if cursor.rowcount == 0:

        connection.close()

        return jsonify({
            "message": "Část nebyla nalezena."
        }), 404

    connection.commit()

    cursor.execute(
        """
        SELECT *
        FROM parts
        WHERE id = ?
        """,
        (part_id,)
    )

    row = cursor.fetchone()

    connection.close()

    return jsonify(
        part_from_row(row)
    )


@books_bp.route(
    "/api/books/<int:book_id>/parts/<int:part_id>",
    methods=["DELETE"]
)
@require_permission("content.manage")
def delete_part(
    book_id,
    part_id
):

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        DELETE FROM parts

        WHERE
            id = ?
            AND book_id = ?
        """,
        (
            part_id,
            book_id
        )
    )

    deleted = cursor.rowcount

    connection.commit()
    connection.close()

    if deleted == 0:

        return jsonify({
            "message": "Část nebyla nalezena."
        }), 404

    return jsonify({
        "message": "Část byla smazána."
    })




def _ensure_book_access_catalog(cursor, book_id):
    """Ensure structural book resources exist before access filtering.

    Older content may predate the central access catalog. Missing catalog rows
    must not make valid volumes, parts, or chapters disappear from API lists.
    This synchronizes only the requested book hierarchy and never changes rules.
    """
    def upsert(key, label, kind, parent_id=None, source_type=None, source_id=None):
        cursor.execute(
            """
            INSERT INTO access_resources
                (resource_key, label, resource_type, parent_resource_id, is_active,
                 source_type, source_id, discovered_at, last_synced_at, updated_at)
            VALUES (?, ?, ?, ?, TRUE, ?, ?, NOW(), NOW(), NOW())
            ON CONFLICT (resource_key) DO UPDATE SET
                label = EXCLUDED.label,
                resource_type = EXCLUDED.resource_type,
                parent_resource_id = EXCLUDED.parent_resource_id,
                   source_type = COALESCE(EXCLUDED.source_type, access_resources.source_type),
                source_id = COALESCE(EXCLUDED.source_id, access_resources.source_id),
                last_synced_at = NOW(),
                updated_at = NOW()
            RETURNING id
            """,
            (key, label, kind, parent_id, source_type,
             str(source_id) if source_id is not None else None),
        )
        row = cursor.fetchone()
        return int(row["id"])

    cursor.execute("SELECT id, title FROM books WHERE id = ?", (book_id,))
    book = cursor.fetchone()
    if book is None:
        return

    books_root_id = upsert("section:books", "Knihy", "section")
    book_resource_id = upsert(
        f"book:{book_id}", book["title"], "book",
        books_root_id, "book", book_id
    )

    cursor.execute(
        "SELECT id, number, title FROM volumes WHERE book_id = ? ORDER BY number, id",
        (book_id,),
    )
    volume_resource_ids = {}
    for row in cursor.fetchall():
        label = row["title"] or f"Svazek {row['number'] or row['id']}"
        volume_resource_ids[int(row["id"])] = upsert(
            f"volume:{row['id']}", label, "volume",
            book_resource_id, "volume", row["id"]
        )

    cursor.execute(
        "SELECT id, volume_id, number, title FROM parts WHERE book_id = ? ORDER BY number, id",
        (book_id,),
    )
    part_resource_ids = {}
    for row in cursor.fetchall():
        parent_id = (
            volume_resource_ids.get(int(row["volume_id"]))
            if row["volume_id"] is not None else book_resource_id
        )
        label = row["title"] or f"Část {row['number'] or row['id']}"
        part_resource_ids[int(row["id"])] = upsert(
            f"part:{row['id']}", label, "part",
            parent_id, "part", row["id"]
        )

    cursor.execute(
        """
        SELECT id, volume_id, part_id, number, title
        FROM chapters WHERE book_id = ?
        ORDER BY number, id
        """,
        (book_id,),
    )
    for row in cursor.fetchall():
        parent_id = None
        if row["part_id"] is not None:
            parent_id = part_resource_ids.get(int(row["part_id"]))
        if parent_id is None and row["volume_id"] is not None:
            parent_id = volume_resource_ids.get(int(row["volume_id"]))
        if parent_id is None:
            parent_id = book_resource_id
        upsert(
            f"chapter:{row['id']}",
            row["title"] or f"Kapitola {row['number']}",
            "chapter", parent_id, "chapter", row["id"]
        )


# =========================================================
# KAPITOLY
# =========================================================

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


def _validate_chapter_structure(
    cursor,
    book_id,
    volume_id,
    part_id
):

    if volume_id is not None:

        cursor.execute(
            """
            SELECT id
            FROM volumes

            WHERE
                id = ?
                AND book_id = ?
            """,
            (
                volume_id,
                book_id
            )
        )

        if cursor.fetchone() is None:

            return (
                "Díl nepatří k této knize."
            )


    if part_id is not None:

        cursor.execute(
            """
            SELECT
                id,
                volume_id

            FROM parts

            WHERE
                id = ?
                AND book_id = ?
            """,
            (
                part_id,
                book_id
            )
        )

        part = cursor.fetchone()

        if part is None:

            return (
                "Část nepatří k této knize."
            )


        if (
            volume_id is not None
            and part["volume_id"] is not None
            and part["volume_id"] != volume_id
        ):

            return (
                "Vybraná část nepatří "
                "do vybraného dílu."
            )


    return None


def _published_chapter_ids(cursor, book_id):
    cursor.execute(
        "SELECT id FROM chapters WHERE book_id = ? AND status = 'published' ORDER BY number, id",
        (book_id,)
    )
    return [row["id"] for row in cursor.fetchall()]


def _resequence_published_chapters(cursor, book_id, ordered_ids):
    """Persist a contiguous, book-wide sequence for published chapters only."""
    # Move through temporary negative values first so swaps never collide with
    # a possible future uniqueness constraint on (book_id, number).
    for index, chapter_id in enumerate(ordered_ids, start=1):
        cursor.execute(
            "UPDATE chapters SET number = ? WHERE id = ? AND book_id = ?",
            (-index, chapter_id, book_id)
        )
    for index, chapter_id in enumerate(ordered_ids, start=1):
        cursor.execute(
            "UPDATE chapters SET number = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND book_id = ?",
            (index, chapter_id, book_id)
        )


def _ordered_after_manual_move(ids, chapter_id, requested_number):
    ids = [item for item in ids if item != chapter_id]
    target = max(1, min(int(requested_number or 1), len(ids) + 1))
    ids.insert(target - 1, chapter_id)
    return ids




@books_bp.route(
    "/api/books/<int:book_id>/chapters",
    methods=["GET"]
)
def get_chapters(book_id):

    connection = get_connection()
    cursor = connection.cursor()
    user_id = _current_user_id()
    _ensure_book_access_catalog(cursor, book_id)
    if not resource_is_accessible(cursor, "book:" + str(book_id), user_id):
        connection.close()
        return jsonify({"message": "K tomuto obsahu nemáš přístup."}), 403

    if not book_exists(
        cursor,
        book_id
    ):

        connection.close()

        return jsonify({
            "message": "Kniha nebyla nalezena."
        }), 404

    cursor.execute(
        """
        SELECT *
        FROM chapters

        WHERE book_id = ?

        ORDER BY
            CASE WHEN status = 'published' THEN 0 ELSE 1 END,
            CASE WHEN status = 'published' THEN number ELSE 0 END,
            updated_at DESC,
            id
        """,
        (book_id,)
    )

    rows = cursor.fetchall()
    rows = filter_accessible_rows(cursor, rows, lambda row: "chapter:" + str(row["id"]), user_id)

    include_concepts = (
        request.args.get("include_concepts") == "1"
        and has_permission(cursor, user_id, "content.manage")
    )
    if not include_concepts:
        rows = [row for row in rows if row["status"] == "published"]

    connection.commit()
    connection.close()

    return jsonify([
        _chapter_payload(row)
        for row in rows
    ])


@books_bp.route(
    "/api/books/<int:book_id>/chapters",
    methods=["POST"]
)
@require_permission("content.manage")
def add_chapter(book_id):

    data = request.get_json() or {}

    title = (
        data.get("title") or ""
    ).strip()

    content_html = (
        data.get("content_html")
        or ""
    )

    status = data.get(
        "status",
        "concept"
    )

    if not title:

        return jsonify({
            "message":
                "Název kapitoly je povinný."
        }), 400

    # Drafts have no public chapter number. Publishing a new chapter appends
    # it to the end of the book-wide published sequence.
    requested_number = data.get("number")

    volume_id = data.get(
        "volume_id"
    )

    part_id = data.get(
        "part_id"
    )

    if volume_id in (
        "",
        None
    ):

        volume_id = None

    else:

        volume_id = int(
            volume_id
        )


    if part_id in (
        "",
        None
    ):

        part_id = None

    else:

        part_id = int(
            part_id
        )


    if status not in {
        "concept",
        "published"
    }:

        status = "concept"


    connection = get_connection()
    cursor = connection.cursor()

    if not book_exists(
        cursor,
        book_id
    ):

        connection.close()

        return jsonify({
            "message":
                "Kniha nebyla nalezena."
        }), 404


    structure_error = (
        _validate_chapter_structure(
            cursor,
            book_id,
            volume_id,
            part_id
        )
    )

    if structure_error:

        connection.close()

        return jsonify({
            "message": structure_error
        }), 400


    existing_published_ids = _published_chapter_ids(cursor, book_id)
    if status == "published":
        number = len(existing_published_ids) + 1
    else:
        number = 0

    cursor.execute(
        """
        INSERT INTO chapters
            (
                book_id,
                volume_id,
                part_id,
                number,
                title,
                content_html,
                status
            )

        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            book_id,
            volume_id,
            part_id,
            number,
            title,
            content_html,
            status
        )
    )

    chapter_id = cursor.lastrowid

    if status == "published":
        existing_published_ids.append(chapter_id)
        _resequence_published_chapters(cursor, book_id, existing_published_ids)

    connection.commit()

    cursor.execute(
        """
        SELECT *
        FROM chapters
        WHERE id = ?
        """,
        (chapter_id,)
    )

    row = cursor.fetchone()

    connection.close()

    return jsonify(
        _chapter_payload(row)
    ), 201


@books_bp.route(
    "/api/books/<int:book_id>/chapters/<int:chapter_id>",
    methods=["PUT"]
)
@require_permission("content.manage")
def update_chapter(
    book_id,
    chapter_id
):

    data = request.get_json() or {}

    title = (
        data.get("title") or ""
    ).strip()

    content_html = (
        data.get("content_html")
        or ""
    )

    status = data.get(
        "status",
        "concept"
    )

    if not title:

        return jsonify({
            "message":
                "Název kapitoly je povinný."
        }), 400

    requested_number = data.get("number")


    volume_id = data.get(
        "volume_id"
    )

    part_id = data.get(
        "part_id"
    )


    if volume_id in (
        "",
        None
    ):

        volume_id = None

    else:

        volume_id = int(
            volume_id
        )


    if part_id in (
        "",
        None
    ):

        part_id = None

    else:

        part_id = int(
            part_id
        )


    if status not in {
        "concept",
        "published"
    }:

        status = "concept"


    connection = get_connection()
    cursor = connection.cursor()


    structure_error = (
        _validate_chapter_structure(
            cursor,
            book_id,
            volume_id,
            part_id
        )
    )

    if structure_error:

        connection.close()

        return jsonify({
            "message": structure_error
        }), 400


    cursor.execute(
        "SELECT id, status, number FROM chapters WHERE id = ? AND book_id = ?",
        (chapter_id, book_id)
    )
    existing_chapter = cursor.fetchone()
    if existing_chapter is None:
        connection.close()
        return jsonify({"message": "Kapitola nebyla nalezena."}), 404

    old_status = existing_chapter["status"]
    ordered_ids = _published_chapter_ids(cursor, book_id)

    if status == "published":
        if old_status == "published":
            try:
                target_number = int(requested_number or existing_chapter["number"] or 1)
            except (TypeError, ValueError):
                target_number = int(existing_chapter["number"] or 1)
            ordered_ids = _ordered_after_manual_move(ordered_ids, chapter_id, target_number)
            number = target_number
        else:
            # Concepts acquire a number only when published, at the end.
            ordered_ids.append(chapter_id)
            number = len(ordered_ids)
    else:
        ordered_ids = [item for item in ordered_ids if item != chapter_id]
        number = 0

    cursor.execute(
        """
        UPDATE chapters

        SET
            volume_id = ?,
            part_id = ?,
            number = ?,
            title = ?,
            content_html = ?,
            status = ?,
            updated_at = CURRENT_TIMESTAMP

        WHERE
            id = ?
            AND book_id = ?
        """,
        (
            volume_id,
            part_id,
            number,
            title,
            content_html,
            status,
            chapter_id,
            book_id
        )
    )


    if cursor.rowcount == 0:

        connection.close()

        return jsonify({
            "message":
                "Kapitola nebyla nalezena."
        }), 404


    _resequence_published_chapters(cursor, book_id, ordered_ids)
    connection.commit()


    cursor.execute(
        """
        SELECT *
        FROM chapters
        WHERE id = ?
        """,
        (chapter_id,)
    )

    row = cursor.fetchone()

    connection.close()


    return jsonify(
        _chapter_payload(row)
    )


@books_bp.route(
    "/api/books/<int:book_id>/chapters/<int:chapter_id>",
    methods=["DELETE"]
)
@require_permission("content.manage")
def delete_chapter(book_id, chapter_id):
    """Delete a chapter, its narrator assignment and its access-catalog entry.

    Keep the delete and the book-wide published numbering update in one
    transaction so the UI never sees a half-completed operation.
    """
    connection = get_connection()
    try:
        cursor = connection.cursor()

        cursor.execute(
            "SELECT id, status FROM chapters WHERE id = ? AND book_id = ?",
            (chapter_id, book_id),
        )
        chapter = cursor.fetchone()
        if chapter is None:
            connection.close()
            return jsonify({"message": "Kapitola nebyla nalezena."}), 404

        # The narrator table is created by the AEIL module. Explicit cleanup
        # also handles databases where its FK was created without CASCADE.
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS aeil_chapter_settings (
                chapter_id INTEGER PRIMARY KEY,
                character_id INTEGER NOT NULL,
                FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
                FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
            )
        """)
        cursor.execute(
            "DELETE FROM aeil_chapter_settings WHERE chapter_id = ?",
            (chapter_id,),
        )

        cursor.execute(
            "DELETE FROM chapters WHERE id = ? AND book_id = ?",
            (chapter_id, book_id),
        )
        if cursor.rowcount != 1:
            connection.rollback()
            connection.close()
            return jsonify({"message": "Kapitolu se nepodařilo najít ke smazání."}), 404

        # Remove the chapter from the central access catalog as well. If a
        # future resource references it as a parent, deactivate it instead
        # of violating the catalog's RESTRICT relationship.
        resource_key = "chapter:" + str(chapter_id)
        cursor.execute(
            "SELECT id FROM access_resources WHERE resource_key = ?",
            (resource_key,),
        )
        resource = cursor.fetchone()
        if resource:
            resource_id = resource["id"]
            cursor.execute(
                "SELECT 1 FROM access_resources WHERE parent_resource_id = ? LIMIT 1",
                (resource_id,),
            )
            has_children = cursor.fetchone() is not None
            if has_children:
                cursor.execute(
                    "UPDATE access_resources SET is_active = FALSE, updated_at = NOW() WHERE id = ?",
                    (resource_id,),
                )
            else:
                cursor.execute(
                    "DELETE FROM access_resources WHERE id = ?",
                    (resource_id,),
                )

        remaining_ids = _published_chapter_ids(cursor, book_id)
        _resequence_published_chapters(cursor, book_id, remaining_ids)
        connection.commit()

        return jsonify({
            "message": "Kapitola byla smazána.",
            "deleted_chapter_id": chapter_id,
            "remaining_published_chapters": len(remaining_ids),
        })
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()
