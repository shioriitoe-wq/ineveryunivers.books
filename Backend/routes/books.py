from flask import Blueprint, jsonify, request
from database.database import get_connection

books_bp = Blueprint("books", __name__)


@books_bp.route("/api/books", methods=["GET"])
def get_books():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("SELECT * FROM books")
    rows = cursor.fetchall()

    connection.close()

    books = []

    for row in rows:
        books.append({
            "id": row["id"],
            "title": row["title"],
            "status": row["status"]
        })

    return jsonify(books)


@books_bp.route("/api/books", methods=["POST"])
def add_book():
    data = request.get_json()

    title = data["title"]
    status = data["status"]

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        "INSERT INTO books (title, status) VALUES (?, ?)",
        (title, status)
    )

    connection.commit()
    connection.close()

    return jsonify({"message": "Kniha byla přidána."}), 201

@books_bp.route("/api/books/<int:book_id>", methods=["DELETE"])
def delete_book(book_id):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        "DELETE FROM books WHERE id = ?",
        (book_id,)
    )

    connection.commit()
    connection.close()

    return jsonify({"message": "Kniha byla smazána."})