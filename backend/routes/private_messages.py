"""Member directory, public member profiles and 1:1 private messaging."""
from flask import Blueprint, jsonify, request

from database.database import get_connection
from routes.user_auth import require_user
from routes.authorization import require_permission
from routes.notifications import create_notification
from services.site_settings_service import is_feature_enabled

private_messages_bp = Blueprint("private_messages", __name__)


def _json_user(row, include_join_date=True):
    result = {
        "id": row["id"],
        "username": row["username"],
        "display_name": row["display_name"] or row["username"],
        "avatar_url": row["avatar_url"] or "",
        "bio": row.get("bio", "") or "",
        "favorite_books": row.get("favorite_books", []) or [],
        "badges": row.get("badges", []) or [],
    }
    if include_join_date:
        result["created_at"] = row["created_at"].isoformat() if row.get("created_at") else None
    return result


def _profile_visibility(cursor, target_id, viewer_id):
    cursor.execute(
        """SELECT COALESCE(p.profile_visibility, 'members') AS visibility
           FROM app_users u LEFT JOIN app_user_profiles p ON p.user_id=u.id
           WHERE u.id=? AND u.account_status='active'""",
        (target_id,),
    )
    row = cursor.fetchone()
    if not row:
        return None
    if target_id == viewer_id:
        return "own"
    if row["visibility"] == "private":
        return None
    if row["visibility"] == "members":
        cursor.execute("SELECT 1 FROM app_user_roles ur JOIN app_roles r ON r.id=ur.role_id WHERE ur.user_id=? AND r.role_key='member' LIMIT 1", (viewer_id,))
        if not cursor.fetchone():
            return None
    return row["visibility"]


@private_messages_bp.get("/api/community/members")
@require_user
def list_members():
    query = (request.args.get("q") or "").strip()[:60]
    try:
        limit = min(max(int(request.args.get("limit", 30)), 1), 60)
        offset = max(int(request.args.get("offset", 0)), 0)
    except ValueError:
        return jsonify({"message": "Neplatné stránkování."}), 400
    connection = get_connection()
    try:
        cursor = connection.cursor()
        pattern = f"%{query}%"
        cursor.execute(
            """SELECT u.id,u.username,u.display_name,u.avatar_url,u.created_at,
                      COALESCE(p.bio,'') AS bio,
                      COALESCE(p.show_join_date,TRUE) AS show_join_date,
                      COALESCE(p.profile_visibility,'members') AS visibility
               FROM app_users u LEFT JOIN app_user_profiles p ON p.user_id=u.id
               WHERE u.account_status='active'
                 AND u.id<>?
                 AND COALESCE(p.profile_visibility,'members')<>'private'
                 AND (u.username ILIKE ? OR u.display_name ILIKE ?)
               ORDER BY COALESCE(u.display_name,u.username),u.username
               LIMIT ? OFFSET ?""",
            (request.user_id, pattern, pattern, limit, offset),
        )
        members = []
        for row in cursor.fetchall():
            cursor.execute("SELECT show_join_date FROM app_user_profiles WHERE user_id=?", (row["id"],))
            setting = cursor.fetchone()
            item = {"id": row["id"], "username": row["username"], "display_name": row["display_name"] or row["username"], "avatar_url": row["avatar_url"] or "", "bio": row["bio"] or ""}
            if setting is None or setting["show_join_date"]:
                item["created_at"] = row["created_at"].isoformat() if row["created_at"] else None
            members.append(item)
        return jsonify({"members": members, "limit": limit, "offset": offset})
    finally:
        connection.close()


