import smtplib
import socket
import urllib.request
import urllib.error
import json
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

logger = logging.getLogger(__name__)

def send_via_brevo_api(email_to: str, subject: str, html_content: str) -> bool:
    """
    Sends email via Brevo transactional email HTTP API (port 443).
    Bypasses SMTP port blocking restrictions on platforms like Render.
    """
    url = "https://api.brevo.com/v3/smtp/email"
    payload = {
        "sender": {"name": settings.EMAILS_FROM_NAME, "email": settings.EMAILS_FROM_EMAIL},
        "to": [{"email": email_to}],
        "subject": subject,
        "htmlContent": html_content
    }
    
    headers = {
        "api-key": settings.SMTP_PASSWORD,  # SMTP password in Brevo corresponds to the v3 API key
        "Content-Type": "application/json"
    }
    
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    
    try:
        logger.info(f"Attempting email delivery to {email_to} via Brevo HTTP API...")
        with urllib.request.urlopen(req, timeout=10) as response:
            resp_body = response.read().decode()
            logger.info(f"Successfully sent email via Brevo HTTP API. Response: {resp_body}")
            return True
    except urllib.error.HTTPError as http_err:
        error_body = http_err.read().decode()
        logger.error(f"Brevo HTTP API request failed with code {http_err.code}. Details: {error_body}")
        raise Exception(f"Brevo API error {http_err.code}: {error_body}")
    except Exception as e:
        logger.error(f"Unexpected connection error during Brevo HTTP API delivery: {str(e)}")
        raise e

def send_via_smtp(email_to: str, subject: str, html_content: str) -> bool:
    """
    Sends email via standard SMTP client connection (port 587/25).
    """
    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
    message["To"] = email_to
    
    part_html = MIMEText(html_content, "html")
    message.attach(part_html)
    
    try:
        logger.info(f"Attempting standard SMTP connection to {settings.SMTP_HOST}:{settings.SMTP_PORT}...")
        if settings.SMTP_TLS:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
            server.starttls()
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
            
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.EMAILS_FROM_EMAIL, email_to, message.as_string())
        server.quit()
        logger.info(f"Successfully sent email via SMTP to {email_to}")
        return True
    except (socket.timeout, TimeoutError) as timeout_err:
        root_cause = (
            f"SMTP connection to {settings.SMTP_HOST}:{settings.SMTP_PORT} timed out. "
            "ROOT CAUSE: Render blocks outbound SMTP traffic (ports 25, 465, and 587) for all "
            "free and default services to prevent spam. Switch your plan or use the Brevo HTTP API."
        )
        logger.error(root_cause)
        raise Exception(root_cause)
    except smtplib.SMTPAuthenticationError as auth_err:
        root_cause = f"SMTP Authentication failed with {settings.SMTP_HOST}. Verify your SMTP credentials (SMTP_USER/SMTP_PASSWORD). Details: {str(auth_err)}"
        logger.error(root_cause)
        raise Exception(root_cause)
    except Exception as e:
        root_cause = f"Failed to send email via SMTP: {str(e)}"
        logger.error(root_cause)
        raise Exception(root_cause)

def send_reset_password_email(email_to: str, token: str):
    # Verify required environment configuration
    missing_vars = []
    if not settings.SMTP_HOST:
        missing_vars.append("SMTP_HOST")
    if not settings.SMTP_USER:
        missing_vars.append("SMTP_USER")
    if not settings.SMTP_PASSWORD:
        missing_vars.append("SMTP_PASSWORD")
    if not settings.SMTP_PORT:
        missing_vars.append("SMTP_PORT")
        
    if missing_vars:
        raise ValueError(
            f"SMTP email configuration is missing or incomplete. "
            f"Please set the following environment variables on the backend: {', '.join(missing_vars)}."
        )
        
    reset_url = f"{settings.FRONTEND_HOST}/reset-password?token={token}"
    subject = "Reset your password for AI Hackathon Management System"
    
    html_content = f"""
    <html>
        <body>
            <h2>Reset your password</h2>
            <p>You requested a password reset for your AI Hackathon Management System account.</p>
            <p>Please click the link below to reset your password. This link is valid for 15 minutes:</p>
            <p><a href="{reset_url}">{reset_url}</a></p>
            <br/>
            <p>If you did not request a password reset, please ignore this email.</p>
        </body>
    </html>
    """
    
    # Check if host is Brevo
    is_brevo = settings.SMTP_HOST and ("brevo.com" in settings.SMTP_HOST.lower() or "sendinblue" in settings.SMTP_HOST.lower())
    
    if is_brevo:
        try:
            send_via_brevo_api(email_to, subject, html_content)
            return
        except Exception as api_err:
            logger.warning(
                f"Brevo HTTP API delivery failed: {str(api_err)}. "
                "Attempting fallback to standard SMTP..."
            )
            
    # Try standard SMTP (primary/fallback)
    send_via_smtp(email_to, subject, html_content)
