import json

from flask import Blueprint, jsonify, request

from database.database import get_connection
from routes.authorization import filter_accessible_rows, resource_is_accessible, require_permission
from routes.user_auth import _current_user_id


characters_bp = Blueprint(
    "characters",
    __name__
)


# =========================================================
# POMOCNÉ FUNKCE
# =========================================================

def get_character_payload(
    cursor,
    character_id
):

    ensure_character_columns(cursor)

    cursor.execute(
        """
        SELECT *
        FROM characters
        WHERE id = ?
        """,
        (character_id,)
    )

    character = cursor.fetchone()

    if character is None:
        return None


    # =====================================================
    # DÍLY
    # =====================================================

    cursor.execute(
        """
        SELECT
            volume_id
        FROM character_volumes
        WHERE character_id = ?
        ORDER BY volume_id
        """,
        (character_id,)
    )

    volume_rows = cursor.fetchall()


    # =====================================================
    # DETAILY
    # =====================================================

    cursor.execute(
        """
        SELECT
            id,
            label,
            value,
            sort_order
        FROM character_details
        WHERE character_id = ?
        ORDER BY
            sort_order,
            id
        """,
        (character_id,)
    )

    detail_rows = cursor.fetchall()


    # =====================================================
    # GALERIE
    # =====================================================

    cursor.execute(
        """
        SELECT
            id,
            image,
            caption,
            sort_order
        FROM character_images
        WHERE character_id = ?
        ORDER BY
            sort_order,
            id
        """,
        (character_id,)
    )

    image_rows = cursor.fetchall()


    # =====================================================
    # CITÁTY
    # =====================================================

    cursor.execute(
        """
        SELECT
            q.id,
            q.quote,
            q.author,
            q.volume_id,
            q.sort_order,
            v.title AS volume_title
        FROM character_quotes q
        LEFT JOIN volumes v
            ON v.id = q.volume_id
        WHERE q.character_id = ?
        ORDER BY
            q.sort_order,
            q.id
        """,
        (character_id,)
    )

    quote_rows = cursor.fetchall()


    # =====================================================
    # VZTAHY
    # =====================================================

    cursor.execute(
        """
        SELECT
            r.id,
            r.relationship_type,

            CASE
                WHEN r.character_id = ?
                THEN r.related_character_id
                ELSE r.character_id
            END AS related_character_id

        FROM character_relationships r

        WHERE
            r.character_id = ?
            OR r.related_character_id = ?

        ORDER BY r.id
        """,
        (
            character_id,
            character_id,
            character_id
        )
    )

    relationship_rows = cursor.fetchall()


    relationships = []
    relationship_index = {}


    for row in relationship_rows:

        related_id = int(
            row["related_character_id"]
        )


        cursor.execute(
            """
            SELECT
                id,
                name
            FROM characters
            WHERE id = ?
            """,
            (related_id,)
        )

        related_character = cursor.fetchone()

        if related_character is None:
            continue


        # =================================================
        # VÍCE TYPŮ VZTAHU
        # =================================================

        try:

            parsed_types = json.loads(
                row["relationship_type"] or "[]"
            )

        except (
            TypeError,
            ValueError,
            json.JSONDecodeError
        ):

            parsed_types = [
                row["relationship_type"]
            ] if row["relationship_type"] else []


        if not isinstance(
            parsed_types,
            list
        ):

            parsed_types = [
                parsed_types
            ]


        parsed_types = [
            str(item)
            for item in parsed_types
            if item
        ]


        # =================================================
        # SLOUČENÍ VZTAHŮ
        # =================================================

        if related_id in relationship_index:

            existing = relationships[
                relationship_index[
                    related_id
                ]
            ]

            for type_value in parsed_types:

                if type_value not in (
                    existing[
                        "relationship_types"
                    ]
                ):

                    existing[
                        "relationship_types"
                    ].append(
                        type_value
                    )

            continue


        relationship_index[
            related_id
        ] = len(relationships)


        relationships.append({
            "id": row["id"],

            "character_id":
                character_id,

            "related_character_id":
                related_character["id"],

            "related_character_name":
                related_character["name"],

            "relationship_types":
                parsed_types,

            # Zpětná kompatibilita
            "relationship_type":
                parsed_types[0]
                if parsed_types
                else "",
        })


    # =====================================================
    # VÝSLEDNÝ OBJEKT
    # =====================================================

    return {

        "id":
            character["id"],

        "book_id":
            character["book_id"],

        "name":
            character["name"],

        "quote":
            character["quote"],

        "content_html":
            character["content_html"],

        "main_image":
            character["main_image"],

        "hover_image":
            character["hover_image"],

        "header_image":
            character["header_image"],

        "chapter_background":
            character.get("chapter_background"),

        "main_video":
            character["main_video"],

        "soundtrack":
            character["soundtrack"],

        "race":
            character["race"],

        "sort_order":
            character["sort_order"],

        "published":
            bool(character["published"]),


        "volume_ids": [
            row["volume_id"]
            for row in volume_rows
        ],


        "details": [

            {
                "id":
                    row["id"],

                "label":
                    row["label"],

                "value":
                    row["value"],

                "sort_order":
                    row["sort_order"],
            }

            for row in detail_rows
        ],


        "images": [

            {
                "id":
                    row["id"],

                "image":
                    row["image"],

                "caption":
                    row["caption"],

                "sort_order":
                    row["sort_order"],
            }

            for row in image_rows
        ],


        "quotes": [

            {
                "id":
                    row["id"],

                "quote":
                    row["quote"],

                "author":
                    row["author"],

                "volume_id":
                    row["volume_id"],

                "volume_title":
                    row["volume_title"],

                "sort_order":
                    row["sort_order"],
            }

            for row in quote_rows
        ],


        "relationships":
            relationships,
    }


