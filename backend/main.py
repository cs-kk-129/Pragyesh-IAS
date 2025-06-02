from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from pathlib import Path

from models.schemas import TestSubmission, EvaluationResponse
from evaluation import TestEvaluator
from report import PDFReportGenerator
from recommendations import RecommendationEngine
from database import DatabaseManager

app = FastAPI(title="UPSC Mock Test Evaluation API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
db_manager = DatabaseManager()
evaluator = TestEvaluator(db_manager)
pdf_generator = PDFReportGenerator()
recommendation_engine = RecommendationEngine()

# Ensure reports directory exists
REPORTS_DIR = Path("reports")
REPORTS_DIR.mkdir(exist_ok=True)

@app.on_event("startup")
async def startup_event():
    """Initialize database tables on startup"""
    db_manager.init_database()

@app.post("/submit-responses", response_model=EvaluationResponse)
async def submit_test_responses(submission: TestSubmission):
    """
    Evaluate student responses for a UPSC mock test and generate comprehensive report
    """
    try:
        # Evaluate the test submission
        evaluation_result = evaluator.evaluate_submission(submission)
        
        # Generate AI-powered recommendations
        recommendations = await recommendation_engine.generate_recommendations(evaluation_result)
        evaluation_result.recommendations = recommendations
        
        # Store evaluation in database
        evaluation_id = db_manager.store_evaluation(evaluation_result)
        evaluation_result.evaluation_id = evaluation_id
        
        # Generate PDF report
        pdf_path = pdf_generator.generate_report(evaluation_result, submission)
        evaluation_result.pdf_path = str(pdf_path)
        
        return evaluation_result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

@app.get("/report/{user_id}/{test_id}")
async def download_report(user_id: int, test_id: int):
    """
    Download PDF report for a specific user and test
    """
    try:
        # Find the evaluation record
        evaluation = db_manager.get_evaluation(user_id, test_id)
        if not evaluation:
            raise HTTPException(status_code=404, detail="Evaluation not found")
        
        pdf_path = Path(evaluation['pdf_path'])
        if not pdf_path.exists():
            raise HTTPException(status_code=404, detail="Report file not found")
        
        return FileResponse(
            path=pdf_path,
            filename=f"UPSC_Report_User{user_id}_Test{test_id}.pdf",
            media_type="application/pdf"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report download failed: {str(e)}")

@app.get("/evaluations/{user_id}")
async def get_user_evaluations(user_id: int):
    """
    Get all evaluations for a specific user
    """
    try:
        evaluations = db_manager.get_user_evaluations(user_id)
        return {"evaluations": evaluations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch evaluations: {str(e)}")

@app.get("/test-analytics/{test_id}")
async def get_test_analytics(test_id: int):
    """
    Get analytics for a specific test across all users
    """
    try:
        analytics = db_manager.get_test_analytics(test_id)
        return analytics
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch analytics: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "UPSC Evaluation API"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)