"""
Authentication and API key management endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional, List
from pydantic import BaseModel

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from core.auth import key_manager, verify_api_key


router = APIRouter()


class GenerateKeyRequest(BaseModel):
    """Request model for generating API keys"""
    description: str
    permissions: Optional[List[str]] = None


class GenerateKeyResponse(BaseModel):
    """Response model for generated API keys"""
    api_key: str
    description: str
    permissions: List[str]
    created_at: str
    message: str


class KeyInfo(BaseModel):
    """API key information model"""
    api_key: str  # Masked
    description: str
    created_at: str
    last_used: Optional[str]
    is_active: bool
    permissions: List[str]


@router.post("/generate-key", response_model=GenerateKeyResponse)
async def generate_api_key(request: GenerateKeyRequest):
    """
    Generate a new API key (no authentication required for this endpoint)
    
    This endpoint allows generating new API keys for accessing the middleware.
    """
    try:
        api_key = key_manager.generate_api_key(
            description=request.description,
            permissions=request.permissions or ["all"]
        )
        
        key_info = key_manager.get_key_info(api_key)
        
        return GenerateKeyResponse(
            api_key=api_key,
            description=key_info["description"],
            permissions=key_info["permissions"],
            created_at=key_info["created_at"].isoformat(),
            message="Save this key securely! It won't be shown again."
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate API key: {str(e)}"
        )


@router.get("/keys", response_model=List[KeyInfo])
async def list_api_keys(api_key: str = Depends(verify_api_key)):
    """
    List all API keys (requires valid API key)
    
    Returns a list of all API keys with their information (keys are masked).
    """
    try:
        keys = key_manager.list_keys()
        
        return [
            KeyInfo(
                api_key=key["api_key"],
                description=key["description"],
                created_at=key["created_at"].isoformat(),
                last_used=key["last_used"].isoformat() if key["last_used"] else None,
                is_active=key["is_active"],
                permissions=key["permissions"]
            )
            for key in keys
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list API keys: {str(e)}"
        )


@router.post("/keys/{key_id}/deactivate")
async def deactivate_api_key(
    key_id: str,
    api_key: str = Depends(verify_api_key)
):
    """
    Deactivate an API key (requires valid API key)
    
    Deactivates the specified API key. The key_id can be a partial match.
    """
    try:
        # Find the key by partial match
        keys = key_manager.list_keys()
        matching_keys = [
            key for key in keys 
            if key["full_key"].startswith(key_id) or key["full_key"].endswith(key_id)
        ]
        
        if not matching_keys:
            raise HTTPException(
                status_code=404,
                detail="API key not found"
            )
        
        if len(matching_keys) > 1:
            raise HTTPException(
                status_code=400,
                detail="Multiple keys match. Please provide more characters."
            )
        
        key_to_deactivate = matching_keys[0]["full_key"]
        success = key_manager.deactivate_key(key_to_deactivate)
        
        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to deactivate key"
            )
        
        return {
            "success": True,
            "message": f"API key {matching_keys[0]['api_key']} deactivated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to deactivate API key: {str(e)}"
        )


@router.get("/validate-key")
async def validate_api_key(x_api_key: Optional[str] = Header(None)):
    """
    Validate if an API key is correct (no authentication required)
    
    This endpoint can be used to check if an API key is valid without
    requiring authentication.
    """
    if not x_api_key:
        return {
            "valid": False,
            "message": "No API key provided"
        }
    
    is_valid = key_manager.validate_api_key(x_api_key)
    key_info = key_manager.get_key_info(x_api_key) if is_valid else None
    
    return {
        "valid": is_valid,
        "message": "API key is valid" if is_valid else "Invalid or inactive API key",
        "description": key_info["description"] if key_info else None,
        "permissions": key_info["permissions"] if key_info else None
    }
