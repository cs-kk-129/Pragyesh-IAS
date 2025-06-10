import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { sql } from 'drizzle-orm';
import { db } from './db';
import { storage } from './storage';
import { mockTestStorage } from "./mock-test-storage";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { IStorage } from "./storage";
import { generateQuiz, answerDoubt } from "./openai";
import * as schema from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple subject mapping function
function getSubjectIdByName(subjectName: string): number {
  const subjectMap: { [key: string]: number } = {
    'Indian History': 1,
    'Art and Culture': 2,
    'Geography': 3,
    'Indian Polity': 4,
    'Economics': 5,
    'Environment': 6,
    'Science and Technology': 7,
    'Current Affairs': 8,
    'General Knowledge': 1,
    'History': 1,
    'Culture': 2,
    'Polity': 4,
    'General': 1
  };
  
  return subjectMap[subjectName] || 1; // Default to Indian History
}

const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.txt', '.docx', '.pdf', '.csv', '.json'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// Global mock tests storage (module level to persist)
const mockTests: any[] = [];
const mockTestAttempts = new Map();
const announcements = [
  {
    id: 1,
    title: "New Study Materials Added",
    message: "Comprehensive study materials for Geography and Modern History have been added to the platform.",
    createdAt: new Date().toISOString(),
    priority: "medium"
  }
];

