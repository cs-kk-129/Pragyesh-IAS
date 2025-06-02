from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.piecharts import Pie
from pathlib import Path
from datetime import datetime
from typing import List
import os

from models.schemas import EvaluationResult, TestSubmission

class PDFReportGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.setup_custom_styles()
        
    def setup_custom_styles(self):
        """Setup custom paragraph styles"""
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=18,
            spaceAfter=30,
            textColor=colors.darkblue,
            alignment=1  # Center alignment
        )
        
        self.heading_style = ParagraphStyle(
            'CustomHeading',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceBefore=20,
            spaceAfter=12,
            textColor=colors.darkgreen
        )
        
        self.body_style = ParagraphStyle(
            'CustomBody',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=8
        )
        
    def generate_report(self, evaluation: EvaluationResult, submission: TestSubmission) -> Path:
        """Generate comprehensive PDF report"""
        
        # Create reports directory if it doesn't exist
        reports_dir = Path("reports")
        reports_dir.mkdir(exist_ok=True)
        
        # Generate filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"UPSC_Report_User{evaluation.user_id}_Test{evaluation.test_id}_{timestamp}.pdf"
        filepath = reports_dir / filename
        
        # Create PDF document
        doc = SimpleDocTemplate(str(filepath), pagesize=A4, 
                              rightMargin=72, leftMargin=72,
                              topMargin=72, bottomMargin=18)
        
        # Build content
        story = []
        
        # Header
        story.extend(self._create_header(evaluation, submission))
        story.append(Spacer(1, 20))
        
        # Performance Summary
        story.extend(self._create_performance_summary(evaluation))
        story.append(Spacer(1, 20))
        
        # Detailed Metrics
        story.extend(self._create_detailed_metrics(evaluation))
        story.append(Spacer(1, 20))
        
        # Subject Analysis
        story.extend(self._create_subject_analysis(evaluation))
        story.append(Spacer(1, 20))
        
        # Topic Analysis
        story.extend(self._create_topic_analysis(evaluation))
        story.append(Spacer(1, 20))
        
        # Time Management Analysis
        story.extend(self._create_time_analysis(evaluation))
        story.append(Spacer(1, 20))
        
        # Strengths and Weaknesses
        story.extend(self._create_strengths_weaknesses(evaluation))
        story.append(Spacer(1, 20))
        
        # Recommendations
        story.extend(self._create_recommendations(evaluation))
        story.append(Spacer(1, 20))
        
        # Next Steps
        story.extend(self._create_next_steps(evaluation))
        
        # Build PDF
        doc.build(story)
        
        return filepath
        
    def _create_header(self, evaluation: EvaluationResult, submission: TestSubmission) -> List:
        """Create report header"""
        elements = []
        
        # Title
        title = Paragraph("UPSC Mock Test Evaluation Report", self.title_style)
        elements.append(title)
        
        # Test details table
        test_data = [
            ['Test ID:', str(evaluation.test_id)],
            ['Test Title:', submission.test_title],
            ['User ID:', str(evaluation.user_id)],
            ['Date:', evaluation.created_at.strftime("%B %d, %Y")],
            ['Time:', evaluation.created_at.strftime("%I:%M %p")]
        ]
        
        test_table = Table(test_data, colWidths=[2*inch, 3*inch])
        test_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        elements.append(test_table)
        
        return elements
        
    def _create_performance_summary(self, evaluation: EvaluationResult) -> List:
        """Create performance summary section"""
        elements = []
        
        elements.append(Paragraph("Performance Summary", self.heading_style))
        
        metrics = evaluation.metrics
        
        # Summary table
        summary_data = [
            ['Metric', 'Score', 'Grade'],
            ['Overall Score', f"{metrics.overall_score}%", self._get_grade(metrics.overall_score)],
            ['Accuracy', f"{metrics.accuracy_percentage}%", self._get_grade(metrics.accuracy_percentage)],
            ['Critical Thinking', f"{metrics.critical_thinking_score}%", self._get_grade(metrics.critical_thinking_score)],
            ['Knowledge Retention', f"{metrics.knowledge_retention_score}%", self._get_grade(metrics.knowledge_retention_score)],
            ['Concept Clarity', f"{metrics.concept_clarity_score}%", self._get_grade(metrics.concept_clarity_score)],
            ['Time Management', f"{metrics.time_management_score}%", self._get_grade(metrics.time_management_score)]
        ]
        
        summary_table = Table(summary_data, colWidths=[2.5*inch, 1*inch, 1*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey)
        ]))
        
        elements.append(summary_table)
        
        # Question breakdown
        elements.append(Spacer(1, 10))
        breakdown_text = f"""
        <b>Question Breakdown:</b><br/>
        • Correct: {metrics.correct_count} questions<br/>
        • Incorrect: {metrics.incorrect_count} questions<br/>
        • Unattempted: {metrics.unattempted_count} questions<br/>
        • Total: {metrics.total_questions} questions
        """
        elements.append(Paragraph(breakdown_text, self.body_style))
        
        return elements
        
    def _create_detailed_metrics(self, evaluation: EvaluationResult) -> List:
        """Create detailed metrics explanation"""
        elements = []
        
        elements.append(Paragraph("Detailed Analysis", self.heading_style))
        
        metrics = evaluation.metrics
        
        # Detailed explanations
        explanations = [
            ("Critical Thinking Score", 
             f"Measures analytical skills and reasoning ability. Your score: {metrics.critical_thinking_score}%. "
             f"This is based on assertion-reason questions and complex analytical problems."),
            
            ("Knowledge Retention Score", 
             f"Evaluates factual knowledge with penalty for incorrect answers. Your score: {metrics.knowledge_retention_score}%. "
             f"Calculated as: (Correct × 2 - Incorrect × 0.67) / Total possible marks × 100."),
            
            ("Concept Clarity Score", 
             f"Tests understanding of fundamental concepts. Your score: {metrics.concept_clarity_score}%. "
             f"Based on questions requiring deep conceptual understanding."),
            
            ("Time Management Score", 
             f"Assesses efficiency in time allocation. Your score: {metrics.time_management_score}%. "
             f"Considers question timing, rushing patterns, and overall time utilization.")
        ]
        
        for title, explanation in explanations:
            elements.append(Paragraph(f"<b>{title}:</b> {explanation}", self.body_style))
            elements.append(Spacer(1, 8))
        
        return elements
        
    def _create_subject_analysis(self, evaluation: EvaluationResult) -> List:
        """Create subject-wise analysis"""
        elements = []
        
        elements.append(Paragraph("Subject-wise Performance", self.heading_style))
        
        # Subject analysis table
        subject_data = [['Subject', 'Total', 'Correct', 'Incorrect', 'Unattempted', 'Accuracy', 'Time (min)']]
        
        for subject in evaluation.subject_analysis:
            subject_data.append([
                subject.subject.value.replace('_', ' ').title(),
                str(subject.total_questions),
                str(subject.correct),
                str(subject.incorrect),
                str(subject.unattempted),
                f"{subject.accuracy}%",
                f"{subject.time_spent/60:.1f}"
            ])
        
        subject_table = Table(subject_data, colWidths=[1.5*inch, 0.6*inch, 0.6*inch, 0.6*inch, 0.8*inch, 0.6*inch, 0.7*inch])
        subject_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkgreen),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightgreen)
        ]))
        
        elements.append(subject_table)
        
        return elements
        
    def _create_topic_analysis(self, evaluation: EvaluationResult) -> List:
        """Create topic-wise analysis"""
        elements = []
        
        elements.append(Paragraph("Topics Requiring Attention", self.heading_style))
        
        # Filter topics that need improvement
        weak_topics = [topic for topic in evaluation.topic_analysis if topic.needs_improvement]
        
        if weak_topics:
            topic_data = [['Topic', 'Subject', 'Questions', 'Accuracy', 'Status']]
            
            for topic in weak_topics[:10]:  # Show top 10 weak topics
                status = "Needs Focus" if topic.accuracy < 40 else "Requires Practice"
                topic_data.append([
                    topic.topic,
                    topic.subject.value.replace('_', ' ').title(),
                    str(topic.total_questions),
                    f"{topic.accuracy}%",
                    status
                ])
            
            topic_table = Table(topic_data, colWidths=[2*inch, 1.5*inch, 0.8*inch, 0.8*inch, 1.2*inch])
            topic_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.darkorange),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('BACKGROUND', (0, 1), (-1, -1), colors.moccasin)
            ]))
            
            elements.append(topic_table)
        else:
            elements.append(Paragraph("Excellent! No topics require immediate attention.", self.body_style))
        
        return elements
        
    def _create_time_analysis(self, evaluation: EvaluationResult) -> List:
        """Create time management analysis"""
        elements = []
        
        elements.append(Paragraph("Time Management Analysis", self.heading_style))
        
        time_analysis = evaluation.time_analysis
        
        # Time statistics
        time_stats = f"""
        <b>Time Statistics:</b><br/>
        • Average time per question: {time_analysis.average_time_per_question:.1f} seconds<br/>
        • Fastest question: {time_analysis.fastest_question_time:.1f} seconds<br/>
        • Slowest question: {time_analysis.slowest_question_time:.1f} seconds<br/>
        • Rushed questions (< 30s): {len(time_analysis.rushed_questions)}<br/>
        • Overthought questions (> 3min): {len(time_analysis.overthought_questions)}
        """
        elements.append(Paragraph(time_stats, self.body_style))
        
        # Time distribution by difficulty
        if time_analysis.time_distribution:
            elements.append(Spacer(1, 10))
            distribution_text = "<b>Average time by difficulty:</b><br/>"
            for difficulty, avg_time in time_analysis.time_distribution.items():
                distribution_text += f"• {difficulty.title()}: {avg_time:.1f} seconds<br/>"
            elements.append(Paragraph(distribution_text, self.body_style))
        
        return elements
        
    def _create_strengths_weaknesses(self, evaluation: EvaluationResult) -> List:
        """Create strengths and weaknesses section"""
        elements = []
        
        elements.append(Paragraph("Strengths & Areas for Improvement", self.heading_style))
        
        # Strengths
        if evaluation.strengths:
            elements.append(Paragraph("<b>Your Strengths:</b>", self.body_style))
            for strength in evaluation.strengths:
                elements.append(Paragraph(f"✓ {strength}", self.body_style))
            elements.append(Spacer(1, 10))
        
        # Weaknesses
        if evaluation.weaknesses:
            elements.append(Paragraph("<b>Areas for Improvement:</b>", self.body_style))
            for weakness in evaluation.weaknesses:
                elements.append(Paragraph(f"• {weakness}", self.body_style))
        
        return elements
        
    def _create_recommendations(self, evaluation: EvaluationResult) -> List:
        """Create AI-generated recommendations section"""
        elements = []
        
        elements.append(Paragraph("Personalized Recommendations", self.heading_style))
        
        if evaluation.recommendations:
            for i, recommendation in enumerate(evaluation.recommendations, 1):
                elements.append(Paragraph(f"{i}. {recommendation}", self.body_style))
                elements.append(Spacer(1, 5))
        else:
            elements.append(Paragraph("Recommendations will be generated based on your performance patterns.", self.body_style))
        
        return elements
        
    def _create_next_steps(self, evaluation: EvaluationResult) -> List:
        """Create next steps section"""
        elements = []
        
        elements.append(Paragraph("Recommended Next Steps", self.heading_style))
        
        # Generate next steps based on performance
        next_steps = []
        metrics = evaluation.metrics
        
        if metrics.accuracy_percentage < 60:
            next_steps.append("Focus on fundamental concept revision before attempting more practice tests")
        
        if metrics.critical_thinking_score < 50:
            next_steps.append("Practice assertion-reason and analytical questions daily")
        
        if metrics.time_management_score < 60:
            next_steps.append("Take timed practice sessions to improve speed and accuracy balance")
        
        # Subject-specific recommendations
        weak_subjects = [s for s in evaluation.subject_analysis if s.accuracy < 50]
        if weak_subjects:
            subject_names = ", ".join([s.subject.value.replace('_', ' ').title() for s in weak_subjects[:3]])
            next_steps.append(f"Prioritize study in: {subject_names}")
        
        # General recommendations
        next_steps.extend([
            "Review incorrect answers to understand mistake patterns",
            "Create a structured study schedule based on weak areas",
            "Take regular mock tests to track improvement"
        ])
        
        for i, step in enumerate(next_steps, 1):
            elements.append(Paragraph(f"{i}. {step}", self.body_style))
            elements.append(Spacer(1, 5))
        
        # Footer
        elements.append(Spacer(1, 20))
        footer_text = "This report is generated by Pragyesh IAS AI evaluation system. Keep practicing and stay motivated!"
        elements.append(Paragraph(footer_text, self.body_style))
        
        return elements
        
    def _get_grade(self, score: float) -> str:
        """Convert score to grade"""
        if score >= 90:
            return "A+"
        elif score >= 80:
            return "A"
        elif score >= 70:
            return "B+"
        elif score >= 60:
            return "B"
        elif score >= 50:
            return "C+"
        elif score >= 40:
            return "C"
        else:
            return "D"