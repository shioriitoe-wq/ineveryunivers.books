import os
import psycopg2
from dotenv import load_dotenv
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent

load_dotenv(BASE_DIR / ".env", override=False)
load_dotenv(BASE_DIR.parent / ".env", override=False)

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ DATABASE_URL nebyla nalezena.")
    raise SystemExit(1)


print("=" * 70)
print("DIAGNOSTIKA NEON POSTGRESQL")
print("=" * 70)

connection = psycopg2.connect(DATABASE_URL)
connection.autocommit = True
cursor = connection.cursor()


def test(name, sql, params=None):
    print()
    print("-" * 70)
    print(name)
    print("-" * 70)
    print("SQL:")
    print(sql.strip())

    if params is not None:
        print("PARAMETRY:")
        print(params)

    try:
        cursor.execute(sql, params)

        if cursor.description:
            rows = cursor.fetchall()
            print("✅ OK")
            print("VÝSLEDEK:")
            for row in rows:
                print(row)
        else:
            print("✅ OK")
            print("POČET ŘÁDKŮ:", cursor.rowcount)

    except Exception as e:
        print("❌ CHYBA:")
        print(type(e).__name__)
        print(str(e))


# ------------------------------------------------------------
# 1. TABULKY
# ------------------------------------------------------------

test(
    "1. EXISTENCE TABULEK",
    """
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
    """
)


# ------------------------------------------------------------
# 2. SLOUPCE CHARACTERS
# ------------------------------------------------------------

test(
    "2. SLOUPCE V CHARACTERS",
    """
    SELECT
        column_name,
        data_type,
        is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'characters'
    ORDER BY ordinal_position
    """
)


# ------------------------------------------------------------
# 3. SLOUPCE CHARACTER_DETAILS
# ------------------------------------------------------------

test(
    "3. SLOUPCE V CHARACTER_DETAILS",
    """
    SELECT
        column_name,
        data_type,
        is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'character_details'
    ORDER BY ordinal_position
    """
)


# ------------------------------------------------------------
# 4. SLOUPCE CHARACTER_VOLUMES
# ------------------------------------------------------------

test(
    "4. SLOUPCE V CHARACTER_VOLUMES",
    """
    SELECT
        column_name,
        data_type,
        is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'character_volumes'
    ORDER BY ordinal_position
    """
)


# ------------------------------------------------------------
# 5. TEST POSTAVY 13
# ------------------------------------------------------------

test(
    "5. POSTAVA 13",
    """
    SELECT *
    FROM characters
    WHERE id = %s
    """,
    (13,)
)


# ------------------------------------------------------------
# 6. TEST BOOK_ID
# ------------------------------------------------------------

test(
    "6. POSTAVA 13 + BOOK 1",
    """
    SELECT id, name, book_id
    FROM characters
    WHERE id = %s
      AND book_id = %s
    """,
    (13, 1)
)


# ------------------------------------------------------------
# 7. TEST UPDATE
# ------------------------------------------------------------

test(
    "7. TEST UPDATE CHARACTERS",
    """
    UPDATE characters
    SET
        name = %s,
        quote = %s,
        content_html = %s,
        main_image = %s,
        hover_image = %s,
        header_image = %s,
        main_video = %s,
        soundtrack = %s,
        race = %s,
        sort_order = %s,
        published = %s,
        updated_at = CURRENT_TIMESTAMP
    WHERE
        id = %s
        AND book_id = %s
    """,
    (
        "TEST - NECHAT",
        "",
        "",
        None,
        None,
        None,
        None,
        None,
        "",
        0,
        True,
        13,
        1
    )
)


# ------------------------------------------------------------
# 8. TEST CHARACTER_VOLUMES
# ------------------------------------------------------------

test(
    "8. DELETE CHARACTER_VOLUMES",
    """
    DELETE FROM character_volumes
    WHERE character_id = %s
    """,
    (13,)
)


# ------------------------------------------------------------
# 9. TEST CHARACTER_DETAILS
# ------------------------------------------------------------

test(
    "9. DELETE CHARACTER_DETAILS",
    """
    DELETE FROM character_details
    WHERE character_id = %s
    """,
    (13,)
)


print()
print("=" * 70)
print("DIAGNOSTIKA DOKONČENA")
print("=" * 70)

cursor.close()
connection.close()