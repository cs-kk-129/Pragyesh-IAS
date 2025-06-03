import type { User, InsertUser, Subject, InsertSubject, Topic, InsertTopic, Subtopic, InsertSubtopic, Quiz, InsertQuiz, Question, InsertQuestion, QuizAttempt, InsertQuizAttempt, Bookmark, InsertBookmark, UserProgress, InsertUserProgress, StudyStreak, InsertStudyStreak, ChatMessage, InsertChatMessage, StudyPlan, InsertStudyPlan } from "@shared/schema";
import session from "express-session";
import { DatabaseStorage } from "./database-storage";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Subjects
  getAllSubjects(): Promise<Subject[]>;
  getSubjectById(id: number): Promise<Subject | undefined>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  
  // Topics
  getAllTopics(): Promise<Topic[]>;
  getTopicById(id: number): Promise<Topic | undefined>;
  getTopicsBySubject(subjectId: number): Promise<Topic[]>;
  createTopic(topic: InsertTopic): Promise<Topic>;
  updateTopicStatus(id: number, status: string): Promise<Topic>;
  
  // Subtopics
  getAllSubtopics(): Promise<Subtopic[]>;
  getSubtopicById(id: number): Promise<Subtopic | undefined>;
  getSubtopicsByTopic(topicId: number): Promise<Subtopic[]>;
  createSubtopic(subtopic: InsertSubtopic): Promise<Subtopic>;
  updateSubtopicStatus(id: number, status: string): Promise<Subtopic>;
  
  // Quizzes
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  getQuizById(id: number): Promise<Quiz | undefined>;
  getQuizzesBySubject(subjectId: number): Promise<Quiz[]>;
  getQuizzesByTopic(topicId: number): Promise<Quiz[]>;
  getQuizzesBySubtopic(subtopicId: number): Promise<Quiz[]>;
  getComprehensiveQuizzesBySubject(subjectId: number): Promise<Quiz[]>;
  
  // Questions
  createQuestion(question: InsertQuestion): Promise<Question>;
  getQuestionsByQuiz(quizId: number): Promise<Question[]>;
  getBookmarkedQuestions(userId: number): Promise<Question[]>;
  
  // Quiz Attempts
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  getQuizAttemptsByUser(userId: number): Promise<QuizAttempt[]>;
  getRecentQuizAttempts(userId: number, limit: number): Promise<QuizAttempt[]>;
  getAllQuizAttempts(): Promise<QuizAttempt[]>;
  
  // Bookmarks
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  getBookmarksByUser(userId: number): Promise<Bookmark[]>;
  deleteBookmark(userId: number, questionId: number): Promise<void>;
  
  // User Progress
  getUserProgressBySubject(userId: number, subjectId: number): Promise<UserProgress | undefined>;
  getUserProgressByTopic(userId: number, topicId: number): Promise<UserProgress | undefined>;
  getUserProgressBySubtopic(userId: number, subtopicId: number): Promise<UserProgress | undefined>;
  updateUserProgress(userId: number, subjectId: number | null, topicId: number | null, subtopicId: number | null, data: Partial<InsertUserProgress>): Promise<UserProgress>;
  getUserProgressOverview(userId: number): Promise<UserProgress[]>;
  
  // Study Streaks
  getStudyStreak(userId: number): Promise<StudyStreak | undefined>;
  updateStudyStreak(userId: number, currentStreak: number, maxStreak: number): Promise<StudyStreak>;
  
  // Chat Messages
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessagesByUser(userId: number, limit: number): Promise<ChatMessage[]>;
  
  // Study Plans
  createStudyPlan(plan: InsertStudyPlan): Promise<StudyPlan>;
  getStudyPlansByUser(userId: number): Promise<StudyPlan[]>;
  getActiveStudyPlan(userId: number): Promise<StudyPlan | undefined>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private topics: Map<number, Topic>;
  private quizzes: Map<number, Quiz>;
  private questions: Map<number, Question>;
  private quizAttempts: Map<number, QuizAttempt>;
  private userProgressRecords: Map<string, UserProgress>;
  private studyStreaks: Map<number, StudyStreak>;
  private chatMessages: Map<number, ChatMessage>;
  private studyPlans: Map<number, StudyPlan>;
  
  sessionStore: session.SessionStore;
  
  private currentIds: {
    users: number;
    topics: number;
    quizzes: number;
    questions: number;
    quizAttempts: number;
    userProgress: number;
    studyStreaks: number;
    chatMessages: number;
    studyPlans: number;
  };

  constructor() {
    this.users = new Map();
    this.topics = new Map();
    this.quizzes = new Map();
    this.questions = new Map();
    this.quizAttempts = new Map();
    this.userProgressRecords = new Map();
    this.studyStreaks = new Map();
    this.chatMessages = new Map();
    this.studyPlans = new Map();
    
    this.currentIds = {
      users: 1,
      topics: 1,
      quizzes: 1,
      questions: 1,
      quizAttempts: 1,
      userProgress: 1,
      studyStreaks: 1,
      chatMessages: 1,
      studyPlans: 1
    };
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Initialize with some topics
    this.initializeTopics();
  }
  
  private initializeTopics() {
    const defaultTopics: InsertTopic[] = [
      { name: "Indian History", description: "Ancient, Medieval, and Modern History of India", category: "History" },
      { name: "Indian Polity", description: "Constitution, Political System, and Governance", category: "Polity" },
      { name: "Geography", description: "Physical, Human, and Economic Geography", category: "Geography" },
      { name: "Economics", description: "Micro & Macro Economics, Indian Economy", category: "Economics" },
      { name: "Environment & Ecology", description: "Biodiversity, Climate Change, and Environmental Issues", category: "Environment" }
    ];
    
    defaultTopics.forEach(topic => this.createTopic(topic));
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Topics
  async getAllTopics(): Promise<Topic[]> {
    return Array.from(this.topics.values());
  }
  
  async getTopicById(id: number): Promise<Topic | undefined> {
    return this.topics.get(id);
  }
  
  async getTopicsByCategory(category: string): Promise<Topic[]> {
    return Array.from(this.topics.values()).filter(
      (topic) => topic.category === category
    );
  }
  
  async createTopic(insertTopic: InsertTopic): Promise<Topic> {
    const id = this.currentIds.topics++;
    const topic: Topic = { ...insertTopic, id };
    this.topics.set(id, topic);
    return topic;
  }
  
  // Quizzes
  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    const id = this.currentIds.quizzes++;
    const createdAt = new Date();
    const quiz: Quiz = { ...insertQuiz, id, createdAt };
    this.quizzes.set(id, quiz);
    return quiz;
  }
  
  async getQuizById(id: number): Promise<Quiz | undefined> {
    return this.quizzes.get(id);
  }
  
  async getQuizzesByTopic(topicId: number): Promise<Quiz[]> {
    return Array.from(this.quizzes.values()).filter(
      (quiz) => quiz.topicId === topicId
    );
  }
  
  // Questions
  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = this.currentIds.questions++;
    const question: Question = { ...insertQuestion, id };
    this.questions.set(id, question);
    return question;
  }
  
  async getQuestionsByQuiz(quizId: number): Promise<Question[]> {
    return Array.from(this.questions.values()).filter(
      (question) => question.quizId === quizId
    );
  }
  
  // Quiz Attempts
  async createQuizAttempt(insertAttempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const id = this.currentIds.quizAttempts++;
    const completedAt = new Date();
    const attempt: QuizAttempt = { ...insertAttempt, id, completedAt };
    this.quizAttempts.set(id, attempt);
    return attempt;
  }
  
  async getQuizAttemptsByUser(userId: number): Promise<QuizAttempt[]> {
    return Array.from(this.quizAttempts.values())
      .filter((attempt) => attempt.userId === userId)
      .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
  }
  
  async getRecentQuizAttempts(userId: number, limit: number): Promise<QuizAttempt[]> {
    return this.getQuizAttemptsByUser(userId).slice(0, limit);
  }
  
  // User Progress
  async getUserProgressByTopic(userId: number, topicId: number): Promise<UserProgress | undefined> {
    const key = `${userId}-${topicId}`;
    return this.userProgressRecords.get(key);
  }
  
  async updateUserProgress(userId: number, topicId: number, quizzesCompleted: number): Promise<UserProgress> {
    const key = `${userId}-${topicId}`;
    const existingProgress = this.userProgressRecords.get(key);
    
    if (existingProgress) {
      const updatedProgress: UserProgress = {
        ...existingProgress,
        quizzesCompleted,
        lastStudiedAt: new Date()
      };
      this.userProgressRecords.set(key, updatedProgress);
      return updatedProgress;
    } else {
      const id = this.currentIds.userProgress++;
      const lastStudiedAt = new Date();
      const newProgress: UserProgress = { 
        id, 
        userId, 
        topicId, 
        quizzesCompleted, 
        lastStudiedAt 
      };
      this.userProgressRecords.set(key, newProgress);
      return newProgress;
    }
  }
  
  async getUserProgressOverview(userId: number): Promise<UserProgress[]> {
    return Array.from(this.userProgressRecords.values())
      .filter((progress) => progress.userId === userId)
      .sort((a, b) => b.lastStudiedAt.getTime() - a.lastStudiedAt.getTime());
  }
  
  // Study Streaks
  async getStudyStreak(userId: number): Promise<StudyStreak | undefined> {
    return this.studyStreaks.get(userId);
  }
  
  async updateStudyStreak(userId: number, currentStreak: number, maxStreak: number): Promise<StudyStreak> {
    const existingStreak = this.studyStreaks.get(userId);
    
    if (existingStreak) {
      const updatedStreak: StudyStreak = {
        ...existingStreak,
        currentStreak,
        maxStreak,
        lastStudyDate: new Date()
      };
      this.studyStreaks.set(userId, updatedStreak);
      return updatedStreak;
    } else {
      const id = this.currentIds.studyStreaks++;
      const lastStudyDate = new Date();
      const newStreak: StudyStreak = { 
        id, 
        userId, 
        currentStreak, 
        maxStreak, 
        lastStudyDate 
      };
      this.studyStreaks.set(userId, newStreak);
      return newStreak;
    }
  }
  
  // Chat Messages
  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentIds.chatMessages++;
    const createdAt = new Date();
    const message: ChatMessage = { ...insertMessage, id, createdAt };
    this.chatMessages.set(id, message);
    return message;
  }
  
  async getChatMessagesByUser(userId: number, limit: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter((message) => message.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
  
  // Study Plans
  async createStudyPlan(insertPlan: InsertStudyPlan): Promise<StudyPlan> {
    const id = this.currentIds.studyPlans++;
    const createdAt = new Date();
    const plan: StudyPlan = { ...insertPlan, id, createdAt };
    this.studyPlans.set(id, plan);
    return plan;
  }
  
  async getStudyPlansByUser(userId: number): Promise<StudyPlan[]> {
    return Array.from(this.studyPlans.values())
      .filter((plan) => plan.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getActiveStudyPlan(userId: number): Promise<StudyPlan | undefined> {
    const now = new Date();
    return Array.from(this.studyPlans.values())
      .find((plan) => 
        plan.userId === userId && 
        new Date(plan.startDate) <= now && 
        new Date(plan.endDate) >= now
      );
  }
}

export const storage = new DatabaseStorage();
