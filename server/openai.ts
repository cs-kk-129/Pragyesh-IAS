import OpenAI from "openai";
import { storage } from "./storage";
import type { Topic, Quiz, Question } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "your-api-key-here" 
});

// Generate a bilingual quiz based on a topic
export async function generateQuiz(topic: Topic): Promise<{ quiz: Quiz; questions: Question[] }> {
  try {
    const prompt = `
      Generate a UPSC exam quiz on the topic: ${topic.name} - ${topic.description}. 
      The quiz should include 5 multiple-choice questions with 4 options each.
      
      IMPORTANT: Provide each question in BOTH English and Hindi languages.
      
      For each question, provide:
      1. The question text in both English and Hindi
      2. Four options (labeled A, B, C, D) in both languages
      3. The correct answer in both languages
      4. A brief explanation in both languages
      
      Format your response as a valid JSON object with the following structure:
      {
        "title": {
          "english": "Quiz title in English",
          "hindi": "Quiz title in Hindi"
        },
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
              "english": "The correct option text in English",
              "hindi": "The correct option text in Hindi"
            },
            "explanation": {
              "english": "Explanation in English",
              "hindi": "Explanation in Hindi"
            }
          },
          ...
        ]
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content as string);

    // Create the quiz in the database
    const quiz = await storage.createQuiz({
      topicId: topic.id,
      title: JSON.stringify(result.title), // Store bilingual title as JSON
      quizType: "topic",
    });

    // Create the questions in the database
    const questions: Question[] = [];
    for (const q of result.questions) {
      const question = await storage.createQuestion({
        quizId: quiz.id,
        question: JSON.stringify(q.question), // Store bilingual question as JSON
        options: JSON.stringify(q.options), // Store bilingual options as JSON
        correctAnswer: JSON.stringify(q.correctAnswer), // Store bilingual correct answer as JSON
        explanation: JSON.stringify(q.explanation), // Store bilingual explanation as JSON
      });
      questions.push(question);
    }

    return { quiz, questions };
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw new Error("Failed to generate quiz");
  }
}

// Generate a personalized study plan
export async function generateStudyPlan(
  topics: Topic[],
  startDate: Date,
  endDate: Date
): Promise<{ day: string; topics: { topicId: number; duration: number; notes: string }[] }[]> {
  try {
    // Calculate the number of days in the plan
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const prompt = `
      Generate a personalized UPSC study plan for ${daysDiff} days starting from ${startDate.toISOString().split('T')[0]}.
      
      The plan should cover the following topics:
      ${topics.map(t => `- ${t.name}: ${t.description}`).join('\n')}
      
      Create a balanced schedule that:
      1. Allocates appropriate study time for each topic
      2. Includes revision days
      3. Provides specific focus areas for each day
      4. Suggests study techniques or approaches
      5. Balances different topics throughout the week
      
      Format your response as a valid JSON object with the following structure:
      {
        "plan": [
          {
            "day": "Day 1 (YYYY-MM-DD)",
            "topics": [
              {
                "topicId": <topic id>,
                "topicName": "<topic name>",
                "duration": <hours as number>,
                "notes": "Specific study notes and focus areas"
              },
              ...
            ]
          },
          ...
        ]
      }
      
      The available topic IDs are:
      ${topics.map(t => `- ${t.id}: ${t.name}`).join('\n')}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content as string);
    
    // Transform the result to match our expected return type
    return result.plan.map((day: any) => ({
      day: day.day,
      topics: day.topics.map((topic: any) => ({
        topicId: topic.topicId,
        duration: topic.duration,
        notes: topic.notes
      }))
    }));
  } catch (error) {
    console.error("Error generating study plan:", error);
    throw new Error("Failed to generate study plan");
  }
}

// Answer a doubt from a user with enhanced search capabilities
export async function answerDoubt(question: string): Promise<string> {
  try {
    const prompt = `
      You are an expert UPSC exam preparation assistant with comprehensive knowledge of the entire UPSC syllabus. 
      Provide a detailed, accurate, and exam-focused answer to the following question:
      
      ${question}
      
      Your response should:
      1. Be comprehensive yet focused on UPSC exam requirements
      2. Include relevant facts, dates, figures, and examples
      3. Provide clear context and background information
      4. Highlight key points and important concepts to remember
      5. Connect the topic to other related UPSC subjects when relevant
      6. Include exam tips or mnemonics if applicable
      7. Structure the answer with clear headings or bullet points for better readability
      8. Provide both English and Hindi terminology where relevant
      
      Focus specifically on UPSC Civil Services Examination preparation across all papers:
      - General Studies Paper I (History, Geography, Polity, Economy)
      - General Studies Paper II (Governance, Constitution, Social Justice)
      - General Studies Paper III (Technology, Environment, Security, Economy)
      - General Studies Paper IV (Ethics, Integrity, Aptitude)
      - CSAT Paper (Comprehension, Reasoning, Mental Ability)
      
      Make your answer exam-oriented and practical for UPSC aspirants.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert UPSC Civil Services examination preparation assistant with comprehensive knowledge of Indian history, geography, polity, economy, environment, science & technology, ethics, and current affairs. Provide detailed, accurate, and exam-focused responses that help aspirants understand concepts thoroughly."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return response.choices[0].message.content || "I apologize, but I couldn't generate a response at this time. Please try asking your question again.";
  } catch (error) {
    console.error("Error answering doubt:", error);
    throw new Error("Failed to answer doubt");
  }
}

// Enhanced AI search function for intelligent query processing
export async function performIntelligentSearch(query: string): Promise<string> {
  try {
    const searchPrompt = `
      You are an intelligent search assistant specializing in UPSC Civil Services examination content.
      
      User Query: "${query}"
      
      Analyze this query and provide a comprehensive response that includes:
      
      1. **Direct Answer**: Address the specific question or topic requested
      2. **Related Concepts**: Mention interconnected topics that are relevant for UPSC
      3. **Exam Relevance**: Explain how this topic appears in UPSC papers
      4. **Key Points**: Bullet points of essential information to remember
      5. **Study Tips**: Practical advice for mastering this topic
      6. **Cross-References**: Related topics in other UPSC subjects
      
      Make your response structured, comprehensive, and optimized for UPSC preparation.
      Include both theoretical knowledge and practical exam strategies.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an advanced AI search engine specialized in UPSC Civil Services examination preparation. Your knowledge spans across all UPSC subjects including History, Geography, Polity, Economy, Environment, Science & Technology, Ethics, and Current Affairs. Provide comprehensive, well-structured, and exam-oriented responses."
        },
        {
          role: "user",
          content: searchPrompt
        }
      ],
      temperature: 0.6,
      max_tokens: 2500,
    });

    return response.choices[0].message.content || "I apologize, but I couldn't process your search query at this time. Please try with a different question.";
  } catch (error) {
    console.error("Error performing intelligent search:", error);
    throw new Error("Failed to perform intelligent search");
  }
}
}
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 1000,
    });

    return response.choices[0].message.content || "I'm sorry, I couldn't generate an answer at this time.";
  } catch (error) {
    console.error("Error answering doubt:", error);
    throw new Error("Failed to answer doubt");
  }
}
