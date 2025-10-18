"""
Logging module for LLM Security Middleware
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field
from bson import ObjectId


class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, field=None):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")
        return field_schema


class LogEntry(BaseModel):
    """Log entry model for MongoDB"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    prompt: str
    response: str
    provider: str
    user_id: str
    risk_score: float
    risks_detected: List[str]
    blocked: bool = False
    validation_results: Optional[Dict[str, Any]] = None
    sanitization_results: Optional[Dict[str, Any]] = None
    provider_metadata: Optional[Dict[str, Any]] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class SecurityLogger:
    """Handles logging of security events and interactions"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["security_logs"]
    
    async def log_interaction(
        self,
        prompt: str,
        response: str,
        provider: str,
        user_id: str,
        risk_score: float,
        risks_detected: List[str],
        blocked: bool = False,
        validation_results: Optional[Dict[str, Any]] = None,
        sanitization_results: Optional[Dict[str, Any]] = None,
        provider_metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Log an interaction to MongoDB
        
        Args:
            prompt: Original user prompt
            response: LLM response (or blocked message)
            provider: Provider name (kapa, vectorshift, etc.)
            user_id: User identifier
            risk_score: Calculated risk score (0.0-1.0)
            risks_detected: List of detected risk categories
            blocked: Whether the request was blocked
            validation_results: Output validation results
            sanitization_results: Input sanitization results
            provider_metadata: Provider-specific metadata
            
        Returns:
            Log entry ID
        """
        log_entry = LogEntry(
            prompt=prompt,
            response=response,
            provider=provider,
            user_id=user_id,
            risk_score=risk_score,
            risks_detected=risks_detected,
            blocked=blocked,
            validation_results=validation_results,
            sanitization_results=sanitization_results,
            provider_metadata=provider_metadata
        )
        
        result = await self.collection.insert_one(log_entry.model_dump(by_alias=True))
        return str(result.inserted_id)
    
    async def get_logs(
        self,
        page: int = 1,
        limit: int = 10,
        provider: Optional[str] = None,
        user_id: Optional[str] = None,
        blocked_only: bool = False,
        min_risk_score: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Retrieve logs with filtering and pagination
        
        Args:
            page: Page number (1-based)
            limit: Number of logs per page
            provider: Filter by provider
            user_id: Filter by user ID
            blocked_only: Only show blocked requests
            min_risk_score: Minimum risk score filter
            
        Returns:
            Dictionary with logs and metadata
        """
        query = {}
        
        if provider:
            query["provider"] = provider
        if user_id:
            query["user_id"] = user_id
        if blocked_only:
            query["blocked"] = True
        if min_risk_score is not None:
            query["risk_score"] = {"$gte": min_risk_score}
        
        total_count = await self.collection.count_documents(query)
        
        logs_cursor = (
            self.collection.find(query)
            .sort("timestamp", -1)
            .skip((page - 1) * limit)
            .limit(limit)
        )
        
        logs = await logs_cursor.to_list(length=limit)
        
        return {
            "logs": logs,
            "total": total_count,
            "page": page,
            "limit": limit,
            "total_pages": (total_count + limit - 1) // limit
        }
    
    async def get_provider_statistics(
        self, 
        provider: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get statistics for a specific provider or all providers
        
        Args:
            provider: Specific provider to analyze
            user_id: Specific user to analyze
            
        Returns:
            Statistics dictionary
        """
        match_query = {}
        if provider:
            match_query["provider"] = provider
        if user_id:
            match_query["user_id"] = user_id
        
        pipeline = [
            {"$match": match_query},
            {"$group": {
                "_id": "$provider" if not provider else None,
                "total_queries": {"$sum": 1},
                "total_blocked": {"$sum": {"$cond": ["$blocked", 1, 0]}},
                "avg_risk_score": {"$avg": "$risk_score"},
                "max_risk_score": {"$max": "$risk_score"},
                "min_risk_score": {"$min": "$risk_score"},
                "risk_category_counts": {"$push": "$risks_detected"},
                "providers": {"$addToSet": "$provider"}
            }}
        ]
        
        stats = await self.collection.aggregate(pipeline).to_list(length=None)
        
        if stats:
            # Process risk category counts
            for stat in stats:
                all_risk_categories = [
                    item for sublist in stat.get("risk_category_counts", []) 
                    for item in sublist
                ]
                category_counts = {
                    category: all_risk_categories.count(category) 
                    for category in set(all_risk_categories)
                }
                stat["risk_category_counts"] = category_counts
            
            return {
                "statistics": stats,
                "summary": {
                    "total_providers": len(set(s.get("_id", "unknown") for s in stats)),
                    "total_queries": sum(s.get("total_queries", 0) for s in stats),
                    "total_blocked": sum(s.get("total_blocked", 0) for s in stats)
                }
            }
        
        return {
            "statistics": [],
            "summary": {
                "total_providers": 0,
                "total_queries": 0,
                "total_blocked": 0
            }
        }
    
    async def get_risk_timeline(
        self,
        provider: Optional[str] = None,
        days: int = 7
    ) -> List[Dict[str, Any]]:
        """
        Get risk score timeline for visualization
        
        Args:
            provider: Specific provider to analyze
            days: Number of days to look back
            
        Returns:
            List of daily risk statistics
        """
        from datetime import timedelta
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        match_query = {"timestamp": {"$gte": start_date}}
        if provider:
            match_query["provider"] = provider
        
        pipeline = [
            {"$match": match_query},
            {"$group": {
                "_id": {
                    "year": {"$year": "$timestamp"},
                    "month": {"$month": "$timestamp"},
                    "day": {"$dayOfMonth": "$timestamp"}
                },
                "total_queries": {"$sum": 1},
                "blocked_queries": {"$sum": {"$cond": ["$blocked", 1, 0]}},
                "avg_risk_score": {"$avg": "$risk_score"},
                "high_risk_queries": {"$sum": {"$cond": [{"$gte": ["$risk_score", 0.7]}, 1, 0]}}
            }},
            {"$sort": {"_id": 1}}
        ]
        
        return await self.collection.aggregate(pipeline).to_list(length=None)

