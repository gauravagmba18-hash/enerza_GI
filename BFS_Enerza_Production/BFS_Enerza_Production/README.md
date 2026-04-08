# BFS Enerza — Production Platform

Multi-utility billing and MDM system covering **Piped Gas (PNG) · CNG · Electricity · Water**.

---

## Quick Start (Docker)

```bash
# 1. Clone and configure
git clone https://github.com/your-org/bfs-enerza.git
cd bfs-enerza
cp .env.template .env
# Edit .env — set DB_PASSWORD, SECRET_KEY, and any live gateway credentials

# 2. Start all services
docker-compose up -d

# 3. Run DB migrations
docker-compose exec api alembic upgrade head

# 4. Seed with sample data (optional)
docker-compose exec api python scripts/seed_data.py

# 5. Access
# API docs:      http://localhost/api/docs
# MDM screens:   http://localhost
# MIS dashboard: http://localhost/mis-dashboard.html

# Default login: superadmin / Enerza@2026  (CHANGE IMMEDIATELY)
```

---

## Architecture

```
Internet → Nginx (SSL, rate limiting) → FastAPI (Uvicorn, 4 workers)
                                      → PostgreSQL 16
                                      → Redis 7 (sessions, cache)
                                      → Celery Worker (async jobs)
                                      → APScheduler (billing cron)
```

---

## Project Structure

```
BFS_Enerza_Production/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── config.py            # Settings from env
│   │   ├── database.py          # SQLAlchemy engine + session
│   │   ├── models.py            # 48-table ORM (all domains)
│   │   ├── auth.py              # JWT + RBAC (7 roles, 6 scopes)
│   │   ├── routers/
│   │   │   ├── auth.py          # POST /token, user management
│   │   │   ├── customers.py     # Customer CRUD + activate/block
│   │   │   ├── billing.py       # Batch run, manual bill, reversal, PDF
│   │   │   ├── payments.py      # Orders, callbacks, refunds
│   │   │   ├── reports.py       # MIS: dashboard, revenue, aging
│   │   │   └── _stubs.py        # Premises, accounts, meters, CNG, mobile, partners
│   │   └── services/
│   │       ├── billing_engine.py   # Rating, arrears, late fees, reversal, batch
│   │       ├── payment_service.py  # Gateway dispatch, callback, reconciliation
│   │       ├── pdf_service.py      # ReportLab PDF bill generator
│   │       ├── scheduler.py        # APScheduler — 4 cron jobs
│   │       ├── notification_service.py  # FCM, SMS, Email
│   │       └── compliance.py       # Aadhaar KYC, GSTN, DPDPA, PNGRB, PII masking
│   ├── tests/
│   │   └── test_suite.py        # 25+ pytest tests
│   ├── alembic/                 # DB migrations
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   └── mis-dashboard.html       # Chart.js MIS analytics dashboard
├── nginx/
│   └── nginx.conf               # SSL, rate limiting, proxy
├── .github/workflows/
│   └── ci-cd.yml                # GitHub Actions: test → build → staging → prod
├── docker-compose.yml
└── .env.template
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/token` | Login, get JWT |
| GET  | `/api/v1/customers` | List + search customers |
| POST | `/api/v1/customers` | Create customer |
| POST | `/api/v1/customers/{id}/activate` | Activate after KYC |
| GET  | `/api/v1/billing` | List bills with filters |
| GET  | `/api/v1/billing/{id}/pdf` | Download bill PDF |
| POST | `/api/v1/billing/batch-run` | Trigger batch billing |
| POST | `/api/v1/billing/{id}/reverse` | Reverse a bill |
| POST | `/api/v1/payments/orders` | Create payment order |
| POST | `/api/v1/payments/callback` | Gateway webhook |
| POST | `/api/v1/payments/refunds` | Initiate refund |
| GET  | `/api/v1/reports/dashboard-summary` | KPI summary |
| GET  | `/api/v1/reports/revenue-by-month` | Revenue trend |
| GET  | `/api/v1/reports/collection-efficiency` | Collection % |
| GET  | `/api/v1/reports/arrears-aging` | Aging buckets |
| GET  | `/api/v1/connections/{id}/disconnect` | Suspend connection |
| POST | `/api/v1/connections/{id}/reconnect` | Reconnect after payment |

Full Swagger UI at `/api/docs`.

---

## Roles & Permissions

| Role | Scopes |
|------|--------|
| SUPER_ADMIN | All |
| ADMIN | read, write, billing:run, billing:reverse, payment:post |
| OPERATIONS | read, write |
| BILLING | read, write, billing:run, billing:reverse |
| FINANCE | read, payment:post |
| IT | read, write, admin |
| READ_ONLY | read |

---

## Integrations — What Needs Live Credentials

| Integration | Where to register | Config key |
|-------------|-------------------|------------|
| Razorpay (card/UPI) | dashboard.razorpay.com | `RAZORPAY_KEY_ID/SECRET` |
| BBPS (NPCI) | npci.org.in — biller onboarding | `BBPS_AGENT_ID/API_KEY` |
| FCM (push) | console.firebase.google.com | `FCM_SERVER_KEY` |
| AWS SNS (SMS) | console.aws.amazon.com/sns | `AWS_ACCESS_KEY/SECRET` |
| Aadhaar e-KYC | uidai.gov.in — AUA application | `UIDAI_AUA_CODE/LICENSE_KEY` |
| GSTN filing | developer.gst.gov.in | `GSTN_API_KEY` |
| SMTP (email bills) | Any SMTP provider | `SMTP_USER/PASS` |
| S3 (PDF storage) | AWS S3 | `S3_BUCKET` + AWS keys |

All integration code is written and deployed — only credentials need to be filled in `.env`.

---

## Running Tests

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v --tb=short
# Expected: 25+ tests, all passing
```

---

## Scheduled Jobs

| Job | Schedule | What it does |
|-----|----------|-------------|
| update_overdue_bills | Daily 2am IST | Mark past-due bills as OVERDUE |
| monthly_billing | 8th of month 6am IST | Batch generate bills for all connections |
| disconnection_check | Daily 3am IST | Suspend connections overdue > 60 days |
| due_reminders | Daily 8am IST | Send push/SMS 3 days before due date |

---

## What Remains for Full Production

1. **Fill `.env`** with live gateway + KYC + notification credentials
2. **Build mobile app** (React Native or Flutter) using the wireframes + MDM config
3. **Register as BBPS biller** at NPCI (takes 4–6 weeks for approval)
4. **Apply for UIDAI AUA code** for live Aadhaar e-KYC
5. **SSL certificate** — add to `nginx/ssl/` (Let's Encrypt or commercial)
6. **Field meter reader app** — use `FieldReaderAPI` service as the backend
7. **PNGRB registration** and monthly report submission using `PNGRBReports`
8. **DPDPA consent flows** on all customer-facing screens
9. **CloudWatch/Datadog** monitoring using the structured log output
10. **Load testing** before first billing batch (9,500+ bills in ~10 min target)
