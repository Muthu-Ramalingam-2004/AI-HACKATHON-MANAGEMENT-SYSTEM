import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

def send_reset_password_email(email_to: str, token: str):
    # Check if SMTP configuration is missing
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
    
    # HTML template
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
    
    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
    message["To"] = email_to
    
    part_html = MIMEText(html_content, "html")
    message.attach(part_html)
    
    try:
        if settings.SMTP_TLS:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
            server.starttls()
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
            
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.EMAILS_FROM_EMAIL, email_to, message.as_string())
        server.quit()
        logger.info(f"Password reset email successfully sent to {email_to}")
    except Exception as e:
        logger.error(f"Error sending SMTP email to {email_to}: {str(e)}")
        raise e
