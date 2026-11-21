import sqlite3
from pathlib import Path


DATABASE_PATH = (
    Path(__file__).parent
    / "database"
    / "database.db"
)


def initialize_characters():

    connection = sqlite3.connect(DATABASE_PATH)

    cursor = connection.cursor()


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


    # =====================================================
    # POSTAVA ↔ DÍL
    #
    # Jedna postava může být v několika dílech.
    # Jeden díl může obsahovat několik postav.
    #
    # Například:
    #
    # Alex → Díl 1
    # Alex → Díl 2
    # Adri → Díl 1
    #
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
    # DALŠÍ INFORMACE
    #
    # Uživatel si může vytvořit libovolné položky:
    #
    # Věk → 24
    # Povolání → Fotograf
    # Rasa → Mory
    # Výška → 187 cm
    #
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
    # GALERIE / OBRÁZKY
    #
    # Hlavní a horní obrázek jsou přímo v characters.
    #
    # Tohle je galerie dalších obrázků.
    #
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


    connection.commit()

    connection.close()


    print("Tabulky postav byly úspěšně vytvořeny.")


if __name__ == "__main__":
    initialize_characters()
    