# =========================================================
# JEDNODOTAZOVÉ NAČTENÍ POSTAV PRO POSTGRESQL
# =========================================================

def _json_value(value, default):
    if value is None:
        return default
    if isinstance(value, str):
        try:
            return json.loads(value)
        except (TypeError, ValueError, json.JSONDecodeError):
            return default
    return value


def _relationship_types(value):
    parsed = _json_value(value, None)
    if parsed is None:
        parsed = [value] if value else []
    if not isinstance(parsed, list):
        parsed = [parsed]
    return [str(item) for item in parsed if item]


def _get_character_payloads_postgres(cursor, character_rows):
    """Load the complete public character payload in one PostgreSQL query."""
    ids = [row["id"] for row in character_rows]
    placeholders = ",".join("?" for _ in ids)

    cursor.execute(
        f"""
        SELECT
            c.*,
            COALESCE((
                SELECT jsonb_agg(cv.volume_id ORDER BY cv.volume_id)
                FROM character_volumes cv
                WHERE cv.character_id = c.id
            ), '[]'::jsonb) AS _volume_ids,
            COALESCE((
                SELECT jsonb_agg(jsonb_build_object(
                    'id', d.id, 'label', d.label, 'value', d.value,
                    'sort_order', d.sort_order
                ) ORDER BY d.sort_order, d.id)
                FROM character_details d
                WHERE d.character_id = c.id
            ), '[]'::jsonb) AS _details,
            COALESCE((
                SELECT jsonb_agg(jsonb_build_object(
                    'id', i.id, 'image', i.image, 'caption', i.caption,
                    'sort_order', i.sort_order
                ) ORDER BY i.sort_order, i.id)
                FROM character_images i
                WHERE i.character_id = c.id
            ), '[]'::jsonb) AS _images,
            COALESCE((
                SELECT jsonb_agg(jsonb_build_object(
                    'id', q.id, 'quote', q.quote, 'author', q.author,
                    'volume_id', q.volume_id, 'volume_title', v.title,
                    'sort_order', q.sort_order
                ) ORDER BY q.sort_order, q.id)
                FROM character_quotes q
                LEFT JOIN volumes v ON v.id = q.volume_id
                WHERE q.character_id = c.id
            ), '[]'::jsonb) AS _quotes,
            COALESCE((
                SELECT jsonb_agg(jsonb_build_object(
                    'id', r.id,
                    'related_character_id', CASE
                        WHEN r.character_id = c.id THEN r.related_character_id
                        ELSE r.character_id
                    END,
                    'related_character_name', CASE
                        WHEN r.character_id = c.id THEN related.name
                        ELSE origin.name
                    END,
                    'relationship_type', r.relationship_type
                ) ORDER BY r.id)
                FROM character_relationships r
                LEFT JOIN characters origin ON origin.id = r.character_id
                LEFT JOIN characters related ON related.id = r.related_character_id
                WHERE r.character_id = c.id OR r.related_character_id = c.id
            ), '[]'::jsonb) AS _relationships
        FROM characters c
        WHERE c.id IN ({placeholders})
        ORDER BY c.sort_order, c.id
        """,
        tuple(ids),
    )

    payloads = []
    for row in cursor.fetchall():
        relationships = []
        relationship_index = {}
        for rel in _json_value(row["_relationships"], []):
            related_id = rel.get("related_character_id")
            related_name = rel.get("related_character_name")
            if related_id is None or related_name is None:
                continue
            related_id = int(related_id)
            types = _relationship_types(rel.get("relationship_type"))
            if related_id in relationship_index:
                existing = relationships[relationship_index[related_id]]
                for item in types:
                    if item not in existing["relationship_types"]:
                        existing["relationship_types"].append(item)
                continue
            relationship_index[related_id] = len(relationships)
            relationships.append({
                "id": rel.get("id"),
                "character_id": row["id"],
                "related_character_id": related_id,
                "related_character_name": related_name,
                "relationship_types": types,
                "relationship_type": types[0] if types else "",
            })

        payloads.append({
            "id": row["id"],
            "book_id": row["book_id"],
            "name": row["name"],
            "quote": row["quote"],
            "content_html": row["content_html"],
            "main_image": row["main_image"],
            "hover_image": row["hover_image"],
            "header_image": row["header_image"],
            "chapter_background": row.get("chapter_background"),
            "main_video": row["main_video"],
            "soundtrack": row["soundtrack"],
            "race": row["race"],
            "sort_order": row["sort_order"],
            "published": bool(row["published"]),
            "volume_ids": _json_value(row["_volume_ids"], []),
            "details": _json_value(row["_details"], []),
            "images": _json_value(row["_images"], []),
            "quotes": _json_value(row["_quotes"], []),
            "relationships": relationships,
        })

    # SQL order mirrors the API's sort_order/id order. Preserve the exact
    # order of the already access-filtered input rows as a defensive measure.
    by_id = {item["id"]: item for item in payloads}
    return [by_id[row["id"]] for row in character_rows if row["id"] in by_id]


# =========================================================
# HROMADNÉ NAČTENÍ POSTAV
# =========================================================

