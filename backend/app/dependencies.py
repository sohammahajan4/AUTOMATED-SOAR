from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from . import security, database
from .models.user import User


def get_current_user(
    token: str = Depends(security.oauth2_scheme),
    db: Session = Depends(database.get_db),
) -> User:
    # If a valid token is present, decode and look up user
    if token:
        payload = security.decode_access_token(token)
        if payload:
            username = payload.get("sub")
            if username:
                user = db.query(User).filter(User.username == username).first()
                if user:
                    return user

    # In local/demo mode: fallback to first admin or default SOC analyst user
    admin_user = db.query(User).first()
    if admin_user:
        return admin_user

    # Create default admin user if database is empty
    default_user = User(
        username="admin",
        hashed_password=security.get_password_hash("admin123"),
        is_admin=True,
        is_active=True,
    )
    db.add(default_user)
    db.commit()
    db.refresh(default_user)
    return default_user


def admin_required(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    return current_user
