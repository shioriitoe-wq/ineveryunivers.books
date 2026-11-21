from database.database import get_connection


db = get_connection()

columns = [
    row[1]
    for row in db.execute(
        "PRAGMA table_info(parts)"
    ).fetchall()
]

print("Sloupce parts:", columns)


if "theme" not in columns:

    db.execute(
        """
        ALTER TABLE parts
        ADD COLUMN theme TEXT NOT NULL DEFAULT 'summer'
        """
    )

    print("Sloupec theme byl přidán.")

else:

    print("Sloupec theme už existuje.")


db.commit()
db.close()

print("HOTOVO")