def get_character_payloads_bulk(
    cursor,
    character_rows
):
    """
    Načte celý seznam postav hromadně.

    Původní get_characters() volal get_character_payload()
    pro každou postavu zvlášť. To znamenalo několik SQL dotazů
    na každou postavu + další dotazy pro jednotlivé vztahy.

    Tato verze načte všechny navazující údaje v dávkách:
      - díly
      - detaily
      - galerii
      - citáty
      - vztahy

    Výsledná JSON struktura zůstává stejná.
    """
    if not character_rows:
        return []

    ensure_character_columns(cursor)

    # PostgreSQL/Neon: fetch the character records and all child collections
    # in one round trip. The previous bulk implementation still made five
    # sequential remote SQL calls (volumes, details, images, quotes, links).
    # On a remote database each round trip adds network latency even when the
    # query itself is indexed. SQLite keeps the compatible fallback below.
    if hasattr(cursor, "_cursor"):
        return _get_character_payloads_postgres(cursor, character_rows)

    character_ids = [
        row["id"]
        for row in character_rows
    ]

    placeholders = ",".join(
        ["?"] * len(character_ids)
    )

    # =====================================================
    # ZÁKLADNÍ OBJEKTY POSTAV
    # =====================================================

    result_by_id = {}

    for character in character_rows:
        character_id = character["id"]

        result_by_id[character_id] = {
            "id": character["id"],
            "book_id": character["book_id"],
            "name": character["name"],
            "quote": character["quote"],
            "content_html": character["content_html"],
            "main_image": character["main_image"],
            "hover_image": character["hover_image"],
            "header_image": character["header_image"],
            "chapter_background": character["chapter_background"],
            "main_video": character["main_video"],
            "soundtrack": character["soundtrack"],
            "race": character["race"],
            "sort_order": character["sort_order"],
            "published": bool(character["published"]),
            "volume_ids": [],
            "details": [],
            "images": [],
            "quotes": [],
            "relationships": [],
        }

    # =====================================================
    # DÍLY
    # =====================================================

    cursor.execute(
        f"""
        SELECT
            character_id,
            volume_id
        FROM character_volumes
        WHERE character_id IN ({placeholders})
        ORDER BY
            character_id,
            volume_id
        """,
        tuple(character_ids)
    )

    for row in cursor.fetchall():
        character_id = row["character_id"]

        if character_id in result_by_id:
            result_by_id[character_id]["volume_ids"].append(
                row["volume_id"]
            )

    # =====================================================
    # DETAILY
    # =====================================================

    cursor.execute(
        f"""
        SELECT
            character_id,
            id,
            label,
            value,
            sort_order
        FROM character_details
        WHERE character_id IN ({placeholders})
        ORDER BY
            character_id,
            sort_order,
            id
        """,
        tuple(character_ids)
    )

    for row in cursor.fetchall():
        character_id = row["character_id"]

        if character_id in result_by_id:
            result_by_id[character_id]["details"].append({
                "id": row["id"],
                "label": row["label"],
                "value": row["value"],
                "sort_order": row["sort_order"],
            })

    # =====================================================
    # GALERIE
    # =====================================================

    cursor.execute(
        f"""
        SELECT
            character_id,
            id,
            image,
            caption,
            sort_order
        FROM character_images
        WHERE character_id IN ({placeholders})
        ORDER BY
            character_id,
            sort_order,
            id
        """,
        tuple(character_ids)
    )

    for row in cursor.fetchall():
        character_id = row["character_id"]

        if character_id in result_by_id:
            result_by_id[character_id]["images"].append({
                "id": row["id"],
                "image": row["image"],
                "caption": row["caption"],
                "sort_order": row["sort_order"],
            })

    # =====================================================
    # CITÁTY
    # =====================================================

    cursor.execute(
        f"""
        SELECT
            q.character_id,
            q.id,
            q.quote,
            q.author,
            q.volume_id,
            q.sort_order,
            v.title AS volume_title
        FROM character_quotes q
        LEFT JOIN volumes v
            ON v.id = q.volume_id
        WHERE q.character_id IN ({placeholders})
        ORDER BY
            q.character_id,
            q.sort_order,
            q.id
        """,
        tuple(character_ids)
    )

    for row in cursor.fetchall():
        character_id = row["character_id"]

        if character_id in result_by_id:
            result_by_id[character_id]["quotes"].append({
                "id": row["id"],
                "quote": row["quote"],
                "author": row["author"],
                "volume_id": row["volume_id"],
                "volume_title": row["volume_title"],
                "sort_order": row["sort_order"],
            })

    # =====================================================
    # VZTAHY
    # =====================================================

    cursor.execute(
        f"""
        SELECT
            r.id,
            r.character_id,
            r.related_character_id,
            r.relationship_type,
            c1.name AS character_name,
            c2.name AS related_name
        FROM character_relationships r
        LEFT JOIN characters c1
            ON c1.id = r.character_id
        LEFT JOIN characters c2
            ON c2.id = r.related_character_id
        WHERE
            r.character_id IN ({placeholders})
            OR r.related_character_id IN ({placeholders})
        ORDER BY
            r.id
        """,
        tuple(character_ids)
        + tuple(character_ids)
    )

    relationship_indexes = {
        character_id: {}
        for character_id in character_ids
    }

    for row in cursor.fetchall():
        left_id = row["character_id"]
        right_id = row["related_character_id"]

        # Vztah musí být v payloadu obou postav.
        owners = []

        if left_id in result_by_id and right_id in result_by_id:
            owners = [
                (
                    left_id,
                    right_id,
                    row["related_name"],
                    left_id,
                ),
                (
                    right_id,
                    left_id,
                    row["character_name"],
                    right_id,
                ),
            ]
        elif left_id in result_by_id:
            owners = [
                (
                    left_id,
                    right_id,
                    row["related_name"],
                    left_id,
                )
            ]
        elif right_id in result_by_id:
            owners = [
                (
                    right_id,
                    left_id,
                    row["character_name"],
                    right_id,
                )
            ]
        else:
            continue

        try:
            parsed_types = json.loads(
                row["relationship_type"] or "[]"
            )
        except (
            TypeError,
            ValueError,
            json.JSONDecodeError
        ):
            parsed_types = [
                row["relationship_type"]
            ] if row["relationship_type"] else []

        if not isinstance(parsed_types, list):
            parsed_types = [parsed_types]

        parsed_types = [
            str(item)
            for item in parsed_types
            if item
        ]

        for owner_id, related_id, related_name, self_id in owners:
            index = relationship_indexes[owner_id]

            if related_id in index:
                existing = result_by_id[owner_id]["relationships"][
                    index[related_id]
                ]

                for type_value in parsed_types:
                    if type_value not in existing["relationship_types"]:
                        existing["relationship_types"].append(
                            type_value
                        )
                continue

            index[related_id] = len(
                result_by_id[owner_id]["relationships"]
            )

            result_by_id[owner_id]["relationships"].append({
                "id": row["id"],
                "character_id": self_id,
                "related_character_id": related_id,
                "related_character_name": related_name,
                "relationship_types": list(parsed_types),
                "relationship_type": (
                    parsed_types[0]
                    if parsed_types
                    else ""
                ),
            })

    # =====================================================
    # ZACHOVÁNÍ PŮVODNÍHO POŘADÍ
    # =====================================================

    return [
        result_by_id[row["id"]]
        for row in character_rows
        if row["id"] in result_by_id
    ]


