"""
VectorShift provider implementation for LLM Security Middleware
"""
import httpx
from typing import Dict, Any
from .base import BaseProvider, ProviderRequest, ProviderResponse


class VectorShiftProvider(BaseProvider):
    """VectorShift provider implementation"""
    
    def __init__(self, api_key: str, base_url: str = "https://api.vectorshift.ai"):
        super().__init__(api_key, base_url)
        self.provider_name = "vectorshift"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    async def query(self, request: ProviderRequest) -> ProviderResponse:
        """
        Execute a query through VectorShift
        
        Args:
            request: Standardized request object
            
        Returns:
            Standardized response object
        """
        try:
            # Extract kb_id from provider_specific data
            kb_id = request.provider_specific.get("kb_id") if request.provider_specific else None
            
            if not kb_id:
                return ProviderResponse(
                    response="",
                    provider=self.provider_name,
                    success=False,
                    error="kb_id is required for VectorShift queries"
                )
            
            # Prepare VectorShift API request
            url = f"{self.base_url}/v1/knowledge-base/{kb_id}/query"
            payload = {
                "query": request.prompt,
                "user_id": request.user_id,
                "max_results": request.provider_specific.get("max_results", 5) if request.provider_specific else 5
            }
            
            # Make request to VectorShift
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
            elif "results" in data and data["results"]:
                # If it's a list of results, combine them
                results = data["results"]
                if isinstance(results, list) and len(results) > 0:
                    response_text = "\n\n".join([
                        result.get("content", str(result)) for result in results
                    ])
                else:
                    response_text = str(data)
            else:
                response_text = str(data)
            
            return ProviderResponse(
                response=response_text,
                provider=self.provider_name,
                success=True,
                metadata={
                    "kb_id": kb_id,
                    "vectorshift_response": data,
                    "results_count": len(data.get("results", [])),
                    "sources": data.get("sources", []),
                    "confidence_scores": [r.get("score", 0.0) for r in data.get("results", [])]
                }
            )
            
        except httpx.HTTPStatusError as e:
            return ProviderResponse(
                response="",
                provider=self.provider_name,
                success=False,
                error=f"VectorShift API error: {e.response.status_code} - {e.response.text}"
            )
        except httpx.RequestError as e:
            return ProviderResponse(
                response="",
                provider=self.provider_name,
                success=False,
                error=f"VectorShift request error: {str(e)}"
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
        Verify API key and connection to VectorShift
        
        Returns:
            True if authentication successful
        """
        try:
            # Try to get knowledge bases list to verify auth
            url = f"{self.base_url}/v1/knowledge-bases"
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, headers=self.headers)
                return response.status_code == 200
                
        except Exception:
            return False
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Check VectorShift health status
        
        Returns:
            Health status information
        """
        try:
            # Check authentication
            auth_status = await self.authenticate()
            
            # Try to get account info to check full functionality
            account_url = f"{self.base_url}/v1/account"
            
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(account_url, headers=self.headers)
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

