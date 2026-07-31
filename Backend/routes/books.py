from flask import Blueprint, jsonify

books_bp = Blueprint("books", __name__)


@books_bp.route("/api/books", methods=["GET"])
def get_books():
    books = [
        {
            "id": 1,
            "title": "Raven",
            "status": "Rozpracováno"
        },
        {
            "id": 2,
            "title": "Kaelen",
            "status": "Plánováno"
        }
    ]

    return jsonify(books)