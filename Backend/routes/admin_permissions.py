import os

from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer


def verify_admin_token(token):
    secret = os.getenv("ADMIN_TOKEN_SECRET") or os.getenv("SECRET_KEY")
    if not secret or not token:
        return False

    try:
        max_age = int(os.getenv("ADMIN_TOKEN_MAX_AGE", "28800"))
    except ValueError:
        max_age = 28800

    try:
        serializer = URLSafeTimedSerializer(
            secret,
            salt="ineveryunivers-admin-auth",
        )
        payload = serializer.loads(token, max_age=max_age)
    except (BadSignature, SignatureExpired, ValueError, TypeError):
        return False

    return isinstance(payload, dict) and payload.get("admin") is True
