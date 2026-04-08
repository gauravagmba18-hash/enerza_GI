from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.auth import authenticate_user, create_token_pair, hash_password, AdminUser
from app.models import SystemUser, UserRole
import uuid

router = APIRouter()

class UserCreate(BaseModel):
    username: str; email: str; full_name: str
    password: str; role: UserRole; department: str = ""

@router.post("/token")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form.username, form.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Incorrect username or password",
                            headers={"WWW-Authenticate": "Bearer"})
    tokens = create_token_pair(user)
    from datetime import datetime, timezone
    user.last_login = datetime.now(timezone.utc)
    db.commit()
    return tokens

@router.post("/users", dependencies=[Depends(AdminUser)])
def create_user(data: UserCreate, db: Session = Depends(get_db)):
    if db.query(SystemUser).filter(SystemUser.username == data.username).first():
        raise HTTPException(400, "Username already exists")
    user = SystemUser(
        user_id=f"USR{uuid.uuid4().hex[:8].upper()}",
        username=data.username, email=data.email,
        full_name=data.full_name, department=data.department,
        hashed_password=hash_password(data.password),
        role=data.role, is_active=True,
    )
    db.add(user); db.commit(); db.refresh(user)
    return {"user_id": user.user_id, "username": user.username, "role": user.role}

@router.get("/me")
def me(current_user: SystemUser = Depends(AdminUser)):
    return {"user_id": current_user.user_id, "username": current_user.username,
            "role": current_user.role, "email": current_user.email}
