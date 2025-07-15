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

// Answer a doubt from a user with conversational approach
export async function answerDoubt(question: string): Promise<string> {
  try {
    const prompt = `
      A UPSC aspirant just asked you: "${question}"
      
      Respond as a supportive mentor would - naturally and conversationally. Think of this as sitting with a student and explaining the concept in a way that makes sense to them.
      
      Your response should:
      - Feel like a natural conversation, not a formal lecture
      - Be encouraging and supportive in tone
      - Explain things clearly with examples and analogies
      - Share useful tips and insights naturally within your explanation
      - Connect to exam context organically, not forcefully
      - Use simple, clear language that's easy to understand
      - Be comprehensive but conversational
      - Avoid bullet points, numbered lists, or formal headings
      - Flow naturally like you're speaking to them
      
      Remember, you're helping a friend prepare for one of India's toughest exams. Be warm, knowledgeable, and encouraging.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a caring, experienced UPSC mentor with deep subject knowledge across history, geography, polity, economy, environment, science & technology, ethics, and current affairs. You communicate warmly and naturally, like a friend helping another friend succeed. You explain complex concepts simply and always encourage students in their preparation."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 2000,
    });

    return response.choices[0].message.content || "I'm sorry, I'm having trouble responding right now. Could you try asking your question again?";
  } catch (error) {
    console.error("Error answering doubt:", error);
    throw new Error("Failed to answer doubt");
  }
}

// Enhanced AI search function for conversational query processing
export async function performIntelligentSearch(query: string): Promise<string> {
  try {
    const searchPrompt = `
      You are a friendly and knowledgeable UPSC mentor having a conversation with a student. 
      
      The student asked: "${query}"
      
      Respond naturally and conversationally, as if you're explaining this to a friend who's preparing for UPSC. Your response should:
      
      - Be warm, encouraging, and human-like in tone
      - Explain concepts clearly without being overly formal or structured
      - Share insights and tips naturally within the conversation
      - Use examples and analogies that help understanding
      - Mention related topics organically when relevant
      - Be comprehensive but feel like a natural conversation
      - Avoid rigid formatting with headings or numbered lists
      - Include practical exam advice naturally in your explanation
      
      Remember, you're not writing a textbook - you're having a helpful conversation about UPSC preparation.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a warm, experienced UPSC mentor who loves helping students succeed. You have deep knowledge across all UPSC subjects and communicate in a friendly, conversational way. You explain complex topics simply, share useful tips naturally, and always encourage students in their preparation journey."
        },
        {
          role: "user",
          content: searchPrompt
        }
      ],
      temperature: 0.8,
      max_tokens: 2000,
    });

    return response.choices[0].message.content || "I'm sorry, I'm having trouble responding right now. Could you try asking your question again?";
  } catch (error) {
    console.error("Error performing intelligent search:", error);
    throw new Error("Failed to perform intelligent search");
  }
}