@private_messages_bp.get("/api/community/members/<int:target_id>")
@require_user
def get_member_profile(target_id):
    connection = get_connection()
    try:
        cursor = connection.cursor()
        visibility = _profile_visibility(cursor, target_id, request.user_id)
        if visibility is None:
            return jsonify({"message": "Profil není dostupný."}), 404
        cursor.execute(
            """SELECT u.id,u.username,u.display_name,u.avatar_url,u.created_at,
                      COALESCE(p.bio,'') AS bio, COALESCE(p.favorite_books,ARRAY[]::TEXT[]) AS favorite_books,
                      COALESCE(p.show_badges,TRUE) AS show_badges, COALESCE(p.show_join_date,TRUE) AS show_join_date
               FROM app_users u LEFT JOIN app_user_profiles p ON p.user_id=u.id
               WHERE u.id=? AND u.account_status='active'""",
            (target_id,),
        )
        row = cursor.fetchone()
        if not row:
            return jsonify({"message": "Profil nebyl nalezen."}), 404
        badges = []
        if row["show_badges"]:
            cursor.execute("""SELECT b.badge_key,b.title,b.description,b.icon,b.rarity,ub.awarded_at
                             FROM app_user_badges ub JOIN app_badges b ON b.id=ub.badge_id
                             WHERE ub.user_id=? AND b.is_active=TRUE AND b.is_hidden=FALSE
                             ORDER BY ub.awarded_at DESC""", (target_id,))
            badges = [{"badge_key": b["badge_key"], "title": b["title"], "description": b["description"], "icon": b["icon"], "rarity": b["rarity"], "awarded_at": b["awarded_at"].isoformat() if b["awarded_at"] else None} for b in cursor.fetchall()]
        result = _json_user({**row, "badges": badges}, include_join_date=bool(row["show_join_date"]) or visibility == "own")
        return jsonify({"user": result})
    finally:
        connection.close()


@private_messages_bp.put("/api/auth/profile/community")
@require_user
def update_community_profile():
    data = request.get_json(silent=True) or {}
    bio = data.get("bio", "")
    favorites = data.get("favorite_books", [])
    visibility = data.get("profile_visibility", "members")
    show_badges = data.get("show_badges", True)
    show_join_date = data.get("show_join_date", True)
    allow_messages = data.get("allow_messages_from", "members")
    if not isinstance(bio, str) or len(bio.strip()) > 1000:
        return jsonify({"message": "Popisek může mít nejvýše 1 000 znaků."}), 400
    if not isinstance(favorites, list) or len(favorites) > 20 or any(not isinstance(x, str) or len(x) > 100 for x in favorites):
        return jsonify({"message": "Oblíbené knihy nemají správný formát."}), 400
    if visibility not in ("public", "members", "private") or allow_messages not in ("everyone", "members", "none") or not isinstance(show_badges, bool) or not isinstance(show_join_date, bool):
        return jsonify({"message": "Nastavení soukromí nemá správný formát."}), 400
    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute("""INSERT INTO app_user_profiles(user_id,bio,favorite_books,profile_visibility,show_badges,show_join_date,allow_messages_from,updated_at)
                          VALUES(?,?,?,?,?,?,?,NOW())
                          ON CONFLICT(user_id) DO UPDATE SET bio=EXCLUDED.bio,favorite_books=EXCLUDED.favorite_books,
                          profile_visibility=EXCLUDED.profile_visibility,show_badges=EXCLUDED.show_badges,
                          show_join_date=EXCLUDED.show_join_date,allow_messages_from=EXCLUDED.allow_messages_from,updated_at=NOW()""",
                       (request.user_id, bio.strip(), favorites, visibility, show_badges, show_join_date, allow_messages))
        connection.commit()
        return jsonify({"message": "Komunitní profil byl uložen."})
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def _is_member(cursor, user_id):
    cursor.execute("SELECT 1 FROM app_user_roles ur JOIN app_roles r ON r.id=ur.role_id WHERE ur.user_id=? AND r.role_key='member' LIMIT 1", (user_id,))
    return cursor.fetchone() is not None


def _conversation_for_user(cursor, conversation_id, user_id):
    cursor.execute("SELECT * FROM app_private_conversations WHERE id=? AND (user_low_id=? OR user_high_id=?)", (conversation_id, user_id, user_id))
    return cursor.fetchone()