# =========================================================
# KONTROLA / MIGRACE SLOUPCŮ POSTAV
# =========================================================

def ensure_character_columns(cursor):
    """
    Zajistí starším SQLite databázím chybějící sloupce.

    PostgreSQL/Neon má schéma vytvořené pomocí seed_postgres.sql,
    takže tam tuto SQLite migraci nespouštíme.
    """
    # Náš PostgresCursor obaluje skutečný psycopg2 cursor v atributu _cursor.
    # PostgreSQL schéma se spravuje přes seed_postgres.sql / jednorázovou migraci,
    # takže ALTER TABLE nespouštíme při každém API požadavku.
    if hasattr(cursor, "_cursor"):
        return

    cursor.execute("PRAGMA table_info(characters)")
    rows = cursor.fetchall()

    existing_columns = set()
    for row in rows:
        try:
            existing_columns.add(row["name"])
        except (TypeError, KeyError, IndexError):
            existing_columns.add(row[1])

    required_columns = {
        "main_video": "TEXT",
        "hover_image": "TEXT",
        "soundtrack": "TEXT",
        "race": "TEXT",
        "chapter_background": "TEXT",
    }

    for column_name, column_definition in required_columns.items():
        if column_name not in existing_columns:
            cursor.execute(
                f"ALTER TABLE characters ADD COLUMN {column_name} {column_definition}"
            )


# =========================================================
# KONTROLA KNIHY
# =========================================================

def book_exists(
    cursor,
    book_id
):

    cursor.execute(
        """
        SELECT id
        FROM books
        WHERE id = ?
        """,
        (book_id,)
    )

    return cursor.fetchone() is not None


# =========================================================
# KONTROLA DÍLU
# =========================================================

def volume_belongs_to_book(
    cursor,
    volume_id,
    book_id
):

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

    return cursor.fetchone() is not None


def validate_volume_ids(
    cursor,
    book_id,
    volume_ids
):

    for volume_id in volume_ids:

        if not volume_belongs_to_book(
            cursor,
            volume_id,
            book_id
        ):

            return False

    return True


# =========================================================
# KONTROLA VZTAHU
# =========================================================

def validate_relationship_character(
    cursor,
    book_id,
    character_id,
    related_character_id
):

    if int(character_id) == int(related_character_id):
        return False


    cursor.execute(
        """
        SELECT id
        FROM characters
        WHERE
            id = ?
            AND book_id = ?
        """,
        (
            related_character_id,
            book_id
        )
    )

    return cursor.fetchone() is not None


# =========================================================
# OPTIMALIZOVANÁ DATA STRÁNKY POSTAV PRO JEDEN DÍL
# =========================================================

