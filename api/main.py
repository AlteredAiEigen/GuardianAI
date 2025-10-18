"""
Main FastAPI application for LLM Security Middleware
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime
import motor.motor_asyncio
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import uvicorn
import os
from dotenv import load_dotenv

from .routes import secure_query, logs, auth_routes, monitoring

# Load environment variables
load_dotenv()

# Rate limiting setup
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    try:
        # Connect to MongoDB
        mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017/llm_security")
        app.mongodb_client = motor.motor_asyncio.AsyncIOMotorClient(mongodb_url)
        app.mongodb = app.mongodb_client["llm_security_middleware"]
        
        # Test connection
        await app.mongodb.command("ping")
        print("✅ Connected to MongoDB")
        
        yield
        
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        raise
    finally:
        # Shutdown
        if hasattr(app, 'mongodb_client'):
            app.mongodb_client.close()
            print("✅ Disconnected from MongoDB")


# Create FastAPI app
app = FastAPI(
    title="LLM Security Middleware",
    description="Multi-provider LLM security middleware with input sanitization and output validation",
    version="2.0.0",
    lifespan=lifespan
)

# Add rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_routes.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(secure_query.router, prefix="/api/v1", tags=["Secure Query"])
app.include_router(logs.router, prefix="/api/v1", tags=["Logs & Analytics"])
app.include_router(monitoring.router, prefix="/api/v1", tags=["AI Output Monitoring"])


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check MongoDB connection
        await app.mongodb.command("ping")
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "database_connected": True,
            "version": "2.0.0",
            "providers": ["kapa", "vectorshift", "truffle", "parea", "confident"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Health check failed: {str(e)}"
        )


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "LLM Security Middleware API",
        "version": "2.0.0",
        "docs": "/docs",
        "health": "/health",
        "providers": {
            "supported": ["kapa", "vectorshift", "truffle", "parea", "confident"],
            "active": ["kapa", "vectorshift"]
        },
        "endpoints": {
            "secure_query": "/api/v1/query",
            "logs": "/api/v1/logs",
            "auth": "/api/v1/auth"
        }
    }


if __name__ == "__main__":
    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
