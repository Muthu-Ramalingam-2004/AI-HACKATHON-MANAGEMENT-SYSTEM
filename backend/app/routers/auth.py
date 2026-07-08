from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core import security, email
from app.crud import crud
from app.schemas import schemas
from app.routers.deps import get_current_user
from app.models import models

router = APIRouter()

@router.post("/register", response_model=schemas.UserResponse)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user_in.email)
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system."
        )
    return crud.create_user(db, user=user_in)

@router.post("/login", response_model=schemas.Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found"
        )
    if not security.verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password"
        )
    
    access_token = security.create_access_token(subject=user.id)
    refresh_token = security.create_refresh_token(subject=user.id)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "role": user.role,
        "name": user.name
    }

@router.post("/refresh", response_model=schemas.Token)
def refresh_token(
    refresh_req: schemas.RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    payload = security.decode_token(refresh_req.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    user_id = int(payload.get("sub"))
    user = crud.get_user_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    access_token = security.create_access_token(subject=user.id)
    new_refresh_token = security.create_refresh_token(subject=user.id)
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "role": user.role,
        "name": user.name
    }

@router.get("/me", response_model=schemas.UserResponse)
def read_user_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=schemas.UserResponse)
def update_user_me(
    user_in: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return crud.update_user_profile(db, user_id=current_user.id, updates=user_in)

@router.get("/users", response_model=List[schemas.UserResponse])
def get_all_users(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have enough permissions to access this resource"
        )
    return db.query(models.User).all()

@router.post("/forgot-password")
def forgot_password(
    forgot_in: schemas.ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    user = crud.get_user_by_email(db, email=forgot_in.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email."
        )
    
    # Generate password reset token
    token = security.create_password_reset_token(subject=user.email)
    
    # Attempt to send email
    try:
        email.send_reset_password_email(email_to=user.email, token=token)
    except ValueError as val_err:
        # SMTP configuration missing or invalid
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(val_err)
        )
    except Exception as smtp_err:
        # SMTP connection/sending failed
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email via SMTP: {str(smtp_err)}"
        )
        
    return {"message": "A password reset link has been sent to your email."}

@router.post("/reset-password")
def reset_password(
    reset_in: schemas.ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    email_address = security.verify_password_reset_token(reset_in.token)
    if not email_address:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The reset link is invalid or has expired."
        )
        
    user = crud.get_user_by_email(db, email=email_address)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email."
        )
        
    # Hash new password
    hashed_pwd = security.get_password_hash(reset_in.new_password)
    user.password = hashed_pwd
    db.commit()
    
    return {"message": "Password reset successfully. You can now login with your new password."}


