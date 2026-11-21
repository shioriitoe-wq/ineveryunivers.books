"""In-app notification inbox and unread indicator."""
from flask import Blueprint, jsonify, request
from database.database import get_connection
from routes.user_auth import require_user

notifications_bp = Blueprint("notifications", __name__)

def create_notification(cursor, user_id, notification_type, title, body="", target_path="/account", metadata=None):
    if not user_id:
        return
    cursor.execute(
        """INSERT INTO app_user_notifications
           (user_id, notification_type, title, body, target_path, metadata)
           VALUES (?, ?, ?, ?, ?, ?::jsonb)""",
        (user_id, notification_type, title, body[:1000], target_path[:500], __import__("json").dumps(metadata or {}, ensure_ascii=False)),
    )

@notifications_bp.get("/api/notifications/unread-count")
@require_user
def unread_count():
    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute(
            """SELECT
                 (SELECT COUNT(*) FROM app_user_notifications WHERE user_id=? AND read_at IS NULL) AS notification_count,
                 (SELECT COUNT(*) FROM app_private_messages m
                    JOIN app_private_conversations c ON c.id=m.conversation_id
                    JOIN app_private_conversation_state s ON s.conversation_id=c.id AND s.user_id=?
                   WHERE (c.user_low_id=? OR c.user_high_id=?)
                     AND m.sender_id<>? AND m.deleted_at IS NULL
                     AND (s.last_read_at IS NULL OR m.created_at>s.last_read_at)) AS message_count""",
            (request.user_id, request.user_id, request.user_id, request.user_id, request.user_id),
        )
        row = cursor.fetchone()
        notification_count = int(row["notification_count"] or 0)
        message_count = int(row["message_count"] or 0)
        return jsonify({"notification_unread_count": notification_count, "message_unread_count": message_count, "unread_count": notification_count + message_count})
    finally:
        connection.close()

@notifications_bp.get("/api/notifications")
@require_user
def list_notifications():
    try:
        limit = min(max(int(request.args.get("limit", 50)), 1), 100)
    except ValueError:
        return jsonify({"message": "Neplatný limit."}), 400
    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute("""SELECT id,notification_type,title,body,target_path,metadata,created_at,read_at
                          FROM app_user_notifications WHERE user_id=?
                          ORDER BY created_at DESC,id DESC LIMIT ?""", (request.user_id, limit))
        rows = cursor.fetchall()
        return jsonify({"notifications": [{"id":r["id"],"type":r["notification_type"],"title":r["title"],"body":r["body"],"target_path":r["target_path"],"metadata":r["metadata"] or {},"created_at":r["created_at"].isoformat(),"read_at":r["read_at"].isoformat() if r["read_at"] else None} for r in rows]})
    finally:
        connection.close()

@notifications_bp.patch("/api/notifications/<int:notification_id>/read")
@require_user
def mark_read(notification_id):
    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute("UPDATE app_user_notifications SET read_at=COALESCE(read_at,NOW()) WHERE id=? AND user_id=? RETURNING id", (notification_id, request.user_id))
        if not cursor.fetchone():
            return jsonify({"message":"Upozornění nebylo nalezeno."}),404
        connection.commit()
        return jsonify({"message":"Upozornění bylo označeno jako přečtené."})
    except Exception:
        connection.rollback(); raise
    finally:
        connection.close()

@notifications_bp.post("/api/notifications/read-all")
@require_user
def mark_all_read():
    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute("UPDATE app_user_notifications SET read_at=NOW() WHERE user_id=? AND read_at IS NULL", (request.user_id,))
        count = cursor.rowcount
        connection.commit()
        return jsonify({"message":"Upozornění byla označena jako přečtená.","updated":count})
    except Exception:
        connection.rollback(); raise
    finally:
        connection.close()
