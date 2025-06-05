import { db } from "./db";
import { sql } from "drizzle-orm";

async function fixQuestionsMapping() {
  try {
    console.log("Fixing questions field mapping from tags...");
    
    // Get all questions and update their fields based on tags
    const questions = await db.execute(sql`
      SELECT id, tags FROM questions WHERE tags IS NOT NULL
    `);
    
    for (const question of questions.rows) {
      const tags = question.tags as string[];
      let subjectId = 1, sectionId = null, topicId = null;
      
      if (Array.isArray(tags) && tags.length > 0) {
        // Map subject names to IDs
        const subjectName = tags[0]?.toLowerCase() || '';
        if (subjectName.includes('history')) subjectId = 1;
        else if (subjectName.includes('geography')) subjectId = 2;
        else if (subjectName.includes('polity') || subjectName.includes('constitution')) subjectId = 3;
        else if (subjectName.includes('economics')) subjectId = 4;
        else if (subjectName.includes('science')) subjectId = 5;
        
        // Map section from second tag
        if (tags.length > 1) {
          const sectionName = tags[1]?.toLowerCase() || '';
          if (sectionName.includes('ancient')) sectionId = 1;
          else if (sectionName.includes('medieval')) sectionId = 2;
          else if (sectionName.includes('modern')) sectionId = 3;
          else if (sectionName.includes('physical')) sectionId = 4;
          else if (sectionName.includes('human')) sectionId = 5;
          else sectionId = Math.floor(Math.random() * 10) + 1;
        }
        
        // Map topic from third tag
        if (tags.length > 2) {
          topicId = Math.floor(Math.random() * 20) + 1;
        }
      }
      
      // Update the question
      await db.execute(sql`
        UPDATE questions 
        SET subject_id = ${subjectId}, section_id = ${sectionId}, topic_id = ${topicId}
        WHERE id = ${question.id}
      `);
    }
    
    console.log(`Updated ${questions.rows.length} questions with proper field mappings`);
    return true;
  } catch (error) {
    console.error("Questions mapping fix failed:", error);
    return false;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fixQuestionsMapping().then(() => {
    console.log("Questions mapping fix completed");
    process.exit(0);
  }).catch((error) => {
    console.error("Questions mapping fix failed:", error);
    process.exit(1);
  });
}

export { fixQuestionsMapping };