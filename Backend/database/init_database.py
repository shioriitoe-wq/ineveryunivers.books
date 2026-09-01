from pathlib import Path

from .database import get_connection


SEED_PATH = Path(__file__).parent / "seed_postgres.sql"


def _postgres_tables_exist(cursor):
    cursor.execute("""
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = 'books'
        ) AS exists
    """)
    row = cursor.fetchone()
    return bool(row["exists"])


def _load_postgres_seed(connection):
    if not SEED_PATH.exists():
        raise FileNotFoundError(f"SEED SOUBOR NENALEZEN: {SEED_PATH}")

    print(f"Načítám PostgreSQL seed: {SEED_PATH}")
    seed_sql = SEED_PATH.read_text(encoding="utf-8")

    # psycopg2 accepts a complete SQL script when no parameter list is used.
    raw_cursor = connection._connection.cursor()
    try:
        raw_cursor.execute(seed_sql)
        connection.commit()
    finally:
        raw_cursor.close()

    print("PostgreSQL databáze byla vytvořena ze seed_postgres.sql.")


def initialize_database():
    connection = get_connection()

    # Local SQLite is still initialized by the old initializer only when no
    # DATABASE_URL is present. Render/Neon always takes the PostgreSQL path.
    if not hasattr(connection, "_connection"):
        connection.close()
        print("DATABASE_URL není nastavená – PostgreSQL inicializace se přeskočila.")
        return

    try:
        cursor = connection.cursor()

        if not _postgres_tables_exist(cursor):
            _load_postgres_seed(connection)
        else:
            print("PostgreSQL databáze už existuje – seed se znovu nenačítá.")
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


if __name__ == "__main__":
    initialize_database()