@private_messages_bp.get("/api/messages/conversations")
@require_user
def list_conversations():
    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute("""SELECT c.id,c.last_message_at,
                    CASE WHEN c.user_low_id=? THEN other.id ELSE other.id END AS other_id,
                    other.username,other.display_name,other.avatar_url,
                    (SELECT m.body FROM app_private_messages m WHERE m.conversation_id=c.id AND m.deleted_at IS NULL ORDER BY m.created_at DESC,m.id DESC LIMIT 1) AS last_message,
                    (SELECT COUNT(*) FROM app_private_messages m WHERE m.conversation_id=c.id AND m.sender_id<>? AND m.deleted_at IS NULL
                       AND (s.last_read_at IS NULL OR m.created_at>s.last_read_at)) AS unread_count
                 FROM app_private_conversations c
                 JOIN app_users other ON other.id=CASE WHEN c.user_low_id=? THEN c.user_high_id ELSE c.user_low_id END
                 LEFT JOIN app_private_conversation_state s ON s.conversation_id=c.id AND s.user_id=?
                 WHERE (c.user_low_id=? OR c.user_high_id=?) AND (s.archived_at IS NULL)
                 ORDER BY c.last_message_at DESC NULLS LAST,c.created_at DESC""",
                 (request.user_id, request.user_id, request.user_id, request.user_id, request.user_id, request.user_id))
        rows = cursor.fetchall()
        return jsonify({"conversations": [{"id": r["id"], "other_user": {"id": r["other_id"], "username": r["username"], "display_name": r["display_name"] or r["username"], "avatar_url": r["avatar_url"] or ""}, "last_message": r["last_message"] or "", "last_message_at": r["last_message_at"].isoformat() if r["last_message_at"] else None, "unread_count": int(r["unread_count"] or 0)} for r in rows]})
    finally:
        connection.close()


@private_messages_bp.post("/api/messages/conversations")
@require_user
def start_conversation():
    if not is_feature_enabled("private_messages"):
        return jsonify({"message": "Vytváření soukromých konverzací je momentálně vypnuté."}), 403
    data = request.get_json(silent=True) or {}
    try:
        recipient_id = int(data.get("recipient_id"))
    except (TypeError, ValueError):
        return jsonify({"message": "Vyber platného příjemce."}), 400
    if recipient_id == request.user_id:
        return jsonify({"message": "Nemůžeš zahájit konverzaci sám/sama se sebou."}), 400
    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT u.id,u.account_status,COALESCE(p.allow_messages_from,'members') AS allow_messages_from FROM app_users u LEFT JOIN app_user_profiles p ON p.user_id=u.id WHERE u.id=?", (recipient_id,))
        recipient = cursor.fetchone()
        if not recipient or recipient["account_status"] != "active":
            return jsonify({"message": "Tento uživatel není dostupný."}), 404
        if recipient["allow_messages_from"] == "none" or (recipient["allow_messages_from"] == "members" and not _is_member(cursor, request.user_id)):
            return jsonify({"message": "Tento uživatel nepřijímá zprávy od tvého účtu."}), 403
        cursor.execute("SELECT 1 FROM app_user_blocks WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?) LIMIT 1", (request.user_id, recipient_id, recipient_id, request.user_id))
        if cursor.fetchone():
            return jsonify({"message": "Mezi těmito účty nelze zahájit konverzaci."}), 403
        low, high = sorted((request.user_id, recipient_id))
        cursor.execute("INSERT INTO app_private_conversations(user_low_id,user_high_id) VALUES(?,?) ON CONFLICT(user_low_id,user_high_id) DO UPDATE SET updated_at=NOW() RETURNING id", (low, high))
        conversation_id = cursor.fetchone()["id"]
        cursor.execute("INSERT INTO app_private_conversation_state(conversation_id,user_id) VALUES(?,?),(?,?) ON CONFLICT DO NOTHING", (conversation_id, low, conversation_id, high))
        connection.commit()
        return jsonify({"conversation_id": conversation_id}), 201
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


