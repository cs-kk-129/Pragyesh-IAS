import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { generateQuiz, generateStudyPlan, answerDoubt } from "./openai";
import seed from "./seed-data";
import { z } from "zod";
import { insertChatMessageSchema, insertQuizAttemptSchema } from "@shared/schema";

const isAuthenticated = (req: Request, res: Response, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Subjects routes
  app.get("/api/subjects", async (req, res) => {
    try {
      const subjects = await storage.getAllSubjects();
      res.json(subjects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  app.get("/api/subjects/:id", async (req, res) => {
    try {
      const subject = await storage.getSubjectById(parseInt(req.params.id));
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      res.json(subject);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subject" });
    }
  });

  // Topics routes
  app.get("/api/topics", async (req, res) => {
    try {
      if (req.query.subjectId) {
        const topics = await storage.getTopicsBySubject(parseInt(req.query.subjectId as string));
        return res.json(topics);
      }
      const topics = await storage.getAllTopics();
      res.json(topics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch topics" });
    }
  });

  app.get("/api/topics/:id", async (req, res) => {
    try {
      const topic = await storage.getTopicById(parseInt(req.params.id));
      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }
      res.json(topic);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch topic" });
    }
  });
  
  app.put("/api/topics/:id/status", isAuthenticated, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status || !['not_started', 'in_progress', 'completed'].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      const topic = await storage.updateTopicStatus(parseInt(req.params.id), status);
      res.json(topic);
    } catch (error) {
      res.status(500).json({ message: "Failed to update topic status" });
    }
  });

  // Subtopics routes
  app.get("/api/subtopics", async (req, res) => {
    try {
      if (req.query.topicId) {
        const subtopics = await storage.getSubtopicsByTopic(parseInt(req.query.topicId as string));
        return res.json(subtopics);
      }
      const subtopics = await storage.getAllSubtopics();
      res.json(subtopics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subtopics" });
    }
  });

  app.get("/api/subtopics/:id", async (req, res) => {
    try {
      const subtopic = await storage.getSubtopicById(parseInt(req.params.id));
      if (!subtopic) {
        return res.status(404).json({ message: "Subtopic not found" });
      }
      res.json(subtopic);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subtopic" });
    }
  });
  
  app.put("/api/subtopics/:id/status", isAuthenticated, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status || !['not_started', 'in_progress', 'completed'].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      const subtopic = await storage.updateSubtopicStatus(parseInt(req.params.id), status);
      res.json(subtopic);
    } catch (error) {
      res.status(500).json({ message: "Failed to update subtopic status" });
    }
  });

  app.get("/api/topics/category/:category", async (req, res) => {
    try {
      const topics = await storage.getTopicsByCategory(req.params.category);
      res.json(topics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch topics by category" });
    }
  });

  // Quiz routes
  app.post("/api/quizzes/generate", isAuthenticated, async (req, res) => {
    try {
      const { topicId } = req.body;
      if (!topicId) {
        return res.status(400).json({ message: "Topic ID is required" });
      }

      const topic = await storage.getTopicById(parseInt(topicId));
      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }

      const quiz = await generateQuiz(topic);
      res.json(quiz);
    } catch (error) {
      console.error("Error generating quiz:", error);
      res.status(500).json({ message: "Failed to generate quiz" });
    }
  });

  app.get("/api/quizzes/:id", isAuthenticated, async (req, res) => {
    try {
      const quiz = await storage.getQuizById(parseInt(req.params.id));
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      const questions = await storage.getQuestionsByQuiz(quiz.id);
      res.json({ quiz, questions });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quiz" });
    }
  });

  app.get("/api/quizzes/topic/:topicId", isAuthenticated, async (req, res) => {
    try {
      const quizzes = await storage.getQuizzesByTopic(parseInt(req.params.topicId));
      res.json(quizzes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  // Quiz attempts routes
  app.post("/api/quiz-attempts", isAuthenticated, async (req, res) => {
    try {
      const quizAttemptSchema = insertQuizAttemptSchema.safeParse(req.body);
      
      if (!quizAttemptSchema.success) {
        return res.status(400).json({ 
          message: "Invalid quiz attempt data", 
          errors: quizAttemptSchema.error.errors 
        });
      }
      
      const { userId, quizId, score, totalQuestions } = quizAttemptSchema.data;
      
      // Ensure the user is submitting their own attempt
      if (userId !== (req.user as any).id) {
        return res.status(403).json({ message: "Forbidden: Cannot submit attempt for another user" });
      }
      
      const quiz = await storage.getQuizById(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      const attempt = await storage.createQuizAttempt({
        userId,
        quizId,
        score,
        totalQuestions
      });
      
      // Update user progress for this topic
      const userProgress = await storage.getUserProgressByTopic(userId, quiz.topicId);
      const completedQuizzes = userProgress ? userProgress.quizzesCompleted + 1 : 1;
      await storage.updateUserProgress(userId, quiz.topicId, completedQuizzes);
      
      // Update study streak
      const streak = await storage.getStudyStreak(userId);
      if (streak) {
        const now = new Date();
        const lastStudyDate = new Date(streak.lastStudyDate);
        
        // Check if the last study was yesterday or today
        const isConsecutive = 
          (now.getDate() === lastStudyDate.getDate() && 
           now.getMonth() === lastStudyDate.getMonth() && 
           now.getFullYear() === lastStudyDate.getFullYear()) ||
          (now.getDate() - lastStudyDate.getDate() === 1 && 
           now.getMonth() === lastStudyDate.getMonth() && 
           now.getFullYear() === lastStudyDate.getFullYear());
        
        let currentStreak = streak.currentStreak;
        if (isConsecutive) {
          currentStreak += 1;
        } else {
          currentStreak = 1; // Reset streak if not consecutive
        }
        
        const maxStreak = Math.max(currentStreak, streak.maxStreak);
        await storage.updateStudyStreak(userId, currentStreak, maxStreak);
      }
      
      res.status(201).json(attempt);
    } catch (error) {
      console.error("Error submitting quiz attempt:", error);
      res.status(500).json({ message: "Failed to submit quiz attempt" });
    }
  });

  app.get("/api/quiz-attempts/user", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const attempts = await storage.getQuizAttemptsByUser(userId);
      res.json(attempts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quiz attempts" });
    }
  });

  app.get("/api/quiz-attempts/recent", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const limit = parseInt(req.query.limit as string) || 5;
      const attempts = await storage.getRecentQuizAttempts(userId, limit);
      res.json(attempts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent quiz attempts" });
    }
  });

  // User progress routes
  app.get("/api/progress", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const progress = await storage.getUserProgressOverview(userId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user progress" });
    }
  });

  app.get("/api/progress/:topicId", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const topicId = parseInt(req.params.topicId);
      const progress = await storage.getUserProgressByTopic(userId, topicId);
      res.json(progress || { userId, topicId, quizzesCompleted: 0 });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch topic progress" });
    }
  });

  // Study streak routes
  app.get("/api/streak", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const streak = await storage.getStudyStreak(userId);
      res.json(streak || { userId, currentStreak: 0, maxStreak: 0 });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch study streak" });
    }
  });

  // Chat messages routes
  app.post("/api/chat", isAuthenticated, async (req, res) => {
    try {
      const chatMessageSchema = insertChatMessageSchema.safeParse({
        ...req.body,
        userId: (req.user as any).id,
        response: "" // Will be filled in by the AI
      });
      
      if (!chatMessageSchema.success) {
        return res.status(400).json({ 
          message: "Invalid chat message data", 
          errors: chatMessageSchema.error.errors 
        });
      }
      
      const { userId, message } = chatMessageSchema.data;
      
      // Generate AI response
      const response = await answerDoubt(message);
      
      // Save the message and response
      const chatMessage = await storage.createChatMessage({
        userId,
        message,
        response
      });
      
      res.status(201).json(chatMessage);
    } catch (error) {
      console.error("Error processing chat message:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  app.get("/api/chat/history", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const limit = parseInt(req.query.limit as string) || 20;
      const messages = await storage.getChatMessagesByUser(userId, limit);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat history" });
    }
  });

  // Study plan routes
  app.post("/api/study-plans/generate", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { topicIds, startDate, endDate } = req.body;
      
      if (!topicIds || !Array.isArray(topicIds) || topicIds.length === 0) {
        return res.status(400).json({ message: "Topic IDs are required" });
      }
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start and end dates are required" });
      }
      
      // Fetch topics to include in the study plan
      const topics = [];
      for (const topicId of topicIds) {
        const topic = await storage.getTopicById(parseInt(topicId));
        if (topic) {
          topics.push(topic);
        }
      }
      
      if (topics.length === 0) {
        return res.status(404).json({ message: "No valid topics found" });
      }
      
      // Generate study plan using AI
      const studyPlan = await generateStudyPlan(topics, new Date(startDate), new Date(endDate));
      
      // Save the study plan
      const savedPlan = await storage.createStudyPlan({
        userId,
        title: `Study Plan (${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()})`,
        plan: studyPlan,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      });
      
      res.status(201).json(savedPlan);
    } catch (error) {
      console.error("Error generating study plan:", error);
      res.status(500).json({ message: "Failed to generate study plan" });
    }
  });

  app.get("/api/study-plans", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const plans = await storage.getStudyPlansByUser(userId);
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch study plans" });
    }
  });

  app.get("/api/study-plans/active", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const activePlan = await storage.getActiveStudyPlan(userId);
      if (!activePlan) {
        return res.status(404).json({ message: "No active study plan found" });
      }
      res.json(activePlan);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active study plan" });
    }
  });

  const httpServer = createServer(app);
  // Seed Database route - only used in development
  app.post("/api/seed", async (req, res) => {
    try {
      await seed();
      res.json({ message: "Database seeded successfully" });
    } catch (error) {
      console.error("Seed error:", error);
      res.status(500).json({ message: "Failed to seed database" });
    }
  });

  return httpServer;
}
