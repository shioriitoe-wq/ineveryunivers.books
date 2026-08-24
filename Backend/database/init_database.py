from pathlib import Path
import sqlite3

from .database import get_connection


DATABASE_PATH = Path(__file__).parent / "database.db"
SEED_PATH = Path(__file__).parent / "seed.sql"


def _add_column_if_missing(
    cursor,
    table_name,
    column_name,
    column_definition
):
    cursor.execute(f"PRAGMA table_info({table_name})")

    columns = {
        row[1]
        for row in cursor.fetchall()
    }

    if column_name not in columns:
        cursor.execute(
            f"""
            ALTER TABLE {table_name}
            ADD COLUMN {column_name} {column_definition}
            """
        )


def _database_is_empty(cursor):
    cursor.execute(
        """
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name NOT LIKE 'sqlite_%'
        LIMIT 1
        """
    )

    return cursor.fetchone() is None


def _load_seed(cursor):
    if not SEED_PATH.exists():
        print(f"SEED SOUBOR NENALEZEN: {SEED_PATH}")
        return False

    print(f"Načítám seed databáze: {SEED_PATH}")

    seed_sql = SEED_PATH.read_text(encoding="utf-8")

    # seed.sql obsahuje vlastní BEGIN/COMMIT,
    # proto ho spouštíme přes executescript.
    cursor.executescript(seed_sql)

    print("Seed databáze byl načten.")
    return True


