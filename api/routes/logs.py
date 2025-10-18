"""
Logs and analytics endpoints for LLM Security Middleware
"""
from fastapi import APIRouter, HTTPException, Depends, Query, Request
from typing import Optional, List
from datetime import datetime, timedelta

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from core.logger import SecurityLogger
from core.auth import verify_api_key


router = APIRouter()


def get_logger(request: Request) -> SecurityLogger:
    """Get logger instance from app state"""
    return SecurityLogger(request.app.mongodb)


@router.get("/logs")
async def get_logs(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    provider: Optional[str] = Query(None, description="Filter by provider"),
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    blocked_only: bool = Query(False, description="Show only blocked requests"),
    min_risk_score: Optional[float] = Query(None, ge=0.0, le=1.0, description="Minimum risk score"),
    api_key: str = Depends(verify_api_key),
    logger: SecurityLogger = Depends(get_logger)
):
    """
    Get security logs with filtering and pagination
    
    Returns logs from all providers with optional filtering.
    """
    try:
        logs_data = await logger.get_logs(
            page=page,
            limit=limit,
            provider=provider,
            user_id=user_id,
            blocked_only=blocked_only,
            min_risk_score=min_risk_score
        )
        
        return {
            "success": True,
            "data": logs_data,
            "filters": {
                "provider": provider,
                "user_id": user_id,
                "blocked_only": blocked_only,
                "min_risk_score": min_risk_score
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve logs: {str(e)}"
        )


@router.get("/logs/stats")
async def get_logs_stats(
    provider: Optional[str] = Query(None, description="Filter by provider"),
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    api_key: str = Depends(verify_api_key),
    logger: SecurityLogger = Depends(get_logger)
):
    """
    Get security statistics and analytics
    
    Returns aggregated statistics across all providers or filtered by provider/user.
    """
    try:
        stats_data = await logger.get_provider_statistics(
            provider=provider,
            user_id=user_id
        )
        
        return {
            "success": True,
            "data": stats_data
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve statistics: {str(e)}"
        )


@router.get("/logs/timeline")
async def get_risk_timeline(
    provider: Optional[str] = Query(None, description="Filter by provider"),
    days: int = Query(7, ge=1, le=30, description="Number of days to look back"),
    api_key: str = Depends(verify_api_key),
    logger: SecurityLogger = Depends(get_logger)
):
    """
    Get risk score timeline for visualization
    
    Returns daily risk statistics for charts and analytics.
    """
    try:
        timeline_data = await logger.get_risk_timeline(
            provider=provider,
            days=days
        )
        
        return {
            "success": True,
            "data": timeline_data,
            "period_days": days
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve timeline: {str(e)}"
        )


@router.get("/providers/health")
async def get_providers_health(
    api_key: str = Depends(verify_api_key)
):
    """
    Get health status of all providers
    
    Returns the current health status of all configured providers.
    """
    try:
        # This would check all configured providers
        # For now, return a placeholder response
        providers = ["kapa", "vectorshift"]
        health_status = {}
        
        for provider_name in providers:
            # In a real implementation, you'd check each provider's health
            health_status[provider_name] = {
                "status": "unknown",
                "last_checked": datetime.utcnow().isoformat(),
                "note": "Health check not implemented yet"
            }
        
        return {
            "success": True,
            "data": {
                "providers": health_status,
                "overall_status": "unknown"
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check provider health: {str(e)}"
        )
