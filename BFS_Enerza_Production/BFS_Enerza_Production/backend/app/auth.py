"""
BFS Enerza — JWT Authentication & Role-Based Access Control
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import OAuth2PasswordBearer, SecurityScopes
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.config import settings
from app.database import get_db
from app.models import SystemUser, UserRole

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/token",
    scopes={
        "read":         "Read all master data",
        "write":        "Create and update master data",
        "billing:run":  "Trigger billing runs",
        "billing:reverse": "Reverse a bill",
        "payment:post": "Post payments and refunds",
        "admin":        "Full administrative access",
    }
)

# ─── Pydantic schemas ─────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

class TokenData(BaseModel):
    username: Optional[str] = None
    scopes: list[str] = []
    user_id: Optional[str] = None
    role: Optional[str] = None

# ─── RBAC scope mapping ───────────────────────────────────────────────────────

ROLE_SCOPES = {
    UserRole.SUPER_ADMIN:  ["read","write","billing:run","billing:reverse","payment:post","admin"],
    UserRole.ADMIN:        ["read","write","billing:run","billing:reverse","payment:post"],
    UserRole.OPERATIONS:   ["read","write"],
    UserRole.BILLING:      ["read","write","billing:run","billing:reverse"],
    UserRole.FINANCE:      ["read","payment:post"],
    UserRole.IT:           ["read","write","admin"],
    UserRole.READ_ONLY:    ["read"],
}

# ─── Password utilities ───────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return pwd_ctx.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain, hashed)

# ─── Token creation ───────────────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_token_pair(user: SystemUser) -> Token:
    scopes = ROLE_SCOPES.get(user.role, ["read"])
    payload = {
        "sub": user.username,
        "user_id": user.user_id,
        "role": user.role.value,
        "scopes": scopes,
    }
    access = create_access_token(payload)
    refresh = create_refresh_token({"sub": user.username, "user_id": user.user_id})
    return Token(
        access_token=access,
        refresh_token=refresh,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

# ─── Authentication ───────────────────────────────────────────────────────────

def authenticate_user(db: Session, username: str, password: str) -> Optional[SystemUser]:
    user = db.query(SystemUser).filter(SystemUser.username == username).first()
    if not user or not verify_password(password, user.hashed_password):
        return None
    if not user.is_active:
        return None
    return user

# ─── Current user dependency ──────────────────────────────────────────────────

async def get_current_user(
    security_scopes: SecurityScopes,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> SystemUser:
    if security_scopes.scopes:
        authenticate_value = f'Bearer scope="{security_scopes.scope_str}"'
    else:
        authenticate_value = "Bearer"

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": authenticate_value},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_scopes = payload.get("scopes", [])
        token_data = TokenData(
            username=username,
            scopes=token_scopes,
            user_id=payload.get("user_id"),
            role=payload.get("role"),
        )
    except JWTError:
        raise credentials_exception

    user = db.query(SystemUser).filter(SystemUser.username == token_data.username).first()
    if user is None:
        raise credentials_exception

    for scope in security_scopes.scopes:
        if scope not in token_data.scopes:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required scope: {scope}",
                headers={"WWW-Authenticate": authenticate_value},
            )
    return user

# ─── Convenience dependencies ─────────────────────────────────────────────────

CurrentUser     = Depends(get_current_user)
ReadUser        = Security(get_current_user, scopes=["read"])
WriteUser       = Security(get_current_user, scopes=["write"])
BillingUser     = Security(get_current_user, scopes=["billing:run"])
BillingReversal = Security(get_current_user, scopes=["billing:reverse"])
PaymentUser     = Security(get_current_user, scopes=["payment:post"])
AdminUser       = Security(get_current_user, scopes=["admin"])
