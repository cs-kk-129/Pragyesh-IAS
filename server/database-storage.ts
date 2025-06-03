import { 
  users, subjects, topics, subtopics, quizzes, questions, 
  quizAttempts, bookmarks, userProgress, studyStreaks, 
  chatMessages, studyPlans 
} from "@shared/schema";
import type { 
  User, InsertUser, Subject, InsertSubject, Topic, InsertTopic, 
  Subtopic, InsertSubtopic, Quiz, InsertQuiz, Question, InsertQuestion, 
  QuizAttempt, InsertQuizAttempt, Bookmark, InsertBookmark, 
  UserProgress, InsertUserProgress, StudyStreak, InsertStudyStreak, 
  ChatMessage, InsertChatMessage, StudyPlan, InsertStudyPlan 
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, and, desc, isNull, lte, gte } from "drizzle-orm";
import { IStorage } from "./storage";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Configure session store with better error handling for Neon
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true,
      errorLog: (err: any) => {
        // Suppress control plane errors that are common with Neon
        if (!err.message?.includes('Control plane request failed')) {
          console.error('Session store error:', err);
        }
      }
    });
  }

  // USERS
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  // SUBJECTS
  async getAllSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects);
  }

  async getSubjectById(id: number): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
    return subject;
  }

  async createSubject(subject: InsertSubject): Promise<Subject> {
    const [newSubject] = await db.insert(subjects).values(subject).returning();
    return newSubject;
  }

  // TOPICS
  async getAllTopics(): Promise<Topic[]> {
    return await db.select().from(topics);
  }

  async getTopicById(id: number): Promise<Topic | undefined> {
    const [topic] = await db.select().from(topics).where(eq(topics.id, id));
    return topic;
  }

  async getTopicsBySubject(subjectId: number): Promise<Topic[]> {
    return await db.select().from(topics).where(eq(topics.subjectId, subjectId));
  }

  async createTopic(topic: InsertTopic): Promise<Topic> {
    const [newTopic] = await db.insert(topics).values(topic).returning();
    return newTopic;
  }

  async updateTopicStatus(id: number, status: string): Promise<Topic> {
    const [updatedTopic] = await db
      .update(topics)
      .set({ status })
      .where(eq(topics.id, id))
      .returning();
    return updatedTopic;
  }

  // SUBTOPICS
  async getAllSubtopics(): Promise<Subtopic[]> {
    return await db.select().from(subtopics);
  }

  async getSubtopicById(id: number): Promise<Subtopic | undefined> {
    const [subtopic] = await db.select().from(subtopics).where(eq(subtopics.id, id));
    return subtopic;
  }

  async getSubtopicsByTopic(topicId: number): Promise<Subtopic[]> {
    return await db.select().from(subtopics).where(eq(subtopics.topicId, topicId));
  }

  async createSubtopic(subtopic: InsertSubtopic): Promise<Subtopic> {
    const [newSubtopic] = await db.insert(subtopics).values(subtopic).returning();
    return newSubtopic;
  }

  async updateSubtopicStatus(id: number, status: string): Promise<Subtopic> {
    const [updatedSubtopic] = await db
      .update(subtopics)
      .set({ status })
      .where(eq(subtopics.id, id))
      .returning();
    return updatedSubtopic;
  }

  // QUIZZES
  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const [newQuiz] = await db.insert(quizzes).values(quiz).returning();
    return newQuiz;
  }

  async getQuizById(id: number): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz;
  }

  async getQuizzesBySubject(subjectId: number): Promise<Quiz[]> {
    return await db.select().from(quizzes).where(eq(quizzes.subjectId, subjectId));
  }

  async getQuizzesByTopic(topicId: number): Promise<Quiz[]> {
    return await db.select().from(quizzes).where(eq(quizzes.topicId, topicId));
  }

  async getQuizzesBySubtopic(subtopicId: number): Promise<Quiz[]> {
    return await db.select().from(quizzes).where(eq(quizzes.subtopicId, subtopicId));
  }
  
  async getComprehensiveQuizzesBySubject(subjectId: number): Promise<Quiz[]> {
    return await db.select()
      .from(quizzes)
      .where(and(
        eq(quizzes.subjectId, subjectId),
        eq(quizzes.quizType, 'comprehensive_quiz')
      ));
  }

  // QUESTIONS
  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [newQuestion] = await db.insert(questions).values(question).returning();
    return newQuestion;
  }

  async getQuestionsByQuiz(quizId: number): Promise<Question[]> {
    return await db.select().from(questions).where(eq(questions.quizId, quizId));
  }

  async getBookmarkedQuestions(userId: number): Promise<Question[]> {
    const bookmarkedIds = await db.select({ id: bookmarks.questionId })
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId));
    
    if (bookmarkedIds.length === 0) {
      return [];
    }
    
    const ids = bookmarkedIds.map(b => b.id);
    return await db.select()
      .from(questions)
      .where(
        ids.map(id => eq(questions.id, id)).reduce((acc, curr) => acc || curr)
      );
  }

  // QUIZ ATTEMPTS
  async createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const [newAttempt] = await db.insert(quizAttempts).values(attempt).returning();
    return newAttempt;
  }

  async getQuizAttemptsByUser(userId: number): Promise<QuizAttempt[]> {
    return await db.select()
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId))
      .orderBy(desc(quizAttempts.completedAt));
  }

  async getRecentQuizAttempts(userId: number, limit: number): Promise<QuizAttempt[]> {
    const attempts = await this.getQuizAttemptsByUser(userId);
    return attempts.slice(0, limit);
  }

  async getAllQuizAttempts(): Promise<QuizAttempt[]> {
    return await db.select()
      .from(quizAttempts)
      .orderBy(desc(quizAttempts.startedAt));
  }

  // BOOKMARKS
  async createBookmark(bookmark: InsertBookmark): Promise<Bookmark> {
    const [newBookmark] = await db.insert(bookmarks).values(bookmark).returning();
    return newBookmark;
  }

  async getBookmarksByUser(userId: number): Promise<Bookmark[]> {
    return await db.select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId));
  }

  async deleteBookmark(userId: number, questionId: number): Promise<void> {
    await db.delete(bookmarks)
      .where(and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.questionId, questionId)
      ));
  }

  // USER PROGRESS
  async getUserProgressBySubject(userId: number, subjectId: number): Promise<UserProgress | undefined> {
    const [progress] = await db.select()
      .from(userProgress)
      .where(and(
        eq(userProgress.userId, userId),
        eq(userProgress.subjectId, subjectId),
        isNull(userProgress.topicId),
        isNull(userProgress.subtopicId)
      ));
    return progress;
  }

  async getUserProgressByTopic(userId: number, topicId: number): Promise<UserProgress | undefined> {
    const [progress] = await db.select()
      .from(userProgress)
      .where(and(
        eq(userProgress.userId, userId),
        eq(userProgress.topicId, topicId),
        isNull(userProgress.subtopicId)
      ));
    return progress;
  }

  async getUserProgressBySubtopic(userId: number, subtopicId: number): Promise<UserProgress | undefined> {
    const [progress] = await db.select()
      .from(userProgress)
      .where(and(
        eq(userProgress.userId, userId),
        eq(userProgress.subtopicId, subtopicId)
      ));
    return progress;
  }

  async updateUserProgress(
    userId: number, 
    subjectId: number | null, 
    topicId: number | null, 
    subtopicId: number | null, 
    data: Partial<InsertUserProgress>
  ): Promise<UserProgress> {
    // Try to find existing progress
    let existingProgress;
    if (subtopicId) {
      existingProgress = await this.getUserProgressBySubtopic(userId, subtopicId);
    } else if (topicId) {
      existingProgress = await this.getUserProgressByTopic(userId, topicId);
    } else if (subjectId) {
      existingProgress = await this.getUserProgressBySubject(userId, subjectId);
    }

    if (existingProgress) {
      // Update existing progress
      const [updatedProgress] = await db.update(userProgress)
        .set({
          ...data,
          lastStudiedAt: new Date()
        })
        .where(eq(userProgress.id, existingProgress.id))
        .returning();
      return updatedProgress;
    } else {
      // Create new progress record
      const [newProgress] = await db.insert(userProgress)
        .values({
          userId,
          subjectId: subjectId || null,
          topicId: topicId || null,
          subtopicId: subtopicId || null,
          quizzesCompleted: data.quizzesCompleted || 0,
          questionsAttempted: data.questionsAttempted || 0,
          questionsCorrect: data.questionsCorrect || 0,
          accuracy: data.accuracy || 0,
          completionPercentage: data.completionPercentage || 0,
          lastStudiedAt: new Date()
        })
        .returning();
      return newProgress;
    }
  }

  async getUserProgressOverview(userId: number): Promise<UserProgress[]> {
    return await db.select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId))
      .orderBy(desc(userProgress.lastStudiedAt));
  }

  // STUDY STREAKS
  async getStudyStreak(userId: number): Promise<StudyStreak | undefined> {
    const [streak] = await db.select()
      .from(studyStreaks)
      .where(eq(studyStreaks.userId, userId));
    return streak;
  }

  async updateStudyStreak(userId: number, currentStreak: number, maxStreak: number): Promise<StudyStreak> {
    const existingStreak = await this.getStudyStreak(userId);
    
    if (existingStreak) {
      const [updatedStreak] = await db.update(studyStreaks)
        .set({ 
          currentStreak, 
          maxStreak: Math.max(existingStreak.maxStreak, maxStreak) 
        })
        .where(eq(studyStreaks.id, existingStreak.id))
        .returning();
      return updatedStreak;
    } else {
      const [newStreak] = await db.insert(studyStreaks)
        .values({ 
          userId, 
          currentStreak, 
          maxStreak 
        })
        .returning();
      return newStreak;
    }
  }

  // CHAT MESSAGES
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getChatMessagesByUser(userId: number, limit: number): Promise<ChatMessage[]> {
    const messages = await db.select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(desc(chatMessages.createdAt));
    
    return messages.slice(0, limit);
  }

  // STUDY PLANS
  async createStudyPlan(plan: InsertStudyPlan): Promise<StudyPlan> {
    const [newPlan] = await db.insert(studyPlans)
      .values(plan)
      .returning();
    return newPlan;
  }

  async getStudyPlansByUser(userId: number): Promise<StudyPlan[]> {
    return await db.select()
      .from(studyPlans)
      .where(eq(studyPlans.userId, userId))
      .orderBy(desc(studyPlans.createdAt));
  }

  async getActiveStudyPlan(userId: number): Promise<StudyPlan | undefined> {
    const now = new Date();
    const [plan] = await db.select()
      .from(studyPlans)
      .where(and(
        eq(studyPlans.userId, userId),
        lte(studyPlans.startDate, now),
        gte(studyPlans.endDate, now)
      ))
      .orderBy(desc(studyPlans.createdAt));
    
    return plan;
  }
}