import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { sql } from 'drizzle-orm';
import { db } from './db';

const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Question generation endpoint for admin panel
  app.post("/api/generate-questions", async (req, res) => {
    try {
      const { prompt, questionType = 'objective' } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const enhancedPrompt = `
        ${prompt}
        
        IMPORTANT: Generate ONLY objective multiple choice questions with 4 options each.
        Provide each question in BOTH English and Hindi languages.
        Generate exactly 5 questions.
        
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
          messages: [{ role: "user", content: enhancedPrompt }],
          response_format: { type: "json_object" },
          temperature: 0.7,
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

  // Global mock tests storage (in real app, this would be in database)
  const mockTests: any[] = [];

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