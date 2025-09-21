"""
CementOS - Cement Plant Optimization System
Main API Entry Point for Cloud Run Deployment

This is the primary entry point that orchestrates all cement optimization agents
and provides REST API endpoints for the chat interface.
"""

import asyncio
import json
import logging
import os
from datetime import datetime
from typing import Dict, List, Optional, Any

import uvicorn
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# Import our agents
from orchestrator import OrchestratorAgent

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Pydantic models for API requests/responses
class ChatRequest(BaseModel):
    message: str = Field(..., description="User's query about cement production optimization")
    session_id: Optional[str] = Field(default="default", description="Session identifier for conversation context")
    user_id: Optional[str] = Field(default=None, description="User identifier")

class ChatResponse(BaseModel):
    success: bool
    response: str
    session_id: str
    timestamp: str
    processing_time_ms: Optional[float] = None
    intent: Optional[str] = None
    confidence: Optional[float] = None

class OptimizationRequest(BaseModel):
    plant_capacity: float = Field(default=3000, description="Plant capacity in TPD")
    objective: str = Field(default="balanced", description="Optimization objective: cost, emissions, balanced, pareto")
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Quality constraints")
    user_query: Optional[str] = Field(default=None, description="Natural language query context")

class SystemStatus(BaseModel):
    status: str
    uptime_seconds: int
    active_sessions: int
    total_queries_processed: int
    agents_status: Dict[str, Any]
    timestamp: str