@characters_bp.route(
    "/api/books/<int:book_id>/volumes/<int:volume_id>/characters-page",
    methods=["GET"]
)
def get_characters_page(book_id, volume_id):
    """Return only the data required by the character-list page."""
    connection = get_connection()
    try:
        cursor = connection.cursor()
        user_id = _current_user_id()

        cursor.execute("SELECT * FROM books WHERE id = ?", (book_id,))
        book_row = cursor.fetchone()
        if book_row is None:
            return jsonify({"message": "Kniha nebyla nalezena."}), 404

        if not resource_is_accessible(cursor, "book:" + str(book_id), user_id):
            return jsonify({"message": "K tomuto obsahu nemáš přístup."}), 403

        cursor.execute(
            "SELECT * FROM volumes WHERE id = ? AND book_id = ?",
            (volume_id, book_id),
        )
        volume_row = cursor.fetchone()
        if volume_row is None:
            return jsonify({"message": "Díl nebyl nalezen."}), 404

        if not resource_is_accessible(cursor, "volume:" + str(volume_id), user_id):
            return jsonify({"message": "K tomuto obsahu nemáš přístup."}), 403

        cursor.execute(
            """
            SELECT DISTINCT
                c.id, c.book_id, c.name, c.main_image, c.sort_order
            FROM characters c
            JOIN character_volumes cv ON cv.character_id = c.id
            WHERE c.book_id = ? AND cv.volume_id = ?
            ORDER BY c.sort_order, c.id
            """,
            (book_id, volume_id),
        )
        character_rows = cursor.fetchall()
        character_rows = filter_accessible_rows(
            cursor,
            character_rows,
            lambda row: "character:" + str(row["id"]),
            user_id,
        )

        book = {
            "id": book_row["id"],
            "title": book_row["title"],
            "status": book_row["status"],
            "type": book_row["type"],
            "parent_id": book_row["parent_id"],
            "cover_url": book_row.get("cover_url") or "",
            "cover_position_x": float(book_row.get("cover_position_x") or 0),
            "cover_position_y": float(book_row.get("cover_position_y") or 0),
            "cover_scale": float(book_row.get("cover_scale") or 1),
            "uses_volumes": bool(book_row["uses_volumes"]),
            "uses_parts": bool(book_row["uses_parts"]),
        }

        return jsonify({
            "book": book,
            "volume": dict(volume_row),
            "characters": [
                {
                    "id": row["id"],
                    "book_id": row["book_id"],
                    "name": row["name"],
                    "main_image": row["main_image"],
                    "sort_order": row["sort_order"],
                }
                for row in character_rows
            ],
        })
    finally:
        connection.close()


# =========================================================
# POSTAVY – SEZNAM
# =========================================================

@characters_bp.route(
    "/api/books/<int:book_id>/characters",
    methods=["GET"]
)
def get_characters(book_id):

    connection = get_connection()
    cursor = connection.cursor()
    user_id = _current_user_id()
    if not resource_is_accessible(cursor, "book:" + str(book_id), user_id):
        connection.close()
        return jsonify({"message": "K tomuto obsahu nemáš přístup."}), 403

    # U hromadného načtení se sloupec chapter_background
    # musí zajistit ještě PŘED SELECT *. Jinak starší SQLite
    # databáze vrátí řádky bez tohoto sloupce a payload skončí
    # na KeyError.
    ensure_character_columns(cursor)


    if not book_exists(
        cursor,
        book_id
    ):

        connection.close()

        return jsonify({
            "message":
                "Kniha nebyla nalezena."
        }), 404


    cursor.execute(
        """
        SELECT *
        FROM characters
        WHERE book_id = ?
        ORDER BY
            sort_order,
            id
        """,
        (book_id,)
    )

    rows = cursor.fetchall()
    rows = filter_accessible_rows(cursor, rows, lambda row: "character:" + str(row["id"]), user_id)


    # =====================================================
    # HROMADNÉ NAČTENÍ
    # =====================================================
    #
    # Dříve se zde volal get_character_payload()
    # pro každou postavu zvlášť. To vytvářelo mnoho
    # SQL dotazů a při větším počtu postav výrazně
    # zpomalovalo stránku.
    #
    # Nyní se navazující data načtou dávkově.
    #

    result = get_character_payloads_bulk(
        cursor,
        rows
    )


    connection.close()


    return jsonify(result)


# =========================================================
# POSTAVA – DETAIL
# =========================================================

@characters_bp.route(
    "/api/books/<int:book_id>/characters/<int:character_id>",
    methods=["GET"]
)
def get_character(
    book_id,
    character_id
):

    connection = get_connection()
    cursor = connection.cursor()
    user_id = _current_user_id()
    if not resource_is_accessible(cursor, "book:" + str(book_id), user_id):
        connection.close()
        return jsonify({"message": "K tomuto obsahu nemáš přístup."}), 403


    cursor.execute(
        """
        SELECT id
        FROM characters
        WHERE
            id = ?
            AND book_id = ?
        """,
        (
            character_id,
            book_id
        )
    )

    row = cursor.fetchone()
    allowed = row is not None and resource_is_accessible(cursor, "character:" + str(character_id), user_id)


    if row is None or not allowed:

        connection.close()

        return jsonify({
            "message":
                "Postava nebyla nalezena."
        }), 404


    payload = get_character_payload(
        cursor,
        character_id
    )


    connection.close()


    return jsonify(payload)


# =========================================================
# POSTAVA – VYTVOŘENÍ
# =========================================================

