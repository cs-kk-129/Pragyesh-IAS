import { db } from "./db";
import { sql } from "drizzle-orm";

async function fixDatabaseSchema() {
  try {
    console.log("Fixing database schema...");
    
    // Add missing columns to quizzes table if they don't exist
    try {
      await db.execute(sql`ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS test_date TIMESTAMP`);
      console.log("Added test_date column to quizzes table");
    } catch (error) {
      console.log("test_date column already exists or error:", error);
    }
    
    try {
      await db.execute(sql`ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS description TEXT`);
      console.log("Added description column to quizzes table");
    } catch (error) {
      console.log("description column already exists or error:", error);
    }
    
    try {
      await db.execute(sql`ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS instructions TEXT`);
      console.log("Added instructions column to quizzes table");
    } catch (error) {
      console.log("instructions column already exists or error:", error);
    }
    
    try {
      await db.execute(sql`ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'both'`);
      console.log("Added language column to quizzes table");
    } catch (error) {
      console.log("language column already exists or error:", error);
    }
    
    // Ensure questions table has all needed columns
    try {
      await db.execute(sql`ALTER TABLE questions ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'`);
      console.log("Added tags column to questions table");
    } catch (error) {
      console.log("tags column already exists or error:", error);
    }
    
    // Ensure quiz_attempts table exists with correct structure
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS quiz_attempts (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          quiz_id INTEGER NOT NULL,
          score INTEGER NOT NULL DEFAULT 0,
          total_questions INTEGER NOT NULL DEFAULT 0,
          accuracy INTEGER DEFAULT 0,
          time_taken INTEGER DEFAULT 0,
          answered_questions JSONB DEFAULT '[]',
          completed_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, quiz_id)
        )
      `);
      console.log("Ensured quiz_attempts table exists");
    } catch (error) {
      console.log("quiz_attempts table setup error:", error);
    }
    
    console.log("Database schema fixes completed successfully");
    return true;
  } catch (error) {
    console.error("Database schema fix failed:", error);
    return false;
  }
}

// Auto-run when imported
if (import.meta.url === `file://${process.argv[1]}`) {
  fixDatabaseSchema().then(() => {
    console.log("Schema fix completed");
    process.exit(0);
  }).catch((error) => {
    console.error("Schema fix failed:", error);
    process.exit(1);
  });
}

export { fixDatabaseSchema };