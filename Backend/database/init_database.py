from .database import get_connection


def initialize_database():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            status TEXT NOT NULL
        )
    """)
    cursor.execute("""
        INSERT OR IGNORE INTO books (id, title, status)
        VALUES
            (1, 'Raven', 'Rozpracováno'),
            (2, 'Kaelen', 'Plánováno')
    """)

    connection.commit()
    connection.close()

    print("Databáze byla připravena.")


if __name__ == "__main__":
    initialize_database()