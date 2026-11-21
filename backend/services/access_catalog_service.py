"""Discovers application content and mirrors it into the central access catalog.

This is catalog synchronization only: it never changes access rules or grants.
"""
from database.database import get_connection

ROOTS = [
    ("section:books", "Knihy", "section"),
    ("section:filmoteka", "Videa / Filmotéka", "section"),
    ("section:soundtrack", "Soundtracky / Hudba", "section"),
    ("section:community", "Komunita", "section"),
]


def _upsert(cursor, key, label, resource_type, parent_id=None, source_type=None, source_id=None):
    cursor.execute(
        """INSERT INTO access_resources
             (resource_key, label, resource_type, parent_resource_id, is_active,
              source_type, source_id, discovered_at, last_synced_at, updated_at)
           VALUES (?, ?, ?, ?, TRUE, ?, ?, NOW(), NOW(), NOW())
           ON CONFLICT (resource_key) DO UPDATE SET
             label = EXCLUDED.label,
             resource_type = EXCLUDED.resource_type,
             parent_resource_id = EXCLUDED.parent_resource_id,
             source_type = COALESCE(EXCLUDED.source_type, access_resources.source_type),
             source_id = COALESCE(EXCLUDED.source_id, access_resources.source_id),
             discovered_at = COALESCE(access_resources.discovered_at, NOW()),
             last_synced_at = NOW(), updated_at = NOW()
           RETURNING id""",
        (key, label, resource_type, parent_id, source_type, str(source_id) if source_id is not None else None),
    )
    return int(cursor.fetchone()["id"])


