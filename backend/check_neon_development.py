
import os
import sys
from database.database import get_connection

# Bezpečnostní kontrola: povolíme pouze vývojovou databázi.
if os.getenv("USE_DEVELOPMENT_DATABASE", "").strip().lower() != "true":
    print("STOP: Vývojová databáze není aktivní.")
    sys.exit(1)

url = os.getenv("DATABASE_URL_DEVELOPMENT", "").strip()

if not url:
    print("STOP: DATABASE_URL_DEVELOPMENT není nastavena.")
    sys.exit(1)

from urllib.parse import urlparse

parsed = urlparse(url)

print("Vybraná databáze: DEVELOPMENT")
print("Hostitel:", parsed.hostname)

connection = None

try:
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            current_database() AS database_name,
            current_user AS database_role
    """)

    result = cursor.fetchone()

    print("\nPŘIPOJENÍ ÚSPĚŠNÉ")
    print("Databáze:", result["database_name"])
    print("Role:", result["database_role"])

    cursor.execute("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN (
              'books',
              'volumes',
              'music_tracks'
          )
        ORDER BY table_name
    """)

    tables = cursor.fetchall()

    print("\nKontrola tabulek:")
    for table in tables:
        print("✓", table["table_name"])

    print("\nKontrola dokončena.")
    print("V databázi nebyly provedeny žádné změny.")

except Exception as error:
    print("\nCHYBA PŘIPOJENÍ:")
    print(type(error).__name__)
    print(str(error))

finally:
    if connection:
        connection.close()
