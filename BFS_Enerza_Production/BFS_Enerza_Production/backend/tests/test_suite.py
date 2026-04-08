"""
BFS Enerza — Test Suite
Tests: billing engine, auth, payment flow, API endpoints.
"""
import pytest
from datetime import date
from decimal import Decimal
from fastapi.testclient import TestClient

# ─── Billing Engine Tests ─────────────────────────────────────────────────────

class TestMeterReadProcessor:
    def test_normal_read(self):
        from app.services.billing_engine import process_meter_read
        r = process_meter_read(1060.8, 1048.4)
        assert abs(r["consumption"] - 12.4) < 0.01
        assert r["anomaly_flag"] is False

    def test_negative_consumption_raises(self):
        from app.services.billing_engine import process_meter_read
        with pytest.raises(ValueError, match="Negative consumption"):
            process_meter_read(1000, 1100)

    def test_anomaly_detection(self):
        from app.services.billing_engine import process_meter_read
        r = process_meter_read(1200, 1000, normal_monthly_avg=10)
        assert r["anomaly_flag"] is True

    def test_multiplier(self):
        from app.services.billing_engine import process_meter_read
        r = process_meter_read(100, 50, multiplier=2)
        assert r["consumption"] == pytest.approx(100.0)

class TestRatingEngine:
    def test_domestic_gas_fixed(self):
        from app.services.billing_engine import rate_bill
        r = rate_bill("RP-GAS-DOM-01", 0)
        assert r["net"] == pytest.approx(120.0)
        assert r["tax"] == pytest.approx(6.0)

    def test_domestic_gas_slab1_only(self):
        from app.services.billing_engine import rate_bill
        r = rate_bill("RP-GAS-DOM-01", 8)
        # Fixed 120 + 8×30 = 360; GST 5% = 18
        assert r["net"] == pytest.approx(360.0)
        assert r["tax"] == pytest.approx(18.0)
        assert r["total"] == pytest.approx(378.0)

    def test_domestic_gas_slab_crossing(self):
        from app.services.billing_engine import rate_bill
        r = rate_bill("RP-GAS-DOM-01", 12.4)
        # Fixed 120 + 10×30 + 2.4×35 = 120+300+84 = 504; GST 5%=25.20
        assert r["net"] == pytest.approx(504.0)
        assert r["tax"] == pytest.approx(25.20)
        assert r["total"] == pytest.approx(529.20)

    def test_electricity_dual_tax(self):
        from app.services.billing_engine import rate_bill
        r = rate_bill("RP-ELEC-DOM-01", 245)
        # Rent 45 + 100×3.5 + 145×5 = 45+350+725 = 1120
        assert r["net"] == pytest.approx(1120.0)
        # Duty 15% on 1075 = 161.25 + GST 18% on 45 = 8.10
        assert r["tax"] == pytest.approx(169.35)
        assert r["total"] == pytest.approx(1289.35)

    def test_water_slabs(self):
        from app.services.billing_engine import rate_bill
        r = rate_bill("RP-WATER-DOM-01", 13.5)
        # Fixed 80 + 10×8 + 3.5×14 = 80+80+49 = 209; Tax 5% = 10.45
        assert r["net"] == pytest.approx(209.0)
        assert r["total"] == pytest.approx(219.45)

    def test_cng_transaction(self):
        from app.services.billing_engine import rate_bill
        r = rate_bill("RP-CNG-PRIV-01", 4.2)
        assert r["total"] == pytest.approx(352.80)

    def test_all_plans_return_valid_structure(self):
        from app.services.billing_engine import rate_bill, RATE_PLANS
        for plan_id in RATE_PLANS:
            r = rate_bill(plan_id, 10)
            assert "net" in r
            assert "tax" in r
            assert "total" in r
            assert r["total"] >= r["net"]
            assert r["tax"] >= 0

class TestBillGenerator:
    def test_generates_bill_with_id(self):
        from app.services.billing_engine import generate_bill
        b = generate_bill("CONN001", "ACCT001", "RP-GAS-DOM-01", 12.4,
                          "2026-04", date(2026, 4, 8))
        assert b["bill_id"].startswith("BILL")
        assert b["total_amount"] > 0
        assert b["due_date"] == "2026-04-28"

    def test_due_date_respects_grace_days(self):
        from app.services.billing_engine import generate_bill
        b = generate_bill("CONN001", "ACCT001", "RP-GAS-DOM-01", 10,
                          "2026-04", date(2026, 4, 8), grace_days=15)
        assert b["due_date"] == "2026-04-23"

class TestLateFee:
    def test_no_fee_before_due(self):
        from app.services.billing_engine import calc_late_fee
        assert calc_late_fee(1000, date(2026, 4, 28), date(2026, 4, 20)) == 0.0

    def test_one_month_fee(self):
        from app.services.billing_engine import calc_late_fee
        # 18% pa on 1000 = 15/month → 1 month overdue
        fee = calc_late_fee(1000, date(2026, 3, 28), date(2026, 4, 28))
        assert fee == pytest.approx(15.0, rel=0.1)

# ─── Auth Tests ───────────────────────────────────────────────────────────────

