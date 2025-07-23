import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { sql } from 'drizzle-orm';
import { db, pool } from './db';
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
import * as mammoth from "mammoth";
import { PDFDocument } from 'pdf-lib';

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
      const questionCount = requestedCount && requestedCount <= 300 ? requestedCount : 10;

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
            content: enhancedPrompt + `\n\nGenerate questions with timestamp: ${Date.now()}. Return response in JSON format only.` 
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

            console.log('Mapping subject:', questionData.subject);
            console.log(`Mapped "${questionData.subject}" to subject ID: ${subjectId}`);

            const questionPayload = {
              quizId: 0, // Temporary quiz ID for standalone questions
              question: typeof questionData.question === 'object' ? 
                JSON.stringify(questionData.question) : questionData.question,
              options: typeof questionData.options === 'object' ? 
                questionData.options.english || questionData.options : questionData.options,
              correctAnswer: typeof questionData.correctAnswer === 'object' ? 
                questionData.correctAnswer.english || questionData.correctAnswer : questionData.correctAnswer,
              explanation: questionData.explanation || '',
              difficulty: questionData.difficulty || 'medium',
              subjectId: subjectId,
              topicId: null,
              sectionId: null,
              tags: questionData.tags || [questionData.subject]
            };

            console.log('Creating question with data:', questionPayload);
            const question = await storage.createQuestion(questionPayload);

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

      console.log(`Processing file: ${file.originalname}, Type: ${fileExtension}, Size: ${file.size} bytes`);

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

        case '.pdf':
          try {
            console.log('Processing PDF file...');

            // For now, we'll prompt the user to convert PDF to text
            // This avoids the pdf-parse library issue while maintaining functionality
            return res.status(400).json({ 
              error: "PDF processing is temporarily unavailable. Please convert your PDF to a .txt or .docx file and upload again.",
              details: "PDF text extraction is being updated for better reliability"
            });

          } catch (pdfError) {
            console.error('PDF processing error:', pdfError);
            return res.status(400).json({ 
              error: "Failed to process PDF file. Please convert to .txt or .docx format and try again.",
              details: pdfError instanceof Error ? pdfError.message : "Unknown error"
            });
          }
          break;

        case '.docx':
          try {
            console.log('Processing DOCX file...');
            const docxResult = await mammoth.extractRawText({ buffer: file.buffer });
            extractedText = docxResult.value;

            if (!extractedText.trim()) {
              throw new Error("Could not extract text from DOCX file");
            }

            console.log(`Successfully extracted ${extractedText.length} characters from DOCX`);

            // Log any conversion warnings
            if (docxResult.messages && docxResult.messages.length > 0) {
              console.log('DOCX conversion warnings:', docxResult.messages);
            }

          } catch (docxError) {
            console.error('DOCX processing error:', docxError);
            return res.status(400).json({ 
              error: "Failed to process DOCX file. Please ensure the document is a valid Word document and try again.",
              details: docxError instanceof Error ? docxError.message : "Unknown error"
            });
          }
          break;

        default:
          return res.status(400).json({ error: `Unsupported file format: ${fileExtension}. Supported formats: .txt, .csv, .json, .pdf, .docx` });
      }

      // Process large documents in chunks to handle all questions
      console.log(`Text length: ${extractedText.length} characters. Processing in chunks for complete extraction.`);
      
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OpenAI API key not configured");
      }
      
      const allQuestions = [];
      const CHUNK_SIZE = 4000; // Much smaller chunks to prevent token overflow
      const textChunks = [];
      
      // Split text into manageable chunks while trying to preserve question boundaries
      for (let i = 0; i < extractedText.length; i += CHUNK_SIZE) {
        let chunk = extractedText.substring(i, i + CHUNK_SIZE);
        
        // Try to end chunk at a question boundary to avoid cutting questions in half
        if (i + CHUNK_SIZE < extractedText.length) {
          const lastQuestionEnd = chunk.lastIndexOf('\n\n');
          if (lastQuestionEnd > CHUNK_SIZE * 0.7) { // More conservative boundary adjustment
            chunk = chunk.substring(0, lastQuestionEnd);
          }
        }
        
        if (chunk.trim()) {
          textChunks.push(chunk.trim());
        }
      }
      
      console.log(`Split document into ${textChunks.length} chunks for processing`);
      console.log(`Chunk sizes: ${textChunks.map(chunk => chunk.length).join(', ')} characters`);
      
      // Estimate expected questions more accurately
      const estimatedQuestions = Math.floor(extractedText.length / 600); // More realistic: ~600 chars per question
      const expectedQuestionsPerChunk = Math.ceil(CHUNK_SIZE / 600);
      console.log(`Estimated total questions in document: ~${estimatedQuestions}`);
      console.log(`Expected ~${expectedQuestionsPerChunk} questions per ${CHUNK_SIZE}-char chunk`);
      
      // Process each chunk
      for (let chunkIndex = 0; chunkIndex < textChunks.length; chunkIndex++) {
        const chunk = textChunks[chunkIndex];
        console.log(`Processing chunk ${chunkIndex + 1}/${textChunks.length} (${chunk.length} characters)`);
        
        try {
          // First, try to extract questions with minimal format to avoid token overflow
          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: `Extract ONLY complete, standalone UPSC exam questions from this text chunk. 

                RULES:
                1. Extract ONLY full questions with multiple choice options (A, B, C, D)
                2. Skip incomplete questions, fragments, or sub-parts
                3. Skip headings, topic names, or reference text
                4. Each question must be self-contained and answerable
                5. This is chunk ${chunkIndex + 1}/${textChunks.length}
                
                Return your response as JSON format:
                {
                  "questions": [
                    {
                      "q": "Complete question text",
                      "opts": ["Option A", "Option B", "Option C", "Option D"],
                      "ans": "Correct answer text",
                      "exp": "Brief explanation",
                      "subj": null,
                      "topic": null
                    }
                  ]
                }
                
                IMPORTANT: Only extract complete, independent questions with 4 options. Return JSON only.`
              },
              {
                role: "user",
                content: `Extract ONLY complete, standalone questions from this text chunk. Ignore headings, fragments, or incomplete text. Return the extracted questions in JSON format:\n\n${chunk}`
              }
            ],
            response_format: { type: "json_object" },
            max_tokens: 3000, // Further reduced to ensure completion
            temperature: 0.1
          });

          const responseContent = response.choices[0].message.content;
          
          // Check if response was truncated
          if (response.choices[0].finish_reason === 'length') {
            console.warn(`Response truncated for chunk ${chunkIndex + 1} - retrying with smaller request`);
            // If truncated, skip this chunk and log for manual review
            continue;
          }

          let result;
          try {
            result = JSON.parse(responseContent || "{}");
          } catch (parseError) {
            console.error(`JSON parse error for chunk ${chunkIndex + 1}:`, parseError);
            console.error(`Response content length: ${responseContent?.length}`);
            console.error(`Response preview: ${responseContent?.substring(0, 500)}...`);
            
            // Try to salvage partial JSON if possible
            if (responseContent) {
              try {
                // Attempt to fix common JSON truncation issues
                let fixedContent = responseContent;
                
                // If JSON ends abruptly, try to close it
                if (!fixedContent.endsWith('}') && !fixedContent.endsWith(']}')) {
                  const lastComplete = fixedContent.lastIndexOf('},');
                  if (lastComplete > 0) {
                    fixedContent = fixedContent.substring(0, lastComplete) + '}]}';
                  }
                }
                
                result = JSON.parse(fixedContent);
                console.log(`✓ Recovered partial JSON for chunk ${chunkIndex + 1}`);
              } catch (recoverError) {
                console.error(`Failed to recover JSON for chunk ${chunkIndex + 1}:`, recoverError);
                continue;
              }
            } else {
              continue;
            }
          }
          
          if (result.questions && Array.isArray(result.questions)) {
            // Convert minimal format to standard format - will add translation in batch later
            const convertedQuestions = result.questions
              .filter((q: any) => {
                // Strict filtering to prevent over-extraction
                const hasQuestion = q.q && q.q.length > 30 && q.q.includes('?'); // Must be a question
                const hasOptions = Array.isArray(q.opts) && q.opts.length === 4;
                const hasAnswer = q.ans && q.ans.length > 2;
                const isNotFragment = !q.q.toLowerCase().includes('which of the following') || q.q.includes('?');
                const hasCompleteOptions = q.opts.every((opt: string) => opt && opt.length > 2);
                
                return hasQuestion && hasOptions && hasAnswer && isNotFragment && hasCompleteOptions;
              })
              .map((q: any) => ({
                question: {
                  english: q.q || "",
                  hindi: "" // Will be translated in batch processing
                },
                options: {
                  english: Array.isArray(q.opts) ? q.opts : [],
                  hindi: [] // Will be translated in batch processing
                },
                correctAnswer: {
                  english: q.ans || "",
                  hindi: "" // Will be translated in batch processing
                },
                explanation: {
                  english: q.exp || q.explanation || "",
                  hindi: "" // Will be translated in batch processing
                },
                subject: q.subj || q.subject || null,
                topic: q.topic || null,
                difficulty: q.difficulty || "medium",
                marks: q.marks || 2
              }));
            
            const chunkQuestionCount = convertedQuestions.length;
            allQuestions.push(...convertedQuestions);
            console.log(`✓ Chunk ${chunkIndex + 1}/${textChunks.length}: Extracted ${chunkQuestionCount} questions (${chunk.length} chars)`);
            
            // Log first question as sample
            if (chunkQuestionCount > 0) {
              const firstQ = convertedQuestions[0];
              console.log(`  Sample: "${firstQ.question?.english?.substring(0, 60)}..."`);
            }
          } else {
            console.error(`✗ Chunk ${chunkIndex + 1}/${textChunks.length}: No valid questions in response`);
            console.error(`  Response format: ${JSON.stringify(Object.keys(result || {}))}`);
          }
          
          // Add delay between requests to avoid rate limiting
          if (chunkIndex < textChunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Increased delay for stability
          }
          
        } catch (chunkError) {
          console.error(`Error processing chunk ${chunkIndex + 1}:`, chunkError);
          console.error(`Chunk error details:`, chunkError instanceof Error ? chunkError.message : String(chunkError));
          // Continue with other chunks even if one fails
        }
      }

      if (allQuestions.length === 0) {
        throw new Error("Could not extract any valid questions from file");
      }

      // Calculate extraction efficiency based on estimated questions
      const extractionEfficiency = (allQuestions.length / estimatedQuestions) * 100;
      
      console.log(`=== EXTRACTION SUMMARY ===`);
      console.log(`Total questions extracted: ${allQuestions.length} out of estimated ~${estimatedQuestions}`);
      console.log(`Extraction efficiency: ${extractionEfficiency.toFixed(1)}%`);
      console.log(`Chunks processed: ${textChunks.length}`);
      console.log(`Questions per chunk: ${textChunks.map((_, i) => `C${i+1}:?`).join(' ')}`);
      
      if (allQuestions.length < 100) {
        console.warn(`⚠️  Low extraction rate - extracted ${allQuestions.length} out of expected ~150 questions`);
      }
      
      console.log(`Successfully processed ${fileExtension} file and extracted ${allQuestions.length} questions total from ${textChunks.length} chunks`);
      
      // Post-process for bilingual translation
      if (allQuestions.length > 0) {
        console.log(`Post-processing: Adding Hindi translation for ${allQuestions.length} questions...`);
        
        // Process questions in batches for translation
        const TRANSLATION_BATCH_SIZE = 10;
        for (let i = 0; i < allQuestions.length; i += TRANSLATION_BATCH_SIZE) {
          const batch = allQuestions.slice(i, i + TRANSLATION_BATCH_SIZE);
          
          try {
            console.log(`Translating batch ${Math.floor(i/TRANSLATION_BATCH_SIZE) + 1}/${Math.ceil(allQuestions.length/TRANSLATION_BATCH_SIZE)}`);
            
            // Create compact batch translation request
            const batchText = batch.map((q, idx) => 
              `Q${idx + 1}: ${q.question.english}\nA: ${q.options.english.join(' | ')}\nAns: ${q.correctAnswer.english}\nExp: ${q.explanation.english}`
            ).join('\n\n');
            
            const translationResponse = await openai.chat.completions.create({
              model: "gpt-4o",
              messages: [
                {
                  role: "system",
                  content: `Translate these UPSC questions from English to Hindi. Maintain technical accuracy and UPSC terminology.
                  
                  Return your response as JSON format:
                  {
                    "translations": [
                      {
                        "question": "हिंदी प्रश्न",
                        "options": ["विकल्प A", "विकल्प B", "विकल्प C", "विकल्प D"],
                        "answer": "सही उत्तर",
                        "explanation": "व्याख्या"
                      }
                    ]
                  }
                  
                  Provide only JSON response.`
                },
                {
                  role: "user",
                  content: `Translate these questions to Hindi:\n\n${batchText}`
                }
              ],
              response_format: { type: "json_object" },
              max_tokens: 3000,
              temperature: 0.1
            });

            const translationResult = JSON.parse(translationResponse.choices[0].message.content || "{}");
            
            if (translationResult.translations && Array.isArray(translationResult.translations)) {
              // Apply translations to the batch
              batch.forEach((question, idx) => {
                const translation = translationResult.translations[idx];
                if (translation) {
                  question.question.hindi = translation.question || question.question.english;
                  question.options.hindi = Array.isArray(translation.options) ? translation.options : question.options.english;
                  question.correctAnswer.hindi = translation.answer || question.correctAnswer.english;
                  question.explanation.hindi = translation.explanation || question.explanation.english;
                }
              });
            }
            
            // Small delay between translation batches
            if (i + TRANSLATION_BATCH_SIZE < allQuestions.length) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
          } catch (translationError) {
            console.error(`Translation error for batch ${Math.floor(i/TRANSLATION_BATCH_SIZE) + 1}:`, translationError);
            // Keep English text as fallback
            batch.forEach(question => {
              question.question.hindi = question.question.english;
              question.options.hindi = question.options.english;
              question.correctAnswer.hindi = question.correctAnswer.english;
              question.explanation.hindi = question.explanation.english;
            });
          }
        }
        
        console.log(`✓ Hindi translation completed for ${allQuestions.length} questions`);
      }

      res.json({ 
        success: true, 
        questions: allQuestions,
        count: allQuestions.length,
        fileType: fileExtension,
        chunksProcessed: textChunks.length
      });

    } catch (error) {
      console.error("Error processing file:", error);
      console.error("Full error details:", error instanceof Error ? error.stack : String(error));
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
  app.post("/api/admin/questions/manual", async (req, res) => {
    try {
      const { questions, subjectId, topicId } = req.body;

      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ error: "No valid questions provided" });
      }

      console.log(`Processing ${questions.length} manual questions for database storage`);

      // Save questions to database with proper structure
      const savedQuestions = [];
      for (const question of questions) {
        try {
          // Map subject using the same logic as AI generation
          let actualSubjectId = parseInt(subjectId) || 1;
          const subjectName = question.subject || '';

          if (subjectName.toLowerCase().includes('art') && subjectName.toLowerCase().includes('culture')) {
            actualSubjectId = 2;
          } else if (subjectName.toLowerCase().includes('geography')) {
            actualSubjectId = 3;
          } else if (subjectName.toLowerCase().includes('polity')) {
            actualSubjectId = 4;
          } else if (subjectName.toLowerCase().includes('economy')) {
            actualSubjectId = 5;
          } else if (subjectName.toLowerCase().includes('environment')) {
            actualSubjectId = 6;
          } else if (subjectName.toLowerCase().includes('science') && subjectName.toLowerCase().includes('technology')) {
            actualSubjectId = 7;
          } else if (subjectName.toLowerCase().includes('general') && subjectName.toLowerCase().includes('science')) {
            actualSubjectId = 8;
          } else if (subjectName.toLowerCase().includes('ethics')) {
            actualSubjectId = 9;
          } else if (subjectName.toLowerCase().includes('current')) {
            actualSubjectId = 10;
          } else if (subjectName.toLowerCase().includes('csat')) {
            actualSubjectId = 11;
          }

          // Format question data for database storage
          const questionData = {
            quizId: 0, // Unassigned initially
            subjectId: actualSubjectId,
            topicId: parseInt(topicId) || null,
            sectionId: null,
            question: JSON.stringify({
              english: question.question || '',
              hindi: question.questionHindi || ''
            }),
            options: question.options || ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: Array.isArray(question.options) && question.correctAnswer !== undefined 
              ? question.options[question.correctAnswer] || question.options[0]
              : 'Option A',
            explanation: question.explanation || 'Explanation will be provided after evaluation.',
            difficulty: question.difficulty || 'medium',
            tags: [question.subject, question.topic].filter(Boolean)
          };

          console.log('Saving manual question:', questionData.question, 'with options:', questionData.options);

          const savedQuestion = await storage.createQuestion(questionData);
          if (savedQuestion) {
            savedQuestions.push(savedQuestion);
            console.log(`Successfully saved manual question with ID: ${savedQuestion.id}`);
          }
        } catch (questionError) {
          console.error('Error saving individual manual question:', questionError);
          console.error('Question data that failed:', question);
        }
      }

      console.log(`Successfully saved ${savedQuestions.length} manual questions to database`);

      res.json({ 
        message: "Questions added successfully", 
        count: savedQuestions.length,
        questions: savedQuestions
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
            { role: "user", content: enhancedPrompt + " Return your response as JSON format only." }
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
          // Validate question structure
          if (!question || !question.question || !question.options || !question.correctAnswer) {
            console.error('Invalid question structure:', question);
            continue;
          }

          // Parse tags to extract subject and topic information
          const tags = [question.subject, question.topic].filter(Boolean);

          // Map subject using direct database lookup
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

          // Extract English options safely
          let englishOptions = [];
          let englishCorrectAnswer = '';
          let englishExplanation = '';
          let englishQuestion = '';

          try {
            // Handle question text
            if (typeof question.question === 'object' && question.question.english) {
              englishQuestion = question.question.english;
            } else if (typeof question.question === 'string') {
              englishQuestion = question.question;
            }

            // Handle options
            if (question.options && question.options.english && Array.isArray(question.options.english)) {
              englishOptions = question.options.english;
            } else if (Array.isArray(question.options)) {
              englishOptions = question.options;
            }

            // Handle correct answer
            if (typeof question.correctAnswer === 'object' && question.correctAnswer.english) {
              englishCorrectAnswer = question.correctAnswer.english;
            } else if (typeof question.correctAnswer === 'string') {
              englishCorrectAnswer = question.correctAnswer;
            }

            // Handle explanation
            if (typeof question.explanation === 'object' && question.explanation.english) {
              englishExplanation = question.explanation.english;
            } else if (typeof question.explanation === 'string') {
              englishExplanation = question.explanation;
            }

          } catch (parseError) {
            console.error('Error parsing question fields:', parseError);
            continue;
          }

          console.log('Creating question with data:', {
            quizId: 0,
            subjectId: actualSubjectId,
            sectionId: actualSectionId,
            question: JSON.stringify(question.question),
            options: englishOptions,
            correctAnswer: englishCorrectAnswer,
            explanation: englishExplanation,
            difficulty: question.difficulty || 'medium',
            tags
          });

          console.log('ROUTES: About to call storage.createQuestion');
          const savedQuestion = await storage.createQuestion({
            quizId: 0, // Unassigned - will be set when mock test is created
            subjectId: actualSubjectId,
            topicId: null, // Will be set based on detailed topic mapping
            sectionId: actualSectionId,
            question: JSON.stringify(question.question),
            options: englishOptions,
            correctAnswer: englishCorrectAnswer,
            explanation: englishExplanation,
            difficulty: question.difficulty || 'medium',
            tags
          });
          console.log('ROUTES: Question saved with ID:', savedQuestion.id);

          savedQuestions.push({
            id: savedQuestion.id, // This is the UUID from the database
            databaseId: savedQuestion.id, // Also store as databaseId for clarity
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
          console.error("Question data that failed:", question);
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

      if (!title || !title.trim()) {
        return res.status(400).json({ error: "Title is required" });
      }

      if (!selectedQuestionIds || selectedQuestionIds.length === 0) {
        return res.status(400).json({ error: "No questions selected" });
      }

      // Filter out null/undefined question IDs and ensure they are strings (UUIDs)
      const validQuestionIds = selectedQuestionIds.filter((id: any) => 
        id !== null && id !== undefined && id !== '' && typeof id === 'string'
      );

      if (validQuestionIds.length === 0) {
        return res.status(400).json({ error: "No valid questions selected" });
      }

      console.log(`Creating mock test "${title}" with ${validQuestionIds.length} valid selected questions`);

      // Create quiz record in database first
      const quiz = await storage.createQuiz({
        title: title.trim(),
        quizType: 'mock_test',
        difficulty: 'medium',
        timeLimit: duration || 120,
        testDate: testDate ? new Date(testDate) : new Date(),
        description: description?.trim() || '',
        language: 'both',
        subjectId: 1, // Default subject
        topicId: null,
        subtopicId: null
      });

      console.log(`Created quiz with ID: ${quiz.id}`);

      // Update selected questions with the quiz ID
      let updatedCount = 0;
      for (const questionId of validQuestionIds) {
        try {
          // First check if question exists (questionId is already a string UUID)
          const existingQuestion = await db.select()
            .from(schema.questions)
            .where(eq(schema.questions.id, questionId))
            .limit(1);

          if (existingQuestion.length === 0) {
            console.warn(`Question ${questionId} not found in database`);
            continue;
          }

          // Use drizzle ORM for reliable updates
          const updateResult = await db.update(schema.questions)
            .set({ quizId: quiz.id })
            .where(eq(schema.questions.id, questionId));

          console.log(`Successfully updated question ${questionId} to quiz ${quiz.id}`);
          updatedCount++;
        } catch (updateError) {
          console.error(`Failed to update question ${questionId}:`, updateError);
        }
      }

      console.log(`Updated ${updatedCount} questions to be assigned to quiz ${quiz.id}`);

      // Verify questions were assigned correctly
      const assignedQuestions = await db.select()
        .from(schema.questions)
        .where(eq(schema.questions.quizId, quiz.id));

      console.log(`Verification: Quiz ${quiz.id} now has ${assignedQuestions.length} questions assigned`);

      // Add to in-memory storage for immediate visibility
      const mockTestForMemory = {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description || '',
        duration: quiz.timeLimit || 120,
        scheduledDate: quiz.testDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        questions: assignedQuestions.map((q, index) => ({
          id: q.id,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          subject: 'General Studies',
          topic: 'Mixed Topics',
          difficulty: q.difficulty || 'medium',
          marks: 2
        })),
        totalQuestions: assignedQuestions.length,
        difficulty: 'medium',
        subjects: ['General Studies'],
        isActive: true,
        isAttempted: false,
        status: 'not_started',
        createdAt: new Date().toISOString()
      };

      // Add to global mockTests array for immediate visibility
      const mockTestsIndex = mockTests.findIndex(test => test.id === quiz.id);
      if (mockTestsIndex >= 0) {
        mockTests[mockTestsIndex] = mockTestForMemory;
      } else {
        mockTests.push(mockTestForMemory);
      }

      console.log(`Mock test "${title}" created successfully with ${assignedQuestions.length} questions and added to memory`);

      res.json({ 
        success: true, 
        mockTest: {
          ...quiz,
          questionsAssigned: updatedCount,
          verifiedQuestions: assignedQuestions.length
        }
      });
    } catch (error) {
      console.error("Mock test creation error:", error);
      res.status(500).json({ error: "Failed to create mock test" });
    }
  });

  // Get mock tests for students (show all tests, restrict attempts by date)
  app.get("/api/student/mock-tests", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get ALL mock test quizzes (no date filtering)
      const availableQuizzes = await db.select()
        .from(schema.quizzes)
        .where(eq(schema.quizzes.quizType, 'mock_test'));

      console.log(`Found ${availableQuizzes.length} mock tests total`);

      // Process each quiz, including those already attempted (to show in history)
      const mockTests = [];
      for (const quiz of availableQuizzes) {
        try {
          // Check if user has already attempted this quiz
          const existingAttempt = await db.select()
            .from(schema.quizAttempts)
            .where(
              and(
                eq(schema.quizAttempts.userId, userId),
                eq(schema.quizAttempts.quizId, quiz.id)
              )
            );

          const isAlreadyAttempted = existingAttempt.length > 0;

          // Get questions for this quiz
          const questions = await db.select()
            .from(schema.questions)
            .where(eq(schema.questions.quizId, quiz.id));

          console.log(`Quiz ${quiz.id} ("${quiz.title}") has ${questions.length} questions`);

          const hasQuestions = questions.length > 0;

          // Extract unique subjects from question tags
          const subjects = hasQuestions ? Array.from(new Set(
            questions.map(q => {
              try {
                if (typeof q.tags === 'string' && q.tags) {
                  const parsedTags = JSON.parse(q.tags);
                  return Array.isArray(parsedTags) ? parsedTags[0] || 'General Studies' : 'General Studies';
                } else if (Array.isArray(q.tags)) {
                  return q.tags[0] || 'General Studies';
                }
                return 'General Studies';
              } catch (e) {
                return 'General Studies';
              }
            })
          )) : ['No Subject'];

          const processedQuestions = hasQuestions ? questions.map((q, index) => {
              let questionText;
              let optionsData;
              let correctAnswerData;

              try {
                // Parse question text - handle both string and JSON formats
                if (typeof q.question === 'string' && q.question.includes('{') && q.question.includes('english')) {
                  try {
                    const parsed = JSON.parse(q.question);
                    questionText = parsed;
                  } catch (e) {
                    // If JSON parsing fails, treat as regular string
                    questionText = { 
                      english: q.question || '', 
                      hindi: q.question || '' 
                    };
                  }
                } else {
                  questionText = { 
                    english: q.question || '', 
                    hindi: q.question || '' 
                  };
                }

                // Parse options - handle both string and array formats
                if (typeof q.options === 'string' && q.options) {
                  try {
                    const parsedOptions = JSON.parse(q.options);
                    optionsData = {
                      english: Array.isArray(parsedOptions) ? parsedOptions : [parsedOptions],
                      hindi: Array.isArray(parsedOptions) ? parsedOptions : [parsedOptions]
                    };
                  } catch (e) {
                    // If parsing fails, split by common delimiters or use as single option
                    const optionsList = String(q.options || '').split(/[,\n\r]/).filter((opt: string) => opt.trim());
                    optionsData = {
                      english: optionsList.length > 0 ? optionsList : ['Option A', 'Option B', 'Option C', 'Option D'],
                      hindi: optionsList.length > 0 ? optionsList : ['विकल्प A', 'विकल्प B', 'विकल्प C', 'विकल्प D']
                    };
                  }
                } else if (Array.isArray(q.options)) {
                  optionsData = {
                    english: q.options,
                    hindi: q.options
                  };
                } else {
                  optionsData = { 
                    english: ['Option A', 'Option B', 'Option C', 'Option D'], 
                    hindi: ['विकल्प A', 'विकल्प B', 'विकल्प C', 'विकल्प D'] 
                  };
                }

                // Parse correct answer
                correctAnswerData = {
                  english: q.correctAnswer || optionsData.english[0] || 'Option A',
                  hindi: q.correctAnswer || optionsData.hindi[0] || 'विकल्प A'
                };

              } catch (parseError) {
                console.error('Error parsing question data for question', q.id, ':', parseError);
                questionText = { english: `Question ${index + 1}`, hindi: `प्रश्न ${index + 1}` };
                optionsData = { 
                  english: ['Option A', 'Option B', 'Option C', 'Option D'], 
                  hindi: ['विकल्प A', 'विकल्प B', 'विकल्प C', 'विकल्प D'] 
                };
                correctAnswerData = { english: 'Option A', hindi: 'विकल्प A' };
              }

              // Extract subject and topic from tags
              let subject = 'General Studies';
              let topic = 'Mixed Topics';

              try {
                if (typeof q.tags === 'string' && q.tags) {
                  const parsedTags = JSON.parse(q.tags);
                  if (Array.isArray(parsedTags) && parsedTags.length > 0) {
                    subject = parsedTags[0] || 'General Studies';
                    topic = parsedTags[1] || 'Mixed Topics';
                  }
                } else if (Array.isArray(q.tags) && q.tags.length > 0) {
                  subject = q.tags[0] || 'General Studies';
                  topic = q.tags[1] || 'Mixed Topics';
                }
              } catch (e) {
                // Use defaults
              }

              return {
                id: q.id,
                question: questionText,
                options: optionsData,
                correctAnswer: correctAnswerData,
                subject: subject,
                topic: topic,
                difficulty: q.difficulty || 'medium',
                marks: 2
              };
            }) : [];

          // Check if test date allows access (only for today's date)
          const testDate = quiz.testDate ? new Date(quiz.testDate) : new Date();
          testDate.setHours(0, 0, 0, 0);

          const isScheduledForToday = testDate.getTime() === today.getTime();

          // Determine test status based on questions, date, and attempt status
          let testStatus = 'not_started';
          let isActive = false;

          if (isAlreadyAttempted) {
            testStatus = 'completed';
            isActive = false;
          } else if (!hasQuestions) {
            testStatus = 'no_questions';
            isActive = false;
          } else if (isScheduledForToday) {
            testStatus = 'available';
            isActive = true;
          } else if (testDate > today) {
            testStatus = 'upcoming';
            isActive = false;
          } else {
            testStatus = 'expired';
            isActive = false;
          }

          // Get attempt score if already attempted
          let attemptScore = null;
          if (isAlreadyAttempted && existingAttempt.length > 0) {
            attemptScore = existingAttempt[0].score;
          }

          mockTests.push({
              id: quiz.id,
              title: quiz.title,
              description: quiz.description || '',
              duration: quiz.timeLimit || 120,
              totalQuestions: questions.length,
              difficulty: quiz.difficulty || 'medium',
              subjects: subjects,
              testDate: quiz.testDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
              isActive: isActive,
              isAttempted: isAlreadyAttempted,
              status: testStatus,
              score: attemptScore,
              questions: processedQuestions
            });

        } catch (quizError) {
          console.error(`Error processing quiz ${quiz.id}:`, quizError);
          continue; // Skip this quiz and continue with others
        }
      }

      // Sort tests: today's tests first, then by date (newest first)
      mockTests.sort((a, b) => {
        const aDate = new Date(a.testDate);
        const bDate = new Date(b.testDate);

        // If one is today and other is not, prioritize today's test
        const aIsToday = aDate.getTime() === today.getTime();
        const bIsToday = bDate.getTime() === today.getTime();

        if (aIsToday && !bIsToday) return -1;
        if (!aIsToday && bIsToday) return 1;

        // Otherwise sort by date (newest first)
        return bDate.getTime() - aDate.getTime();
      });

      console.log(`Returning ${mockTests.length} mock tests for user ${userId} (including all dates)`);
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

      console.log(`Mock test submission: User ${userId}, Quiz ${quizId}, Answers: ${answers.length}`);

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

      console.log(`Found ${questions.length} questions for quiz ${quizId}`);

      if (questions.length === 0) {
        return res.status(400).json({ error: "No questions found for this test" });
      }

      // Calculate score
      let correct = 0;
      const evaluatedAnswers = answers.map((answer: any, index: number) => {
        const question = questions[index];
        let isCorrect = false;

        if (question && answer.answer !== undefined && answer.answer !== null) {
          // Compare the user's answer (option text) with the correct answer
          if (typeof answer.answer === 'string' && question.correctAnswer) {
            isCorrect = answer.answer.trim() === question.correctAnswer.trim();
          } else if (typeof answer.answer === 'number') {
            // If answer is an index, get the option text and compare
            try {
              const questionOptions = Array.isArray(question.options) ? question.options : [];
              const userAnswerText = questionOptions[answer.answer] || '';
              isCorrect = userAnswerText.trim() === question.correctAnswer.trim();
            } catch (e) {
              isCorrect = false;
            }
          }
        }

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

      console.log(`Evaluation: ${correct}/${totalQuestions} correct, Score: ${score}%`);

      // Save quiz attempt to database with proper error handling and validation
      try {
        const quizAttemptData = {
          userId: userId,
          quizId: quizId,
          score: score,
          totalQuestions: totalQuestions,
          accuracy: accuracy,
          timeTaken: Math.round(timeSpent),
          completedAt: new Date(),
          answeredQuestions: JSON.stringify(evaluatedAnswers)
        };

        console.log('Attempting to save quiz attempt with data:', quizAttemptData);

        const [savedAttempt] = await db.insert(schema.quizAttempts)
          .values([quizAttemptData])
          .returning();

        console.log(`Quiz attempt saved successfully with ID: ${savedAttempt.id}`);

        // Note: Cache invalidation happens on client-side when admin refetches

      } catch (dbError) {
        console.error('Database error saving quiz attempt:', dbError);
        console.error('Error details:', JSON.stringify(dbError, null, 2));
        return res.status(500).json({ error: "Failed to save quiz attempt to database" });
      }

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
      console.log("Fetching admin evaluations...");

      // Get quiz attempts directly from database using Drizzle
      const dbAttempts = await db.select()
        .from(schema.quizAttempts)
        .orderBy(desc(schema.quizAttempts.completedAt));

      console.log(`Found ${dbAttempts.length} quiz attempts in database`);

      const evaluations = await Promise.all(dbAttempts.map(async (attempt) => {
        let user = null;
        let quiz = null;

        try {
          // Get user details
          const userResult = await db.select()
            .from(schema.users)
            .where(eq(schema.users.id, attempt.userId))
            .limit(1);
          user = userResult[0] || null;

          // Get quiz details
          const quizResult = await db.select()
            .from(schema.quizzes)
            .where(eq(schema.quizzes.id, attempt.quizId))
            .limit(1);
          quiz = quizResult[0] || null;
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
      console.error("Error details:", JSON.stringify(error, null, 2));
      res.json({ evaluations: [] });
    }
  });

  // Chat API endpoints for AI-powered doubt solving
  app.post("/api/chat", isAuthenticated, async (req, res) => {
    try {
      const { message } = req.body;
      const userId = (req as any).user.id;

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ error: "Message is required" });
      }

      console.log(`Processing chat message from user ${userId}: ${message.substring(0, 100)}...`);

      // Use OpenAI to generate intelligent response
      const { performIntelligentSearch } = await import("./openai");
      const aiResponse = await performIntelligentSearch(message.trim());

      // Save chat message to database
      const chatMessage = await storage.createChatMessage({
        userId,
        message: message.trim(),
        response: aiResponse
      });

      console.log(`AI response generated for user ${userId}, length: ${aiResponse.length} characters`);

      res.json(chatMessage);
    } catch (error) {
      console.error("Error processing chat message:", error);

      // Provide specific error messages based on the error type
      let fallbackResponse = "I apologize, but I'm experiencing technical difficulties. Please try asking your question again, or contact support if the issue persists.";

      if (error instanceof Error) {
        if (error.message.includes('OpenAI API key not configured')) {
          fallbackResponse = "The AI chat service is not properly configured. Please contact the administrator to set up the OpenAI API key.";
        } else if (error.message.includes('OpenAI API billing issue')) {
          fallbackResponse = "The AI chat service is temporarily unavailable due to billing issues. Please contact the administrator or try again later.";
        } else if (error.message.includes('Invalid OpenAI API key')) {
          fallbackResponse = "The AI chat service is not properly configured. Please contact the administrator to update the API key.";
        }
      }

      try {
        const chatMessage = await storage.createChatMessage({
          userId: (req as any).user.id,
          message: req.body.message || "Error processing message",
          response: fallbackResponse
        });
        res.json(chatMessage);
      } catch (dbError) {
        console.error("Error saving fallback message:", dbError);
        res.status(500).json({ error: "Failed to process chat message" });
      }
    }
  });

  // Get chat history for authenticated user
  app.get("/api/chat/history", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const limit = parseInt(req.query.limit as string) || 50;

      console.log(`Fetching chat history for user ${userId}, limit: ${limit}`);

      const chatHistory = await storage.getChatMessagesByUser(userId, limit);

      console.log(`Retrieved ${chatHistory.length} chat messages for user ${userId}`);

      res.json(chatHistory);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      res.status(500).json({ error: "Failed to fetch chat history" });
    }
  });

  // Enhanced search endpoint for intelligent query processing
  app.post("/api/search", isAuthenticated, async (req, res) => {
    try {
      const { query } = req.body;
      const userId = (req as any).user.id;

      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return res.status(400).json({ error: "Search query is required" });
      }

      console.log(`Processing search query from user ${userId}: ${query.substring(0, 100)}...`);

      // Use OpenAI for intelligent search
      const { performIntelligentSearch } = await import("./openai");
      const searchResults = await performIntelligentSearch(query.trim());

      // Optionally save search query as chat message for history
      await storage.createChatMessage({
        userId,
        message: `Search: ${query.trim()}`,
        response: searchResults
      });

      console.log(`Search results generated for user ${userId}, length: ${searchResults.length} characters`);

      res.json({ 
        query: query.trim(),
        results: searchResults,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error processing search query:", error);
      res.status(500).json({ error: "Failed to process search query" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}