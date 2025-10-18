"""
kapa.ai provider implementation for LLM Security Middleware
"""
import httpx
from typing import Dict, Any
from .base import BaseProvider, ProviderRequest, ProviderResponse


class KapaProvider(BaseProvider):
    """kapa.ai provider implementation"""
    
    def __init__(self, api_key: str, base_url: str = "https://api.kapa.ai"):
        super().__init__(api_key, base_url)
        self.provider_name = "kapa"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    async def query(self, request: ProviderRequest) -> ProviderResponse:
        """
        Execute a query through kapa.ai
        
        Args:
            request: Standardized request object
            
        Returns:
            Standardized response object
        """
        try:
            # Extract project_id from provider_specific data
            project_id = request.provider_specific.get("project_id") if request.provider_specific else None
            
            if not project_id:
                return ProviderResponse(
                    response="",
                    provider=self.provider_name,
                    success=False,
                    error="project_id is required for kapa.ai queries"
                )
            
            # Prepare kapa.ai API request
            url = f"{self.base_url}/query/v1/projects/{project_id}/search"
            payload = {
                "query": request.prompt,
                "user_id": request.user_id
            }
            
            # Make request to kapa.ai
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    url,
                    headers=self.headers,
                    json=payload
                )
                response.raise_for_status()
                data = response.json()
            
            # Extract response content
            if "answer" in data:
                response_text = data["answer"]
            elif "response" in data:
                response_text = data["response"]
            else:
                response_text = str(data)
            
            return ProviderResponse(
                response=response_text,
                provider=self.provider_name,
                success=True,
                metadata={
                    "project_id": project_id,
                    "kapa_response": data,
                    "source_documents": data.get("sources", []),
                    "confidence": data.get("confidence", 0.0)
                }
            )
            
        except httpx.HTTPStatusError as e:
            return ProviderResponse(
                response="",
                provider=self.provider_name,
                success=False,
                error=f"kapa.ai API error: {e.response.status_code} - {e.response.text}"
            )
        except httpx.RequestError as e:
            return ProviderResponse(
                response="",
                provider=self.provider_name,
                success=False,
                error=f"kapa.ai request error: {str(e)}"
            )
        except Exception as e:
            return ProviderResponse(
                response="",
                provider=self.provider_name,
                success=False,
                error=f"Unexpected error: {str(e)}"
            )
    
    async def authenticate(self) -> bool:
        """
        Verify API key and connection to kapa.ai
        
        Returns:
            True if authentication successful
        """
        try:
            # Try to get projects list to verify auth
            url = f"{self.base_url}/projects"
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, headers=self.headers)
                return response.status_code == 200
                
        except Exception:
            return False
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Check kapa.ai health status
        
        Returns:
            Health status information
        """
        try:
            # Check authentication
            auth_status = await self.authenticate()
            
            # Try a simple query to check full functionality
            test_url = f"{self.base_url}/health"
            
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(test_url, headers=self.headers)
                api_healthy = response.status_code == 200
            
            return {
                "provider": self.provider_name,
                "authenticated": auth_status,
                "api_healthy": api_healthy,
                "base_url": self.base_url,
                "status": "healthy" if auth_status and api_healthy else "unhealthy"
            }
            
        except Exception as e:
            return {
                "provider": self.provider_name,
                "authenticated": False,
                "api_healthy": False,
                "base_url": self.base_url,
                "status": "unhealthy",
                "error": str(e)
            }