@characters_bp.route(
    "/api/books/<int:book_id>/characters",
    methods=["POST"]
)
@require_permission("content.manage")
def add_character(book_id):

    data = request.get_json() or {}


    name = (
        data.get("name") or ""
    ).strip()


    if not name:

        return jsonify({
            "message":
                "Jméno postavy je povinné."
        }), 400


    quote = (
        data.get("quote") or ""
    )


    content_html = (
        data.get("content_html") or ""
    )


    main_image = (
        data.get("main_image") or None
    )


    hover_image = (
        data.get("hover_image") or None
    )


    header_image = (
        data.get("header_image") or None
    )


    chapter_background = (
        data.get("chapter_background") or None
    )


    # =====================================================
    # VIDEO POSTAVY
    # =====================================================

    main_video = (
        data.get("main_video") or None
    )


    soundtrack = (
        data.get("soundtrack") or None
    )


    race = (
        data.get("race") or ""
    )


    sort_order = data.get(
        "sort_order",
        0
    )


    published = data.get(
        "published",
        True
    )


    volume_ids = data.get(
        "volume_ids",
        []
    )


    if volume_ids is None:
        volume_ids = []


    try:

        volume_ids = [
            int(volume_id)
            for volume_id in volume_ids
        ]

    except (
        TypeError,
        ValueError
    ):

        return jsonify({
            "message":
                "Neplatný díl."
        }), 400


    connection = get_connection()
    cursor = connection.cursor()

    ensure_character_columns(cursor)


    if not book_exists(
        cursor,
        book_id
    ):

        connection.close()

        return jsonify({
            "message":
                "Kniha nebyla nalezena."
        }), 404


    if not validate_volume_ids(
        cursor,
        book_id,
        volume_ids
    ):

        connection.close()

        return jsonify({
            "message":
                "Některý vybraný díl nepatří k této knize."
        }), 400


    cursor.execute(
        """
        INSERT INTO characters
        (
            book_id,
            name,
            quote,
            content_html,
            main_image,
            hover_image,
            header_image,
            chapter_background,
            main_video,
            soundtrack,
            race,
            sort_order,
            published
        )

        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            book_id,
            name,
            quote,
            content_html,
            main_image,
            hover_image,
            header_image,
            chapter_background,
            main_video,
            soundtrack,
            race,
            sort_order,
            1 if published else 0
        )
    )


    character_id = cursor.lastrowid


    # =====================================================
    # DÍLY
    # =====================================================

    for volume_id in volume_ids:

        cursor.execute(
            """
            INSERT INTO character_volumes
            (
                character_id,
                volume_id
            )

            VALUES (?, ?)
            """,
            (
                character_id,
                volume_id
            )
        )


    # =====================================================
    # DALŠÍ INFORMACE
    # =====================================================

    details = data.get(
        "details",
        []
    )


    if details is None:
        details = []


    for index, detail in enumerate(details):

        label = (
            detail.get("label") or ""
        ).strip()


        value = (
            detail.get("value") or ""
        )


        if not label:
            continue


        cursor.execute(
            """
            INSERT INTO character_details
            (
                character_id,
                label,
                value,
                sort_order
            )

            VALUES (?, ?, ?, ?)
            """,
            (
                character_id,
                label,
                value,
                detail.get(
                    "sort_order",
                    index
                )
            )
        )


    # =====================================================
    # GALERIE
    # =====================================================

    images = data.get(
        "images",
        []
    )


    if images is None:
        images = []


    for index, image in enumerate(images):

        image_path = (
            image.get("image") or ""
        ).strip()


        if not image_path:
            continue


        cursor.execute(
            """
            INSERT INTO character_images
            (
                character_id,
                image,
                caption,
                sort_order
            )

            VALUES (?, ?, ?, ?)
            """,
            (
                character_id,
                image_path,
                image.get("caption") or "",
                image.get(
                    "sort_order",
                    index
                )
            )
        )


    # =====================================================
    # CITÁTY
    # =====================================================

    quotes = data.get(
        "quotes",
        []
    )


    if quotes is None:
        quotes = []


    for index, item in enumerate(quotes):

        quote = (
            item.get("quote") or ""
        ).strip()


        author = (
            item.get("author") or ""
        ).strip()


        volume_id = item.get(
            "volume_id"
        )


        if not quote:
            continue


        if volume_id not in (
            None,
            "",
        ):

            try:

                volume_id = int(volume_id)

            except (
                TypeError,
                ValueError
            ):

                connection.close()

                return jsonify({
                    "message":
                        "Neplatný díl u citátu."
                }), 400


            if not volume_belongs_to_book(
                cursor,
                volume_id,
                book_id
            ):

                connection.close()

                return jsonify({
                    "message":
                        "Díl u citátu nepatří k této knize."
                }), 400

        else:

            volume_id = None


        cursor.execute(
            """
            INSERT INTO character_quotes
            (
                character_id,
                quote,
                author,
                volume_id,
                sort_order
            )

            VALUES (?, ?, ?, ?, ?)
            """,
            (
                character_id,
                quote,
                author,
                volume_id,
                item.get(
                    "sort_order",
                    index
                )
            )
        )


    # =====================================================
    # VZTAHY
    # =====================================================

    relationships = data.get(
        "relationships",
        []
    )


    if relationships is None:
        relationships = []


    for item in relationships:

        related_character_id = item.get(
            "related_character_id"
        )


        if related_character_id in (
            None,
            "",
        ):

            continue


        try:

            related_character_id = int(
                related_character_id
            )

        except (
            TypeError,
            ValueError
        ):

            connection.close()

            return jsonify({
                "message":
                    "Neplatná postava u vztahu."
            }), 400


        if not validate_relationship_character(
            cursor,
            book_id,
            character_id,
            related_character_id
        ):

            connection.close()

            return jsonify({
                "message":
                    "Vybraná postava nepatří k této knize nebo je vybrána sama postava."
            }), 400


        relationship_types = item.get(
            "relationship_types",
            []
        )


        if not isinstance(
            relationship_types,
            list
        ):

            relationship_types = [
                relationship_types
            ]


        relationship_types = [
            str(type_value)
            for type_value in relationship_types
            if type_value
        ]


        if not relationship_types:
            continue


        left_id = min(
            character_id,
            related_character_id
        )


        right_id = max(
            character_id,
            related_character_id
        )


        relationship_json = json.dumps(
            relationship_types,
            ensure_ascii=False
        )

        if hasattr(cursor, "_cursor"):
            # PostgreSQL / Neon
            cursor.execute(
                """
                INSERT INTO character_relationships
                (
                    character_id,
                    related_character_id,
                    relationship_type
                )
                VALUES (?, ?, ?)
                ON CONFLICT (character_id, related_character_id)
                DO UPDATE SET
                    relationship_type = EXCLUDED.relationship_type
                """,
                (
                    left_id,
                    right_id,
                    relationship_json
                )
            )
        else:
            # SQLite
            cursor.execute(
                """
                INSERT OR REPLACE INTO character_relationships
                (
                    character_id,
                    related_character_id,
                    relationship_type
                )
                VALUES (?, ?, ?)
                """,
                (
                    left_id,
                    right_id,
                    relationship_json
                )
            )


    connection.commit()


    payload = get_character_payload(
        cursor,
        character_id
    )


    connection.close()


    return jsonify(payload), 201


# =========================================================
# POSTAVA – ÚPRAVA
# =========================================================

@characters_bp.route(
    "/api/books/<int:book_id>/characters/<int:character_id>",
    methods=["PUT"]
)
@require_permission("content.manage")
def update_character(
    book_id,
    character_id
):

    data = request.get_json() or {}


    name = (
        data.get("name") or ""
    ).strip()


    if not name:

        return jsonify({
            "message":
                "Jméno postavy je povinné."
        }), 400


    quote = (
        data.get("quote") or ""
    )


    content_html = (
        data.get("content_html") or ""
    )


    main_image = (
        data.get("main_image") or None
    )


    hover_image = (
        data.get("hover_image") or None
    )


    header_image = (
        data.get("header_image") or None
    )


    chapter_background = (
        data.get("chapter_background") or None
    )


    # =====================================================
    # VIDEO POSTAVY
    # =====================================================

    main_video = (
        data.get("main_video") or None
    )


    soundtrack = (
        data.get("soundtrack") or None
    )


    race = (
        data.get("race") or ""
    )


    sort_order = data.get(
        "sort_order",
        0
    )


    published = data.get(
        "published",
        True
    )


    volume_ids = data.get(
        "volume_ids",
        []
    )


    if volume_ids is None:
        volume_ids = []


    try:

        volume_ids = [
            int(volume_id)
            for volume_id in volume_ids
        ]

    except (
        TypeError,
        ValueError
    ):

        return jsonify({
            "message":
                "Neplatný díl."
        }), 400


    connection = get_connection()
    cursor = connection.cursor()

    ensure_character_columns(cursor)


    # =====================================================
    # KONTROLA POSTAVY
    # =====================================================

    cursor.execute(
        """
        SELECT id
        FROM characters
        WHERE
            id = ?
            AND book_id = ?
        """,
        (
            character_id,
            book_id
        )
    )


    if cursor.fetchone() is None:

        connection.close()

        return jsonify({
            "message":
                "Postava nebyla nalezena."
        }), 404


    # =====================================================
    # KONTROLA DÍLŮ
    # =====================================================

    if not validate_volume_ids(
        cursor,
        book_id,
        volume_ids
    ):

        connection.close()

        return jsonify({
            "message":
                "Některý vybraný díl nepatří k této knize."
        }), 400


    # =====================================================
    # HLAVNÍ ÚDAJE
    # =====================================================

    cursor.execute(
        """
        UPDATE characters

        SET
            name = ?,
            quote = ?,
            content_html = ?,
            main_image = ?,
            hover_image = ?,
            header_image = ?,
            chapter_background = ?,
            main_video = ?,
            soundtrack = ?,
            race = ?,
            sort_order = ?,
            published = CAST(? AS INTEGER),
            updated_at = CURRENT_TIMESTAMP

        WHERE
            id = ?
            AND book_id = ?
        """,
        (
            name,
            quote,
            content_html,
            main_image,
            hover_image,
            header_image,
            chapter_background,
            main_video,
            soundtrack,
            race,
            sort_order,
            1 if published else 0,
            character_id,
            book_id
        )
    )


    # =====================================================
    # DÍLY
    # =====================================================

    cursor.execute(
        """
        DELETE FROM character_volumes
        WHERE character_id = ?
        """,
        (character_id,)
    )


    for volume_id in volume_ids:

        cursor.execute(
            """
            INSERT INTO character_volumes
            (
                character_id,
                volume_id
            )

            VALUES (?, ?)
            """,
            (
                character_id,
                volume_id
            )
        )


    # =====================================================
    # DALŠÍ INFORMACE
    # =====================================================

    cursor.execute(
        """
        DELETE FROM character_details
        WHERE character_id = ?
        """,
        (character_id,)
    )


    details = data.get(
        "details",
        []
    )


    if details is None:
        details = []


    for index, detail in enumerate(details):

        label = (
            detail.get("label") or ""
        ).strip()


        value = (
            detail.get("value") or ""
        )


        if not label:
            continue


        cursor.execute(
            """
            INSERT INTO character_details
            (
                character_id,
                label,
                value,
                sort_order
            )

            VALUES (?, ?, ?, ?)
            """,
            (
                character_id,
                label,
                value,
                detail.get(
                    "sort_order",
                    index
                )
            )
        )


    # =====================================================
    # GALERIE
    # =====================================================

    cursor.execute(
        """
        DELETE FROM character_images
        WHERE character_id = ?
        """,
        (character_id,)
    )


    images = data.get(
        "images",
        []
    )


    if images is None:
        images = []


    for index, image in enumerate(images):

        image_path = (
            image.get("image") or ""
        ).strip()


        if not image_path:
            continue


        cursor.execute(
            """
            INSERT INTO character_images
            (
                character_id,
                image,
                caption,
                sort_order
            )

            VALUES (?, ?, ?, ?)
            """,
            (
                character_id,
                image_path,
                image.get("caption") or "",
                image.get(
                    "sort_order",
                    index
                )
            )
        )


    # =====================================================
    # CITÁTY
    # =====================================================

    cursor.execute(
        """
        DELETE FROM character_quotes
        WHERE character_id = ?
        """,
        (character_id,)
    )


    quotes = data.get(
        "quotes",
        []
    )


    if quotes is None:
        quotes = []


    for index, item in enumerate(quotes):

        quote = (
            item.get("quote") or ""
        ).strip()


        author = (
            item.get("author") or ""
        ).strip()


        volume_id = item.get(
            "volume_id"
        )


        if not quote:
            continue


        if volume_id not in (
            None,
            "",
        ):

            try:

                volume_id = int(volume_id)

            except (
                TypeError,
                ValueError
            ):

                connection.close()

                return jsonify({
                    "message":
                        "Neplatný díl u citátu."
                }), 400


            if not volume_belongs_to_book(
                cursor,
                volume_id,
                book_id
            ):

                connection.close()

                return jsonify({
                    "message":
                        "Díl u citátu nepatří k této knize."
                }), 400

        else:

            volume_id = None


        cursor.execute(
            """
            INSERT INTO character_quotes
            (
                character_id,
                quote,
                author,
                volume_id,
                sort_order
            )

            VALUES (?, ?, ?, ?, ?)
            """,
            (
                character_id,
                quote,
                author,
                volume_id,
                item.get(
                    "sort_order",
                    index
                )
            )
        )


    # =====================================================
    # VZTAHY
    #
    # Jedna dvojice postav = jeden řádek.
    # relationship_type = JSON seznam typů.
    #
    # Například:
    #
    # ["love", "enemy"]
    #
    # znamená:
    # ❤️ Láska
    # ⚔️ Nepřítel
    # =====================================================

    relationships = data.get(
        "relationships",
        []
    )

    if relationships is None:
        relationships = []

    # Nejdřív všechny vztahy zvalidujeme a sloučíme podle dvojice postav.
    # Díky tomu se při více řádcích se stejnou postavou žádný typ nepřepíše.
    normalized_relationships = {}

    for item in relationships:

        related_character_id = item.get(
            "related_character_id"
        )

        if related_character_id in (
            None,
            "",
        ):
            continue

        try:
            related_character_id = int(
                related_character_id
            )

        except (
            TypeError,
            ValueError
        ):

            connection.close()

            return jsonify({
                "message":
                    "Neplatná postava u vztahu."
            }), 400

        if not validate_relationship_character(
            cursor,
            book_id,
            character_id,
            related_character_id
        ):

            connection.close()

            return jsonify({
                "message":
                    "Vybraná postava nepatří k této knize nebo je vybrána sama postava."
            }), 400

        relationship_types = item.get(
            "relationship_types",
            []
        )

        if not isinstance(
            relationship_types,
            list
        ):

            relationship_types = [
                relationship_types
            ]

        relationship_types = [
            str(type_value)
            for type_value in relationship_types
            if type_value
        ]

        if not relationship_types:
            continue

        left_id = min(
            character_id,
            related_character_id
        )

        right_id = max(
            character_id,
            related_character_id
        )

        pair_key = (
            left_id,
            right_id
        )

        if pair_key not in normalized_relationships:
            normalized_relationships[pair_key] = []

        for type_value in relationship_types:
            if type_value not in normalized_relationships[pair_key]:
                normalized_relationships[pair_key].append(
                    type_value
                )

    # Staré vztahy smažeme až poté, co je celý nový seznam validní.
    cursor.execute(
        """
        DELETE FROM character_relationships
        WHERE
            character_id = ?
            OR related_character_id = ?
        """,
        (
            character_id,
            character_id
        )
    )

    for (
        left_id,
        right_id
    ), relationship_types in normalized_relationships.items():

        relationship_json = json.dumps(
            relationship_types,
            ensure_ascii=False
        )

        if hasattr(cursor, "_cursor"):
            # PostgreSQL / Neon
            cursor.execute(
                """
                INSERT INTO character_relationships
                (
                    character_id,
                    related_character_id,
                    relationship_type
                )
                VALUES (?, ?, ?)
                ON CONFLICT (character_id, related_character_id)
                DO UPDATE SET
                    relationship_type = EXCLUDED.relationship_type
                """,
                (
                    left_id,
                    right_id,
                    relationship_json
                )
            )
        else:
            # SQLite
            cursor.execute(
                """
                INSERT OR REPLACE INTO character_relationships
                (
                    character_id,
                    related_character_id,
                    relationship_type
                )
                VALUES (?, ?, ?)
                """,
                (
                    left_id,
                    right_id,
                    relationship_json
                )
            )


    # =====================================================
    # ULOŽENÍ
    # =====================================================

    connection.commit()


    payload = get_character_payload(
        cursor,
        character_id
    )


    connection.close()


    return jsonify(payload)


# =========================================================
# POSTAVA – SMAZÁNÍ
# =========================================================

@characters_bp.route(
    "/api/books/<int:book_id>/characters/<int:character_id>",
    methods=["DELETE"]
)
@require_permission("content.manage")
def delete_character(
    book_id,
    character_id
):

    connection = get_connection()
    cursor = connection.cursor()


    cursor.execute(
        """
        DELETE FROM characters
        WHERE
            id = ?
            AND book_id = ?
        """,
        (
            character_id,
            book_id
        )
    )


    deleted = cursor.rowcount


    connection.commit()
    connection.close()


    if deleted == 0:

        return jsonify({
            "message":
                "Postava nebyla nalezena."
        }), 404


    return jsonify({
        "message":
            "Postava byla smazána."
    })