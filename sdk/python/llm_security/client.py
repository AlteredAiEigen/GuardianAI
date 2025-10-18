"""
Main SecureClient for LLM Security SDK
"""
import httpx
from typing import Dict, Any, Optional
from .providers import KapaSecure, VectorShiftSecure


class SecureClient:
    """
    Main client for LLM Security Middleware
    
    Provides access to all supported providers through a unified interface.
    """
    
    def __init__(
        self,
        middleware_key: str,
        base_url: str = "http://localhost:8000",
        timeout: float = 60.0
    ):
        """
        Initialize the secure client
        
        Args:
            middleware_key: API key for the middleware
            base_url: Base URL of the middleware service
            timeout: Request timeout in seconds
        """
        self.middleware_key = middleware_key
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.headers = {
            "X-API-Key": middleware_key,
            "Content-Type": "application/json"
        }
    
    def kapa(self, api_key: str) -> KapaSecure:
        """
        Get a kapa.ai secure client
        
        Args:
            api_key: kapa.ai API key
            
        Returns:
            KapaSecure client instance
        """
        return KapaSecure(
            middleware_key=self.middleware_key,
            middleware_url=self.base_url,
            provider_api_key=api_key,
            timeout=self.timeout
        )
    
    def vectorshift(self, api_key: str) -> VectorShiftSecure:
        """
        Get a VectorShift secure client
        
        Args:
            api_key: VectorShift API key
            
        Returns:
            VectorShiftSecure client instance
        """
        return VectorShiftSecure(
            middleware_key=self.middleware_key,
            middleware_url=self.base_url,
            provider_api_key=api_key,
            timeout=self.timeout
        )
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Check the health of the middleware service
        
        Returns:
            Health status information
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/health",
                    headers=self.headers
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e)
            }
    
    async def get_providers_health(self) -> Dict[str, Any]:
        """
        Get health status of all providers
        
        Returns:
            Provider health information
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/api/v1/providers/health",
                    headers=self.headers
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