# Initialize FastAPI app
app = FastAPI(
    title="CementOS - Cement Plant Optimization System",
    description="AI-powered cement production optimization with multi-agent architecture",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware for web interface integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
orchestrator_agent = None
app_start_time = datetime.now()
query_counter = 0
active_sessions = set()

@app.on_event("startup")
async def startup_event():
    """Initialize the application and agents on startup"""
    global orchestrator_agent
    
    logger.info("🚀 Starting CementOS - Cement Plant Optimization System")
    
    try:
        # Initialize the orchestrator agent
        orchestrator_agent = OrchestratorAgent()
        logger.info("✅ Orchestrator Agent initialized successfully")
        
        # Test agent connectivity
        test_response = await orchestrator_agent.process_query(
            "System health check", 
            session_id="startup_test"
        )
        logger.info("✅ Agent connectivity test passed")
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize agents: {str(e)}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on application shutdown"""
    logger.info("🛑 Shutting down CementOS")

# Health check endpoint for Cloud Run
@app.get("/health")
async def health_check():
    """Health check endpoint for load balancers and Cloud Run"""
    uptime = (datetime.now() - app_start_time).total_seconds()
    
    return {
        "status": "healthy",
        "service": "CementOS",
        "uptime_seconds": int(uptime),
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

# Main chat endpoint
@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Main chat endpoint for processing user queries about cement optimization
    
    This endpoint handles natural language queries and returns AI-powered responses
    with optimization recommendations, technical insights, and actionable advice.
    """
    global query_counter
    start_time = datetime.now()
    
    try:
        query_counter += 1
        active_sessions.add(request.session_id)
        
        logger.info(f"Processing chat request: {request.message[:100]}...")
        
        # Process the query through the orchestrator
        response = await orchestrator_agent.process_query(
            request.message, 
            session_id=request.session_id
        )
        
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        logger.info(f"Query processed successfully in {processing_time:.2f}ms")
        
        return ChatResponse(
            success=True,
            response=response,
            session_id=request.session_id,
            timestamp=datetime.now().isoformat(),
            processing_time_ms=processing_time
        )
        
    except Exception as e:
        logger.error(f"Error processing chat request: {str(e)}")
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return ChatResponse(
            success=False,
            response=f"I apologize, but I encountered an error processing your request: {str(e)}. Please try again or rephrase your question.",
            session_id=request.session_id,
            timestamp=datetime.now().isoformat(),
            processing_time_ms=processing_time
        )

# Direct optimization endpoint
@app.post("/optimize")
async def optimize_endpoint(request: OptimizationRequest):
    """
    Direct optimization endpoint for programmatic access
    
    This endpoint provides direct access to optimization functions without
    natural language processing, suitable for API integrations.
    """
    try:
        logger.info(f"Processing optimization request: {request.objective} for {request.plant_capacity} TPD")
        
        # Construct query for orchestrator
        if request.user_query:
            query = request.user_query
        else:
            query = f"Optimize my {request.plant_capacity} TPD cement plant for {request.objective} objective"
            if request.constraints:
                constraint_desc = ", ".join([f"{k}: {v}" for k, v in request.constraints.items()])
                query += f" with constraints: {constraint_desc}"
        
        # Process through orchestrator
        response = await orchestrator_agent.process_query(query, session_id="api_direct")
        
        return {
            "success": True,
            "optimization_result": response,
            "request_parameters": request.dict(),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in optimization endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# System status endpoint
@app.get("/status", response_model=SystemStatus)
async def system_status():
    """Get comprehensive system status including all agents"""
    uptime = (datetime.now() - app_start_time).total_seconds()
    
    # Collect agent statuses
    agents_status = {}
    
    try:
        # Test orchestrator health
        test_response = await orchestrator_agent.process_query("health check", session_id="status_check")
        agents_status["orchestrator"] = {
            "status": "healthy",
            "last_response_length": len(test_response),
            "session_context_size": len(orchestrator_agent.session_context)
        }
    except Exception as e:
        agents_status["orchestrator"] = {
            "status": "error",
            "error": str(e)
        }
    
    # Check TSR service health
    try:
        import requests
        tsr_response = requests.get("http://localhost:8001/health", timeout=2)
        agents_status["tsr"] = {
            "status": "healthy" if tsr_response.status_code == 200 else "unhealthy",
            "endpoint": "http://localhost:8001"
        }
    except Exception as e:
        agents_status["tsr"] = {
            "status": "offline",
            "error": str(e)
        }
    
    # Check Quality service health
    try:
        import requests
        quality_response = requests.get("http://localhost:8003/health", timeout=2)
        agents_status["quality"] = {
            "status": "healthy" if quality_response.status_code == 200 else "unhealthy",
            "endpoint": "http://localhost:8003"
        }
    except Exception as e:
        agents_status["quality"] = {
            "status": "offline",
            "error": str(e)
        }
    
    # Check Clinker service health
    try:
        import requests
        clinker_response = requests.get("http://localhost:8002/health", timeout=2)
        agents_status["clinker"] = {
            "status": "healthy" if clinker_response.status_code == 200 else "unhealthy",
            "endpoint": "http://localhost:8002"
        }
    except Exception as e:
        agents_status["clinker"] = {
            "status": "offline",
            "error": str(e)
        }
    
    return SystemStatus(
        status="running",
        uptime_seconds=int(uptime),
        active_sessions=len(active_sessions),
        total_queries_processed=query_counter,
        agents_status=agents_status,
        timestamp=datetime.now().isoformat()
    )

# Session management endpoints
@app.get("/sessions")
async def list_sessions():
    """List all active sessions"""
    return {
        "active_sessions": list(active_sessions),
        "session_count": len(active_sessions),
        "timestamp": datetime.now().isoformat()
    }

@app.delete("/sessions/{session_id}")
async def clear_session(session_id: str):
    """Clear a specific session's conversation history"""
    try:
        if session_id in orchestrator_agent.session_context:
            del orchestrator_agent.session_context[session_id]
            active_sessions.discard(session_id)
            
        return {
            "success": True,
            "message": f"Session {session_id} cleared successfully",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Utility endpoints
@app.get("/capabilities")
async def get_capabilities():
    """Get system capabilities and available features"""
    return {
        "capabilities": {
            "optimization": {
                "objectives": ["cost", "emissions", "balanced", "pareto"],
                "constraints": ["LSF", "SM", "AM", "quality_targets"],
                "plant_capacity_range": "1000-10000 TPD"
            },
            "quality_control": {
                "thermal_imaging": "ResNet50-based classification",
                "f_cao_prediction": "XGBoost regression",
                "abnormal_condition_detection": "Real-time alerts"
            },
            "clinker_optimization": {
                "phase_prediction": "C3S, C2S, C3A, C4AF",
                "energy_efficiency": "Real-time optimization",
                "control_decisions": "Automated adjustments"
            },
            "fuel_optimization": {
                "alternative_fuels": ["biomass", "tdf", "wdf", "petcoke", "coal"],
                "co2_reduction": "Up to 40% reduction possible",
                "cost_optimization": "Multi-objective balancing"
            }
        },
        "supported_queries": [
            "Optimize my cement plant for cost/emissions",
            "What's the optimal fuel mix for next 8 hours?",
            "Analyze thermal image for abnormal conditions",
            "Predict f-CaO content from DCS data",
            "Perform sensitivity analysis on biomass price",
            "Show Pareto front for cost vs emissions"
        ],
        "timestamp": datetime.now().isoformat()
    }

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "timestamp": datetime.now().isoformat()
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "timestamp": datetime.now().isoformat()
        }
    )

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with system information"""
    uptime = (datetime.now() - app_start_time).total_seconds()
    
    return {
        "service": "CementOS - Cement Plant Optimization System",
        "version": "1.0.0",
        "status": "running",
        "uptime_seconds": int(uptime),
        "description": "AI-powered cement production optimization with multi-agent architecture",
        "endpoints": {
            "chat": "/chat - Main chat interface for natural language queries",
            "optimize": "/optimize - Direct optimization API",
            "status": "/status - System health and status",
            "health": "/health - Health check for load balancers",
            "capabilities": "/capabilities - System capabilities and features",
            "docs": "/docs - Interactive API documentation"
        },
        "timestamp": datetime.now().isoformat()
    }

def main():
    """Main function to run the server"""
    # Get configuration from environment variables
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8080))  # Cloud Run uses PORT environment variable
    workers = int(os.getenv("WORKERS", 1))
    log_level = os.getenv("LOG_LEVEL", "info")
    
    logger.info(f"Starting CementOS server on {host}:{port}")
    
    # Configure uvicorn
    config = uvicorn.Config(
        app=app,
        host=host,
        port=port,
        log_level=log_level,
        workers=workers if workers > 1 else None,
        access_log=True,
        use_colors=True,
        reload=False  # Disable reload in production
    )
    
    server = uvicorn.Server(config)
    server.run()

if __name__ == "__main__":
    main()
