from pathlib import Path
from dotenv import load_dotenv

_BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(_BACKEND_DIR / ".env", override=False)
load_dotenv(_BACKEND_DIR.parent / ".env", override=False)

from flask import Flask
from flask_cors import CORS

from routes.books import books_bp
from routes.characters import characters_bp
from routes.aeil import aeil_bp
from routes.vespera_characters import vespera_characters_bp 
from routes.soundtrack import soundtracks_bp
from routes.videos import videos_bp
from routes.admin_auth import admin_auth_bp

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 26 * 1024 * 1024

# ADMIN_API_GUARD
import os
from flask import current_app, jsonify, request
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer


@app.before_request
def protect_admin_api_mutations():
    if not request.path.startswith("/api/"):
        return None

    if request.method in ("GET", "HEAD", "OPTIONS"):
        return None

    if request.path == "/api/admin/login":
        return None

    secret = os.getenv("ADMIN_TOKEN_SECRET") or os.getenv("SECRET_KEY")
    if not secret:
        current_app.logger.error("Chybí tajný klíč pro ověřování administračních tokenů.")
        return jsonify({"message": "Ověření administrace není nakonfigurováno."}), 503

    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return jsonify({"message": "Pro tuto akci je nutné přihlášení."}), 401

    try:
        max_age = int(os.getenv("ADMIN_TOKEN_MAX_AGE", "28800"))
        payload = URLSafeTimedSerializer(
            secret, salt="ineveryunivers-admin-auth"
        ).loads(header[7:].strip(), max_age=max_age)
    except (BadSignature, SignatureExpired, ValueError):
        return jsonify({"message": "Přihlášení vypršelo nebo není platné."}), 401

    if payload.get("admin") is not True:
        return jsonify({"message": "Nemáš oprávnění k této akci."}), 403

    return None


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
app.register_blueprint(aeil_bp)
app.register_blueprint(vespera_characters_bp)
app.register_blueprint(soundtracks_bp)
app.register_blueprint(videos_bp)
app.register_blueprint(admin_auth_bp)

@app.route("/")
def home():
    return {
        "message": "Backend běží!",
        "project": "ineveryunivers.books"
    }


if __name__ == "__main__":
    app.run(debug=True)