def initialize_database():

    connection = get_connection()
    cursor = connection.cursor()

    try:

        # =====================================================
        # NOVÁ / PRÁZDNÁ DATABÁZE
        # =====================================================

        database_was_empty = _database_is_empty(cursor)

        if database_was_empty:
            print("Databáze je prázdná.")

            # Seed obsahuje kompletní strukturu i data.
            if _load_seed(cursor):
                connection.commit()

                print("Databáze byla vytvořena ze seed.sql.")
                return

        # =====================================================
        # KNIHY
        # =====================================================

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS books (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                status TEXT NOT NULL,
                type TEXT NOT NULL,
                parent_id INTEGER
            )
        """)

        _add_column_if_missing(
            cursor,
            "books",
            "uses_volumes",
            "INTEGER NOT NULL DEFAULT 0"
        )

        _add_column_if_missing(
            cursor,
            "books",
            "uses_parts",
            "INTEGER NOT NULL DEFAULT 0"
        )

        # =====================================================
        # DÍLY
        # =====================================================

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS volumes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,

                book_id INTEGER NOT NULL,

                number INTEGER,

                title TEXT NOT NULL,

                FOREIGN KEY (book_id)
                    REFERENCES books(id)
                    ON DELETE CASCADE
            )
        """)

        # =====================================================
        # ČÁSTI
        # =====================================================

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS parts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,

                book_id INTEGER NOT NULL,

                volume_id INTEGER,

                number INTEGER,

                title TEXT NOT NULL,

                theme TEXT NOT NULL DEFAULT 'summer',

                FOREIGN KEY (book_id)
                    REFERENCES books(id)
                    ON DELETE CASCADE,

                FOREIGN KEY (volume_id)
                    REFERENCES volumes(id)
                    ON DELETE CASCADE
            )
        """)

        _add_column_if_missing(
            cursor,
            "parts",
            "theme",
            "TEXT NOT NULL DEFAULT 'summer'"
        )

        # =====================================================
        # POSTAVY
        # =====================================================

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS characters (
                id INTEGER PRIMARY KEY AUTOINCREMENT,

                book_id INTEGER NOT NULL,

                name TEXT NOT NULL,

                quote TEXT NOT NULL DEFAULT '',

                content_html TEXT NOT NULL DEFAULT '',

                main_image TEXT,

                header_image TEXT,

                sort_order INTEGER NOT NULL DEFAULT 0,

                published INTEGER NOT NULL DEFAULT 1,

                created_at TEXT NOT NULL
                    DEFAULT CURRENT_TIMESTAMP,

                updated_at TEXT NOT NULL
                    DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (book_id)
                    REFERENCES books(id)
                    ON DELETE CASCADE
            )
        """)

        _add_column_if_missing(
            cursor,
            "characters",
            "main_video",
            "TEXT"
        )

        # =====================================================
        # KAPITOLY
        # =====================================================

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS chapters (
                id INTEGER PRIMARY KEY AUTOINCREMENT,

                book_id INTEGER NOT NULL,

                volume_id INTEGER,

                part_id INTEGER,

                number INTEGER NOT NULL,

                title TEXT NOT NULL,

                content_html TEXT NOT NULL DEFAULT '',

                status TEXT NOT NULL DEFAULT 'concept',

                created_at TEXT NOT NULL
                    DEFAULT CURRENT_TIMESTAMP,

                updated_at TEXT NOT NULL
                    DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (book_id)
                    REFERENCES books(id)
                    ON DELETE CASCADE,

                FOREIGN KEY (volume_id)
                    REFERENCES volumes(id)
                    ON DELETE SET NULL,

                FOREIGN KEY (part_id)
                    REFERENCES parts(id)
                    ON DELETE SET NULL
            )
        """)

        # =====================================================
        # DETAILY POSTAV
        # =====================================================

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS character_details (
                id INTEGER PRIMARY KEY AUTOINCREMENT,

                character_id INTEGER NOT NULL,

                label TEXT NOT NULL,

                value TEXT NOT NULL DEFAULT '',

                sort_order INTEGER NOT NULL DEFAULT 0,

                FOREIGN KEY (character_id)
                    REFERENCES characters(id)
                    ON DELETE CASCADE
            )
        """)

        # =====================================================
        # OBRÁZKY POSTAV
        # =====================================================

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS character_images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,

                character_id INTEGER NOT NULL,

                image TEXT NOT NULL,

                caption TEXT NOT NULL DEFAULT '',

                sort_order INTEGER NOT NULL DEFAULT 0,

                FOREIGN KEY (character_id)
                    REFERENCES characters(id)
                    ON DELETE CASCADE
            )
        """)

        # =====================================================
        # CITÁTY POSTAV
        # =====================================================

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS character_quotes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,

                character_id INTEGER NOT NULL,

                quote TEXT NOT NULL,

                author TEXT NOT NULL DEFAULT '',

                volume_id INTEGER,

                sort_order INTEGER NOT NULL DEFAULT 0,

                FOREIGN KEY (character_id)
                    REFERENCES characters(id)
                    ON DELETE CASCADE,

                FOREIGN KEY (volume_id)
                    REFERENCES volumes(id)
                    ON DELETE SET NULL
            )
        """)

        # =====================================================
        # VZTAHY POSTAV
        # =====================================================

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS character_relationships (
                id INTEGER PRIMARY KEY AUTOINCREMENT,

                character_id INTEGER NOT NULL,

                related_character_id INTEGER NOT NULL,

                relationship_type TEXT NOT NULL,

                FOREIGN KEY (character_id)
                    REFERENCES characters(id)
                    ON DELETE CASCADE,

                FOREIGN KEY (related_character_id)
                    REFERENCES characters(id)
                    ON DELETE CASCADE,

                UNIQUE (
                    character_id,
                    related_character_id
                )
            )
        """)

        # =====================================================
        # POSTAVY ↔ DÍLY
        # =====================================================

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS character_volumes (
                character_id INTEGER NOT NULL,

                volume_id INTEGER NOT NULL,

                PRIMARY KEY (
                    character_id,
                    volume_id
                ),

                FOREIGN KEY (character_id)
                    REFERENCES characters(id)
                    ON DELETE CASCADE,

                FOREIGN KEY (volume_id)
                    REFERENCES volumes(id)
                    ON DELETE CASCADE
            )
        """)

        # =====================================================
        # ZÁKLADNÍ KNIHY
        # =====================================================

        cursor.execute("""
            INSERT OR IGNORE INTO books
                (
                    id,
                    title,
                    status,
                    type,
                    parent_id,
                    uses_volumes,
                    uses_parts
                )
            VALUES
                (
                    1,
                    '(Ne)začalo to létem',
                    'Rozpracováno',
                    'series',
                    NULL,
                    1,
                    1
                ),
                (
                    2,
                    'AEIL',
                    'Rozpracováno',
                    'standalone',
                    NULL,
                    0,
                    0
                )
        """)

        connection.commit()

        print("Databáze byla připravena.")

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


if __name__ == "__main__":
    initialize_database()