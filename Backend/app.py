from flask import Flask
from flask_cors import CORS

from routes.books import books_bp
from routes.characters import characters_bp


app = Flask(__name__)

CORS(app)

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

