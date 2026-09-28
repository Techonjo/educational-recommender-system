import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.schemas.token import Token
from app.core.security import get_password_hash, verify_password, create_access_token, get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/register", response_model=Token)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    try:
        # Check if email exists
        existing_user = db.query(User).filter(User.email == user_in.email).first()
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="A user with this email already exists."
            )
        
        user_id = "USR_" + str(uuid.uuid4()).split("-")[0]
        
        new_user = User(
            user_id=user_id,
            email=user_in.email,
            name=user_in.name,
            hashed_password=get_password_hash(user_in.password)
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Generate token
        access_token = create_access_token(data={"sub": new_user.user_id})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": new_user
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Register error: %s", e)
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@router.post("/login", response_model=Token)
def login_user(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(data={"sub": user.user_id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Fetch the currently logged in user based on the JWT token."""
    return current_user
