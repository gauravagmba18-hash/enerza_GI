"""
BFS Enerza — APScheduler Billing Scheduler
Runs batch billing, overdue checks, disconnections and reconciliation on schedule.
"""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import date
import logging
from app.config import settings
from app.database import SessionLocal

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler(timezone="Asia/Kolkata")

def _get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ─── Job: Daily overdue bill update ──────────────────────────────────────────

def job_update_overdue_bills():
    """Mark GENERATED/PARTIALLY_PAID bills past due date as OVERDUE."""
    from app.models import Bill, BillStatus
    db = SessionLocal()
    try:
        today = date.today()
        updated = (
            db.query(Bill)
            .filter(
                Bill.due_date < today,
                Bill.status.in_([BillStatus.GENERATED, BillStatus.PARTIALLY_PAID]),
                Bill.balance_amount > 0,
            )
            .update({"status": BillStatus.OVERDUE}, synchronize_session=False)
        )
        db.commit()
        logger.info(f"Overdue job: {updated} bills marked OVERDUE")
    except Exception as e:
        logger.error(f"Overdue job failed: {e}")
        db.rollback()
    finally:
        db.close()

# ─── Job: Monthly batch billing ──────────────────────────────────────────────

def job_monthly_billing():
    """
    Run batch billing for the current period.
    Triggered on the 8th of each month at settings.BILLING_BATCH_HOUR.
    """
    from app.services.billing_engine import run_batch_billing
    today = date.today()
    billing_period = today.strftime("%Y-%m")
    db = SessionLocal()
    try:
        logger.info(f"Batch billing triggered for {billing_period}")
        result = run_batch_billing(
            billing_period = billing_period,
            bill_date      = today,
            db             = db,
            generated_by   = "scheduler",
        )
        logger.info(
            f"Batch billing done: {result['processed']} processed, "
            f"{result['skipped']} skipped"
        )
    except Exception as e:
        logger.error(f"Batch billing failed: {e}")
        db.rollback()
    finally:
        db.close()

# ─── Job: Disconnection check ────────────────────────────────────────────────

def job_disconnection_check():
    """Check and disconnect overdue connections daily."""
    from app.services.billing_engine import check_disconnections
    db = SessionLocal()
    try:
        disconnected = check_disconnections(db)
        if disconnected:
            db.commit()
            logger.info(f"Disconnection job: {len(disconnected)} connections suspended")
        else:
            logger.info("Disconnection job: no connections eligible for disconnection")
    except Exception as e:
        logger.error(f"Disconnection job failed: {e}")
        db.rollback()
    finally:
        db.close()

# ─── Job: Notify due bills ────────────────────────────────────────────────────

def job_due_reminders():
    """Send due reminder notifications 3 days before due date."""
    from app.models import Bill, BillStatus, AppNotification, AppAccountLink
    from app.services.notification_service import send_push_notification
    import uuid
    db = SessionLocal()
    try:
        from datetime import timedelta
        remind_date = date.today() + timedelta(days=3)
        bills = (
            db.query(Bill)
            .filter(
                Bill.due_date == remind_date,
                Bill.status.in_([BillStatus.GENERATED, BillStatus.PARTIALLY_PAID]),
            )
            .all()
        )
        for bill in bills:
            links = (
                db.query(AppAccountLink)
                .filter(AppAccountLink.account_id == bill.account_id,
                        AppAccountLink.status == "ACTIVE")
                .all()
            )
            for link in links:
                send_push_notification(
                    app_user_id = link.app_user_id,
                    title       = "Bill Due in 3 Days",
                    body        = f"Your bill of ₹{bill.total_amount:,.2f} is due on {bill.due_date}. Pay now.",
                    data        = {"bill_id": bill.bill_id, "screen": "bill_detail"},
                    db          = db,
                )
        db.commit()
        logger.info(f"Due reminders sent for {len(bills)} bills")
    except Exception as e:
        logger.error(f"Due reminder job failed: {e}")
        db.rollback()
    finally:
        db.close()

# ─── Register jobs ────────────────────────────────────────────────────────────

def start_scheduler():
    # Daily at 2am: mark overdue bills
    scheduler.add_job(
        job_update_overdue_bills,
        CronTrigger(hour=2, minute=0),
        id="update_overdue", replace_existing=True,
    )
    # 8th of each month at configured hour: batch billing
    scheduler.add_job(
        job_monthly_billing,
        CronTrigger(day=8, hour=settings.BILLING_BATCH_HOUR, minute=settings.BILLING_BATCH_MINUTE),
        id="monthly_billing", replace_existing=True,
    )
    # Daily at 3am: disconnection check
    scheduler.add_job(
        job_disconnection_check,
        CronTrigger(hour=3, minute=0),
        id="disconnection_check", replace_existing=True,
    )
    # Daily at 8am: due reminders
    scheduler.add_job(
        job_due_reminders,
        CronTrigger(hour=8, minute=0),
        id="due_reminders", replace_existing=True,
    )

    scheduler.start()
    logger.info("BFS Enerza scheduler started with 4 jobs")

def stop_scheduler():
    scheduler.shutdown(wait=False)
    logger.info("Scheduler stopped")
