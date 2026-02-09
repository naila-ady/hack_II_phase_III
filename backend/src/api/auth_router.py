from fastapi import APIRouter, HTTPException, Depends, Form, status
from sqlmodel import Session, select
from models.user_model import User, UserCreate, UserResponse, LoginRequest, TokenResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from utils.auth import verify_password, get_password_hash, create_access_token, verify_token
from database import engine

router = APIRouter()
security = HTTPBearer()

def get_session():
    with Session(engine) as session:
        yield session

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session)
) -> User:
    """Extract user from JWT token."""
    payload = verify_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    email = payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    statement = select(User).where(User.email == email)
    user = session.exec(statement).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate, session: Session = Depends(get_session)):
    """Register a new user."""
    # Check if user already exists
    statement = select(User).where(User.email == user_data.email)
    existing_user = session.exec(statement).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # Create new user
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        hashed_password=hashed_password
    )
    
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    
    # Create access token - MAKE SURE THIS USES new_user.id
    access_token = create_access_token(data={
        "sub": new_user.email, 
        "user_id": str(new_user.id)  # This must be the ID from database
    })
    
    return TokenResponse(access_token=access_token)
@router.post("/login", response_model=TokenResponse)
async def login(login_data: LoginRequest, session: Session = Depends(get_session)):
    """Login user and return access token."""
    # Find user by email
    statement = select(User).where(User.email == login_data.email)
    user = session.exec(statement).first()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create access token
    access_token = create_access_token(data={"sub": user.email, "user_id": str(user.id)})
    
    return TokenResponse(access_token=access_token)

@router.post("/verify-token", response_model=UserResponse)
async def verify_user_token(token: str = Form(...), session: Session = Depends(get_session)):
    """Verify token and return user data."""
    payload = verify_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    # Get user from database
    statement = select(User).where(User.email == email)
    user = session.exec(statement).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        created_at=user.created_at
    )