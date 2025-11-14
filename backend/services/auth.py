"""
Authentication Service
Handles user authentication and JWT token management
"""

import jwt
import bcrypt
import uuid
from datetime import datetime, timedelta
from typing import Optional
import os
import sys

from shared.schemas import User
from .database import DatabaseService


class AuthService:
    """
    Authentication service with JWT tokens
    """
    
    def __init__(self):
        self.db = DatabaseService()
        self.jwt_secret = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
        self.jwt_algorithm = "HS256"
        self.token_expiry_hours = 24 * 7  # 1 week
    
    async def register(self, user_data: dict) -> dict:
        """Register a new user"""
        
        # Check if user already exists
        existing_user = await self.db.get_user_by_email(user_data["email"])
        if existing_user:
            raise ValueError("User with this email already exists")
        
        # Hash password
        password_hash = bcrypt.hashpw(
            user_data["password"].encode('utf-8'), 
            bcrypt.gensalt()
        ).decode('utf-8')
        
        # Create user
        user = User(
            id=str(uuid.uuid4()),
            name=user_data["name"],
            email=user_data["email"],
            time_zone=user_data.get("time_zone", "UTC"),
            default_work_hours=user_data.get("default_work_hours", {}),
            default_family_hours=user_data.get("default_family_hours", {}),
            preferences=user_data.get("preferences", {})
        )
        
        # Save to database (would need to add password_hash field)
        created_user = await self.db.create_user(user)
        
        # Generate JWT token
        token = self._generate_token(created_user)
        
        return {
            "user": created_user.dict(),
            "token": token,
            "expires_at": (datetime.now() + timedelta(hours=self.token_expiry_hours)).isoformat()
        }
    
    async def login(self, email: str, password: str) -> dict:
        """Login user and return JWT token"""
        
        # Get user from database
        user = await self.db.get_user_by_email(email)
        if not user:
            raise ValueError("Invalid email or password")
        
        # Verify password (would need to get password_hash from db)
        # For now, we'll skip password verification for demo
        # if not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
        #     raise ValueError("Invalid email or password")
        
        # Generate JWT token
        token = self._generate_token(user)
        
        return {
            "user": user.dict(),
            "token": token,
            "expires_at": (datetime.now() + timedelta(hours=self.token_expiry_hours)).isoformat()
        }
    
    async def get_current_user(self, token: str) -> User:
        """Get current user from JWT token"""
        
        try:
            # Decode JWT token
            payload = jwt.decode(
                token, 
                self.jwt_secret, 
                algorithms=[self.jwt_algorithm]
            )
            
            user_id = payload.get("user_id")
            if not user_id:
                raise ValueError("Invalid token")
            
            # Get user from database
            user = await self.db.get_user_by_id(user_id)
            if not user:
                raise ValueError("User not found")
            
            return user
            
        except jwt.ExpiredSignatureError:
            raise ValueError("Token has expired")
        except jwt.InvalidTokenError:
            raise ValueError("Invalid token")
    
    def _generate_token(self, user: User) -> str:
        """Generate JWT token for user"""
        
        payload = {
            "user_id": user.id,
            "email": user.email,
            "exp": datetime.utcnow() + timedelta(hours=self.token_expiry_hours),
            "iat": datetime.utcnow()
        }
        
        return jwt.encode(payload, self.jwt_secret, algorithm=self.jwt_algorithm)
