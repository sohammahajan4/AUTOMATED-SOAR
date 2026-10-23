from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from .. import schemas_auth, database, security, dependencies
from ..models import User

router = APIRouter()


@router.post("/token", response_model=schemas_auth.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(database.get_db),
):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not user.verify_password(form_data.password):
        # Auto-create admin if logging in with default credentials on fresh db
        if form_data.username == "admin" and form_data.password == "admin123" and not user:
            user = User(
                username="admin",
                hashed_password=security.get_password_hash("admin123"),
                is_admin=True,
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username, "admin": user.is_admin},
        expires_delta=access_token_expires,
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me")
async def get_current_user_profile(current_user: User = Depends(dependencies.get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "is_admin": current_user.is_admin,
        "is_active": current_user.is_active,
    }


@router.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(
    username: str,
    password: str,
    is_admin: bool = False,
    db: Session = Depends(database.get_db),
    admin: User = Depends(dependencies.admin_required),
):
    existing = db.query(User).filter(User.username == username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    hashed = security.get_password_hash(password)
    new_user = User(username=username, hashed_password=hashed, is_admin=is_admin)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"id": new_user.id, "username": new_user.username, "is_admin": new_user.is_admin}
