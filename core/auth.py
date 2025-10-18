"""
Authentication module for LLM Security Middleware
"""
import secrets
import string
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from fastapi import HTTPException, Header


class APIKeyManager:
    """Manages API keys for the middleware"""
    
    def __init__(self):
        # In-memory storage for demo (in production, use a database)
        self.api_keys: Dict[str, Dict[str, Any]] = {
            "your_secure_api_key_here": {
                "created_at": datetime.utcnow(),
                "last_used": None,
                "is_active": True,
                "description": "Default API key",
                "permissions": ["all"]
            }
        }
    
    def generate_api_key(self, description: str = "Generated key", permissions: List[str] = None) -> str:
        """
        Generate a new API key
        
        Args:
            description: Description for the key
            permissions: List of permissions for the key
            
        Returns:
            Generated API key
        """
        if permissions is None:
            permissions = ["all"]
        
        # Generate a secure random API key
        alphabet = string.ascii_letters + string.digits
        api_key = ''.join(secrets.choice(alphabet) for _ in range(32))
        
        self.api_keys[api_key] = {
            "created_at": datetime.utcnow(),
            "last_used": None,
            "is_active": True,
            "description": description,
            "permissions": permissions
        }
        
        return api_key
    
    def validate_api_key(self, api_key: str) -> bool:
        """
        Validate an API key
        
        Args:
            api_key: API key to validate
            
        Returns:
            True if valid and active
        """
        if not api_key or api_key not in self.api_keys:
            return False
        
        key_info = self.api_keys[api_key]
        return key_info.get("is_active", False)
    
    def get_key_info(self, api_key: str) -> Optional[Dict[str, Any]]:
        """
        Get information about an API key
        
        Args:
            api_key: API key to get info for
            
        Returns:
            Key information dictionary or None
        """
        if not self.validate_api_key(api_key):
            return None
        
        key_info = self.api_keys[api_key].copy()
        key_info["api_key"] = api_key[:8] + "..." + api_key[-4:]  # Masked key
        return key_info
    
    def update_last_used(self, api_key: str):
        """Update the last used timestamp for an API key"""
        if api_key in self.api_keys:
            self.api_keys[api_key]["last_used"] = datetime.utcnow()
    
    def deactivate_key(self, api_key: str) -> bool:
        """
        Deactivate an API key
        
        Args:
            api_key: API key to deactivate
            
        Returns:
            True if successfully deactivated
        """
        if api_key in self.api_keys:
            self.api_keys[api_key]["is_active"] = False
            return True
        return False
    
    def list_keys(self) -> List[Dict[str, Any]]:
        """
        List all API keys (with masked keys)
        
        Returns:
            List of key information dictionaries
        """
        keys = []
        for api_key, info in self.api_keys.items():
            key_info = info.copy()
            key_info["api_key"] = api_key[:8] + "..." + api_key[-4:]
            key_info["full_key"] = api_key
            keys.append(key_info)
        
        return keys
    
    def check_permission(self, api_key: str, permission: str) -> bool:
        """
        Check if an API key has a specific permission
        
        Args:
            api_key: API key to check
            permission: Permission to check for
            
        Returns:
            True if key has permission
        """
        if not self.validate_api_key(api_key):
            return False
        
        key_info = self.api_keys[api_key]
        permissions = key_info.get("permissions", [])
        
        return "all" in permissions or permission in permissions


# Global instance
key_manager = APIKeyManager()


def verify_api_key(x_api_key: Optional[str] = Header(None)) -> str:
    """
    FastAPI dependency to verify API key from header
    
    Args:
        x_api_key: API key from X-API-Key header
        
    Returns:
        Validated API key
        
    Raises:
        HTTPException: If API key is invalid
    """
    if not x_api_key:
        raise HTTPException(
            status_code=401,
            detail="Missing API key. Use X-API-Key header."
        )
    
    if not key_manager.validate_api_key(x_api_key):
        raise HTTPException(
            status_code=401,
            detail="Invalid or inactive API key"
        )
    
    # Update last used timestamp
    key_manager.update_last_used(x_api_key)
    
    return x_api_key


def verify_permission(permission: str):
    """
    FastAPI dependency factory to verify specific permission
    
    Args:
        permission: Required permission
        
    Returns:
        FastAPI dependency function
    """
    def check_permission(x_api_key: str = Header(None)):
        if not x_api_key:
            raise HTTPException(
                status_code=401,
                detail="Missing API key"
            )
        
        if not key_manager.check_permission(x_api_key, permission):
            raise HTTPException(
                status_code=403,
                detail=f"Insufficient permissions. Required: {permission}"
            )
        
        return x_api_key
    
    return check_permission
