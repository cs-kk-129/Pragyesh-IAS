#!/usr/bin/env python3
"""
UPSC Mock Test Evaluation Backend
FastAPI server for processing test submissions and generating PDF reports
"""

import uvicorn
import os
import sys
from pathlib import Path

# Add current directory to Python path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

from main import app

if __name__ == "__main__":
    print("🚀 Starting UPSC Evaluation Backend...")
    print("📋 Features:")
    print("   • Test submission evaluation")
    print("   • AI-powered recommendations")
    print("   • PDF report generation")
    print("   • Performance analytics")
    print("")
    
    # Configuration
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8001))
    
    print(f"🌐 Server will be available at: http://{host}:{port}")
    print("📖 API documentation: http://localhost:8001/docs")
    print("")
    
    # Start server
    uvicorn.run(
        app,
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )