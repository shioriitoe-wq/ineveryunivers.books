"""Small SMTP mail helper. Email delivery is optional until SMTP env vars are configured."""
import os
import smtplib
import logging
from email.message import EmailMessage

log = logging.getLogger(__name__)

def email_is_configured():
    return bool(os.getenv("SMTP_HOST") and os.getenv("MAIL_FROM"))

def send_email(to_email, subject, text_body):
    """Send a plain-text transactional email. Never raises into the API request."""
    host = os.getenv("SMTP_HOST", "").strip()
    sender = os.getenv("MAIL_FROM", "").strip()
    if not host or not sender or not to_email:
        log.info("Transactional email skipped: SMTP is not configured or recipient is missing.")
        return False
    try:
        port = int(os.getenv("SMTP_PORT", "587"))
        username = os.getenv("SMTP_USER", "").strip()
        password = os.getenv("SMTP_PASSWORD", "")
        use_ssl = os.getenv("SMTP_USE_SSL", "false").lower() in ("1", "true", "yes")
        use_tls = os.getenv("SMTP_USE_TLS", "true").lower() in ("1", "true", "yes")
        msg = EmailMessage()
        msg["From"] = sender
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.set_content(text_body)
        smtp_cls = smtplib.SMTP_SSL if use_ssl else smtplib.SMTP
        with smtp_cls(host, port, timeout=15) as server:
            if use_tls and not use_ssl:
                server.starttls()
            if username:
                server.login(username, password)
            server.send_message(msg)
        return True
    except Exception:
        log.exception("Transactional email delivery failed.")
        return False
