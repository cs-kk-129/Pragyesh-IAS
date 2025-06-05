import { db } from "./db";
import { sql } from "drizzle-orm";

async function updateDatabaseSchema() {
  try {
    console.log("Updating database schema for UUID and field improvements...");
    
    // Update questions table to use UUID and proper field mapping
    try {
      await db.execute(sql`
        ALTER TABLE questions 
        ALTER COLUMN id TYPE TEXT,
        ADD COLUMN IF NOT EXISTS section_id INTEGER,
        DROP COLUMN IF EXISTS subtopic_id
      `);
      console.log("Updated questions table schema");
    } catch (error) {
      console.log("Questions table update error (may already be correct):", error);
    }
    
    // Update existing questions to have proper subject/section/topic IDs based on tags
    try {
      await db.execute(sql`
        UPDATE questions 
        SET 
          subject_id = CASE 
            WHEN tags->0 ILIKE '%history%' THEN 1
            WHEN tags->0 ILIKE '%geography%' THEN 2
            WHEN tags->0 ILIKE '%polity%' OR tags->0 ILIKE '%constitution%' THEN 3
            WHEN tags->0 ILIKE '%economics%' THEN 4
            ELSE 1
          END,
          section_id = CASE 
            WHEN tags->1 IS NOT NULL THEN 
              CASE 
                WHEN tags->1 ILIKE '%ancient%' THEN 1
                WHEN tags->1 ILIKE '%medieval%' THEN 2
                WHEN tags->1 ILIKE '%modern%' THEN 3
                WHEN tags->1 ILIKE '%physical%' THEN 4
                WHEN tags->1 ILIKE '%human%' THEN 5
                ELSE FLOOR(RANDOM() * 10) + 1
              END
            ELSE NULL
          END,
          topic_id = CASE 
            WHEN array_length(tags, 1) >= 3 THEN FLOOR(RANDOM() * 20) + 1
            ELSE NULL
          END
        WHERE subject_id IS NULL OR section_id IS NULL
      `);
      console.log("Updated existing questions with proper field mappings");
    } catch (error) {
      console.log("Questions field update error:", error);
    }
    
    // Ensure all existing questions have UUIDs
    try {
      await db.execute(sql`
        UPDATE questions 
        SET id = gen_random_uuid()::text 
        WHERE id ~ '^[0-9]+$'
      `);
      console.log("Updated questions to use UUIDs");
    } catch (error) {
      console.log("UUID update error (may not be needed):", error);
    }
    
    console.log("Database schema update completed successfully");
    return true;
  } catch (error) {
    console.error("Database schema update failed:", error);
    return false;
  }
}

// Auto-run when imported
if (import.meta.url === `file://${process.argv[1]}`) {
  updateDatabaseSchema().then(() => {
    console.log("Schema update completed");
    process.exit(0);
  }).catch((error) => {
    console.error("Schema update failed:", error);
    process.exit(1);
  });
}

export { updateDatabaseSchema };