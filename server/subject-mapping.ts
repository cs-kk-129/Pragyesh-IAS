import { db } from "./db";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";

interface SubjectMapping {
  keywords: string[];
  aliases: string[];
}

const SUBJECT_MAPPINGS: Record<string, SubjectMapping> = {
  "Indian History": {
    keywords: ["history", "ancient", "medieval", "modern", "mughal", "british", "independence"],
    aliases: ["history"]
  },
  "Art & Culture": {
    keywords: ["art", "culture", "architecture", "literature", "music", "dance", "painting", "sculpture", "festivals", "traditions"],
    aliases: ["art and culture", "culture", "art"]
  },
  "Geography": {
    keywords: ["geography", "physical", "human", "economic", "climate", "rivers", "mountains", "agriculture"],
    aliases: ["geo"]
  },
  "Indian Polity & Governance": {
    keywords: ["polity", "constitution", "governance", "parliament", "judiciary", "executive", "fundamental rights"],
    aliases: ["polity", "governance"]
  },
  "Indian Economy": {
    keywords: ["economy", "economic", "gdp", "inflation", "banking", "finance", "budget", "planning"],
    aliases: ["economics"]
  },
  "Environment & Ecology": {
    keywords: ["environment", "ecology", "biodiversity", "conservation", "climate change", "pollution"],
    aliases: ["environment"]
  },
  "Science & Technology": {
    keywords: ["science", "technology", "space", "defense", "biotechnology", "communication", "innovation"],
    aliases: ["science", "tech"]
  },
  "General Science": {
    keywords: ["physics", "chemistry", "biology", "general science", "basic science"],
    aliases: ["general science"]
  },
  "Ethics, Integrity & Aptitude (GS Paper IV)": {
    keywords: ["ethics", "integrity", "aptitude", "moral", "philosophy", "values"],
    aliases: ["ethics"]
  },
  "Current Affairs": {
    keywords: ["current affairs", "national", "international", "news", "events", "awards"],
    aliases: ["current"]
  },
  "CSAT (Prelims Paper II)": {
    keywords: ["csat", "comprehension", "quantitative", "aptitude", "reasoning", "math"],
    aliases: ["csat"]
  }
};

export async function mapQuestionToSubject(questionSubject: string, questionTopic: string = ""): Promise<{ subjectId: number, sectionId: number | null }> {
  try {
    // Get all subjects from database
    const subjects = await db.select().from(schema.subjects);
    
    // Normalize search terms
    const searchTerms = [questionSubject, questionTopic]
      .filter(Boolean)
      .map(term => term.toLowerCase().trim());
    
    console.log('Mapping search terms:', searchTerms);
    
    // Find best matching subject
    let bestMatch = null;
    let highestScore = 0;
    
    for (const subject of subjects) {
      const subjectMapping = SUBJECT_MAPPINGS[subject.name];
      if (!subjectMapping) continue;
      
      let score = 0;
      
      // Check for exact name matches
      for (const searchTerm of searchTerms) {
        if (subject.name.toLowerCase().includes(searchTerm) || searchTerm.includes(subject.name.toLowerCase())) {
          score += 10;
        }
        
        // Check aliases
        for (const alias of subjectMapping.aliases) {
          if (searchTerm.includes(alias) || alias.includes(searchTerm)) {
            score += 8;
          }
        }
        
        // Check keywords
        for (const keyword of subjectMapping.keywords) {
          if (searchTerm.includes(keyword) || keyword.includes(searchTerm)) {
            score += 5;
          }
        }
      }
      
      if (score > highestScore) {
        highestScore = score;
        bestMatch = subject;
      }
    }
    
    if (bestMatch) {
      console.log(`Mapped to subject: ${bestMatch.name} (ID: ${bestMatch.id}) with score: ${highestScore}`);
      
      // Try to find a matching section/topic
      const sections = await db.select()
        .from(schema.topics)
        .where(eq(schema.topics.subjectId, bestMatch.id));
      
      let sectionId = null;
      if (questionTopic) {
        const sectionMatch = sections.find(section => 
          section.name.toLowerCase().includes(questionTopic.toLowerCase()) ||
          questionTopic.toLowerCase().includes(section.name.toLowerCase())
        );
        sectionId = sectionMatch?.id || null;
      }
      
      return { subjectId: bestMatch.id, sectionId };
    }
    
    // Default fallback
    console.log('No subject match found, defaulting to Indian History');
    return { subjectId: 1, sectionId: null };
    
  } catch (error) {
    console.error('Error mapping subject:', error);
    return { subjectId: 1, sectionId: null };
  }
}

export async function updateExistingQuestionMappings() {
  try {
    console.log('Updating existing question subject mappings...');
    
    // Get all questions with tags but incorrect subject mapping
    const questions = await db.select()
      .from(schema.questions)
      .where(schema.questions.tags !== null);
    
    let updated = 0;
    
    for (const question of questions) {
      if (question.tags && Array.isArray(question.tags) && question.tags.length > 0) {
        const { subjectId, sectionId } = await mapQuestionToSubject(
          question.tags[0] || '',
          question.tags[1] || ''
        );
        
        // Update if mapping changed
        if (question.subjectId !== subjectId || question.sectionId !== sectionId) {
          await db.update(schema.questions)
            .set({ 
              subjectId, 
              sectionId,
              topicId: null // Reset topic ID for now
            })
            .where(schema.questions.id === question.id);
          
          console.log(`Updated question ${question.id}: ${question.tags[0]} -> Subject ID ${subjectId}`);
          updated++;
        }
      }
    }
    
    console.log(`Updated ${updated} questions with correct subject mappings`);
    return updated;
    
  } catch (error) {
    console.error('Error updating question mappings:', error);
    return 0;
  }
}