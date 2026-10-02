import random
import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.db.dependencies import get_db
from app.models.user import User
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    UserResponse,
    TokenResponse,
    VerifyEmailRequest,
    ResendVerificationRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    AuthMessageResponse,
)
from app.core.security import create_access_token
from app.core.dependencies import get_current_user
from app.core.config import (
    FRONTEND_URL,
    SMTP_HOST,
    SMTP_USER,
    SMTP_PASSWORD,
)
from app.services.email import (
    send_verification_email,
    send_password_reset_email,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

@router.get("/me", response_model=UserResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    return current_user

@router.post("/register", response_model=UserResponse)
def register_user(
    user_data: RegisterRequest,
    db: Session = Depends(get_db)
):
    existing_user = (
        db.query(User)
        .filter(User.email == user_data.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_password = pwd_context.hash(
        user_data.password
    )

    # 6-digit verification OTP
    code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password=hashed_password,
        role="user",
        is_verified=False,
        verification_code=code,
        verification_code_expires_at=expires_at,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Send verification email
    try:
        send_verification_email(new_user, code)
    except Exception as e:
        print(f"[AUTH ERROR] Failed sending verification email: {e}")

    # If SMTP is not configured in local development, attach preview_code so user is not blocked
    if not (SMTP_HOST and SMTP_USER and SMTP_PASSWORD):
        new_user.preview_code = code
        new_user.dev_hint = (
            f"[LOCAL DEV MODE] Gmail SMTP is not configured in backend/.env. "
            f"Your verification code is: {code}."
        )

    return new_user

@router.post("/login", response_model=TokenResponse)
def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.email == form_data.username)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    password_valid = pwd_context.verify(
        form_data.password,
        user.password
    )

    if not password_valid:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=403,
            detail="Email not verified. Please check your inbox for the verification code."
        )

    access_token = create_access_token(user.id)

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.post("/verify-email")
def verify_email(
    payload: VerifyEmailRequest,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.email == payload.email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if user.is_verified:
        access_token = create_access_token(user.id)
        return {
            "message": "Email is already verified.",
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "is_verified": True
            }
        }

    if not user.verification_code or user.verification_code != payload.code.strip():
        raise HTTPException(
            status_code=400,
            detail="Invalid verification code. Please check and try again."
        )

    # Check expiration
    if user.verification_code_expires_at:
        exp = user.verification_code_expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=400,
                detail="Verification code has expired. Please click resend to get a new code."
            )

    user.is_verified = True
    user.verification_code = None
    user.verification_code_expires_at = None
    db.commit()
    db.refresh(user)

    access_token = create_access_token(user.id)

    return {
        "message": "Email verified successfully!",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "is_verified": True
        }
    }


@router.post("/resend-verification", response_model=AuthMessageResponse)
def resend_verification(
    payload: ResendVerificationRequest,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.email == payload.email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found with this email"
        )

    if user.is_verified:
        return {
            "message": "Email is already verified.",
            "success": True
        }

    code = f"{random.randint(100000, 999999)}"
    user.verification_code = code
    user.verification_code_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    db.commit()

    try:
        send_verification_email(user, code)
    except Exception as e:
        print(f"[AUTH ERROR] Failed resending verification email: {e}")

    preview_code = None
    dev_hint = None
    if not (SMTP_HOST and SMTP_USER and SMTP_PASSWORD):
        preview_code = code
        dev_hint = (
            f"[LOCAL DEV MODE] Gmail SMTP is not configured in backend/.env. "
            f"Your verification code is: {code}."
        )

    return {
        "message": f"A new 6-digit verification code has been dispatched to {user.email}.",
        "success": True,
        "preview_code": preview_code,
        "dev_hint": dev_hint
    }


@router.post("/forgot-password", response_model=AuthMessageResponse)
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.email == payload.email)
        .first()
    )

    if user:
        token = secrets.token_urlsafe(32)
        user.reset_password_token = token
        user.reset_password_expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)
        db.commit()

        reset_url = f"{FRONTEND_URL}/reset-password?token={token}"
        try:
            send_password_reset_email(user, reset_url)
        except Exception:
            pass

        if not (SMTP_HOST and SMTP_USER and SMTP_PASSWORD):
            preview_url = reset_url
            dev_hint = f"[LOCAL DEV MODE] Reset URL: {reset_url}"

    return {
        "message": "If this email is registered, password reset instructions have been sent to your inbox.",
        "success": True,
        "reset_url": preview_url,
        "dev_hint": dev_hint
    }


@router.post("/reset-password", response_model=AuthMessageResponse)
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.reset_password_token == payload.token)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired password reset link."
        )

    if user.reset_password_expires_at:
        exp = user.reset_password_expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=400,
                detail="Password reset link has expired. Please request a new one."
            )

    user.password = pwd_context.hash(payload.new_password)
    user.reset_password_token = None
    user.reset_password_expires_at = None
    db.commit()

    return {
        "message": "Your password has been successfully reset. You can now log in.",
        "success": True
    }
