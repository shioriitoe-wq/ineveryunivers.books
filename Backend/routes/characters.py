import json

from flask import Blueprint, jsonify, request

from database.database import get_connection


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
# KONTROLA / MIGRACE SLOUPCŮ POSTAV
# =========================================================

def ensure_character_columns(cursor):
    """
    Zajistí starším SQLite databázím chybějící sloupce.

    PostgreSQL/Neon má schéma vytvořené pomocí seed_postgres.sql,
    takže tam tuto SQLite migraci nespouštíme.
    """
    # Náš PostgresCursor obaluje skutečný psycopg2 cursor v atributu _cursor.
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
# POSTAVY – SEZNAM
# =========================================================

@characters_bp.route(
    "/api/books/<int:book_id>/characters",
    methods=["GET"]
)
def get_characters(book_id):

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


    result = []


    for row in rows:

        payload = get_character_payload(
            cursor,
            row["id"]
        )

        result.append(payload)


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


    if row is None:

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
            main_video,
            soundtrack,
            race,
            sort_order,
            published
        )

        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            book_id,
            name,
            quote,
            content_html,
            main_image,
            hover_image,
            header_image,
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
            main_video = ?,
            soundtrack = ?,
            race = ?,
            sort_order = ?,
            published = ?,
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


        # =================================================
        # ZPĚTNÁ KOMPATIBILITA
        # =================================================

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


        # =================================================
        # JEDNOTNÝ SMĚR DVOJICE
        # =================================================

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