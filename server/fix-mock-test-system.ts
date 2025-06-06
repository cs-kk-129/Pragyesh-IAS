import { db } from "./db";
import { sql } from "drizzle-orm";
import * as schema from "@shared/schema";

async function fixMockTestSystem() {
  try {
    console.log("Fixing mock test system comprehensively...");
    
    // 1. Ensure questions table has proper schema with UUID support
    await db.execute(sql`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      -- Update questions table structure
      ALTER TABLE questions 
      ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;
      
      -- Ensure proper indexes for performance
      CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);
      CREATE INDEX IF NOT EXISTS idx_questions_subject_id ON questions(subject_id);
      CREATE INDEX IF NOT EXISTS idx_questions_section_id ON questions(section_id);
      CREATE INDEX IF NOT EXISTS idx_quizzes_test_date ON quizzes(test_date);
      CREATE INDEX IF NOT EXISTS idx_quizzes_quiz_type ON quizzes(quiz_type);
    `);
    
    // 2. Fix any orphaned questions (quizId = 0) by assigning them proper UUIDs
    const orphanedQuestions = await db.execute(sql`
      SELECT id FROM questions WHERE quiz_id = 0 AND id ~ '^[0-9]+$'
    `);
    
    for (const question of orphanedQuestions.rows) {
      await db.execute(sql`
        UPDATE questions 
        SET id = uuid_generate_v4()::text 
        WHERE id = ${question.id}
      `);
    }
    
    // 3. Ensure all questions have proper subject/section mappings
    await db.execute(sql`
      UPDATE questions 
      SET 
        subject_id = COALESCE(subject_id, 1),
        section_id = COALESCE(section_id, 1)
      WHERE subject_id IS NULL OR section_id IS NULL
    `);
    
    // 4. Create sample mock test for today's date if none exists
    const today = new Date().toISOString().split('T')[0];
    const existingTests = await db.execute(sql`
      SELECT id FROM quizzes 
      WHERE quiz_type = 'mock_test' AND DATE(test_date) = ${today}
    `);
    
    if (existingTests.rows.length === 0) {
      console.log("Creating sample mock test for today...");
      
      // Create a sample quiz for today
      const [sampleQuiz] = await db.insert(schema.quizzes).values({
        title: `UPSC Mock Test - ${today}`,
        description: "Comprehensive UPSC preparation test covering multiple subjects",
        quizType: 'mock_test',
        difficulty: 'medium',
        timeLimit: 120,
        testDate: new Date(),
        language: 'both',
        subjectId: 1,
        topicId: null,
        subtopicId: null
      }).returning();
      
      // Update any unassigned questions to belong to this quiz
      await db.execute(sql`
        UPDATE questions 
        SET quiz_id = ${sampleQuiz.id} 
        WHERE quiz_id = 0 AND id IN (
          SELECT id FROM questions WHERE quiz_id = 0 ORDER BY created_at DESC LIMIT 10
        )
      `);
      
      console.log(`Created sample mock test with ID: ${sampleQuiz.id}`);
    }
    
    console.log("Mock test system fixes completed successfully");
    return true;
  } catch (error) {
    console.error("Failed to fix mock test system:", error);
    return false;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fixMockTestSystem().then(() => {
    console.log("Mock test system fix completed");
    process.exit(0);
  }).catch((error) => {
    console.error("Mock test system fix failed:", error);
    process.exit(1);
  });
}

export { fixMockTestSystem };