@private_messages_bp.get("/api/messages/conversations/<int:conversation_id>")
@require_user
def get_conversation(conversation_id):
    try:
        limit = min(max(int(request.args.get("limit", 50)), 1), 100)
        before_id = int(request.args.get("before_id", 2**63 - 1))
    except ValueError:
        return jsonify({"message": "Neplatné stránkování."}), 400
    connection = get_connection()
    try:
        cursor = connection.cursor()
        conversation = _conversation_for_user(cursor, conversation_id, request.user_id)
        if not conversation:
            return jsonify({"message": "Konverzace nebyla nalezena."}), 404
        other_id = conversation["user_high_id"] if conversation["user_low_id"] == request.user_id else conversation["user_low_id"]
        cursor.execute("SELECT blocker_id FROM app_user_blocks WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?)", (request.user_id, other_id, other_id, request.user_id))
        if cursor.fetchone():
            return jsonify({"message": "Konverzace není dostupná."}), 403
        cursor.execute("""SELECT id,sender_id,body,created_at,edited_at FROM app_private_messages
                          WHERE conversation_id=? AND id<? AND deleted_at IS NULL
                          ORDER BY id DESC LIMIT ?""", (conversation_id, before_id, limit))
        messages = [{"id": r["id"], "sender_id": r["sender_id"], "body": r["body"], "created_at": r["created_at"].isoformat(), "edited_at": r["edited_at"].isoformat() if r["edited_at"] else None} for r in reversed(cursor.fetchall())]
        cursor.execute("UPDATE app_private_conversation_state SET last_read_at=NOW() WHERE conversation_id=? AND user_id=?", (conversation_id, request.user_id))
        connection.commit()
        return jsonify({"conversation_id": conversation_id, "other_user_id": other_id, "messages": messages, "has_more": len(messages) == limit})
    finally:
        connection.close()


@private_messages_bp.post("/api/messages/conversations/<int:conversation_id>/messages")
@require_user
def send_message(conversation_id):
    if not is_feature_enabled("private_messages"):
        return jsonify({"message": "Odesílání soukromých zpráv je momentálně vypnuté."}), 403
    data = request.get_json(silent=True) or {}
    body = data.get("body", "")
    if not isinstance(body, str) or not body.strip() or len(body.strip()) > 5000:
        return jsonify({"message": "Zpráva musí obsahovat 1 až 5 000 znaků."}), 400
    connection = get_connection()
    try:
        cursor = connection.cursor()
        conversation = _conversation_for_user(cursor, conversation_id, request.user_id)
        if not conversation:
            return jsonify({"message": "Konverzace nebyla nalezena."}), 404
        other_id = conversation["user_high_id"] if conversation["user_low_id"] == request.user_id else conversation["user_low_id"]
        cursor.execute("SELECT 1 FROM app_user_blocks WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?) LIMIT 1", (request.user_id, other_id, other_id, request.user_id))
        if cursor.fetchone():
            return jsonify({"message": "Zprávu nelze odeslat, jeden z účtů druhý zablokoval."}), 403
        cursor.execute("INSERT INTO app_private_messages(conversation_id,sender_id,body) VALUES(?,?,?) RETURNING id,created_at", (conversation_id, request.user_id, body.strip()))
        message = cursor.fetchone()
        cursor.execute("UPDATE app_private_conversations SET last_message_at=?,updated_at=NOW() WHERE id=?", (message["created_at"], conversation_id))
        cursor.execute("UPDATE app_private_conversation_state SET archived_at=NULL WHERE conversation_id=? AND user_id=?", (conversation_id, other_id))
        cursor.execute("SELECT COALESCE(display_name,username) AS display_name FROM app_users WHERE id=?", (request.user_id,))
        sender_name = cursor.fetchone()["display_name"]
        create_notification(cursor, other_id, "private_message", "Nová soukromá zpráva", f"{sender_name} ti poslal/a novou zprávu.", "/account?tab=messages", {"conversation_id": conversation_id})
        connection.commit()
        return jsonify({"message": {"id": message["id"], "sender_id": request.user_id, "body": body.strip(), "created_at": message["created_at"].isoformat()}}), 201
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


@private_messages_bp.post("/api/messages/conversations/<int:conversation_id>/archive")
@require_user
def archive_conversation(conversation_id):
    connection = get_connection()
    try:
        cursor = connection.cursor()
        if not _conversation_for_user(cursor, conversation_id, request.user_id):
            return jsonify({"message": "Konverzace nebyla nalezena."}), 404
        cursor.execute("UPDATE app_private_conversation_state SET archived_at=NOW() WHERE conversation_id=? AND user_id=?", (conversation_id, request.user_id))
        connection.commit()
        return jsonify({"message": "Konverzace byla archivována."})
    finally:
        connection.close()


