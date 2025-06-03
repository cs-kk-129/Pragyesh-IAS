import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { sql } from 'drizzle-orm';
import { db } from './db';
import { storage } from './storage';

const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

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
      
      res.json(result);
    } catch (error) {
      console.error("Question generation error:", error);
      res.status(500).json({ error: "Failed to generate questions" });
    }
  });



  // Mock test creation endpoint
  app.post("/api/mock-tests", async (req, res) => {
    try {
      const { title, description, duration, scheduledDate, questions } = req.body;
      
      const mockTest = {
        id: Date.now(),
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
      
      // Store the mock test
      mockTests.push(mockTest);
      
      res.status(201).json({ success: true, mockTest });
    } catch (error) {
      console.error("Mock test creation error:", error);
      res.status(500).json({ error: "Failed to create mock test" });
    }
  });

  // Get all mock tests for students
  app.get("/api/mock-tests", async (req, res) => {
    try {
      res.json(mockTests);
    } catch (error) {
      console.error("Error fetching mock tests:", error);
      res.status(500).json({ error: "Failed to fetch mock tests" });
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
  app.post("/api/mock-tests/:id/evaluate", async (req, res) => {
    try {
      const { id } = req.params;
      const { answers, timeSpent, questionTimings } = req.body;
      
      // Find the mock test
      const mockTest = mockTests.find(test => test.id == id);
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
              score: transformedResult.overallScore,
              totalQuestions: transformedResult.totalQuestions,
              accuracy: transformedResult.accuracy,
              timeTaken: timeSpent,
              answeredQuestions: answers,
              startedAt: new Date(Date.now() - timeSpent * 1000),
              completedAt: new Date()
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
        const userId = (req as any).user?.id || 1;
        const quizAttempt = {
          userId: userId,
          quizId: parseInt(id),
          score: evaluation.summary.overallScore,
          totalQuestions: evaluation.summary.totalQuestions,
          accuracy: evaluation.summary.accuracy,
          timeTaken: timeSpent,
          answeredQuestions: answers,
          startedAt: new Date(Date.now() - timeSpent * 1000),
          completedAt: new Date()
        };
        
        await storage.createQuizAttempt(quizAttempt);
        console.log("Quiz attempt saved to database");
      } catch (dbError) {
        console.error("Failed to save quiz attempt:", dbError);
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

  const httpServer = createServer(app);
  return httpServer;
}