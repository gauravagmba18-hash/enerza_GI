"""
BFS Enerza — FastAPI Application Entry Point
"""
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging, time
from app.config import settings
from app.database import init_db
from app.services.scheduler import start_scheduler, stop_scheduler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)
logger = logging.getLogger("enerza")

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    start_scheduler()
    logger.info(f"BFS Enerza v{settings.APP_VERSION} started")
    yield
    stop_scheduler()
    logger.info("BFS Enerza shutdown complete")

app = FastAPI(
    title       = settings.APP_NAME,
    version     = settings.APP_VERSION,
    description = "Multi-utility billing platform API — Gas · Electricity · Water · CNG",
    docs_url    = "/api/docs",
    redoc_url   = "/api/redoc",
    openapi_url = "/api/openapi.json",
    lifespan    = lifespan,
)

# ─── Middleware ───────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["http://localhost:3000", "https://app.bfsenerza.in"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

@app.middleware("http")
async def add_process_time(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    elapsed = round((time.time() - start) * 1000, 1)
    response.headers["X-Process-Time-ms"] = str(elapsed)
    return response

@app.middleware("http")
async def audit_middleware(request: Request, call_next):
    response = await call_next(request)
    if request.method in ("POST", "PUT", "PATCH", "DELETE"):
        logger.info(
            f"{request.method} {request.url.path} "
            f"→ {response.status_code} "
            f"from {request.client.host if request.client else '?'}"
        )
    return response

# ─── Exception handlers ───────────────────────────────────────────────────────

@app.exception_handler(404)
async def not_found(request: Request, exc):
    return JSONResponse(status_code=404, content={"detail": "Not found", "path": str(request.url.path)})

@app.exception_handler(500)
async def server_error(request: Request, exc):
    logger.error(f"500 error on {request.url.path}: {exc}")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

# ─── Health check ─────────────────────────────────────────────────────────────

@app.get("/health", tags=["health"])
def health():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}

@app.get("/", tags=["health"])
def root():
    return {"message": f"Welcome to {settings.APP_NAME} API", "docs": "/api/docs"}

# ─── Routers ─────────────────────────────────────────────────────────────────

from app.routers import (
    auth, customers, premises, accounts, connections,
    meters, rates, billing, payments, cng,
    mobile, api_partners, reports
)

API = "/api/v1"
app.include_router(auth.router,         prefix=f"{API}/auth",        tags=["Authentication"])
app.include_router(customers.router,    prefix=f"{API}/customers",   tags=["Customers"])
app.include_router(premises.router,     prefix=f"{API}/premises",    tags=["Premises"])
app.include_router(accounts.router,     prefix=f"{API}/accounts",    tags=["Accounts"])
app.include_router(connections.router,  prefix=f"{API}/connections", tags=["Connections"])
app.include_router(meters.router,       prefix=f"{API}/meters",      tags=["Metering"])
app.include_router(rates.router,        prefix=f"{API}/rates",       tags=["Tariff & Rates"])
app.include_router(billing.router,      prefix=f"{API}/billing",     tags=["Billing"])
app.include_router(payments.router,     prefix=f"{API}/payments",    tags=["Payments"])
app.include_router(cng.router,          prefix=f"{API}/cng",         tags=["CNG"])
app.include_router(mobile.router,       prefix=f"{API}/mobile",      tags=["Mobile App"])
app.include_router(api_partners.router, prefix=f"{API}/partners",    tags=["API Partners"])
app.include_router(reports.router,      prefix=f"{API}/reports",     tags=["Reports & MIS"])
