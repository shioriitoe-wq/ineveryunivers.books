import sqlite3

db = sqlite3.connect("database/database.db")

tables = db.execute(
    "SELECT name FROM sqlite_master "
    "WHERE type='table' "
    "ORDER BY name"
).fetchall()

print("Tabulky v databázi:")

for table in tables:
    print("-", table[0])

db.close()