@private_messages_bp.post("/api/messages/users/<int:target_id>/block")
@require_user
def block_user(target_id):
    if target_id == request.user_id:
        return jsonify({"message": "Nemůžeš zablokovat vlastní účet."}), 400
    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT id FROM app_users WHERE id=? AND account_status='active'", (target_id,))
        if not cursor.fetchone():
            return jsonify({"message": "Uživatel nebyl nalezen."}), 404
        cursor.execute("INSERT INTO app_user_blocks(blocker_id,blocked_id) VALUES(?,?) ON CONFLICT DO NOTHING", (request.user_id, target_id))
        connection.commit()
        return jsonify({"message": "Uživatel byl zablokován."})
    finally:
        connection.close()


@private_messages_bp.delete("/api/messages/users/<int:target_id>/block")
@require_user
def unblock_user(target_id):
    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute("DELETE FROM app_user_blocks WHERE blocker_id=? AND blocked_id=?", (request.user_id, target_id))
        connection.commit()
        return jsonify({"message": "Blokování bylo zrušeno."})
    finally:
        connection.close()


@private_messages_bp.post("/api/messages/<int:message_id>/report")
@require_user
def report_message(message_id):
    if not is_feature_enabled("private_message_reports"):
        return jsonify({"message": "Nahlašování soukromých zpráv je momentálně vypnuté."}), 403
    data = request.get_json(silent=True) or {}
    reason = data.get("reason")
    details = data.get("details", "")
    if reason not in ("harassment", "spam", "threat", "inappropriate", "other") or not isinstance(details, str) or len(details) > 2000:
        return jsonify({"message": "Vyber důvod a zkontroluj doplňující text."}), 400
    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute("""SELECT m.id,c.user_low_id,c.user_high_id FROM app_private_messages m
                          JOIN app_private_conversations c ON c.id=m.conversation_id
                          WHERE m.id=? AND m.sender_id<>? AND (c.user_low_id=? OR c.user_high_id=?)""", (message_id, request.user_id, request.user_id, request.user_id))
        row = cursor.fetchone()
        if not row or row["user_low_id"] == row["user_high_id"]:
            return jsonify({"message": "Zprávu nelze nahlásit."}), 404
        cursor.execute("INSERT INTO app_private_message_reports(reporter_id,message_id,reason,details) VALUES(?,?,?,?) ON CONFLICT(reporter_id,message_id) DO NOTHING RETURNING id", (request.user_id, message_id, reason, details.strip()))
        report = cursor.fetchone()
        if report:
            create_notification(cursor, request.user_id, "report_received", "Hlášení bylo přijato", "Tvoje nahlášení soukromé zprávy jsme předali moderátorům.", "/account?tab=notifications", {"report_id": report["id"]})
            cursor.execute("SELECT email, display_name, username FROM app_users WHERE id=?", (request.user_id,))
            reporter = cursor.fetchone()
        else:
            reporter = None
        connection.commit()
        if report and reporter:
            from services.email_service import send_email
            send_email(reporter["email"], "Potvrzení přijetí hlášení – ineveryunivers.books",
                       f"Ahoj {reporter['display_name'] or reporter['username']},\n\nTvoje nahlášení soukromé zprávy jsme přijali a předali moderátorům. O průběhu a výsledku tě budeme informovat.\n\nText soukromé zprávy není součástí tohoto e-mailu.\n\nTým ineveryunivers.books")
        return jsonify({"message": "Hlášení bylo předáno moderátorům.", "report_id": report["id"] if report else None}), 201
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


