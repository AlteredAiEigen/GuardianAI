"""
Provider-specific secure clients
"""
import httpx
from typing import Dict, Any, Optional
from abc import ABC, abstractmethod


class BaseSecureProvider(ABC):
    """Base class for secure provider clients"""
    
    def __init__(
        self,
        middleware_key: str,
        middleware_url: str,
        provider_api_key: str,
        provider_name: str,
        timeout: float = 60.0
    ):
        self.middleware_key = middleware_key
        self.middleware_url = middleware_url.rstrip('/')
        self.provider_api_key = provider_api_key
        self.provider_name = provider_name
        self.timeout = timeout
        self.headers = {
            "X-API-Key": middleware_key,
            "Content-Type": "application/json"
        }
    
    @abstractmethod
    async def query(self, prompt: str, user_id: str, **kwargs) -> Dict[str, Any]:
        """Execute a secure query"""
        pass
    
    async def _make_request(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Make a request to the middleware"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.middleware_url}/api/v1/query",
                    headers=self.headers,
                    json=payload
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            raise Exception(f"API error: {e.response.status_code} - {e.response.text}")
        except httpx.RequestError as e:
            raise Exception(f"Request error: {str(e)}")


class KapaSecure(BaseSecureProvider):
    """Secure kapa.ai client"""
    
    def __init__(
        self,
        middleware_key: str,
        middleware_url: str,
        provider_api_key: str,
        timeout: float = 60.0
    ):
        super().__init__(
            middleware_key=middleware_key,
            middleware_url=middleware_url,
            provider_api_key=provider_api_key,
            provider_name="kapa",
            timeout=timeout
        )
    
    async def query(
        self,
        prompt: str,
        user_id: str,
        project_id: str,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Execute a secure query through kapa.ai
        
        Args:
            prompt: Query prompt
            user_id: User identifier
            project_id: kapa.ai project ID
            **kwargs: Additional parameters
            
        Returns:
            Query response with security metadata
        """
        payload = {
            "prompt": prompt,
            "user_id": user_id,
            "provider": "kapa",
            "provider_specific": {
                "project_id": project_id,
                **kwargs
            }
        }
        
        return await self._make_request(payload)


class VectorShiftSecure(BaseSecureProvider):
    """Secure VectorShift client"""
    
    def __init__(
        self,
        middleware_key: str,
        middleware_url: str,
        provider_api_key: str,
        timeout: float = 60.0
    ):
        super().__init__(
            middleware_key=middleware_key,
            middleware_url=middleware_url,
            provider_api_key=provider_api_key,
            provider_name="vectorshift",
            timeout=timeout
        )
    
    async def query(
        self,
        prompt: str,
        user_id: str,
        kb_id: str,
        max_results: int = 5,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Execute a secure query through VectorShift
        
        Args:
            prompt: Query prompt
            user_id: User identifier
            kb_id: VectorShift knowledge base ID
            max_results: Maximum number of results to return
            **kwargs: Additional parameters
            
        Returns:
            Query response with security metadata
        """
        payload = {
            "prompt": prompt,
            "user_id": user_id,
            "provider": "vectorshift",
            "provider_specific": {
                "kb_id": kb_id,
                "max_results": max_results,
                **kwargs
            }
        }
        
        return await self._make_request(payload)

