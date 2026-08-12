from .database import get_connection


def _add_column_if_missing(cursor, table_name, column_name, column_definition):
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = {row[1] for row in cursor.fetchall()}
    if column_name not in columns:
        cursor.execute(
            f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_definition}"
        )


def initialize_database():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            status TEXT NOT NULL,
            type TEXT NOT NULL,
            parent_id INTEGER
        )
    """)

    _add_column_if_missing(cursor, "books", "uses_volumes", "INTEGER NOT NULL DEFAULT 0")
    _add_column_if_missing(cursor, "books", "uses_parts", "INTEGER NOT NULL DEFAULT 0")

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS volumes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            book_id INTEGER NOT NULL,
            number INTEGER,
            title TEXT NOT NULL,
            FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS parts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            book_id INTEGER NOT NULL,
            volume_id INTEGER,
            number INTEGER,
            title TEXT NOT NULL,
            FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
            FOREIGN KEY (volume_id) REFERENCES volumes(id) ON DELETE CASCADE
        )
    """)

    # Kapitoly ukládáme jako HTML z vizuálního editoru.
    # Uživatel nikdy nemusí HTML psát ručně.
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
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
            FOREIGN KEY (volume_id) REFERENCES volumes(id) ON DELETE SET NULL,
            FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE SET NULL
        )
    """)

    cursor.execute("""
        INSERT OR IGNORE INTO books
            (id, title, status, type, parent_id, uses_volumes, uses_parts)
        VALUES
            (1, '(Ne)začalo to létem', 'Rozpracováno', 'series', NULL, 1, 1),
            (2, 'AEIL', 'Rozpracováno', 'standalone', NULL, 0, 0)
    """)

    connection.commit()
    connection.close()

    print("Databáze byla připravena.")


if __name__ == "__main__":
    initialize_database()
