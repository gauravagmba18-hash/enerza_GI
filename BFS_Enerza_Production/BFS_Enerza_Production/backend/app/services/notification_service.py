"""
BFS Enerza — Notification Service
FCM push · SMS (Twilio/AWS SNS) · Email (SMTP/SES)
"""
import smtplib, uuid, logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from typing import Optional
import httpx
from sqlalchemy.orm import Session
from app.config import settings
from app.models import AppNotification, AppUser, AppDevice

logger = logging.getLogger(__name__)

# ─── FCM Push Notification ────────────────────────────────────────────────────

async def send_fcm_push(push_token: str, title: str, body: str, data: dict = None) -> bool:
    """
    Send FCM push notification.
    Requires FCM_SERVER_KEY in settings.
    """
    if not settings.FCM_SERVER_KEY:
        logger.info(f"[FCM MOCK] {title}: {body} → {push_token[:20]}...")
        return True

    payload = {
        "to": push_token,
        "notification": {"title": title, "body": body, "sound": "default"},
        "data": data or {},
    }
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://fcm.googleapis.com/fcm/send",
                json=payload,
                headers={"Authorization": f"key={settings.FCM_SERVER_KEY}",
                         "Content-Type": "application/json"},
                timeout=10,
            )
            resp.raise_for_status()
            result = resp.json()
            success = result.get("success", 0) > 0
            logger.info(f"FCM push {'OK' if success else 'FAIL'}: {title}")
            return success
    except Exception as e:
        logger.error(f"FCM push failed: {e}")
        return False

def send_push_notification(
    app_user_id: str,
    title: str,
    body: str,
    data: dict,
    db: Session,
    bill_id: Optional[str] = None,
    template_id: Optional[str] = None,
) -> AppNotification:
    """
    Send push to all active devices of an app user and record in DB.
    """
    user = db.query(AppUser).filter(AppUser.app_user_id == app_user_id).first()
    if not user:
        return None

    notif = AppNotification(
        notif_id    = f"NOTIF{uuid.uuid4().hex[:12].upper()}",
        app_user_id = app_user_id,
        template_id = template_id,
        bill_id     = bill_id,
        message     = body,
        channel     = "PUSH",
        read_flag   = False,
    )
    db.add(notif)

    devices = db.query(AppDevice).filter(
        AppDevice.app_user_id == app_user_id,
        AppDevice.active == True,
    ).all()

    for device in devices:
        if device.push_token:
            import asyncio
            try:
                loop = asyncio.get_event_loop()
                loop.run_until_complete(send_fcm_push(device.push_token, title, body, data))
            except RuntimeError:
                # No event loop — log and continue
                logger.info(f"[FCM SYNC MOCK] {title} → {device.device_id}")

    db.flush()
    return notif

# ─── SMS ──────────────────────────────────────────────────────────────────────

async def send_sms(mobile: str, message: str) -> bool:
    """
    Send SMS via AWS SNS or Twilio.
    Requires SMS_API_KEY in settings.
    """
    if not settings.SMS_API_KEY:
        logger.info(f"[SMS MOCK] {mobile}: {message[:60]}...")
        return True

    # AWS SNS implementation
    try:
        import boto3
        sns = boto3.client(
            "sns",
            region_name          = settings.AWS_REGION,
            aws_access_key_id    = settings.AWS_ACCESS_KEY,
            aws_secret_access_key = settings.AWS_SECRET_KEY,
        )
        sns.publish(
            PhoneNumber = mobile,
            Message     = message,
            MessageAttributes = {
                "AWS.SNS.SMS.SenderID": {"DataType": "String", "StringValue": settings.SMS_SENDER_ID},
                "AWS.SNS.SMS.SMSType":  {"DataType": "String", "StringValue": "Transactional"},
            }
        )
        logger.info(f"SMS sent to {mobile}")
        return True
    except Exception as e:
        logger.error(f"SMS failed to {mobile}: {e}")
        return False

async def send_otp_sms(mobile: str, otp: str) -> bool:
    message = (
        f"{otp} is your BFS Enerza OTP for login. "
        f"Valid for 5 minutes. Do not share this with anyone. - BFSENZ"
    )
    return await send_sms(mobile, message)

# ─── Email ────────────────────────────────────────────────────────────────────

def send_email(
    to_email: str,
    subject: str,
    html_body: str,
    pdf_attachment: Optional[bytes] = None,
    attachment_name: str = "bill.pdf",
) -> bool:
    """
    Send email with optional PDF attachment.
    Uses SMTP settings from config.
    """
    if not settings.SMTP_USER:
        logger.info(f"[EMAIL MOCK] To: {to_email} | {subject}")
        return True

    try:
        msg = MIMEMultipart("mixed")
        msg["From"]    = f"BFS Enerza <{settings.SMTP_USER}>"
        msg["To"]      = to_email
        msg["Subject"] = subject

        msg.attach(MIMEText(html_body, "html"))

        if pdf_attachment:
            part = MIMEBase("application", "octet-stream")
            part.set_payload(pdf_attachment)
            encoders.encode_base64(part)
            part.add_header(
                "Content-Disposition",
                f'attachment; filename="{attachment_name}"',
            )
            msg.attach(part)

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASS)
            server.send_message(msg)

        logger.info(f"Email sent to {to_email}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Email failed to {to_email}: {e}")
        return False

def send_bill_email(
    to_email: str,
    customer_name: str,
    bill_data: dict,
    pdf_bytes: Optional[bytes] = None,
) -> bool:
    period      = bill_data.get("billing_period", "")
    total       = bill_data.get("total_amount", 0)
    due_date    = bill_data.get("due_date", "")
    bill_id     = bill_data.get("bill_id", "")

    html = f"""
    <html><body style="font-family:Arial,sans-serif;color:#1D2D3E">
      <div style="background:#1E3A5F;padding:20px;color:white">
        <h2>BFS Enerza — Your Utility Bill</h2>
      </div>
      <div style="padding:20px">
        <p>Dear {customer_name},</p>
        <p>Your utility bill for <b>{period}</b> has been generated.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr style="background:#EAF2FF"><td style="padding:8px"><b>Bill Number</b></td><td>{bill_id}</td></tr>
          <tr><td style="padding:8px"><b>Amount Due</b></td><td><b>₹{total:,.2f}</b></td></tr>
          <tr style="background:#EAF2FF"><td style="padding:8px"><b>Due Date</b></td>
              <td><b style="color:#BB0000">{due_date}</b></td></tr>
        </table>
        <p>
          <a href="https://app.bfsenerza.in/pay/{bill_id}"
             style="background:#0070F2;color:white;padding:10px 20px;border-radius:4px;text-decoration:none">
            Pay Now
          </a>
        </p>
        <p style="font-size:12px;color:#6B7685">
          You can also pay via UPI ID <b>enerza@upi</b>, BBPS Biller ID <b>BFSENZ001</b>,
          or the BFS Enerza App. For support: 1800-123-4567 or care@bfsenerza.in
        </p>
      </div>
    </body></html>
    """
    return send_email(
        to_email        = to_email,
        subject         = f"BFS Enerza: Your bill of ₹{total:,.2f} for {period} — Due {due_date}",
        html_body       = html,
        pdf_attachment  = pdf_bytes,
        attachment_name = f"BFS_Enerza_Bill_{bill_id}.pdf",
    )

# ─── Template Renderer ────────────────────────────────────────────────────────

def render_template(body_template: str, context: dict) -> str:
    """Simple {{variable}} substitution for notification templates."""
    result = body_template
    for key, val in context.items():
        result = result.replace(f"{{{{{key}}}}}", str(val))
    return result
