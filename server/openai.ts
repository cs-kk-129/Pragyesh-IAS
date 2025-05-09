import OpenAI from "openai";
import { storage } from "./storage";
import type { Topic, Quiz, Question } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "your-api-key-here" 
});

// Generate a quiz based on a topic
export async function generateQuiz(topic: Topic): Promise<{ quiz: Quiz; questions: Question[] }> {
  try {
    const prompt = `
      Generate a UPSC exam quiz on the topic: ${topic.name} - ${topic.description}. 
      The quiz should include 5 multiple-choice questions with 4 options each.
      
      For each question, provide:
      1. The question text
      2. Four options (labeled A, B, C, D)
      3. The correct answer
      4. A brief explanation of why the answer is correct
      
      Format your response as a valid JSON object with the following structure:
      {
        "title": "Quiz title related to the topic",
        "questions": [
          {
            "question": "Question text",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "The correct option text",
            "explanation": "Explanation of the correct answer"
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
      title: result.title,
    });

    // Create the questions in the database
    const questions: Question[] = [];
    for (const q of result.questions) {
      const question = await storage.createQuestion({
        quizId: quiz.id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
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

// Answer a doubt from a user
export async function answerDoubt(question: string): Promise<string> {
  try {
    const prompt = `
      You are a UPSC exam expert assistant. Provide a clear, detailed, and accurate answer to the following UPSC-related question:
      
      ${question}
      
      Your answer should:
      1. Be comprehensive yet concise
      2. Include relevant facts, dates, and figures when applicable
      3. Provide context for better understanding
      4. Highlight key points to remember
      5. Follow UPSC syllabus guidelines
      
      Your expertise is specifically in UPSC exam preparation, so focus your answer accordingly.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
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
