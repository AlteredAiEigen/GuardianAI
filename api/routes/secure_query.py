"""
Universal secure query endpoint for all providers
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Dict, Any, Optional
from pydantic import BaseModel

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from core.sanitizer import sanitizer
from core.validator import validator
from core.logger import SecurityLogger
from core.auth import verify_api_key
from providers.base import BaseProvider
from providers.kapa import KapaProvider
from providers.vectorshift import VectorShiftProvider


router = APIRouter()


class SecureQueryRequest(BaseModel):
    """Request model for secure queries"""
    prompt: str
    user_id: str
    provider: str  # kapa, vectorshift, etc.
    provider_specific: Optional[Dict[str, Any]] = None


class SecureQueryResponse(BaseModel):
    """Response model for secure queries"""
    response: str
    provider: str
    success: bool
    blocked: bool
    risk_score: float
    risks_detected: list
    validation_results: Dict[str, Any]
    sanitization_results: Dict[str, Any]
    provider_metadata: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


def get_logger(request: Request) -> SecurityLogger:
    """Get logger instance from app state"""
    return SecurityLogger(request.app.mongodb)


def get_provider(provider_name: str, api_key: str) -> BaseProvider:
    """
    Get provider instance based on provider name
    
    Args:
        provider_name: Name of the provider (kapa, vectorshift, etc.)
        api_key: Provider API key
        
    Returns:
        Provider instance
        
    Raises:
        HTTPException: If provider not supported
    """
    if provider_name == "kapa":
        return KapaProvider(api_key=api_key)
    elif provider_name == "vectorshift":
        return VectorShiftProvider(api_key=api_key)
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported provider: {provider_name}. Supported: kapa, vectorshift"
        )


@router.post("/query", response_model=SecureQueryResponse)
async def secure_query(
    request: SecureQueryRequest,
    api_key: str = Depends(verify_api_key),
    logger: SecurityLogger = Depends(get_logger)
):
    """
    Universal secure query endpoint for all providers
    
    This endpoint provides a unified interface for secure LLM queries across
    multiple providers with built-in security checks.
    """
    try:
        # Step 1: Input sanitization
        sanitization_results = sanitizer.sanitize_input(request.prompt)
        
        # Step 2: Check if request should be blocked
        if sanitization_results["is_risky"]:
            # Log blocked attempt
            await logger.log_interaction(
                prompt=request.prompt,
                response="[BLOCKED - Security Risk Detected]",
                provider=request.provider,
                user_id=request.user_id,
                risk_score=sanitization_results["risk_score"],
                risks_detected=sanitization_results["risk_categories"],
                blocked=True,
                sanitization_results=sanitization_results
            )
            
            return SecureQueryResponse(
                response="[BLOCKED - Security Risk Detected]",
                provider=request.provider,
                success=False,
                blocked=True,
                risk_score=sanitization_results["risk_score"],
                risks_detected=sanitization_results["risk_categories"],
                validation_results={"is_safe": False, "reason": "Input blocked"},
                sanitization_results=sanitization_results
            )
        
        # Step 3: Get provider and make query
        # Note: In a real implementation, you'd get the provider API key from a secure store
        # For now, we'll use a placeholder - this should be stored securely per user/provider
        provider_api_key = "placeholder_api_key"  # TODO: Implement secure key storage
        
        provider = get_provider(request.provider, provider_api_key)
        
        # Create provider request
        provider_request = ProviderRequest(
            prompt=sanitization_results["sanitized_prompt"],
            user_id=request.user_id,
            provider_specific=request.provider_specific
        )
        
        # Execute query through provider
        provider_response = await provider.query(provider_request)
        
        if not provider_response.success:
            # Log failed query
            await logger.log_interaction(
                prompt=request.prompt,
                response=f"[ERROR - {provider_response.error}]",
                provider=request.provider,
                user_id=request.user_id,
                risk_score=0.0,
                risks_detected=["provider_error"],
                blocked=False,
                sanitization_results=sanitization_results,
                provider_metadata={"error": provider_response.error}
            )
            
            return SecureQueryResponse(
                response=f"[ERROR - {provider_response.error}]",
                provider=request.provider,
                success=False,
                blocked=False,
                risk_score=0.0,
                risks_detected=["provider_error"],
                validation_results={"is_safe": True, "reason": "Provider error"},
                sanitization_results=sanitization_results,
                error=provider_response.error
            )
        
        # Step 4: Output validation
        validation_results = validator.validate_output(provider_response.response)
        
        # Step 5: Determine final risk score
        final_risk_score = max(
            sanitization_results["risk_score"],
            validation_results["toxicity_score"]
        )
        
        # Step 6: Check if response should be blocked
        should_block = (
            not validation_results["is_safe"] or 
            final_risk_score > 0.8 or
            len(validation_results["pii_detected"]) > 0 or
            len(validation_results["code_risks"]) > 0
        )
        
        # Step 7: Log interaction
        await logger.log_interaction(
            prompt=request.prompt,
            response=provider_response.response if not should_block else "[BLOCKED - Output Validation Failed]",
            provider=request.provider,
            user_id=request.user_id,
            risk_score=final_risk_score,
            risks_detected=sanitization_results["risk_categories"] + 
                          (["output_validation_failed"] if should_block else []),
            blocked=should_block,
            validation_results=validation_results,
            sanitization_results=sanitization_results,
            provider_metadata=provider_response.metadata
        )
        
        # Step 8: Return response
        return SecureQueryResponse(
            response=provider_response.response if not should_block else "[BLOCKED - Output Validation Failed]",
            provider=request.provider,
            success=provider_response.success and not should_block,
            blocked=should_block,
            risk_score=final_risk_score,
            risks_detected=sanitization_results["risk_categories"] + 
                          (["output_validation_failed"] if should_block else []),
            validation_results=validation_results,
            sanitization_results=sanitization_results,
            provider_metadata=provider_response.metadata,
            error=provider_response.error if not should_block else "Output validation failed"
        )
        
    except Exception as e:
        # Log unexpected error
        await logger.log_interaction(
            prompt=request.prompt,
            response=f"[ERROR - {str(e)}]",
            provider=request.provider,
            user_id=request.user_id,
            risk_score=0.0,
            risks_detected=["system_error"],
            blocked=False
        )
        
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
