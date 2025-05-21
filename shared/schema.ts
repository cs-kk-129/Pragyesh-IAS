import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
});

// Subjects model - Main categories like Polity, History, etc.
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSubjectSchema = createInsertSchema(subjects).pick({
  name: true,
  description: true,
  imageUrl: true,
});

// Topics model - Main topics within a subject
export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  status: text("status").default("not_started"), // not_started, in_progress, completed
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTopicSchema = createInsertSchema(topics).pick({
  subjectId: true,
  name: true,
  description: true,
  status: true,
  imageUrl: true,
});

// Subtopics model - Specific areas within topics
export const subtopics = pgTable("subtopics", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  status: text("status").default("not_started"), // not_started, in_progress, completed
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSubtopicSchema = createInsertSchema(subtopics).pick({
  topicId: true,
  name: true,
  description: true,
  status: true,
  imageUrl: true,
});

// Quiz model
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  quizType: text("quiz_type").notNull(), // unit_quiz, comprehensive_quiz, mock_test, adaptive
  subjectId: integer("subject_id"),
  topicId: integer("topic_id"),
  subtopicId: integer("subtopic_id"),
  difficulty: text("difficulty").default("medium"), // easy, medium, hard
  timeLimit: integer("time_limit"), // in minutes
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQuizSchema = createInsertSchema(quizzes).pick({
  title: true,
  quizType: true,
  subjectId: true,
  topicId: true,
  subtopicId: true,
  difficulty: true,
  timeLimit: true,
});

// Quiz questions model
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull(),
  subjectId: integer("subject_id"),
  topicId: integer("topic_id"),
  subtopicId: integer("subtopic_id"),
  question: text("question").notNull(),
  options: json("options").notNull().$type<string[]>(),
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation").notNull(),
  difficulty: text("difficulty").default("medium"), // easy, medium, hard
  tags: json("tags").$type<string[]>(), // For categorizing questions
  isBookmarked: boolean("is_bookmarked").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQuestionSchema = createInsertSchema(questions).pick({
  quizId: true,
  subjectId: true,
  topicId: true,
  subtopicId: true,
  question: true,
  options: true,
  correctAnswer: true,
  explanation: true,
  difficulty: true,
  tags: true,
  isBookmarked: true,
});

// Quiz attempt model
export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  quizId: integer("quiz_id").notNull(),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  accuracy: integer("accuracy"), // percentage
  timeTaken: integer("time_taken"), // in seconds
  answeredQuestions: json("answered_questions").$type<{
    questionId: number;
    userAnswer: string;
    isCorrect: boolean;
    timeSpent: number; // in seconds
  }[]>(),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).pick({
  userId: true,
  quizId: true,
  score: true,
  totalQuestions: true,
  accuracy: true,
  timeTaken: true,
  answeredQuestions: true,
});

// User bookmarks model
export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  questionId: integer("question_id").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBookmarkSchema = createInsertSchema(bookmarks).pick({
  userId: true,
  questionId: true,
  notes: true,
});

// User progress model
export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  subjectId: integer("subject_id"),
  topicId: integer("topic_id"),
  subtopicId: integer("subtopic_id"),
  quizzesCompleted: integer("quizzes_completed").notNull().default(0),
  questionsAttempted: integer("questions_attempted").default(0),
  questionsCorrect: integer("questions_correct").default(0),
  accuracy: integer("accuracy").default(0), // percentage
  completionPercentage: integer("completion_percentage").default(0),
  lastStudiedAt: timestamp("last_studied_at").defaultNow(),
});

export const insertUserProgressSchema = createInsertSchema(userProgress).pick({
  userId: true,
  subjectId: true,
  topicId: true,
  subtopicId: true,
  quizzesCompleted: true,
  questionsAttempted: true,
  questionsCorrect: true,
  accuracy: true,
  completionPercentage: true,
});

// Study streak model
export const studyStreaks = pgTable("study_streaks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  currentStreak: integer("current_streak").notNull().default(0),
  maxStreak: integer("max_streak").notNull().default(0),
  lastStudyDate: timestamp("last_study_date").defaultNow(),
});

export const insertStudyStreakSchema = createInsertSchema(studyStreaks).pick({
  userId: true,
  currentStreak: true,
  maxStreak: true,
});

// Chat messages model
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  message: text("message").notNull(),
  response: text("response").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  userId: true,
  message: true,
  response: true,
});

// Study plans model
export const studyPlans = pgTable("study_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  plan: json("plan").notNull().$type<{
    day: string;
    topics: { topicId: number; duration: number; notes: string }[];
  }[]>(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStudyPlanSchema = createInsertSchema(studyPlans).pick({
  userId: true,
  title: true,
  plan: true,
  startDate: true,
  endDate: true,
});

// Export all types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Subject = typeof subjects.$inferSelect;

export type InsertTopic = z.infer<typeof insertTopicSchema>;
export type Topic = typeof topics.$inferSelect;

export type InsertSubtopic = z.infer<typeof insertSubtopicSchema>;
export type Subtopic = typeof subtopics.$inferSelect;

export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = typeof quizzes.$inferSelect;

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;

export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;

export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;

export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type UserProgress = typeof userProgress.$inferSelect;

export type InsertStudyStreak = z.infer<typeof insertStudyStreakSchema>;
export type StudyStreak = typeof studyStreaks.$inferSelect;

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

export type InsertStudyPlan = z.infer<typeof insertStudyPlanSchema>;
export type StudyPlan = typeof studyPlans.$inferSelect;
