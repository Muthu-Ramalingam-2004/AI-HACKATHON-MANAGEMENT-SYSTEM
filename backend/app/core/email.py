import urllib.request
import urllib.error
import json
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

def send_reset_password_email(email_to: str, token: str):
    # Verify required environment configuration
    if not settings.BREVO_API_KEY:
        raise ValueError(
            "Brevo HTTP Email API configuration is missing. "
            "Please set the BREVO_API_KEY environment variable on the backend."
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
    
    url = "https://api.brevo.com/v3/smtp/email"
    payload = {
        "sender": {"name": settings.EMAILS_FROM_NAME, "email": settings.EMAILS_FROM_EMAIL},
        "to": [{"email": email_to}],
        "subject": subject,
        "htmlContent": html_content
    }
    
    headers = {
        "api-key": settings.BREVO_API_KEY,
        "Content-Type": "application/json"
    }
    
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    
    try:
        logger.info(f"Attempting email delivery to {email_to} via official Brevo HTTP API...")
        with urllib.request.urlopen(req, timeout=15) as response:
            resp_code = response.getcode()
            resp_body = response.read().decode()
            logger.info(f"Successfully sent email via Brevo HTTP API (Status Code: {resp_code}). Response Payload: {resp_body}")
    except urllib.error.HTTPError as http_err:
        error_body = http_err.read().decode()
        logger.error(
            f"Brevo HTTP API request failed with HTTP status code {http_err.code}. "
            f"Details: {error_body}"
        )
        raise Exception(f"Brevo HTTP API returned status {http_err.code}: {error_body}")
    except Exception as e:
        logger.error(f"Unexpected connection or network error during Brevo HTTP API delivery: {str(e)}")
        raise e