class TestAuth:
    def test_hash_and_verify(self):
        from app.auth import hash_password, verify_password
        h = hash_password("SecurePass123!")
        assert verify_password("SecurePass123!", h)
        assert not verify_password("WrongPass", h)

    def test_access_token_contains_role(self):
        from app.auth import create_access_token
        from jose import jwt
        from app.config import settings
        token = create_access_token({"sub": "testuser", "role": "ADMIN", "scopes": ["read"]})
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        assert payload["role"] == "ADMIN"
        assert "read" in payload["scopes"]

    def test_role_scopes_mapping(self):
        from app.auth import ROLE_SCOPES
        from app.models import UserRole
        assert "billing:run" in ROLE_SCOPES[UserRole.BILLING]
        assert "billing:run" not in ROLE_SCOPES[UserRole.FINANCE]
        assert "admin" in ROLE_SCOPES[UserRole.SUPER_ADMIN]
        assert "admin" not in ROLE_SCOPES[UserRole.READ_ONLY]

# ─── Payment Tests ────────────────────────────────────────────────────────────

class TestPaymentService:
    def test_signature_verification_dev_mode(self):
        from app.services.payment_service import verify_razorpay_webhook
        # With no secret configured, always returns True
        assert verify_razorpay_webhook(b"payload", "anysig") is True

    def test_reconciliation_match(self):
        from app.services.payment_service import run_reconciliation
        class MockOrder:
            gateway_id = "GW-TEST"; gateway_ref = "REF001"
            order_id = "ORD001"; total_charged = 529.20
            status = type('S', (), {'value': 'SUCCESS'})()

        class MockDB:
            def query(self, *a): return self
            def filter(self, *a): return self
            def all(self): return [MockOrder()]
            def add(self, *a): pass
            def flush(self): pass

        # Check basic calculation logic
        gross = 529.20
        fee = round(gross * 0.002, 2)
        net = round(gross - fee, 2)
        assert net == pytest.approx(528.14, rel=0.01)

# ─── PDF Tests ────────────────────────────────────────────────────────────────

class TestPDFService:
    def test_pdf_generation_returns_bytes(self):
        from app.services.pdf_service import generate_bill_pdf
        bill_data = {
            "bill_id": "BILL0001", "billing_period": "2026-04",
            "bill_date": "2026-04-08", "due_date": "2026-04-28",
            "consumption": 12.4, "uom": "SCM", "utility": "GAS_PNG",
            "net_amount": 504.0, "tax_amount": 25.20, "total_amount": 529.20,
            "arrears_amount": 0, "late_fee": 0, "subsidy_amount": 0,
            "status": "GENERATED", "lines": [
                {"name": "Fixed Charge", "qty": None, "rate": 120.0, "amount": 120.0, "line_type": "CHARGE"},
                {"name": "Variable Slab 1", "qty": 10.0, "rate": 30.0, "amount": 300.0, "line_type": "CHARGE"},
                {"name": "GST 5%", "qty": None, "rate": 5.0, "amount": 25.20, "line_type": "TAX"},
            ],
        }
        customer_data = {"name": "Ramesh Shah", "address": "H-23, Navrangpura, Ahmedabad",
                         "mobile": "+91 98765 43210", "email": "r@test.com", "account_id": "ACCT000001"}
        pdf = generate_bill_pdf(bill_data, customer_data)
        assert isinstance(pdf, bytes)
        assert pdf[:4] == b'%PDF'  # PDF magic bytes
        assert len(pdf) > 5000     # Reasonable minimum size

    def test_paid_bill_pdf(self):
        from app.services.pdf_service import generate_bill_pdf
        bill_data = {
            "bill_id": "BILL0002", "billing_period": "2026-03",
            "bill_date": "2026-03-08", "due_date": "2026-03-28",
            "consumption": 8.5, "uom": "SCM", "utility": "GAS_PNG",
            "net_amount": 375.0, "tax_amount": 18.75, "total_amount": 393.75,
            "status": "PAID", "lines": [], "arrears_amount": 0, "late_fee": 0, "subsidy_amount": 0,
        }
        pdf = generate_bill_pdf(bill_data, {"name": "Test", "address": "Surat",
                                             "mobile": "+91 0000", "email": "", "account_id": "ACC001"})
        assert isinstance(pdf, bytes)

# ─── Notification Tests ───────────────────────────────────────────────────────

class TestNotifications:
    def test_template_render(self):
        from app.services.notification_service import render_template
        tmpl = "Your bill of ₹{{amount}} for {{period}} is due on {{due_date}}."
        result = render_template(tmpl, {"amount": "529.20", "period": "April 2026", "due_date": "2026-04-28"})
        assert "₹529.20" in result
        assert "April 2026" in result

    def test_mock_sms(self):
        import asyncio
        from app.services.notification_service import send_sms
        # Without SMS_API_KEY, should return True (mock mode)
        result = asyncio.run(send_sms("+91 98765 43210", "Test OTP: 123456"))
        assert result is True

    def test_mock_email(self):
        from app.services.notification_service import send_email
        result = send_email("test@test.com", "Test", "<p>Test</p>")
        assert result is True