def sync_access_catalog(cursor):
    root_ids = {}
    for key, label, kind in ROOTS:
        root_ids[key] = _upsert(cursor, key, label, kind)

    # Community capabilities are stable application areas rather than rows in one content table.
    community_items = [
        ("community:fans", "Fanoušci"),
        ("community:member_directory", "Adresář členů"),
        ("community:profiles", "Veřejné profily"),
        ("community:private_messages", "Soukromé zprávy"),
        ("community:comments", "Komentáře a reakce"),
    ]
    for key, label in community_items:
        _upsert(cursor, key, label, "community_item", root_ids["section:community"])

    # Books and their structural descendants.
    cursor.execute("SELECT id, title FROM books ORDER BY title, id")
    book_ids = {}
    for row in cursor.fetchall():
        rid = _upsert(cursor, f"book:{row['id']}", row["title"], "book", root_ids["section:books"], "book", row["id"])
        book_ids[int(row["id"])] = rid

    cursor.execute("SELECT id, book_id, number, title FROM volumes ORDER BY book_id, number NULLS LAST, id")
    volume_ids = {}
    for row in cursor.fetchall():
        parent = book_ids.get(int(row["book_id"]))
        if parent is None:
            continue
        label = row["title"] or f"Svazek {row['number'] or row['id']}"
        volume_ids[int(row["id"])] = _upsert(cursor, f"volume:{row['id']}", label, "volume", parent, "volume", row["id"])

    cursor.execute("SELECT id, book_id, volume_id, number, title FROM parts ORDER BY book_id, volume_id NULLS FIRST, number NULLS LAST, id")
    for row in cursor.fetchall():
        parent = volume_ids.get(int(row["volume_id"])) if row["volume_id"] is not None else book_ids.get(int(row["book_id"]))
        if parent is None:
            continue
        label = row["title"] or f"Část {row['number'] or row['id']}"
        _upsert(cursor, f"part:{row['id']}", label, "part", parent, "part", row["id"])

    cursor.execute("SELECT id, book_id, volume_id, part_id, number, title FROM chapters ORDER BY book_id, number, id")
    for row in cursor.fetchall():
        parent = None
        if row["part_id"] is not None:
            cursor.execute("SELECT id FROM access_resources WHERE source_type = 'part' AND source_id = ?", (str(row["part_id"]),))
            found = cursor.fetchone()
            parent = int(found["id"]) if found else None
        if parent is None and row["volume_id"] is not None:
            parent = volume_ids.get(int(row["volume_id"]))
        if parent is None:
            parent = book_ids.get(int(row["book_id"]))
        if parent is not None:
            _upsert(cursor, f"chapter:{row['id']}", row["title"] or f"Kapitola {row['number']}", "chapter", parent, "chapter", row["id"])

    cursor.execute("SELECT id, book_id, name FROM characters ORDER BY book_id, sort_order, name, id")
    character_ids = {}
    for row in cursor.fetchall():
        parent = book_ids.get(int(row["book_id"]))
        if parent is not None:
            character_ids[int(row["id"])] = _upsert(cursor, f"character:{row['id']}", row["name"], "character", parent, "character", row["id"])

    # Vespera uses its own character table; create its established schema before discovery.
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vespera_characters (
            id SERIAL PRIMARY KEY, book_id INTEGER NOT NULL DEFAULT 3,
            case_number TEXT, name TEXT NOT NULL, age INTEGER, location TEXT,
            nexis_level NUMERIC, classification TEXT, operational_assignment TEXT,
            available_information TEXT, status TEXT, last_record TEXT, case_manager TEXT,
            image_1 TEXT, image_2 TEXT, image_3 TEXT, media TEXT, media_type TEXT,
            published BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("SELECT id, name FROM vespera_characters WHERE book_id = 3 ORDER BY id")
    for row in cursor.fetchall():
        _upsert(cursor, f"vespera_character:{row['id']}", row["name"], "character",
                book_ids.get(3), "vespera_character", row["id"])

    # Tracks are listed under Soundtracks, with contextual links to their book.
    cursor.execute("SELECT id, title, book_id FROM music_tracks ORDER BY sort_order, title, id")
    track_ids = {}
    for row in cursor.fetchall():
        rid = _upsert(cursor, f"track:{row['id']}", row["title"], "track", root_ids["section:soundtrack"], "track", row["id"])
        track_ids[int(row["id"])] = rid
        if row["book_id"] is not None and int(row["book_id"]) in book_ids:
            cursor.execute("""INSERT INTO access_resource_links (resource_id, linked_resource_id, relation_type, is_primary)
                              VALUES (?, ?, 'book_context', TRUE) ON CONFLICT DO NOTHING""", (rid, book_ids[int(row["book_id"]) ]))

    # Videos are listed under Filmotéka, with links to all their related entities.
    cursor.execute("SELECT id, title FROM media_videos ORDER BY sort_order, title, id")
    video_ids = {}
    for row in cursor.fetchall():
        video_ids[int(row["id"])] = _upsert(cursor, f"video:{row['id']}", row["title"], "video", root_ids["section:filmoteka"], "video", row["id"])

    cursor.execute("SELECT video_id, book_id, volume_id FROM media_video_books")
    for row in cursor.fetchall():
        video = video_ids.get(int(row["video_id"]))
        target = volume_ids.get(int(row["volume_id"])) if row["volume_id"] is not None else book_ids.get(int(row["book_id"]))
        if video and target:
            cursor.execute("""INSERT INTO access_resource_links (resource_id, linked_resource_id, relation_type)
                              VALUES (?, ?, 'book_context') ON CONFLICT DO NOTHING""", (video, target))

    cursor.execute("SELECT video_id, track_id FROM media_video_tracks")
    for row in cursor.fetchall():
        video, target = video_ids.get(int(row["video_id"])), track_ids.get(int(row["track_id"]))
        if video and target:
            cursor.execute("""INSERT INTO access_resource_links (resource_id, linked_resource_id, relation_type)
                              VALUES (?, ?, 'track_context') ON CONFLICT DO NOTHING""", (video, target))

    cursor.execute("SELECT video_id, character_id FROM media_video_characters")
    for row in cursor.fetchall():
        video, target = video_ids.get(int(row["video_id"])), character_ids.get(int(row["character_id"]))
        if video and target:
            cursor.execute("""INSERT INTO access_resource_links (resource_id, linked_resource_id, relation_type)
                              VALUES (?, ?, 'character_context') ON CONFLICT DO NOTHING""", (video, target))

    cursor.execute("""SELECT r.id, r.resource_key, r.label, r.resource_type, r.parent_resource_id,
                             r.source_type, r.source_id, r.is_active,
                             COALESCE(ar.access_mode, 'inherit') AS access_mode,
                             ar.locked_message,
                             ap.profile_key AS access_profile_key,
                             COALESCE((
                               SELECT array_agg(role.role_key ORDER BY role.role_key)
                               FROM access_rule_roles rr
                               JOIN app_roles role ON role.id = rr.role_id
                               WHERE rr.access_rule_id = ar.id
                             ), ARRAY[]::text[]) AS allowed_roles
                      FROM access_resources r
                      LEFT JOIN access_rules ar ON ar.resource_id = r.id
                      LEFT JOIN access_profiles ap ON ap.id = ar.access_profile_id
                      WHERE r.is_active = TRUE
                      ORDER BY r.resource_type, r.label, r.id""")
    rows = cursor.fetchall()
    by_id = {int(r["id"]): {"id": int(r["id"]), "key": r["resource_key"], "label": r["label"],
             "type": r["resource_type"], "source_type": r["source_type"], "source_id": r["source_id"],
             "access_mode": r["access_mode"], "locked_message": r["locked_message"] or "Tento obsah je momentálně uzamčen.",
             "access_profile_key": r["access_profile_key"], "allowed_roles": list(r["allowed_roles"] or []),
             "parent_key": None, "children": []} for r in rows}
    roots = []
    for r in rows:
        node = by_id[int(r["id"])]
        parent_id = int(r["parent_resource_id"]) if r["parent_resource_id"] is not None else None
        if parent_id in by_id:
            node["parent_key"] = by_id[parent_id]["key"]
            by_id[parent_id]["children"].append(node)
        elif node["key"] in root_ids:
            roots.append(node)
    return roots


def get_synced_access_catalog():
    connection = get_connection()
    try:
        cursor = connection.cursor()
        tree = sync_access_catalog(cursor)
        connection.commit()
        return {"roots": tree, "synced": True}
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()
