from flask import Blueprint, jsonify, request

from database.database import get_connection


vespera_characters_bp = Blueprint(
    "vespera_characters",
    __name__
)


BOOK_ID = 3


# =========================================================
# POMOCNÉ FUNKCE
# =========================================================

def character_payload(row):
    if row is None:
        return None

    return {
        "id": row["id"],
        "book_id": row["book_id"],
        "case_number": row["case_number"],
        "name": row["name"],
        "age": row["age"],
        "location": row["location"],
        "nexis_level": row["nexis_level"],
        "classification": row["classification"],
        "operational_assignment":
            row["operational_assignment"],
        "available_information":
            row["available_information"],
        "status": row["status"],
        "last_record": row["last_record"],
        "case_manager": row["case_manager"],
        "image_1": row["image_1"],
        "image_2": row["image_2"],
        "image_3": row["image_3"],
        "media": row["media"],
        "media_type": row["media_type"],
        "published": bool(row["published"]),
    }


def ensure_table(cursor):
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS vespera_characters (
            id SERIAL PRIMARY KEY,
            book_id INTEGER NOT NULL DEFAULT 3,
            case_number TEXT,
            name TEXT NOT NULL,
            age INTEGER,
            location TEXT,
            nexis_level NUMERIC,
            classification TEXT,
            operational_assignment TEXT,
            available_information TEXT,
            status TEXT,
            last_record TEXT,
            case_manager TEXT,
            image_1 TEXT,
            image_2 TEXT,
            image_3 TEXT,
            media TEXT,
            media_type TEXT,
            published BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )


# =========================================================
# SEZNAM
# =========================================================

@vespera_characters_bp.route(
    "/api/vespera/characters",
    methods=["GET"]
)
def get_characters():

    connection = get_connection()
    cursor = connection.cursor()

    ensure_table(cursor)

    cursor.execute(
        """
        SELECT *
        FROM vespera_characters
        WHERE book_id = ?
        ORDER BY id
        """,
        (BOOK_ID,)
    )

    rows = cursor.fetchall()

    connection.commit()
    connection.close()

    return jsonify([
        character_payload(row)
        for row in rows
    ])


# =========================================================
# DETAIL
# =========================================================

@vespera_characters_bp.route(
    "/api/vespera/characters/<int:character_id>",
    methods=["GET"]
)
def get_character(character_id):

    connection = get_connection()
    cursor = connection.cursor()

    ensure_table(cursor)

    cursor.execute(
        """
        SELECT *
        FROM vespera_characters
        WHERE
            id = ?
            AND book_id = ?
        """,
        (
            character_id,
            BOOK_ID
        )
    )

    row = cursor.fetchone()

    connection.commit()
    connection.close()

    if row is None:
        return jsonify({
            "message":
                "Postava Vespery nebyla nalezena."
        }), 404

    return jsonify(
        character_payload(row)
    )


# =========================================================
# VYTVOŘENÍ
# =========================================================

@vespera_characters_bp.route(
    "/api/vespera/characters",
    methods=["POST"]
)
def add_character():

    data = request.get_json() or {}

    name = (
        data.get("name") or ""
    ).strip()

    if not name:
        return jsonify({
            "message":
                "Jméno postavy je povinné."
        }), 400

    connection = get_connection()
    cursor = connection.cursor()

    ensure_table(cursor)

    cursor.execute(
        """
        INSERT INTO vespera_characters (
            book_id,
            case_number,
            name,
            age,
            location,
            nexis_level,
            classification,
            operational_assignment,
            available_information,
            status,
            last_record,
            case_manager,
            image_1,
            image_2,
            image_3,
            media,
            media_type,
            published
        )
        VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
        RETURNING *
        """,
        (
            BOOK_ID,
            data.get("case_number"),
            name,
            data.get("age"),
            data.get("location"),
            data.get("nexis_level"),
            data.get("classification"),
            data.get(
                "operational_assignment"
            ),
            data.get(
                "available_information"
            ),
            data.get("status"),
            data.get("last_record"),
            data.get("case_manager"),
            data.get("image_1"),
            data.get("image_2"),
            data.get("image_3"),
            data.get("media"),
            data.get("media_type"),
            bool(data.get("published")),
        )
    )

    row = cursor.fetchone()

    connection.commit()
    connection.close()

    return jsonify(
        character_payload(row)
    ), 201


# =========================================================
# ÚPRAVA
# =========================================================

@vespera_characters_bp.route(
    "/api/vespera/characters/<int:character_id>",
    methods=["PUT"]
)
def update_character(character_id):

    data = request.get_json() or {}

    name = (
        data.get("name") or ""
    ).strip()

    if not name:
        return jsonify({
            "message":
                "Jméno postavy je povinné."
        }), 400

    connection = get_connection()
    cursor = connection.cursor()

    ensure_table(cursor)

    cursor.execute(
        """
        UPDATE vespera_characters
        SET
            case_number = ?,
            name = ?,
            age = ?,
            location = ?,
            nexis_level = ?,
            classification = ?,
            operational_assignment = ?,
            available_information = ?,
            status = ?,
            last_record = ?,
            case_manager = ?,
            image_1 = ?,
            image_2 = ?,
            image_3 = ?,
            media = ?,
            media_type = ?,
            published = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE
            id = ?
            AND book_id = ?
        RETURNING *
        """,
        (
            data.get("case_number"),
            name,
            data.get("age"),
            data.get("location"),
            data.get("nexis_level"),
            data.get("classification"),
            data.get(
                "operational_assignment"
            ),
            data.get(
                "available_information"
            ),
            data.get("status"),
            data.get("last_record"),
            data.get("case_manager"),
            data.get("image_1"),
            data.get("image_2"),
            data.get("image_3"),
            data.get("media"),
            data.get("media_type"),
            bool(data.get("published")),
            character_id,
            BOOK_ID,
        )
    )

    row = cursor.fetchone()

    if row is None:
        connection.rollback()
        connection.close()

        return jsonify({
            "message":
                "Postava Vespery nebyla nalezena."
        }), 404

    connection.commit()
    connection.close()

    return jsonify(
        character_payload(row)
    )


# =========================================================
# SMAZÁNÍ
# =========================================================

@vespera_characters_bp.route(
    "/api/vespera/characters/<int:character_id>",
    methods=["DELETE"]
)
def delete_character(character_id):

    connection = get_connection()
    cursor = connection.cursor()

    ensure_table(cursor)

    cursor.execute(
        """
        DELETE FROM vespera_characters
        WHERE
            id = ?
            AND book_id = ?
        """,
        (
            character_id,
            BOOK_ID
        )
    )

    deleted = cursor.rowcount

    connection.commit()
    connection.close()

    if deleted == 0:
        return jsonify({
            "message":
                "Postava Vespery nebyla nalezena."
        }), 404

    return jsonify({
        "message":
            "Postava byla smazána."
    })