import openai
import os
from typing import List
from models.schemas import EvaluationResult

class RecommendationEngine:
    def __init__(self):
        # Check if OpenAI API key is available
        self.api_key = os.getenv("OPENAI_API_KEY")
        if self.api_key:
            openai.api_key = self.api_key
        
    async def generate_recommendations(self, evaluation: EvaluationResult) -> List[str]:
        """
        Generate personalized study recommendations using OpenAI GPT-4
        """
        if not self.api_key:
            return self._generate_fallback_recommendations(evaluation)
        
        try:
            # Prepare evaluation data for AI analysis
            prompt = self._create_recommendation_prompt(evaluation)
            
            # Call OpenAI API
            response = await openai.ChatCompletion.acreate(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert UPSC preparation mentor with deep knowledge of the exam pattern, syllabus, and effective study strategies. Provide personalized, actionable recommendations based on student performance data."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=800,
                temperature=0.7
            )
            
            # Parse recommendations from response
            recommendations_text = response.choices[0].message.content.strip()
            recommendations = self._parse_recommendations(recommendations_text)
            
            return recommendations
            
        except Exception as e:
            print(f"OpenAI API error: {e}")
            return self._generate_fallback_recommendations(evaluation)
    
    def _create_recommendation_prompt(self, evaluation: EvaluationResult) -> str:
        """Create detailed prompt for AI recommendation generation"""
        
        metrics = evaluation.metrics
        
        # Performance summary
        performance_summary = f"""
        Overall Performance Analysis:
        - Overall Score: {metrics.overall_score}%
        - Accuracy: {metrics.accuracy_percentage}% ({metrics.correct_count}/{metrics.total_questions} correct)
        - Critical Thinking Score: {metrics.critical_thinking_score}%
        - Knowledge Retention Score: {metrics.knowledge_retention_score}%
        - Concept Clarity Score: {metrics.concept_clarity_score}%
        - Time Management Score: {metrics.time_management_score}%
        """
        
        # Subject performance
        subject_performance = "Subject-wise Performance:\n"
        for subject in evaluation.subject_analysis:
            subject_performance += f"- {subject.subject.value}: {subject.accuracy}% accuracy ({subject.correct}/{subject.total_questions})\n"
        
        # Weak topics
        weak_topics = [topic for topic in evaluation.topic_analysis if topic.needs_improvement]
        weak_topics_text = "Topics needing improvement:\n"
        for topic in weak_topics[:5]:  # Top 5 weak topics
            weak_topics_text += f"- {topic.topic} ({topic.subject.value}): {topic.accuracy}% accuracy\n"
        
        # Time analysis
        time_analysis = f"""
        Time Management Analysis:
        - Average time per question: {evaluation.time_analysis.average_time_per_question:.1f} seconds
        - Rushed questions (< 30s): {len(evaluation.time_analysis.rushed_questions)}
        - Overthought questions (> 3min): {len(evaluation.time_analysis.overthought_questions)}
        """
        
        # Strengths and weaknesses
        strengths_text = "Current Strengths:\n" + "\n".join([f"- {s}" for s in evaluation.strengths])
        weaknesses_text = "Areas for Improvement:\n" + "\n".join([f"- {w}" for w in evaluation.weaknesses])
        
        prompt = f"""
        Based on the following UPSC mock test performance data, generate 5-7 specific, actionable study recommendations for this student:

        {performance_summary}

        {subject_performance}

        {weak_topics_text}

        {time_analysis}

        {strengths_text}

        {weaknesses_text}

        Please provide recommendations that are:
        1. Specific and actionable
        2. Tailored to the student's performance pattern
        3. Include both subject-wise and skill-based advice
        4. Address time management if needed
        5. Provide concrete study strategies and resources
        6. Include short-term (1-2 weeks) and medium-term (1-2 months) goals

        Format each recommendation as a separate numbered point, focusing on practical steps the student can implement immediately.
        """
        
        return prompt
    
    def _parse_recommendations(self, recommendations_text: str) -> List[str]:
        """Parse AI-generated recommendations into a list"""
        recommendations = []
        
        # Split by lines and clean up
        lines = recommendations_text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Remove numbering and clean up
            if line[0].isdigit() and '.' in line[:3]:
                line = line.split('.', 1)[1].strip()
            elif line.startswith('-') or line.startswith('•'):
                line = line[1:].strip()
            
            if len(line) > 10:  # Filter out very short lines
                recommendations.append(line)
        
        return recommendations[:7]  # Return max 7 recommendations
    
    def _generate_fallback_recommendations(self, evaluation: EvaluationResult) -> List[str]:
        """Generate rule-based recommendations when OpenAI is not available"""
        recommendations = []
        metrics = evaluation.metrics
        
        # Accuracy-based recommendations
        if metrics.accuracy_percentage < 50:
            recommendations.append("Focus on strengthening fundamental concepts through NCERT textbooks before attempting advanced practice questions.")
        elif metrics.accuracy_percentage < 70:
            recommendations.append("Continue regular practice with moderate-level questions while reviewing incorrect answers systematically.")
        
        # Critical thinking recommendations
        if metrics.critical_thinking_score < 60:
            recommendations.append("Practice assertion-reason questions daily and analyze editorial articles to improve analytical thinking skills.")
        
        # Time management recommendations
        if metrics.time_management_score < 60:
            recommendations.append("Implement strict time limits during practice: 1.5 minutes per question for prelims preparation.")
            recommendations.append("Take sectional tests with timer to identify time-consuming question types and develop quick elimination strategies.")
        
        # Subject-specific recommendations
        weak_subjects = [s for s in evaluation.subject_analysis if s.accuracy < 50]
        if weak_subjects:
            subject_names = [s.subject.value.replace('_', ' ').title() for s in weak_subjects[:2]]
            recommendations.append(f"Prioritize {' and '.join(subject_names)} by dedicating 2-3 hours daily to these subjects for the next 2 weeks.")
        
        # Knowledge retention recommendations
        if metrics.knowledge_retention_score < 60:
            recommendations.append("Implement spaced repetition technique: review topics after 1 day, 3 days, 1 week, and 2 weeks intervals.")
        
        # Concept clarity recommendations
        if metrics.concept_clarity_score < 60:
            recommendations.append("Create concept maps and flowcharts for complex topics to improve understanding and retention.")
        
        # General recommendations
        recommendations.extend([
            "Maintain an error log to track and review all incorrect answers with detailed explanations.",
            "Join online study groups or forums to discuss difficult concepts and current affairs.",
            "Take full-length mock tests weekly to simulate actual exam conditions and track progress."
        ])
        
        return recommendations[:7]  # Return max 7 recommendations