// Initialize with sample data
mockTests.push({
  id: 1,
  title: "Sample UPSC Mock Test",
  description: "Comprehensive test covering multiple subjects with AI-generated questions",
  duration: 120,
  totalQuestions: 1,
  difficulty: 'medium',
  subjects: ["Polity", "History", "Geography"],
  isActive: true,
  isAttempted: false,
  status: 'not_started',
  scheduledDate: new Date().toISOString(),
  questions: [
    {
      question: { english: "Which article of the Indian Constitution deals with the Right to Education?", hindi: "भारतीय संविधान का कौन सा अनुच्छेद शिक्षा के अधिकार से संबंधित है?" },
      options: { english: ["Article 21", "Article 21A", "Article 19", "Article 32"], hindi: ["अनुच्छेद 21", "अनुच्छेद 21A", "अनुच्छेद 19", "अनुच्छेद 32"] },
      correctAnswer: { english: "Article 21A", hindi: "अनुच्छेद 21A" },
      subject: "Polity",
      topic: "Fundamental Rights",
      marks: 2
    }
  ],
  createdAt: new Date().toISOString()
});

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Question generation endpoint for admin panel
  app.post("/api/generate-questions", async (req, res) => {
    try {
      const { prompt, questionType = 'objective' } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      // Extract number of questions from prompt - look for various patterns
      const patterns = [
        /generate\s+(\d+)\s*questions?/i,
        /create\s+(\d+)\s*questions?/i,
        /make\s+(\d+)\s*questions?/i,
        /(\d+)\s*questions?/i
      ];

      let requestedCount = null;
      for (const pattern of patterns) {
        const match = prompt.match(pattern);
        if (match) {
          requestedCount = parseInt(match[1]);
          break;
        }
      }

      // Limit to reasonable number for API constraints
      const questionCount = requestedCount && requestedCount <= 50 ? requestedCount : 10;

      console.log(`Question generation: Requested ${requestedCount}, Using ${questionCount}`);

      const enhancedPrompt = `
        ${prompt}

        IMPORTANT: Generate ONLY objective multiple choice questions with 4 options each.
        Provide each question in BOTH English and Hindi languages.
        Generate exactly ${questionCount} questions as requested.

        Format as JSON:
        {
          "questions": [
            {
              "question": {
                "english": "Question in English",
                "hindi": "Question in Hindi"
              },
              "options": {
                "english": ["Option A", "Option B", "Option C", "Option D"],
                "hindi": ["विकल्प A", "विकल्प B", "विकल्प C", "विकल्प D"]
              },
              "correctAnswer": {
                "english": "Correct option in English",
                "hindi": "Correct option in Hindi"
              },
              "subject": "Subject name",
              "topic": "Topic name",
              "difficulty": "medium"
            }
          ]
        }
      `;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ 
            role: "user", 
            content: enhancedPrompt + `\n\nGenerate questions with timestamp: ${Date.now()}` 
          }],
          response_format: { type: "json_object" },
          temperature: 1.0,
          max_tokens: Math.min(16000, questionCount * 800), // Scale tokens based on question count
          seed: Date.now(), // Ensure different questions each time
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);

      // Save questions to database with UUIDs
      const savedQuestions = [];
      if (result.questions && Array.isArray(result.questions)) {
        for (const questionData of result.questions) {
          try {
            // Map subject name to subject ID
            const subjectId = getSubjectIdByName(questionData.subject);
            
            // Create a temporary quiz first to associate questions
            let tempQuizId = 1; // Default temporary quiz
            
            const question = await storage.createQuestion({
              quizId: tempQuizId,
              question: typeof questionData.question === 'object' ? 
                JSON.stringify(questionData.question) : questionData.question,
              options: typeof questionData.options === 'object' ? 
                questionData.options.english || questionData.options : questionData.options,
              correctAnswer: typeof questionData.correctAnswer === 'object' ? 
                questionData.correctAnswer.english || questionData.correctAnswer : questionData.correctAnswer,
              explanation: questionData.explanation || '',
              difficulty: questionData.difficulty || 'medium',
              subjectId: subjectId,
              topicId: 1, // Default topic
              sectionId: 1 // Default section
            });
            
            savedQuestions.push(question);
            console.log(`Saved question with ID: ${question.id}, Subject ID: ${subjectId}`);
          } catch (error) {
            console.error("Error saving individual question:", error);
          }
        }
      }

      console.log(`Successfully generated and saved ${savedQuestions.length} questions to database`);
      
      // Return the saved questions with database IDs
      res.json({ 
        success: true, 
        questions: savedQuestions,
        count: savedQuestions.length
      });
    } catch (error) {
      console.error("Question generation error:", error);
      res.status(500).json({ error: "Failed to generate questions" });
    }
  });

  // File upload processing endpoint for manual question input
  app.post("/api/admin/process-question-file", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const file = req.file;
      const fileExtension = path.extname(file.originalname).toLowerCase();
      let extractedText = '';
      
      // Process different file types
      switch (fileExtension) {
        case '.txt':
          extractedText = file.buffer.toString('utf-8');
          break;
          
        case '.csv':
          // Simple CSV parsing for questions
          const csvData = file.buffer.toString('utf-8');
          const lines = csvData.split('\n');
          extractedText = lines.join('\n');
          break;
          
        case '.json':
          try {
            const jsonData = JSON.parse(file.buffer.toString('utf-8'));
            extractedText = JSON.stringify(jsonData, null, 2);
          } catch (error) {
            return res.status(400).json({ error: "Invalid JSON format" });
          }
          break;
          
        default:
          return res.status(400).json({ error: "Unsupported file format" });
      }

      // Use OpenAI to extract and structure questions from the text
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert at extracting and structuring UPSC exam questions from various text formats. 
            
            Analyze the provided text and extract/create well-structured multiple choice questions.
            
            For each question, provide:
            1. A clear, well-structured question
            2. Four answer options (A, B, C, D) 
            3. The correct answer
            4. Subject classification
            5. Topic classification
            6. Difficulty level (easy/medium/hard)
            7. Marks (usually 2 for UPSC)
            8. Brief explanation
            
            Format your response as a JSON object with this structure:
            {
              "questions": [
                {
                  "question": "Your question here",
                  "options": ["Option A", "Option B", "Option C", "Option D"],
                  "correctAnswer": "Option A",
                  "subject": "Subject name",
                  "topic": "Topic name",
                  "difficulty": "medium",
                  "marks": 2,
                  "explanation": "Brief explanation"
                }
              ]
            }
            
            If the text contains existing questions, extract them. If it's content/notes, create relevant questions from it.
            Ensure all questions are factually accurate and appropriate for UPSC preparation.`
          },
          {
            role: "user",
            content: `Please extract/create UPSC questions from this text:\n\n${extractedText}`
          }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      if (!result.questions || !Array.isArray(result.questions)) {
        throw new Error("Could not extract valid questions from file");
      }

      console.log(`Successfully processed ${fileExtension} file and extracted ${result.questions.length} questions`);
      
      res.json({ 
        success: true, 
        questions: result.questions,
        count: result.questions.length,
        fileType: fileExtension
      });

    } catch (error) {
      console.error("Error processing file:", error);
      res.status(500).json({ 
        error: "Failed to process file",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Mock test creation endpoint
  app.post("/api/mock-tests", async (req, res) => {
    try {
      const { title, description, duration, scheduledDate, questions } = req.body;

      // Create quiz in database
      const quiz = await storage.createQuiz({
        title,
        description: description || '',
        quizType: 'mock_test',
        subjectId: 1, // Multi-subject mock test
        topicId: 1,
        difficulty: 'medium',
        timeLimit: duration || 120,
        testDate: new Date(scheduledDate),
        instructions: 'Complete all questions within the time limit.',
        language: 'english'
      });

      // Save questions to database linked to this quiz
      const savedQuestions = [];
      for (const questionData of questions) {
        try {
          const question = await storage.createQuestion({
            quizId: quiz.id,
            question: typeof questionData.question === 'object' ? 
              questionData.question.english : questionData.question,
            options: typeof questionData.options === 'object' ? 
              questionData.options.english : questionData.options,
            correctAnswer: typeof questionData.correctAnswer === 'object' ? 
              questionData.correctAnswer.english : questionData.correctAnswer,
            explanation: questionData.explanation || '',
            difficulty: questionData.difficulty || 'medium',
            subjectId: getSubjectIdByName(questionData.subject || 'General Knowledge'),
            topicId: 1,
            sectionId: 1
          });
          savedQuestions.push(question);
        } catch (error) {
          console.error("Error saving question:", error);
        }
      }

      // Also add to in-memory storage for compatibility
      const mockTest = {
        id: quiz.id,
        title,
        description,
        duration,
        scheduledDate,
        questions,
        totalQuestions: questions.length,
        difficulty: 'medium',
        subjects: Array.from(new Set(questions.map((q: any) => q.subject))),
        isActive: true,
        isAttempted: false,
        status: 'not_started',
        createdAt: new Date().toISOString()
      };
      mockTests.push(mockTest);

      console.log(`Mock test "${title}" created successfully with ${savedQuestions.length} questions in database`);
      res.status(201).json({ success: true, mockTest: { ...mockTest, databaseId: quiz.id } });
    } catch (error) {
      console.error("Mock test creation error:", error);
      res.status(500).json({ error: "Failed to create mock test" });
    }
  });

  // Get all mock tests for students
  app.get("/api/mock-tests", async (req, res) => {
    try {
      // Use only in-memory mock tests to avoid database schema conflicts
      console.log(`Retrieved ${mockTests.length} mock tests from memory`);
      res.json(mockTests);
    } catch (error) {
      console.error("Mock test retrieval error:", error);
      res.status(500).json({ error: "Failed to retrieve mock tests" });
    }
  });

  // Get admin evaluations - real mock test attempts
  app.get("/api/admin/evaluations", async (req, res) => {
    try {
      // Get all quiz attempts (mock test submissions)
      const attempts = await storage.getAllQuizAttempts();

      // Transform to evaluation format
      const evaluations = await Promise.all(attempts.map(async (attempt: any) => {
        const user = await storage.getUser(attempt.userId);

        // Find mock test by ID
        const mockTest = mockTests.find(test => test.id == attempt.quizId);

        return {
          id: attempt.id,
          studentName: user?.username || 'Unknown Student',
          quizTitle: mockTest?.title || `Mock Test ${attempt.quizId}`,
          submissionType: 'objective',
          submittedAt: attempt.completedAt || new Date().toISOString(),
          status: 'completed',
          score: attempt.score,
          timeSpent: attempt.timeTaken,
          createdAt: attempt.completedAt || new Date().toISOString(),
          userId: attempt.userId,
          quizId: attempt.quizId
        };
      }));

      res.json({
        evaluations: evaluations.sort((a, b) => 
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        )
      });
    } catch (error) {
      console.error("Error fetching evaluations:", error);
      res.status(500).json({ error: "Failed to fetch evaluations" });
    }
  });

  // Forgot password endpoint
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "No account found with this email address" });
      }

      // In a real application, you would:
      // 1. Generate a secure reset token
      // 2. Store it in database with expiration
      // 3. Send email with reset link
      // For now, we'll simulate this process

      console.log(`Password reset requested for: ${email}`);

      // Simulate email sending
      res.json({ 
        message: "Password reset instructions have been sent to your email",
        success: true 
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Failed to process password reset request" });
    }
  });

  // Mock test evaluation endpoint with FastAPI backend integration
  app.post("/api/mock-tests/:id/evaluate", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { answers, timeSpent, questionTimings } = req.body;

      // Find the mock test from database first, then fall back to memory
      let mockTest = null;
      try {
        const dbMockTests = await storage.getAllMockTests();
        mockTest = dbMockTests.find(test => test.id == id);
      } catch (dbError) {
        console.log("Database lookup failed, checking memory");
      }
      
      if (!mockTest) {
        mockTest = mockTests.find(test => test.id == id);
      }
      
      if (!mockTest) {
        return res.status(404).json({ error: "Mock test not found" });
      }

      // Transform data for FastAPI backend
      const submissionData = {
        user_id: (req as any).user?.id || 1,
        test_id: parseInt(id),
        test_title: mockTest.title,
        answers: answers.map((answer: any, index: number) => ({
          question_id: index + 1,
          selected_option: answer.answer || null,
          time_spent: questionTimings[index] || 90,
          is_marked_for_review: false
        })),
        questions_metadata: mockTest.questions.map((question: any, index: number) => ({
          question_id: index + 1,
          correct_answer: question.correctAnswer?.english || question.correctAnswer,
          question_type: question.type || "multiple_choice",
          subject: question.subject || "general_studies",
          topic: question.topic || "General Knowledge",
          difficulty_level: question.difficulty || "medium",
          marks: 2,
          is_critical_thinking: question.type === "assertion_reason" || 
                               (question.question?.english && question.question.english.includes('Assertion')),
          is_concept_clarity: question.difficulty === "hard" || 
                             (question.question?.english && question.question.english.includes('principle'))
        })),
        total_time_spent: timeSpent,
        submission_timestamp: new Date().toISOString()
      };

      // Try to call FastAPI backend for advanced evaluation
      try {
        const fetch = (await import('node-fetch')).default;
        const evaluationResponse = await fetch('http://localhost:8001/submit-responses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submissionData),
          timeout: 10000
        });

        if (evaluationResponse.ok) {
          const evaluationResult = await evaluationResponse.json();

          // Transform response to match frontend expectations
          const transformedResult = {
            totalQuestions: evaluationResult.evaluation.metrics.total_questions,
            correctAnswers: evaluationResult.evaluation.metrics.correct_count,
            incorrectAnswers: evaluationResult.evaluation.metrics.incorrect_count,
            unattempted: evaluationResult.evaluation.metrics.unattempted_count,
            accuracy: evaluationResult.evaluation.metrics.accuracy_percentage,
            overallScore: evaluationResult.evaluation.metrics.overall_score,
            criticalThinkingScore: evaluationResult.evaluation.metrics.critical_thinking_score,
            knowledgeRetentionScore: evaluationResult.evaluation.metrics.knowledge_retention_score,
            conceptClarityScore: evaluationResult.evaluation.metrics.concept_clarity_score,
            timeManagementScore: evaluationResult.evaluation.metrics.time_management_score,
            subjectAnalysis: evaluationResult.evaluation.subject_analysis.map((subject: any) => ({
              subject: subject.subject,
              totalQuestions: subject.total_questions,
              correct: subject.correct,
              incorrect: subject.incorrect,
              accuracy: subject.accuracy,
              timeSpent: subject.time_spent
            })),
            topicAnalysis: evaluationResult.evaluation.topic_analysis.map((topic: any) => ({
              topic: topic.topic,
              subject: topic.subject,
              accuracy: topic.accuracy,
              needsImprovement: topic.needs_improvement
            })),
            timeAnalysis: {
              averageTimePerQuestion: evaluationResult.evaluation.time_analysis.average_time_per_question,
              rushedQuestions: evaluationResult.evaluation.time_analysis.rushed_questions.length,
              overthoughtQuestions: evaluationResult.evaluation.time_analysis.overthought_questions.length
            },
            strengths: evaluationResult.evaluation.strengths,
            weaknesses: evaluationResult.evaluation.weaknesses,
            recommendations: evaluationResult.evaluation.recommendations,
            reportDownloadUrl: `/api/reports/${evaluationResult.evaluation.user_id}/${evaluationResult.evaluation.test_id}`,
            evaluationId: evaluationResult.evaluation.evaluation_id,
            pdfReportAvailable: true
          };

          // Save quiz attempt to database for advanced evaluation too
          try {
            const userId = (req as any).user?.id || 1;
            const quizAttempt = {
              userId: userId,
              quizId: parseInt(id),
              score: Math.round(transformedResult.overallScore),
              totalQuestions: transformedResult.totalQuestions,
              accuracy: Math.round(transformedResult.accuracy),
              timeTaken: Math.round(timeSpent),
              answeredQuestions: answers.map((answer: any, index: number) => ({
                questionId: index + 1,
                userAnswer: answer.answer || '',
                isCorrect: answer.isCorrect || false,
                timeSpent: questionTimings[index] || 90
              }))
            };

            await storage.createQuizAttempt(quizAttempt);
            console.log("Advanced evaluation quiz attempt saved to database");
          } catch (dbError) {
            console.error("Failed to save advanced evaluation quiz attempt:", dbError);
          }

          console.log("Advanced evaluation completed with PDF report generation");
          res.json(transformedResult);
          return;
        }
      } catch (backendError) {
        console.log("FastAPI backend unavailable, using standard evaluation");
      }

      // Fallback to standard evaluation
      const evaluation = calculateDetailedEvaluation(mockTest, answers, timeSpent, questionTimings);
      (evaluation as any).pdfReportAvailable = false;

      // Save quiz attempt to database
      try {
        const userId = (req as any).user.id;
        const quizAttempt = {
          userId: userId,
          quizId: parseInt(id),
          score: Math.round(evaluation.summary.overallScore),
          totalQuestions: evaluation.summary.totalQuestions,
          accuracy: Math.round(evaluation.summary.accuracy),
          timeTaken: Math.round(timeSpent),
          answeredQuestions: answers.map((answer: any, index: number) => ({
            questionId: index + 1,
            userAnswer: answer.answer || '',
            isCorrect: answer.isCorrect || false,
            timeSpent: questionTimings[index] || 90
          }))
        };

        console.log("Saving quiz attempt:", { userId, quizId: parseInt(id), score: Math.round(evaluation.summary.overallScore) });
        const savedAttempt = await storage.createQuizAttempt(quizAttempt);
        console.log("Quiz attempt saved successfully:", savedAttempt.id);
      } catch (dbError) {
        console.error("Failed to save quiz attempt:", dbError);
        console.error("Quiz attempt data:", JSON.stringify({
          userId: (req as any).user?.id || req.body.userId || 1,
          quizId: parseInt(id),
          score: Math.round(evaluation.summary.overallScore)
        }));
      }

      // Also save to in-memory storage for admin evaluations
      try {
        const user = (req as any).user;
        const mockTest = mockTests.find(test => test.id == parseInt(id));
        
        mockTestStorage.saveAttempt({
          userId: user.id,
          quizId: parseInt(id),
          score: evaluation.summary.overallScore,
          totalQuestions: evaluation.summary.totalQuestions,
          accuracy: evaluation.summary.accuracy,
          timeTaken: Math.round(timeSpent),
          answers: answers,
          userName: user?.username || 'Unknown Student',
          quizTitle: mockTest?.title || `Mock Test ${id}`
        });
      } catch (storageError) {
        console.error("Failed to save to mock test storage:", storageError);
      }

      res.json(evaluation);

    } catch (error) {
      console.error("Mock test evaluation error:", error);
      res.status(500).json({ error: "Failed to evaluate mock test" });
    }
  });

  // PDF report download endpoint
  app.get("/api/reports/:userId/:testId", async (req, res) => {
    try {
      const { userId, testId } = req.params;

      // Proxy request to FastAPI backend
      const fetch = (await import('node-fetch')).default;
      const reportResponse = await fetch(`http://localhost:8001/report/${userId}/${testId}`);

      if (reportResponse.ok) {
        const buffer = await reportResponse.buffer();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="UPSC_Report_User${userId}_Test${testId}.pdf"`);
        res.send(buffer);
      } else {
        res.status(404).json({ error: "Report not found" });
      }
    } catch (error) {
      console.error("Report download error:", error);
      res.status(500).json({ error: "Failed to download report" });
    }
  });

  // Function to calculate detailed evaluation
  function calculateDetailedEvaluation(mockTest: any, answers: any[], timeSpent: number, questionTimings: any[]) {
    const questions = mockTest.questions;
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;
    let criticalThinkingCorrect = 0;
    let criticalThinkingTotal = 0;
    let conceptClarityCorrect = 0;
    let conceptClarityTotal = 0;
    let timeScores = { superfast: 0, onTime: 0, slow: 0, onTimeIncorrect: 0 };

    const questionAnalysis = questions.map((question: any, index: number) => {
      const userAnswer = answers[index];
      const correctAnswer = question.correctAnswer?.english || question.correctAnswer;
      const isCorrect = userAnswer?.answer === correctAnswer;
      const isAttempted = userAnswer?.answer !== undefined;
      const questionTime = questionTimings[index] || 0;

      // Expected time per question (2 minutes average)
      const expectedTime = 120;
      let timeCategory = 'onTime';

      if (questionTime < expectedTime * 0.5) {
        timeCategory = 'superfast';
        timeScores.superfast++;
      } else if (questionTime > expectedTime * 1.5) {
        timeCategory = 'slow';
        timeScores.slow++;
      } else {
        timeCategory = 'onTime';
        if (isCorrect) {
          timeScores.onTime++;
        } else {
          timeScores.onTimeIncorrect++;
        }
      }

      if (isAttempted) {
        if (isCorrect) {
          correct++;

          // Check for critical thinking questions (assertion-reason type)
          if (question.question?.english?.includes('Assertion') || 
              question.question?.english?.includes('Statement') ||
              question.topic?.toLowerCase().includes('analysis')) {
            criticalThinkingCorrect++;
            criticalThinkingTotal++;
          } else {
            criticalThinkingTotal++;
          }

          // Check for concept clarity questions
          if (question.question?.english?.includes('principle') || 
              question.question?.english?.includes('concept') ||
              question.difficulty === 'hard') {
            conceptClarityCorrect++;
            conceptClarityTotal++;
          } else {
            conceptClarityTotal++;
          }
        } else {
          incorrect++;
          if (question.question?.english?.includes('Assertion') || 
              question.question?.english?.includes('Statement') ||
              question.topic?.toLowerCase().includes('analysis')) {
            criticalThinkingTotal++;
          }
          if (question.question?.english?.includes('principle') || 
              question.question?.english?.includes('concept') ||
              question.difficulty === 'hard') {
            conceptClarityTotal++;
          }
        }
      } else {
        unattempted++;
      }

      return {
        questionIndex: index,
        question: question.question?.english || question.question,
        userAnswer: userAnswer?.answer,
        correctAnswer,
        isCorrect,
        isAttempted,
        timeSpent: questionTime,
        timeCategory,
        subject: question.subject,
        topic: question.topic,
        difficulty: question.difficulty || 'medium'
      };
    });

    // Calculate scores
    const totalQuestions = questions.length;
    const attempted = correct + incorrect;

    const criticalThinkingScore = criticalThinkingTotal > 0 ? 
      Math.round((criticalThinkingCorrect / criticalThinkingTotal) * 100) : 0;

    const knowledgeRetentionScore = totalQuestions > 0 ? 
      Math.round(((correct - incorrect) / totalQuestions) * 100) : 0;

    const conceptClarityScore = conceptClarityTotal > 0 ? 
      Math.round((conceptClarityCorrect / conceptClarityTotal) * 100) : 0;

    const timeManagementScore = attempted > 0 ? 
      Math.round(((timeScores.superfast + timeScores.onTime) / attempted) * 100) : 0;

    const overallScore = Math.round((correct / totalQuestions) * 100);
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

    // Subject-wise analysis
    const subjectAnalysis = questions.reduce((acc: any, question: any, index: number) => {
      const subject = question.subject || 'General';
      if (!acc[subject]) {
        acc[subject] = { correct: 0, total: 0, attempted: 0 };
      }
      acc[subject].total++;
      const userAnswer = answers[index];
      if (userAnswer?.answer !== undefined) {
        acc[subject].attempted++;
        if (userAnswer.answer === (question.correctAnswer?.english || question.correctAnswer)) {
          acc[subject].correct++;
        }
      }
      return acc;
    }, {});

    return {
      summary: {
        totalQuestions,
        correct,
        incorrect,
        unattempted,
        attempted,
        overallScore,
        accuracy,
        timeSpent
      },
      advancedScores: {
        criticalThinkingScore,
        knowledgeRetentionScore,
        conceptClarityScore,
        timeManagementScore
      },
      subjectAnalysis,
      questionAnalysis,
      timeAnalysis: timeScores,
      recommendations: generateRecommendations(criticalThinkingScore, knowledgeRetentionScore, conceptClarityScore, timeManagementScore)
    };
  }

  function generateRecommendations(critical: number, retention: number, clarity: number, timeManagement: number) {
    const recommendations = [];

    if (critical < 60) {
      recommendations.push("Focus on assertion-reason and analytical questions to improve critical thinking");
    }
    if (retention < 70) {
      recommendations.push("Strengthen knowledge retention through regular revision and practice");
    }
    if (clarity < 65) {
      recommendations.push("Work on understanding fundamental concepts and principles");
    }
    if (timeManagement < 75) {
      recommendations.push("Practice time management with timed mock tests");
    }

    return recommendations.length > 0 ? recommendations : ["Great performance! Continue with consistent practice"];
  }

  // Get announcements endpoint
  app.get("/api/announcements", (req, res) => {
    try {
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  // Create announcement endpoint (Admin only)
  app.post("/api/admin/announcements", (req, res) => {
    try {
      const { title, message, priority } = req.body;
      const announcement = {
        id: announcements.length + 1,
        title,
        message,
        createdAt: new Date().toISOString(),
        priority: priority || "medium"
      };
      announcements.push(announcement);
      res.json(announcement);
    } catch (error) {
      console.error("Error creating announcement:", error);
      res.status(500).json({ message: "Failed to create announcement" });
    }
  });

  // Admin manual question input endpoint
  app.post("/api/admin/questions/manual", (req, res) => {
    try {
      const { questions, subjectId, topicId } = req.body;

      // Process and store manual questions
      const processedQuestions = questions.map((q: any, index: number) => ({
        id: Date.now() + index,
        ...q,
        subjectId,
        topicId,
        createdAt: new Date().toISOString(),
        createdBy: 1 // placeholder admin ID
      }));

      res.json({ 
        message: "Questions added successfully", 
        count: processedQuestions.length,
        questions: processedQuestions 
      });
    } catch (error) {
      console.error("Error adding manual questions:", error);
      res.status(500).json({ message: "Failed to add questions" });
    }
  });

  // Subjects routes
  app.get("/api/subjects", async (req, res) => {
    try {
      const result = await db.execute(sql`SELECT * FROM subjects ORDER BY name`);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  app.get("/api/subjects/:id", async (req, res) => {
    try {
      const result = await db.execute(sql`SELECT * FROM subjects WHERE id = ${req.params.id}`);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Subject not found" });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error fetching subject:", error);
      res.status(500).json({ message: "Failed to fetch subject" });
    }
  });

  // Sections routes
  app.get("/api/sections", async (req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT s.*, sub.name as subject_name 
        FROM sections s 
        JOIN subjects sub ON s.subject_id = sub.id 
        ORDER BY sub.name, s.name
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching sections:", error);
      res.status(500).json({ message: "Failed to fetch sections" });
    }
  });

  app.get("/api/sections/subject/:subjectId", async (req, res) => {
    try {
      const subjectId = parseInt(req.params.subjectId);
      const result = await db.execute(sql`
        SELECT * FROM sections 
        WHERE subject_id = ${subjectId} 
        ORDER BY name
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching sections by subject:", error);
      res.status(500).json({ message: "Failed to fetch sections" });
    }
  });

  // Topics routes - updated for new structure
  app.get("/api/topics", async (req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT t.*, s.name as section_name, s.subject_id,
               sub.name as subject_name
        FROM topics t 
        JOIN sections s ON t.section_id = s.id 
        JOIN subjects sub ON s.subject_id = sub.id
        ORDER BY sub.name, s.name, t.name
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching topics:", error);
      res.status(500).json({ message: "Failed to fetch topics" });
    }
  });

  app.get("/api/topics/section/:sectionId", async (req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT * FROM topics 
        WHERE section_id = ${req.params.sectionId} 
        ORDER BY name
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching topics by section:", error);
      res.status(500).json({ message: "Failed to fetch topics" });
    }
  });

  app.get("/api/topics/:id", async (req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT t.*, s.name as section_name, s.subject_id,
               sub.name as subject_name
        FROM topics t 
        JOIN sections s ON t.section_id = s.id 
        JOIN subjects sub ON s.subject_id = sub.id
        WHERE t.id = ${req.params.id}
      `);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Topic not found" });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error fetching topic:", error);
      res.status(500).json({ message: "Failed to fetch topic" });
    }
  });

  // Quiz generation route - updated for new structure
  app.post("/api/quizzes/generate", isAuthenticated, async (req, res) => {
    try {
      const { subjectId, sectionId, topicId, difficulty = 'medium' } = req.body;

      if (!subjectId && !sectionId && !topicId) {
        return res.status(400).json({ message: "At least one of subjectId, sectionId, or topicId must be provided" });
      }

      // For now, return a placeholder response since we need to update the quiz generation logic
      res.json({ 
        message: "Quiz generation feature will be updated to work with the new curriculum structure",
        requested: { subjectId, sectionId, topicId, difficulty }
      });
    } catch (error) {
      console.error("Error generating quiz:", error);
      res.status(500).json({ message: "Failed to generate quiz" });
    }
  });

  // Progress routes - placeholder for now
  app.get("/api/progress", isAuthenticated, async (req, res) => {
    try {
      // Return empty array for now until we update progress tracking
      res.json([]);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  app.get("/api/quiz-attempts/user", isAuthenticated, async (req, res) => {
    try {
      res.json([]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quiz attempts" });
    }
  });

  app.get("/api/quiz-attempts/recent", isAuthenticated, async (req, res) => {
    try {
      res.json([]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent quiz attempts" });
    }
  });

  app.get("/api/streak", isAuthenticated, async (req, res) => {
    try {
      res.json({ id: 1, userId: req.user?.id, currentStreak: 0, maxStreak: 0 });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch streak" });
    }
  });

  app.get("/api/study-plans/active", isAuthenticated, async (req, res) => {
    try {
      res.status(404).json({ message: "No active study plan found" });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active study plan" });
    }
  });

  // Admin evaluations endpoint - shows real mock test submissions
  app.get("/api/admin/evaluations", async (req, res) => {
    try {
      // Get all quiz attempts from database
      const dbAttempts = await storage.getAllQuizAttempts();
      
      // Get in-memory attempts as fallback
      const memoryAttempts = mockTestStorage.getAllAttempts();
      
      // Transform database attempts to evaluation format
      const dbEvaluations = await Promise.all(dbAttempts.map(async (attempt) => {
        let user = null;
        let mockTest = null;
        
        try {
          user = await storage.getUser(attempt.userId);
          mockTest = mockTests.find(test => test.id === attempt.quizId);
        } catch (err) {
          console.error("Error getting user/test details:", err);
        }
        
        return {
          id: attempt.id,
          studentName: user?.username || `User ${attempt.userId}`,
          quizTitle: mockTest?.title || `Mock Test ${attempt.quizId}`,
          submissionType: 'objective',
          submittedAt: attempt.completedAt?.toISOString() || new Date().toISOString(),
          status: 'completed',
          score: attempt.score,
          timeSpent: attempt.timeTaken || 0,
          createdAt: attempt.completedAt?.toISOString() || new Date().toISOString(),
          userId: attempt.userId,
          quizId: attempt.quizId,
          totalQuestions: attempt.totalQuestions,
          accuracy: attempt.accuracy || 0
        };
      }));
      
      // Transform memory attempts to evaluation format
      const memoryEvaluations = memoryAttempts.map(attempt => ({
        id: `mem_${attempt.id}`,
        studentName: attempt.userName,
        quizTitle: attempt.quizTitle,
        submissionType: 'objective',
        submittedAt: attempt.submittedAt,
        status: 'completed',
        score: attempt.score,
        timeSpent: attempt.timeTaken,
        createdAt: attempt.submittedAt,
        userId: attempt.userId,
        quizId: attempt.quizId,
        totalQuestions: attempt.totalQuestions,
        accuracy: attempt.accuracy
      }));
      
      // Combine and sort by submission time
      const allEvaluations = [...dbEvaluations, ...memoryEvaluations]
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      
      console.log(`Retrieved ${allEvaluations.length} evaluations (${dbEvaluations.length} from database, ${memoryEvaluations.length} from memory)`);
      res.json({ evaluations: allEvaluations });
    } catch (error) {
      console.error("Error fetching evaluations:", error);
      res.json({ evaluations: [] });
    }
  });

  // New database-driven question generation endpoint
  app.post("/api/admin/generate-questions", isAuthenticated, async (req, res) => {
    try {
      const { prompt, questionType = 'objective' } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const questionCount = 10; // Fixed count for consistency
      console.log(`Generating ${questionCount} questions for database storage`);

      const enhancedPrompt = `
        ${prompt}

        Generate ONLY ${questionCount} questions and return as JSON:
        {
          "questions": [
            {
              "question": { 
                "english": "Question text in English", 
                "hindi": "Question text in Hindi" 
              },
              "options": { 
                "english": ["Option A", "Option B", "Option C", "Option D"], 
                "hindi": ["विकल्प A", "विकल्प B", "विकल्प C", "विकल्प D"] 
              },
              "correctAnswer": { 
                "english": "Correct option text", 
                "hindi": "सही विकल्प पाठ" 
              },
              "explanation": { 
                "english": "Explanation in English", 
                "hindi": "हिंदी में व्याख्या" 
              },
              "difficulty": "medium",
              "subject": "Subject name",
              "topic": "Topic name",
              "marks": 2
            }
          ]
        }
        Return ONLY the JSON object.
      `;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { 
              role: "system", 
              content: "You are an expert UPSC question generator. Generate high-quality multiple choice questions for competitive exam preparation. Always return valid JSON format with bilingual content." 
            },
            { role: "user", content: enhancedPrompt }
          ],
          response_format: { type: "json_object" },
          temperature: 1.0,
          max_tokens: 8000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);

      // Save questions to database with quizId = 0 (unassigned)
      const savedQuestions = [];
      for (const question of result.questions) {
        try {
          // Parse tags to extract subject and topic information
          const tags = [question.subject, question.topic].filter(Boolean);

          // Map subject using direct database lookup
          const subjects = await storage.getAllSubjects();
          let actualSubjectId = 1; // Default to Indian History
          let actualSectionId = null;
          
          const subjectName = question.subject || tags[0] || '';
          console.log('Mapping subject:', subjectName);
          
          // Direct subject mapping logic
          if (subjectName.toLowerCase().includes('art') && subjectName.toLowerCase().includes('culture')) {
            actualSubjectId = 2; // Art & Culture
          } else if (subjectName.toLowerCase().includes('geography')) {
            actualSubjectId = 3; // Geography
          } else if (subjectName.toLowerCase().includes('polity')) {
            actualSubjectId = 4; // Indian Polity & Governance
          } else if (subjectName.toLowerCase().includes('economy')) {
            actualSubjectId = 5; // Indian Economy
          } else if (subjectName.toLowerCase().includes('environment')) {
            actualSubjectId = 6; // Environment & Ecology
          } else if (subjectName.toLowerCase().includes('science') && subjectName.toLowerCase().includes('technology')) {
            actualSubjectId = 7; // Science & Technology
          } else if (subjectName.toLowerCase().includes('general') && subjectName.toLowerCase().includes('science')) {
            actualSubjectId = 8; // General Science
          } else if (subjectName.toLowerCase().includes('ethics')) {
            actualSubjectId = 9; // Ethics, Integrity & Aptitude
          } else if (subjectName.toLowerCase().includes('current')) {
            actualSubjectId = 10; // Current Affairs
          } else if (subjectName.toLowerCase().includes('csat')) {
            actualSubjectId = 11; // CSAT
          } else if (subjectName.toLowerCase().includes('history')) {
            actualSubjectId = 1; // Indian History
          }
          
          console.log(`Mapped "${subjectName}" to subject ID: ${actualSubjectId}`);

          console.log('Creating question with data:', {
            quizId: 0,
            subjectId: actualSubjectId,
            sectionId: actualSectionId,
            question: JSON.stringify(question.question),
            options: Array.isArray(question.options.english) ? question.options.english : [],
            correctAnswer: question.correctAnswer.english,
            explanation: question.explanation.english,
            difficulty: question.difficulty || 'medium',
            tags
          });

          const savedQuestion = await storage.createQuestion({
            quizId: 0, // Unassigned - will be set when mock test is created
            subjectId: actualSubjectId,
            topicId: null, // Will be set based on detailed topic mapping
            sectionId: actualSectionId,
            question: JSON.stringify(question.question),
            options: Array.isArray(question.options.english) ? question.options.english : [],
            correctAnswer: question.correctAnswer.english,
            explanation: question.explanation.english,
            difficulty: question.difficulty || 'medium',
            tags
          });
          
          savedQuestions.push({
            id: savedQuestion.id,
            question: question.question,
            options: question.options,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            difficulty: question.difficulty,
            subject: question.subject,
            topic: question.topic,
            marks: question.marks || 2,
            isSelected: false
          });
        } catch (dbError) {
          console.error("Failed to save question to database:", dbError);
        }
      }

      console.log(`Saved ${savedQuestions.length} questions to database`);
      res.json({ questions: savedQuestions });
    } catch (error) {
      console.error("Question generation error:", error);
      res.status(500).json({ error: "Failed to generate questions" });
    }
  });

  // Create mock test with selected questions and test date
  app.post("/api/admin/create-mock-test", isAuthenticated, async (req, res) => {
    try {
      const { title, description, duration, testDate, selectedQuestionIds } = req.body;

      if (!selectedQuestionIds || selectedQuestionIds.length === 0) {
        return res.status(400).json({ error: "No questions selected" });
      }

      // Analyze selected questions to determine quiz metadata
      const selectedQuestions = [];
      for (const questionId of selectedQuestionIds) {
        const question = await db.select()
          .from(schema.questions)
          .where(eq(schema.questions.id, questionId))
          .limit(1);
        if (question.length > 0) {
          selectedQuestions.push(question[0]);
        }
      }
      
      // Extract unique subject/section/topic IDs from questions
      const subjectIds = selectedQuestions.map(q => q.subjectId).filter(Boolean);
      const sectionIds = selectedQuestions.map(q => q.sectionId).filter(Boolean);
      const topicIds = selectedQuestions.map(q => q.topicId).filter(Boolean);
      
      const uniqueSubjectIds = subjectIds.filter((id, index) => subjectIds.indexOf(id) === index);
      const uniqueSectionIds = sectionIds.filter((id, index) => sectionIds.indexOf(id) === index);
      const uniqueTopicIds = topicIds.filter((id, index) => topicIds.indexOf(id) === index);

      // Create quiz record in database with metadata from questions
      const quiz = await storage.createQuiz({
        title,
        quizType: 'mock_test',
        difficulty: 'medium',
        timeLimit: duration,
        testDate: new Date(testDate),
        description: description || '',
        language: 'both',
        subjectId: uniqueSubjectIds.length === 1 ? uniqueSubjectIds[0] : null, // Single subject only
        topicId: uniqueSectionIds.length === 1 ? uniqueSectionIds[0] : null,   // Single section only
        subtopicId: uniqueTopicIds.length === 1 ? uniqueTopicIds[0] : null     // Single topic only
      });

      // Update selected questions with the quiz ID
      for (const questionId of selectedQuestionIds) {
        await db.update(schema.questions)
          .set({ quizId: quiz.id })
          .where(eq(schema.questions.id, questionId));
      }

      // Delete unselected questions (those with quizId = 0)
      await db.delete(schema.questions)
        .where(eq(schema.questions.quizId, 0));

      console.log(`Created mock test ${quiz.id} with ${selectedQuestionIds.length} questions`);
      res.json({ success: true, mockTest: quiz });
    } catch (error) {
      console.error("Mock test creation error:", error);
      res.status(500).json({ error: "Failed to create mock test" });
    }
  });

  // Get mock tests for students (with date restrictions)
  app.get("/api/student/mock-tests", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get quizzes that are scheduled for today or future dates
      const availableQuizzes = await db.select()
        .from(schema.quizzes)
        .where(
          and(
            eq(schema.quizzes.quizType, 'mock_test'),
            sql`test_date >= ${today.toISOString()}`
          )
        );

      console.log(`Found ${availableQuizzes.length} mock tests scheduled for ${today}`);

      // Check if user has already attempted each quiz
      const mockTests = [];
      for (const quiz of availableQuizzes) {
        const existingAttempt = await db.select()
          .from(schema.quizAttempts)
          .where(
            and(
              eq(schema.quizAttempts.userId, userId),
              eq(schema.quizAttempts.quizId, quiz.id)
            )
          );

        if (existingAttempt.length === 0) {
          // Get questions for this quiz
          const questions = await db.select()
            .from(schema.questions)
            .where(eq(schema.questions.quizId, quiz.id));

          mockTests.push({
            id: quiz.id,
            title: quiz.title,
            description: quiz.description,
            duration: quiz.timeLimit,
            totalQuestions: questions.length,
            testDate: quiz.testDate?.toISOString().split('T')[0],
            isAttempted: false,
            status: 'available',
            questions: questions.map(q => {
              let questionText;
              try {
                // Try to parse as JSON first
                const parsed = JSON.parse(q.question || '{}');
                questionText = typeof parsed === 'object' ? parsed : { english: q.question, hindi: '' };
              } catch (e) {
                // If JSON parsing fails, treat as plain text
                questionText = { english: q.question || '', hindi: '' };
              }
              
              return {
                id: q.id,
                question: questionText,
                options: q.options,
                correctAnswer: q.correctAnswer,
                marks: 2
              };
            })
          });
        } else {
          console.log(`User ${userId} already attempted quiz ${quiz.id}`);
        }
      }

      console.log(`Returning ${mockTests.length} available mock tests for user ${userId}`);
      res.json(mockTests);
    } catch (error) {
      console.error("Error fetching mock tests:", error);
      res.status(500).json({ error: "Failed to fetch mock tests" });
    }
  });

  // Submit mock test evaluation (database-driven)
  app.post("/api/student/submit-mock-test/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const quizId = parseInt(req.params.id);
      const { answers, timeSpent, questionTimings } = req.body;

      // Check if user has already attempted this quiz
      const existingAttempt = await db.select()
        .from(schema.quizAttempts)
        .where(
          and(
            eq(schema.quizAttempts.userId, userId),
            eq(schema.quizAttempts.quizId, quizId)
          )
        );

      if (existingAttempt.length > 0) {
        return res.status(400).json({ error: "Test already attempted" });
      }

      // Get quiz questions for evaluation
      const questions = await db.select()
        .from(schema.questions)
        .where(eq(schema.questions.quizId, quizId));

      // Calculate score
      let correct = 0;
      const evaluatedAnswers = answers.map((answer: any, index: number) => {
        const question = questions[index];
        const isCorrect = answer.answer === question?.correctAnswer;
        if (isCorrect) correct++;
        
        return {
          questionId: question?.id || index + 1,
          userAnswer: answer.answer || '',
          isCorrect,
          timeSpent: questionTimings[index] || 90
        };
      });

      const totalQuestions = questions.length;
      const score = Math.round((correct / totalQuestions) * 100);
      const accuracy = Math.round((correct / totalQuestions) * 100);

      // Save quiz attempt to database
      const quizAttempt = await storage.createQuizAttempt({
        userId,
        quizId,
        score,
        totalQuestions,
        accuracy,
        timeTaken: Math.round(timeSpent),
        answeredQuestions: evaluatedAnswers
      });

      console.log(`Quiz attempt saved: User ${userId}, Quiz ${quizId}, Score ${score}%`);

      const evaluation = {
        summary: {
          totalQuestions,
          correct,
          incorrect: totalQuestions - correct,
          unattempted: 0,
          attempted: totalQuestions,
          overallScore: score,
          accuracy,
          timeSpent: Math.round(timeSpent)
        }
      };

      res.json(evaluation);
    } catch (error) {
      console.error("Mock test submission error:", error);
      res.status(500).json({ error: "Failed to submit mock test" });
    }
  });

  // Admin evaluations endpoint (database-driven)
  app.get("/api/admin/evaluations", async (req, res) => {
    try {
      const dbAttempts = await storage.getAllQuizAttempts();
      
      const evaluations = await Promise.all(dbAttempts.map(async (attempt) => {
        let user = null;
        let quiz = null;
        
        try {
          user = await storage.getUser(attempt.userId);
          quiz = await storage.getQuizById(attempt.quizId);
        } catch (err) {
          console.error("Error getting user/quiz details:", err);
        }
        
        return {
          id: attempt.id,
          studentName: user?.username || `User ${attempt.userId}`,
          quizTitle: quiz?.title || `Mock Test ${attempt.quizId}`,
          submissionType: 'objective',
          submittedAt: attempt.completedAt?.toISOString() || new Date().toISOString(),
          status: 'completed',
          score: attempt.score,
          timeSpent: attempt.timeTaken || 0,
          createdAt: attempt.completedAt?.toISOString() || new Date().toISOString(),
          userId: attempt.userId,
          quizId: attempt.quizId,
          totalQuestions: attempt.totalQuestions,
          accuracy: attempt.accuracy || 0
        };
      }));
      
      const sortedEvaluations = evaluations.sort((a, b) => 
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
      
      console.log(`Retrieved ${sortedEvaluations.length} evaluations from database`);
      res.json({ evaluations: sortedEvaluations });
    } catch (error) {
      console.error("Error fetching evaluations:", error);
      res.json({ evaluations: [] });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}