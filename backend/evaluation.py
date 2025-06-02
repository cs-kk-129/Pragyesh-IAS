import math
from typing import List, Dict
from models.schemas import (
    TestSubmission, EvaluationResult, PerformanceMetrics, 
    SubjectAnalysis, TopicAnalysis, TimeAnalysis, Subject
)

class TestEvaluator:
    def __init__(self, db_manager):
        self.db_manager = db_manager
        
    def evaluate_submission(self, submission: TestSubmission) -> EvaluationResult:
        """
        Comprehensive evaluation of test submission with detailed metrics
        """
        # Basic scoring
        correct_count = 0
        incorrect_count = 0
        unattempted_count = 0
        
        question_results = {}
        
        for answer in submission.answers:
            question_meta = next(
                (q for q in submission.questions_metadata if q.question_id == answer.question_id),
                None
            )
            
            if not question_meta:
                continue
                
            if answer.selected_option is None:
                unattempted_count += 1
                status = "unattempted"
            elif answer.selected_option.upper() == question_meta.correct_answer.upper():
                correct_count += 1
                status = "correct"
            else:
                incorrect_count += 1
                status = "incorrect"
                
            question_results[answer.question_id] = {
                "status": status,
                "time_spent": answer.time_spent,
                "metadata": question_meta
            }
        
        total_questions = len(submission.questions_metadata)
        
        # Calculate performance metrics
        metrics = self._calculate_performance_metrics(
            correct_count, incorrect_count, unattempted_count, total_questions,
            submission, question_results
        )
        
        # Subject-wise analysis
        subject_analysis = self._analyze_by_subject(submission, question_results)
        
        # Topic-wise analysis
        topic_analysis = self._analyze_by_topic(submission, question_results)
        
        # Time analysis
        time_analysis = self._analyze_time_patterns(submission, question_results)
        
        # Generate strengths and weaknesses
        strengths, weaknesses = self._identify_strengths_weaknesses(
            metrics, subject_analysis, topic_analysis, time_analysis
        )
        
        return EvaluationResult(
            user_id=submission.user_id,
            test_id=submission.test_id,
            metrics=metrics,
            subject_analysis=subject_analysis,
            topic_analysis=topic_analysis,
            time_analysis=time_analysis,
            strengths=strengths,
            weaknesses=weaknesses
        )
    
    def _calculate_performance_metrics(self, correct: int, incorrect: int, unattempted: int, 
                                     total: int, submission: TestSubmission, 
                                     question_results: Dict) -> PerformanceMetrics:
        """Calculate comprehensive performance metrics"""
        
        accuracy = (correct / total * 100) if total > 0 else 0
        
        # Critical Thinking Score (based on assertion-reason questions)
        critical_thinking_questions = [
            q for q in submission.questions_metadata 
            if q.is_critical_thinking or q.question_type.value == "assertion_reason"
        ]
        
        critical_correct = sum(
            1 for q in critical_thinking_questions
            if question_results.get(q.question_id, {}).get("status") == "correct"
        )
        
        critical_thinking_score = (
            (critical_correct / len(critical_thinking_questions) * 100) 
            if critical_thinking_questions else 0
        )
        
        # Knowledge Retention Score (correct minus penalty for incorrect)
        # UPSC formula: (Correct × 2) - (Incorrect × 0.67) / Total possible marks × 100
        total_marks = sum(q.marks for q in submission.questions_metadata)
        earned_marks = (correct * 2) - (incorrect * 0.67)
        knowledge_retention_score = max(0, (earned_marks / total_marks * 100)) if total_marks > 0 else 0
        
        # Concept Clarity Score (based on deep concept questions)
        concept_questions = [
            q for q in submission.questions_metadata 
            if q.is_concept_clarity
        ]
        
        concept_correct = sum(
            1 for q in concept_questions
            if question_results.get(q.question_id, {}).get("status") == "correct"
        )
        
        concept_clarity_score = (
            (concept_correct / len(concept_questions) * 100) 
            if concept_questions else accuracy
        )
        
        # Time Management Score
        time_management_score = self._calculate_time_management_score(
            submission, question_results
        )
        
        # Overall Score (weighted average)
        overall_score = (
            accuracy * 0.4 + 
            critical_thinking_score * 0.2 + 
            knowledge_retention_score * 0.2 + 
            concept_clarity_score * 0.1 + 
            time_management_score * 0.1
        )
        
        return PerformanceMetrics(
            correct_count=correct,
            incorrect_count=incorrect,
            unattempted_count=unattempted,
            total_questions=total,
            accuracy_percentage=round(accuracy, 2),
            critical_thinking_score=round(critical_thinking_score, 2),
            knowledge_retention_score=round(knowledge_retention_score, 2),
            concept_clarity_score=round(concept_clarity_score, 2),
            time_management_score=round(time_management_score, 2),
            overall_score=round(overall_score, 2)
        )
    
    def _calculate_time_management_score(self, submission: TestSubmission, 
                                       question_results: Dict) -> float:
        """Calculate time management efficiency score"""
        total_time = submission.total_time_spent
        total_questions = len(submission.questions_metadata)
        
        if total_questions == 0 or total_time == 0:
            return 0
        
        average_time = total_time / total_questions
        ideal_time_per_question = 90  # 1.5 minutes per question for UPSC
        
        # Count questions with good time management
        well_timed_questions = 0
        rushed_questions = 0
        overthought_questions = 0
        
        for qid, result in question_results.items():
            time_spent = result["time_spent"]
            
            if 45 <= time_spent <= 120:  # 45 seconds to 2 minutes is ideal
                well_timed_questions += 1
            elif time_spent < 30:  # Too rushed
                rushed_questions += 1
            elif time_spent > 180:  # Overthinking
                overthought_questions += 1
        
        # Base score from well-timed questions
        base_score = (well_timed_questions / total_questions) * 100
        
        # Penalty for rushed or overthought questions
        penalty = ((rushed_questions + overthought_questions) / total_questions) * 20
        
        # Bonus for finishing within time limit (assuming 2 hours = 7200 seconds)
        time_bonus = 0
        if total_time <= 7200:  # Finished within time
            time_bonus = 10
        
        return max(0, min(100, base_score - penalty + time_bonus))
    
    def _analyze_by_subject(self, submission: TestSubmission, 
                          question_results: Dict) -> List[SubjectAnalysis]:
        """Analyze performance by subject"""
        subject_data = {}
        
        for answer in submission.answers:
            question_meta = next(
                (q for q in submission.questions_metadata if q.question_id == answer.question_id),
                None
            )
            
            if not question_meta:
                continue
                
            subject = question_meta.subject
            
            if subject not in subject_data:
                subject_data[subject] = {
                    "total": 0, "correct": 0, "incorrect": 0, 
                    "unattempted": 0, "time_spent": 0
                }
            
            subject_data[subject]["total"] += 1
            subject_data[subject]["time_spent"] += answer.time_spent
            
            result = question_results.get(answer.question_id, {})
            status = result.get("status", "unattempted")
            
            if status == "correct":
                subject_data[subject]["correct"] += 1
            elif status == "incorrect":
                subject_data[subject]["incorrect"] += 1
            else:
                subject_data[subject]["unattempted"] += 1
        
        analysis = []
        for subject, data in subject_data.items():
            accuracy = (data["correct"] / data["total"] * 100) if data["total"] > 0 else 0
            
            analysis.append(SubjectAnalysis(
                subject=subject,
                total_questions=data["total"],
                correct=data["correct"],
                incorrect=data["incorrect"],
                unattempted=data["unattempted"],
                accuracy=round(accuracy, 2),
                time_spent=round(data["time_spent"], 2)
            ))
        
        return sorted(analysis, key=lambda x: x.accuracy, reverse=True)
    
    def _analyze_by_topic(self, submission: TestSubmission, 
                        question_results: Dict) -> List[TopicAnalysis]:
        """Analyze performance by topic"""
        topic_data = {}
        
        for answer in submission.answers:
            question_meta = next(
                (q for q in submission.questions_metadata if q.question_id == answer.question_id),
                None
            )
            
            if not question_meta:
                continue
                
            topic = question_meta.topic
            subject = question_meta.subject
            
            if topic not in topic_data:
                topic_data[topic] = {
                    "subject": subject, "total": 0, "correct": 0, "incorrect": 0
                }
            
            topic_data[topic]["total"] += 1
            
            result = question_results.get(answer.question_id, {})
            status = result.get("status", "unattempted")
            
            if status == "correct":
                topic_data[topic]["correct"] += 1
            elif status == "incorrect":
                topic_data[topic]["incorrect"] += 1
        
        analysis = []
        for topic, data in topic_data.items():
            accuracy = (data["correct"] / data["total"] * 100) if data["total"] > 0 else 0
            needs_improvement = accuracy < 60 or data["incorrect"] > data["correct"]
            
            analysis.append(TopicAnalysis(
                topic=topic,
                subject=data["subject"],
                total_questions=data["total"],
                correct=data["correct"],
                incorrect=data["incorrect"],
                accuracy=round(accuracy, 2),
                needs_improvement=needs_improvement
            ))
        
        return sorted(analysis, key=lambda x: x.accuracy)
    
    def _analyze_time_patterns(self, submission: TestSubmission, 
                             question_results: Dict) -> TimeAnalysis:
        """Analyze time management patterns"""
        times = [result["time_spent"] for result in question_results.values()]
        
        if not times:
            return TimeAnalysis(
                average_time_per_question=0,
                fastest_question_time=0,
                slowest_question_time=0,
                time_distribution={},
                rushed_questions=[],
                overthought_questions=[]
            )
        
        # Time distribution by difficulty
        difficulty_times = {"easy": [], "medium": [], "hard": []}
        rushed_questions = []
        overthought_questions = []
        
        for qid, result in question_results.items():
            time_spent = result["time_spent"]
            difficulty = result["metadata"].difficulty_level
            
            if difficulty in difficulty_times:
                difficulty_times[difficulty].append(time_spent)
            
            if time_spent < 30:
                rushed_questions.append(qid)
            elif time_spent > 180:
                overthought_questions.append(qid)
        
        time_distribution = {}
        for difficulty, times_list in difficulty_times.items():
            if times_list:
                time_distribution[difficulty] = round(sum(times_list) / len(times_list), 2)
            else:
                time_distribution[difficulty] = 0
        
        return TimeAnalysis(
            average_time_per_question=round(sum(times) / len(times), 2),
            fastest_question_time=round(min(times), 2),
            slowest_question_time=round(max(times), 2),
            time_distribution=time_distribution,
            rushed_questions=rushed_questions,
            overthought_questions=overthought_questions
        )
    
    def _identify_strengths_weaknesses(self, metrics: PerformanceMetrics,
                                     subject_analysis: List[SubjectAnalysis],
                                     topic_analysis: List[TopicAnalysis],
                                     time_analysis: TimeAnalysis) -> tuple:
        """Identify strengths and weaknesses based on analysis"""
        strengths = []
        weaknesses = []
        
        # Accuracy-based analysis
        if metrics.accuracy_percentage >= 80:
            strengths.append("Excellent overall accuracy")
        elif metrics.accuracy_percentage >= 60:
            strengths.append("Good accuracy level")
        else:
            weaknesses.append("Accuracy needs improvement")
        
        # Critical thinking analysis
        if metrics.critical_thinking_score >= 75:
            strengths.append("Strong analytical and critical thinking skills")
        elif metrics.critical_thinking_score < 50:
            weaknesses.append("Critical thinking and analysis needs development")
        
        # Time management analysis
        if metrics.time_management_score >= 75:
            strengths.append("Effective time management")
        elif metrics.time_management_score < 50:
            weaknesses.append("Time management needs improvement")
        
        # Subject-wise strengths/weaknesses
        if subject_analysis:
            best_subject = subject_analysis[0]
            worst_subject = subject_analysis[-1]
            
            if best_subject.accuracy >= 70:
                strengths.append(f"Strong performance in {best_subject.subject.value}")
            
            if worst_subject.accuracy < 50:
                weaknesses.append(f"Needs improvement in {worst_subject.subject.value}")
        
        # Topic-specific analysis
        weak_topics = [topic for topic in topic_analysis if topic.needs_improvement]
        if len(weak_topics) > 3:
            weaknesses.append("Multiple topics require focused study")
        
        return strengths, weaknesses