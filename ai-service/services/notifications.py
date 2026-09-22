import asyncio
import logging
import smtplib
from email.message import EmailMessage
from html import escape
from uuid import UUID

from core.config import get_settings

logger = logging.getLogger(__name__)


async def send_booking_confirmation(email: str | None, name: str, ticket_id: UUID, total_cost) -> None:
    if not email:
        return
    settings = get_settings()
    if not settings.smtp_username or not settings.smtp_password or not settings.smtp_sender_email:
        logger.info("[MOCK EMAIL] Booking confirmation for ticket %s to %s (%s), total %s",
                    ticket_id, name, email, total_cost)
        return

    def send() -> None:
        message = EmailMessage()
        message["From"] = f"{settings.smtp_sender_name} <{settings.smtp_sender_email}>"
        message["To"] = email
        message["Subject"] = f"SmartSpace Maintenance Booking Confirmation - Ticket #{str(ticket_id)[:8]}"
        message.set_content(
            f"Dear {name}, the maintenance quotation for ticket {ticket_id} was approved. Total: ${total_cost}."
        )
        message.add_alternative(
            f"<h2>SmartSpace maintenance approved</h2><p>Dear <strong>{escape(name)}</strong>,</p>"
            f"<p>Ticket <strong>{ticket_id}</strong> has been scheduled.</p>"
            f"<p>Approved total: <strong>${total_cost}</strong></p>", subtype="html",
        )
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as client:
            if settings.smtp_enable_tls:
                client.starttls()
            client.login(settings.smtp_username, settings.smtp_password)
            client.send_message(message)

    try:
        await asyncio.to_thread(send)
    except Exception:
        logger.exception("Post-commit notification failed for ticket %s; approval remains committed.", ticket_id)
