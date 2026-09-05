from flask import Flask
from flask_cors import CORS

from routes.books import books_bp
from routes.characters import characters_bp


app = Flask(__name__)

# Povolení komunikace frontend ↔ backend
# Funguje pro localhost i Vercel.
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": "*"
        }
    },
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


app.register_blueprint(books_bp)
app.register_blueprint(characters_bp)


@app.route("/")
def home():
    return {
        "message": "Backend běží!",
        "project": "ineveryunivers.books"
    }


if __name__ == "__main__":
    app.run(debug=True)