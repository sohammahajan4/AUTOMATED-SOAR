from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from ..database import Base
from ..security import verify_password, get_password_hash


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def verify_password(self, plain_password: str) -> bool:
        return verify_password(plain_password, self.hashed_password)

    @staticmethod
    def get_password_hash(password: str) -> str:
        return get_password_hash(password)
