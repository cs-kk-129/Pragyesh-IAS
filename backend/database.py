import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Optional
from pathlib import Path
from models.schemas import EvaluationResult, TestSubmission

class DatabaseManager:
    def __init__(self, db_path: str = "upsc_evaluations.db"):
        self.db_path = db_path
        self.ensure_db_directory()
        
    def ensure_db_directory(self):
        """Ensure database directory exists"""
        db_dir = Path(self.db_path).parent
        db_dir.mkdir(exist_ok=True)
        
    def init_database(self):
        """Initialize database tables"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Create evaluations table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS evaluations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    test_id INTEGER NOT NULL,
                    test_title TEXT NOT NULL,
                    submission_timestamp TEXT NOT NULL,
                    
                    -- Performance metrics
                    overall_score REAL NOT NULL,
                    accuracy_percentage REAL NOT NULL,
                    critical_thinking_score REAL NOT NULL,
                    knowledge_retention_score REAL NOT NULL,
                    concept_clarity_score REAL NOT NULL,
                    time_management_score REAL NOT NULL,
                    
                    -- Question counts
                    correct_count INTEGER NOT NULL,
                    incorrect_count INTEGER NOT NULL,
                    unattempted_count INTEGER NOT NULL,
                    total_questions INTEGER NOT NULL,
                    
                    -- Analysis data (JSON)
                    subject_analysis TEXT NOT NULL,
                    topic_analysis TEXT NOT NULL,
                    time_analysis TEXT NOT NULL,
                    
                    -- Insights
                    strengths TEXT NOT NULL,
                    weaknesses TEXT NOT NULL,
                    recommendations TEXT NOT NULL,
                    
                    -- Report details
                    pdf_path TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    
                    UNIQUE(user_id, test_id)
                )
            ''')
            
            # Create test answers table for detailed tracking
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS test_answers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    evaluation_id INTEGER NOT NULL,
                    question_id INTEGER NOT NULL,
                    selected_option TEXT,
                    correct_answer TEXT NOT NULL,
                    is_correct BOOLEAN NOT NULL,
                    time_spent REAL NOT NULL,
                    is_marked_for_review BOOLEAN NOT NULL,
                    question_type TEXT NOT NULL,
                    subject TEXT NOT NULL,
                    topic TEXT NOT NULL,
                    difficulty_level TEXT NOT NULL,
                    
                    FOREIGN KEY (evaluation_id) REFERENCES evaluations (id)
                )
            ''')
            
            # Create test questions metadata table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS test_questions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    test_id INTEGER NOT NULL,
                    question_id INTEGER NOT NULL,
                    question_text TEXT NOT NULL,
                    options TEXT NOT NULL,
                    correct_answer TEXT NOT NULL,
                    question_type TEXT NOT NULL,
                    subject TEXT NOT NULL,
                    topic TEXT NOT NULL,
                    difficulty_level TEXT NOT NULL,
                    marks INTEGER NOT NULL,
                    is_critical_thinking BOOLEAN NOT NULL,
                    is_concept_clarity BOOLEAN NOT NULL,
                    
                    UNIQUE(test_id, question_id)
                )
            ''')
            
            conn.commit()
            
    def store_evaluation(self, evaluation: EvaluationResult) -> int:
        """Store evaluation result in database"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            try:
                # Insert evaluation record
                cursor.execute('''
                    INSERT OR REPLACE INTO evaluations (
                        user_id, test_id, test_title, submission_timestamp,
                        overall_score, accuracy_percentage, critical_thinking_score,
                        knowledge_retention_score, concept_clarity_score, time_management_score,
                        correct_count, incorrect_count, unattempted_count, total_questions,
                        subject_analysis, topic_analysis, time_analysis,
                        strengths, weaknesses, recommendations,
                        pdf_path, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    evaluation.user_id,
                    evaluation.test_id,
                    "Mock Test",  # Default title
                    evaluation.created_at.isoformat(),
                    evaluation.metrics.overall_score,
                    evaluation.metrics.accuracy_percentage,
                    evaluation.metrics.critical_thinking_score,
                    evaluation.metrics.knowledge_retention_score,
                    evaluation.metrics.concept_clarity_score,
                    evaluation.metrics.time_management_score,
                    evaluation.metrics.correct_count,
                    evaluation.metrics.incorrect_count,
                    evaluation.metrics.unattempted_count,
                    evaluation.metrics.total_questions,
                    json.dumps([s.__dict__ for s in evaluation.subject_analysis]),
                    json.dumps([t.__dict__ for t in evaluation.topic_analysis]),
                    json.dumps(evaluation.time_analysis.__dict__),
                    json.dumps(evaluation.strengths),
                    json.dumps(evaluation.weaknesses),
                    json.dumps(evaluation.recommendations),
                    evaluation.pdf_path or "",
                    evaluation.created_at.isoformat()
                ))
                
                evaluation_id = cursor.lastrowid
                conn.commit()
                return evaluation_id
                
            except sqlite3.Error as e:
                print(f"Database error: {e}")
                conn.rollback()
                raise
                
    def get_evaluation(self, user_id: int, test_id: int) -> Optional[Dict]:
        """Get evaluation record for specific user and test"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT * FROM evaluations 
                WHERE user_id = ? AND test_id = ?
                ORDER BY created_at DESC
                LIMIT 1
            ''', (user_id, test_id))
            
            row = cursor.fetchone()
            if not row:
                return None
                
            # Convert row to dictionary
            columns = [description[0] for description in cursor.description]
            return dict(zip(columns, row))
            
    def get_user_evaluations(self, user_id: int) -> List[Dict]:
        """Get all evaluations for a specific user"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT id, test_id, test_title, overall_score, accuracy_percentage,
                       submission_timestamp, created_at, pdf_path
                FROM evaluations 
                WHERE user_id = ?
                ORDER BY created_at DESC
            ''', (user_id,))
            
            rows = cursor.fetchall()
            columns = [description[0] for description in cursor.description]
            
            return [dict(zip(columns, row)) for row in rows]
            
    def get_test_analytics(self, test_id: int) -> Dict:
        """Get analytics for a specific test across all users"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Overall statistics
            cursor.execute('''
                SELECT 
                    COUNT(*) as total_attempts,
                    AVG(overall_score) as avg_overall_score,
                    AVG(accuracy_percentage) as avg_accuracy,
                    AVG(critical_thinking_score) as avg_critical_thinking,
                    AVG(knowledge_retention_score) as avg_knowledge_retention,
                    AVG(concept_clarity_score) as avg_concept_clarity,
                    AVG(time_management_score) as avg_time_management,
                    MAX(overall_score) as highest_score,
                    MIN(overall_score) as lowest_score
                FROM evaluations 
                WHERE test_id = ?
            ''', (test_id,))
            
            stats_row = cursor.fetchone()
            
            if not stats_row or stats_row[0] == 0:
                return {
                    "test_id": test_id,
                    "total_attempts": 0,
                    "message": "No attempts found for this test"
                }
            
            # Score distribution
            cursor.execute('''
                SELECT 
                    CASE 
                        WHEN overall_score >= 90 THEN 'A+ (90-100%)'
                        WHEN overall_score >= 80 THEN 'A (80-89%)'
                        WHEN overall_score >= 70 THEN 'B+ (70-79%)'
                        WHEN overall_score >= 60 THEN 'B (60-69%)'
                        WHEN overall_score >= 50 THEN 'C+ (50-59%)'
                        WHEN overall_score >= 40 THEN 'C (40-49%)'
                        ELSE 'D (Below 40%)'
                    END as grade_range,
                    COUNT(*) as count
                FROM evaluations 
                WHERE test_id = ?
                GROUP BY grade_range
                ORDER BY MIN(overall_score) DESC
            ''', (test_id,))
            
            grade_distribution = cursor.fetchall()
            
            # Subject-wise performance
            cursor.execute('''
                SELECT subject_analysis FROM evaluations WHERE test_id = ?
            ''', (test_id,))
            
            subject_data = {}
            for row in cursor.fetchall():
                subjects = json.loads(row[0])
                for subject in subjects:
                    subject_name = subject['subject']
                    if subject_name not in subject_data:
                        subject_data[subject_name] = {
                            'total_questions': 0,
                            'total_correct': 0,
                            'total_attempts': 0
                        }
                    
                    subject_data[subject_name]['total_questions'] += subject['total_questions']
                    subject_data[subject_name]['total_correct'] += subject['correct']
                    subject_data[subject_name]['total_attempts'] += 1
            
            # Calculate subject averages
            subject_averages = {}
            for subject, data in subject_data.items():
                if data['total_attempts'] > 0:
                    avg_accuracy = (data['total_correct'] / data['total_questions']) * 100
                    subject_averages[subject] = round(avg_accuracy, 2)
            
            return {
                "test_id": test_id,
                "total_attempts": stats_row[0],
                "statistics": {
                    "average_overall_score": round(stats_row[1], 2),
                    "average_accuracy": round(stats_row[2], 2),
                    "average_critical_thinking": round(stats_row[3], 2),
                    "average_knowledge_retention": round(stats_row[4], 2),
                    "average_concept_clarity": round(stats_row[5], 2),
                    "average_time_management": round(stats_row[6], 2),
                    "highest_score": round(stats_row[7], 2),
                    "lowest_score": round(stats_row[8], 2)
                },
                "grade_distribution": [
                    {"grade": grade, "count": count} 
                    for grade, count in grade_distribution
                ],
                "subject_performance": subject_averages
            }
            
    def store_test_questions(self, test_id: int, questions: List[Dict]):
        """Store test questions metadata for future reference"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            try:
                for question in questions:
                    cursor.execute('''
                        INSERT OR REPLACE INTO test_questions (
                            test_id, question_id, question_text, options, correct_answer,
                            question_type, subject, topic, difficulty_level, marks,
                            is_critical_thinking, is_concept_clarity
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        test_id,
                        question['question_id'],
                        question.get('question_text', ''),
                        json.dumps(question.get('options', [])),
                        question['correct_answer'],
                        question['question_type'],
                        question['subject'],
                        question['topic'],
                        question['difficulty_level'],
                        question.get('marks', 2),
                        question.get('is_critical_thinking', False),
                        question.get('is_concept_clarity', False)
                    ))
                
                conn.commit()
                
            except sqlite3.Error as e:
                print(f"Database error storing questions: {e}")
                conn.rollback()
                raise
                
    def get_test_questions(self, test_id: int) -> List[Dict]:
        """Get questions for a specific test"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT * FROM test_questions WHERE test_id = ?
                ORDER BY question_id
            ''', (test_id,))
            
            rows = cursor.fetchall()
            columns = [description[0] for description in cursor.description]
            
            questions = []
            for row in rows:
                question_dict = dict(zip(columns, row))
                question_dict['options'] = json.loads(question_dict['options'])
                questions.append(question_dict)
                
            return questions