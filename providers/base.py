"""
Base provider interface for LLM Security Middleware
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from pydantic import BaseModel


class ProviderRequest(BaseModel):
    """Standard request model for all providers"""
    prompt: str
    user_id: str
    provider_specific: Optional[Dict[str, Any]] = None


class ProviderResponse(BaseModel):
    """Standard response model for all providers"""
    response: str
    provider: str
    success: bool
    error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class BaseProvider(ABC):
    """Abstract base class for all LLM providers"""
    
    def __init__(self, api_key: str, base_url: str):
        self.api_key = api_key
        self.base_url = base_url
        self.provider_name = self.__class__.__name__.replace("Provider", "").lower()
    
    @abstractmethod
    async def query(self, request: ProviderRequest) -> ProviderResponse:
        """
        Execute a query through the provider
        
        Args:
            request: Standardized request object
            
        Returns:
            Standardized response object
        """
        pass
    
    @abstractmethod
    async def authenticate(self) -> bool:
        """
        Verify API key and connection to provider
        
        Returns:
            True if authentication successful
        """
        pass
    
    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """
        Check provider health status
        
        Returns:
            Health status information
        """
        pass
    
    def get_provider_name(self) -> str:
        """Get the provider name"""
        return self.provider_name

