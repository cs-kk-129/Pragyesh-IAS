"""
Test script for UPSC Mock Test Evaluation API
Demonstrates complete submission and report generation flow
"""

import requests
import json
from datetime import datetime
from models.schemas import TestSubmission, Answer, QuestionMetadata, Subject, QuestionType

# Sample test data
def create_sample_submission():
    """Create a sample test submission for demonstration"""
    
    # Sample questions metadata
    questions_metadata = [
        QuestionMetadata(
            question_id=1,
            correct_answer="B",
            question_type=QuestionType.MULTIPLE_CHOICE,
            subject=Subject.HISTORY,
            topic="Ancient India",
            difficulty_level="medium",
            marks=2,
            is_critical_thinking=False,
            is_concept_clarity=True
        ),
        QuestionMetadata(
            question_id=2,
            correct_answer="A",
            question_type=QuestionType.ASSERTION_REASON,
            subject=Subject.POLITY,
            topic="Constitutional Framework",
            difficulty_level="hard",
            marks=2,
            is_critical_thinking=True,
            is_concept_clarity=False
        ),
        QuestionMetadata(
            question_id=3,
            correct_answer="C",
            question_type=QuestionType.MULTIPLE_CHOICE,
            subject=Subject.GEOGRAPHY,
            topic="Physical Geography",
            difficulty_level="easy",
            marks=2,
            is_critical_thinking=False,
            is_concept_clarity=True
        ),
        QuestionMetadata(
            question_id=4,
            correct_answer="D",
            question_type=QuestionType.MULTIPLE_CHOICE,
            subject=Subject.ECONOMICS,
            topic="Economic Planning",
            difficulty_level="medium",
            marks=2,
            is_critical_thinking=False,
            is_concept_clarity=False
        ),
        QuestionMetadata(
            question_id=5,
            correct_answer="A",
            question_type=QuestionType.STATEMENT_BASED,
            subject=Subject.CURRENT_AFFAIRS,
            topic="National Issues",
            difficulty_level="hard",
            marks=2,
            is_critical_thinking=True,
            is_concept_clarity=True
        )
    ]
    
    # Sample student answers
    answers = [
        Answer(question_id=1, selected_option="B", time_spent=120.5, is_marked_for_review=False),
        Answer(question_id=2, selected_option="C", time_spent=180.0, is_marked_for_review=True),  # Incorrect
        Answer(question_id=3, selected_option="C", time_spent=90.0, is_marked_for_review=False),
        Answer(question_id=4, selected_option=None, time_spent=45.0, is_marked_for_review=False),  # Unattempted
        Answer(question_id=5, selected_option="A", time_spent=200.5, is_marked_for_review=False),
    ]
    
    # Create submission
    submission = TestSubmission(
        user_id=123,
        test_id=456,
        test_title="UPSC Prelims Mock Test - General Studies",
        answers=answers,
        questions_metadata=questions_metadata,
        total_time_spent=636.0  # Total time in seconds
    )
    
    return submission

def test_api_endpoints():
    """Test the FastAPI endpoints"""
    base_url = "http://localhost:8001"
    
    print("Testing UPSC Evaluation API")
    print("=" * 50)
    
    # Test health check
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            print("✓ Health check passed")
        else:
            print("✗ Health check failed")
            return
    except requests.exceptions.ConnectionError:
        print("✗ Could not connect to API server")
        print("  Make sure the server is running: python run_backend.py")
        return
    
    # Test submission
    submission = create_sample_submission()
    submission_data = submission.dict()
    
    # Convert datetime to string for JSON serialization
    submission_data['submission_timestamp'] = submission_data['submission_timestamp'].isoformat()
    
    try:
        print("\nSubmitting test for evaluation...")
        response = requests.post(
            f"{base_url}/submit-responses",
            json=submission_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✓ Test submission successful")
            print(f"  Overall Score: {result['evaluation']['metrics']['overall_score']}%")
            print(f"  Accuracy: {result['evaluation']['metrics']['accuracy_percentage']}%")
            print(f"  PDF Report: {result['evaluation']['pdf_path']}")
            
            # Test report download
            user_id = result['evaluation']['user_id']
            test_id = result['evaluation']['test_id']
            
            print(f"\nTesting report download for User {user_id}, Test {test_id}...")
            download_response = requests.get(f"{base_url}/report/{user_id}/{test_id}")
            
            if download_response.status_code == 200:
                print("✓ Report download successful")
                print(f"  Content-Type: {download_response.headers.get('content-type')}")
            else:
                print("✗ Report download failed")
                print(f"  Status: {download_response.status_code}")
                
        else:
            print("✗ Test submission failed")
            print(f"  Status: {response.status_code}")
            print(f"  Error: {response.text}")
            
    except Exception as e:
        print(f"✗ API test failed: {str(e)}")

if __name__ == "__main__":
    test_api_endpoints()