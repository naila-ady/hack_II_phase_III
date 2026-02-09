# from fastapi import Depends, HTTPException, status
# from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
# from sqlmodel import Session, select
# from typing import Generator
# import uuid
# from database import engine
# from utils.auth import verify_token
# from models.user_model import User

# security = HTTPBearer()


# def get_session() -> Generator[Session, None, None]:
#     """Database session dependency"""
#     with Session(engine) as session:
#         yield session


# # def get_current_user(
# #     credentials: HTTPAuthorizationCredentials = Depends(security),
# #     session: Session = Depends(get_session)
# # ) -> uuid.UUID:
# #     """Extract user_id from JWT token"""
# #     token = credentials.credentials
    
# #     payload = verify_token(token)
# #     if not payload:
# #         raise HTTPException(
# #             status_code=status.HTTP_401_UNAUTHORIZED,
# #             detail="Invalid or expired token"
# #         )
    
# #     user_id = payload.get("user_id")
# #     if not user_id:
# #         raise HTTPException(
# #             status_code=status.HTTP_401_UNAUTHORIZED,
# #             detail="Invalid token payload"
# #         )
# def get_current_user(
#     credentials: HTTPAuthorizationCredentials = Depends(security),
#     session: Session = Depends(get_session)
# ) -> uuid.UUID:
#     """Extract user_id from JWT token"""
#     token = credentials.credentials
    
#     payload = verify_token(token)
#     print(f"DEBUG TOKEN: Payload: {payload}")
    
#     if not payload:
#         raise HTTPException(...)
    
#     user_id = payload.get("user_id")
#     print(f"DEBUG TOKEN: Extracted user_id: {user_id}")
    
    
    
#     # Verify user exists
#     statement = select(User).where(User.id == uuid.UUID(user_id))
#     user = session.exec(statement).first()
    
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")
    
#     return uuid.UUID(user_id)

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select
from typing import Generator
import uuid
from database import engine
from utils.auth import verify_token
from models.user_model import User

security = HTTPBearer()


def get_session() -> Generator[Session, None, None]:
    """Database session dependency"""
    with Session(engine) as session:
        yield session


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session)
) -> uuid.UUID:
    """Extract user_id from JWT token"""
    token = credentials.credentials
    
    payload = verify_token(token)
    print(f"DEBUG TOKEN: Full payload: {payload}")
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    user_id = payload.get("user_id")
    print(f"DEBUG TOKEN: Extracted user_id from payload: {user_id}")
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    # Verify user exists
    statement = select(User).where(User.id == uuid.UUID(user_id))
    user = session.exec(statement).first()
    
    print(f"DEBUG TOKEN: User found in DB: {user is not None}")
    if user:
        print(f"DEBUG TOKEN: DB User ID: {user.id}, Name: {user.name}, Email: {user.email}")
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return uuid.UUID(user_id)