@private_messages_bp.get("/api/moderation/private-message-reports")
@require_permission("community.messages.moderate")
def list_message_reports():
    # Default view contains pending reports. Closed reports are available
    # separately so the moderation inbox stays focused on active cases.
    report_filter = (request.args.get("status") or "open").strip().lower()
    if report_filter == "closed":
        status_clause = "r.status IN ('resolved','rejected')"
        order_clause = "r.reviewed_at DESC NULLS LAST, r.created_at DESC"
    elif report_filter in ("open", "pending"):
        status_clause = "r.status IN ('open','reviewing')"
        order_clause = "r.created_at ASC"
    else:
        return jsonify({"message": "Neplatný filtr hlášení."}), 400

    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute(f"""SELECT r.id,r.reason,r.details,r.status,r.created_at,r.reviewed_at,
                          m.id AS message_id,m.body,m.created_at AS message_created_at,m.sender_id,
                          reporter.username AS reporter_username, sender.username AS sender_username,
                          reviewer.username AS reviewer_username
                          FROM app_private_message_reports r
                          JOIN app_private_messages m ON m.id=r.message_id
                          JOIN app_users reporter ON reporter.id=r.reporter_id
                          JOIN app_users sender ON sender.id=m.sender_id
                          LEFT JOIN app_users reviewer ON reviewer.id=r.reviewed_by
                          WHERE {status_clause} ORDER BY {order_clause} LIMIT 100""")
        reports = [{"id": r["id"], "reason": r["reason"], "details": r["details"], "status": r["status"], "created_at": r["created_at"].isoformat(), "reviewed_at": r["reviewed_at"].isoformat() if r["reviewed_at"] else None, "reviewer_username": r["reviewer_username"], "message": {"id": r["message_id"], "body": r["body"], "sender_id": r["sender_id"], "created_at": r["message_created_at"].isoformat()}, "reporter_username": r["reporter_username"], "sender_username": r["sender_username"]} for r in cursor.fetchall()]
        return jsonify({"reports": reports, "filter": report_filter})
    finally:
        connection.close()


@private_messages_bp.patch("/api/moderation/private-message-reports/<int:report_id>")
@require_permission("community.messages.moderate")
def update_message_report(report_id):
    data = request.get_json(silent=True) or {}
    status = data.get("status")
    if status not in ("reviewing", "resolved", "rejected"):
        return jsonify({"message": "Neplatný stav hlášení."}), 400
    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute("UPDATE app_private_message_reports SET status=?,reviewed_by=?,reviewed_at=NOW() WHERE id=? AND status IN ('open','reviewing') AND status<>? RETURNING id,reporter_id", (status, request.user_id, report_id, status))
        report = cursor.fetchone()
        if not report:
            return jsonify({"message": "Hlášení nebylo nalezeno nebo už bylo uzavřeno."}), 404
        if status == "reviewing":
            create_notification(cursor, report["reporter_id"], "report_reviewing", "Hlášení se řeší", "Moderátor převzal tvoje nahlášení k řešení.", "/account?tab=notifications", {"report_id": report_id})
        elif status == "resolved":
            create_notification(cursor, report["reporter_id"], "report_resolved", "Hlášení bylo vyřešeno", "Moderace dokončila řešení tvého nahlášení.", "/account?tab=notifications", {"report_id": report_id})
        elif status == "rejected":
            create_notification(cursor, report["reporter_id"], "report_rejected", "Hlášení bylo uzavřeno", "Moderace tvoje nahlášení po posouzení zamítla.", "/account?tab=notifications", {"report_id": report_id})
        cursor.execute("SELECT email, display_name, username FROM app_users WHERE id=?", (report["reporter_id"],))
        reporter = cursor.fetchone()
        connection.commit()
        if reporter and status in ("reviewing", "resolved", "rejected"):
            from services.email_service import send_email
            subjects = {"reviewing": "Tvoje hlášení se řeší – ineveryunivers.books", "resolved": "Tvoje hlášení bylo vyřešeno – ineveryunivers.books", "rejected": "Tvoje hlášení bylo uzavřeno – ineveryunivers.books"}
            messages = {"reviewing": "Moderátor převzal tvoje nahlášení k řešení.", "resolved": "Moderace dokončila řešení tvého nahlášení.", "rejected": "Moderace tvoje nahlášení po posouzení zamítla."}
            send_email(reporter["email"], subjects[status], f"Ahoj {reporter['display_name'] or reporter['username']},\n\n{messages[status]}\n\nPodrobnosti najdeš po přihlášení ve svém účtu na ineveryunivers.books.\n\nText soukromé zprávy není součástí tohoto e-mailu.\n\nTým ineveryunivers.books")
        return jsonify({"message": "Stav hlášení byl aktualizován."})
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()
