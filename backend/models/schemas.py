from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class QuestionType(str, Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    ASSERTION_REASON = "assertion_reason"
    STATEMENT_BASED = "statement_based"

class Subject(str, Enum):
    HISTORY = "history"
    GEOGRAPHY = "geography"
    POLITY = "polity"
    ECONOMICS = "economics"
    SCIENCE_TECH = "science_technology"
    ENVIRONMENT = "environment"
    CURRENT_AFFAIRS = "current_affairs"
    ART_CULTURE = "art_culture"

class Answer(BaseModel):
    question_id: int
    selected_option: Optional[str] = None  # A, B, C, D or None for unattempted
    time_spent: float = Field(..., description="Time spent on question in seconds")
    is_marked_for_review: bool = False

class QuestionMetadata(BaseModel):
    question_id: int
    correct_answer: str
    question_type: QuestionType
    subject: Subject
    topic: str
    difficulty_level: str = Field(..., description="easy, medium, hard")
    marks: int = 2
    is_critical_thinking: bool = False
    is_concept_clarity: bool = False

class TestSubmission(BaseModel):
    user_id: int
    test_id: int
    test_title: str
    answers: List[Answer]
    questions_metadata: List[QuestionMetadata]
    total_time_spent: float = Field(..., description="Total test time in seconds")
    submission_timestamp: datetime = Field(default_factory=datetime.now)

class PerformanceMetrics(BaseModel):
    correct_count: int
    incorrect_count: int
    unattempted_count: int
    total_questions: int
    
    accuracy_percentage: float
    critical_thinking_score: float = Field(..., description="Score out of 100")
    knowledge_retention_score: float = Field(..., description="Score out of 100")
    concept_clarity_score: float = Field(..., description="Score out of 100")
    time_management_score: float = Field(..., description="Score out of 100")
    
    overall_score: float = Field(..., description="Weighted average of all metrics")

class SubjectAnalysis(BaseModel):
    subject: Subject
    total_questions: int
    correct: int
    incorrect: int
    unattempted: int
    accuracy: float
    time_spent: float
    
class TopicAnalysis(BaseModel):
    topic: str
    subject: Subject
    total_questions: int
    correct: int
    incorrect: int
    accuracy: float
    needs_improvement: bool

class TimeAnalysis(BaseModel):
    average_time_per_question: float
    fastest_question_time: float
    slowest_question_time: float
    time_distribution: Dict[str, float]  # easy, medium, hard
    rushed_questions: List[int]  # question_ids where time < 30 seconds
    overthought_questions: List[int]  # question_ids where time > 3 minutes

class EvaluationResult(BaseModel):
    user_id: int
    test_id: int
    evaluation_id: Optional[int] = None
    
    metrics: PerformanceMetrics
    subject_analysis: List[SubjectAnalysis]
    topic_analysis: List[TopicAnalysis]
    time_analysis: TimeAnalysis
    
    strengths: List[str]
    weaknesses: List[str]
    recommendations: List[str] = []
    
    pdf_path: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)

class EvaluationResponse(BaseModel):
    success: bool
    message: str
    evaluation: EvaluationResult
    download_url: Optional[str] = None

class RecommendationRequest(BaseModel):
    evaluation_result: EvaluationResult
    user_performance_history: Optional[List[Dict[str, Any]]] = None