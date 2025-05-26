import { db } from './db';
import { sql } from 'drizzle-orm';

// First, let's create the comprehensive UPSC curriculum import
async function updateSchemaAndImportUPSC() {
  console.log("Starting comprehensive UPSC schema update and curriculum import...");

  try {
    // Drop existing tables and recreate with new structure
    console.log("Updating database schema...");
    
    await db.execute(sql`DROP TABLE IF EXISTS subtopics CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS topics CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS sections CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS subjects CASCADE`);
    
    // Create subjects table
    await db.execute(sql`
      CREATE TABLE subjects (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create sections table
    await db.execute(sql`
      CREATE TABLE sections (
        id SERIAL PRIMARY KEY,
        subject_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
      )
    `);

    // Create topics table  
    await db.execute(sql`
      CREATE TABLE topics (
        id SERIAL PRIMARY KEY,
        section_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'not_started',
        image_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
      )
    `);

    console.log("Schema updated successfully");

    // Import subjects
    console.log("Importing subjects...");
    
    const subjectsData = [
      { name: 'Indian History', description: 'Ancient, Medieval, and Modern Indian History', category: 'History' },
      { name: 'Art & Culture', description: 'Indian art, architecture, literature, music, dance, and cultural heritage', category: 'Culture' },
      { name: 'Geography', description: 'Physical Geography, Indian Geography, Human & Economic Geography', category: 'Geography' },
      { name: 'Indian Polity & Governance', description: 'Constitution, Political System, and Governance structures', category: 'Polity' },
      { name: 'Indian Economy', description: 'Economic concepts, development, sectors, and government initiatives', category: 'Economy' },
      { name: 'Environment & Ecology', description: 'Environmental topics, conservation, and climate change', category: 'Environment' },
      { name: 'Science & Technology', description: 'Modern science and technology developments', category: 'Science' },
      { name: 'General Science', description: 'Basic concepts in Physics, Chemistry, and Biology', category: 'Science' },
      { name: 'Ethics, Integrity & Aptitude (GS Paper IV)', description: 'Ethics, moral philosophy, and aptitude', category: 'Ethics' },
      { name: 'Current Affairs', description: 'National and international current events', category: 'Current Affairs' },
      { name: 'CSAT (Prelims Paper II)', description: 'Comprehension and quantitative aptitude', category: 'CSAT' }
    ];

    for (const subject of subjectsData) {
      await db.execute(sql`
        INSERT INTO subjects (name, description, category) 
        VALUES (${subject.name}, ${subject.description}, ${subject.category})
      `);
    }

    // Import sections
    console.log("Importing sections...");
    
    const sectionsData = [
      { subject_id: 1, name: 'Ancient History' },
      { subject_id: 1, name: 'Medieval History' },
      { subject_id: 1, name: 'Modern History' },
      { subject_id: 2, name: 'Art & Culture Topics' },
      { subject_id: 3, name: 'Physical Geography' },
      { subject_id: 3, name: 'Indian Geography' },
      { subject_id: 3, name: 'Human & Economic Geography' },
      { subject_id: 4, name: 'Constitution of India' },
      { subject_id: 4, name: 'Political System' },
      { subject_id: 4, name: 'Governance' },
      { subject_id: 5, name: 'Basic Concepts' },
      { subject_id: 5, name: 'Economic Development' },
      { subject_id: 5, name: 'Sectors of Economy' },
      { subject_id: 5, name: 'Government Initiatives' },
      { subject_id: 6, name: 'Environment & Ecology Topics' },
      { subject_id: 7, name: 'Science & Technology Topics' },
      { subject_id: 8, name: 'General Science Topics' },
      { subject_id: 9, name: 'Ethics & Aptitude' },
      { subject_id: 10, name: 'Current Affairs Topics' },
      { subject_id: 11, name: 'Comprehension & Reasoning' },
      { subject_id: 11, name: 'Quantitative Aptitude' }
    ];

    for (const section of sectionsData) {
      await db.execute(sql`
        INSERT INTO sections (subject_id, name) 
        VALUES (${section.subject_id}, ${section.name})
      `);
    }

    // Import topics - comprehensive list from the SQL file
    console.log("Importing topics...");
    
    const topicsData = [
      // Ancient History topics (section_id: 1)
      { section_id: 1, name: 'Prehistoric Cultures in India' },
      { section_id: 1, name: 'Indus Valley Civilization' },
      { section_id: 1, name: 'Vedic Age' },
      { section_id: 1, name: 'Mahajanapadas & Rise of Jainism and Buddhism' },
      { section_id: 1, name: 'Mauryan Empire' },
      { section_id: 1, name: 'Post-Mauryan Kingdoms' },
      { section_id: 1, name: 'Gupta Age' },
      { section_id: 1, name: 'Post-Gupta Period' },
      { section_id: 1, name: 'Early South Indian Kingdoms' },
      
      // Medieval History topics (section_id: 2)
      { section_id: 2, name: 'Early Medieval Period (750–1200 AD)' },
      { section_id: 2, name: 'Delhi Sultanate' },
      { section_id: 2, name: 'Vijayanagara and Bahmani Kingdoms' },
      { section_id: 2, name: 'Mughal Empire' },
      { section_id: 2, name: 'Marathas and Regional Kingdoms' },
      { section_id: 2, name: 'Religious Movements: Bhakti & Sufi' },
      { section_id: 2, name: 'Administrative and Cultural Developments' },
      
      // Modern History topics (section_id: 3)
      { section_id: 3, name: 'Advent of Europeans' },
      { section_id: 3, name: 'British Expansion in India' },
      { section_id: 3, name: 'Socio-Religious Reform Movements' },
      { section_id: 3, name: 'Revolt of 1857' },
      { section_id: 3, name: 'Indian National Movement: Pre-Congress (1858–1885)' },
      { section_id: 3, name: 'INC Formation & Early Phase' },
      { section_id: 3, name: 'Extremist Phase (1905–1919)' },
      { section_id: 3, name: 'Gandhian Era (1919–1947)' },
      { section_id: 3, name: 'Constitutional Developments' },
      { section_id: 3, name: 'Partition & Independence' },
      
      // Art & Culture topics (section_id: 4)
      { section_id: 4, name: 'Indian Architecture (Ancient to Modern)' },
      { section_id: 4, name: 'Sculpture and Iconography' },
      { section_id: 4, name: 'Indian Paintings' },
      { section_id: 4, name: 'Performing Arts: Music, Dance, Theatre' },
      { section_id: 4, name: 'Literature (Sanskrit, Tamil, Regional)' },
      { section_id: 4, name: 'Religion and Philosophy' },
      { section_id: 4, name: 'UNESCO Heritage Sites in India' },
      { section_id: 4, name: 'Fairs, Festivals and Cultural Institutions' },
      
      // Physical Geography topics (section_id: 5)
      { section_id: 5, name: 'Geomorphology' },
      { section_id: 5, name: 'Climatology' },
      { section_id: 5, name: 'Oceanography' },
      { section_id: 5, name: 'Biogeography' },
      
      // Indian Geography topics (section_id: 6)
      { section_id: 6, name: 'Physiographic Divisions' },
      { section_id: 6, name: 'Climate and Weather Patterns' },
      { section_id: 6, name: 'Soil and Natural Vegetation' },
      { section_id: 6, name: 'Rivers and Water Resources' },
      { section_id: 6, name: 'Agriculture' },
      { section_id: 6, name: 'Mineral and Energy Resources' },
      { section_id: 6, name: 'Transport and Infrastructure' },
      { section_id: 6, name: 'Natural Hazards and Disaster Management' },
      
      // Human & Economic Geography topics (section_id: 7)
      { section_id: 7, name: 'Population and Demographics' },
      { section_id: 7, name: 'Urbanization and Migration' },
      { section_id: 7, name: 'Industries and Manufacturing' },
      { section_id: 7, name: 'Trade and Transport' },
      { section_id: 7, name: 'Regional Development' },
      
      // Constitution topics (section_id: 8)
      { section_id: 8, name: 'Historical Background' },
      { section_id: 8, name: 'Preamble' },
      { section_id: 8, name: 'Fundamental Rights and Duties' },
      { section_id: 8, name: 'Directive Principles of State Policy' },
      { section_id: 8, name: 'Amendment Procedures' },
      { section_id: 8, name: 'Constitutional Bodies' },
      
      // Political System topics (section_id: 9)
      { section_id: 9, name: 'Parliament' },
      { section_id: 9, name: 'President and Vice-President' },
      { section_id: 9, name: 'Prime Minister and Council of Ministers' },
      { section_id: 9, name: 'Judiciary (Supreme Court, High Courts)' },
      { section_id: 9, name: 'Federalism and Centre-State Relations' },
      { section_id: 9, name: 'Emergency Provisions' },
      { section_id: 9, name: 'Elections and Representation' },
      { section_id: 9, name: 'Political Parties and Pressure Groups' },
      
      // Governance topics (section_id: 10)
      { section_id: 10, name: 'Civil Services' },
      { section_id: 10, name: 'e-Governance' },
      { section_id: 10, name: 'Transparency and Accountability' },
      { section_id: 10, name: 'RTI, Citizen Charters, Grievance Redressal' },
      { section_id: 10, name: 'NGOs and SHGs' },
      { section_id: 10, name: 'Role of Media' },
      
      // Basic Economic Concepts topics (section_id: 11)
      { section_id: 11, name: 'National Income' },
      { section_id: 11, name: 'Inflation and Deflation' },
      { section_id: 11, name: 'Monetary and Fiscal Policy' },
      { section_id: 11, name: 'Banking and Financial Institutions' },
      { section_id: 11, name: 'Budgeting' },
      
      // Economic Development topics (section_id: 12)
      { section_id: 12, name: 'Planning in India' },
      { section_id: 12, name: 'Poverty and Unemployment' },
      { section_id: 12, name: 'Inclusive Growth' },
      { section_id: 12, name: 'Sustainable Development Goals' },
      { section_id: 12, name: 'Demographic Dividend' },
      
      // Sectors of Economy topics (section_id: 13)
      { section_id: 13, name: 'Agriculture and Allied Sectors' },
      { section_id: 13, name: 'Industry and Infrastructure' },
      { section_id: 13, name: 'Services Sector' },
      { section_id: 13, name: 'MSMEs' },
      
      // Government Initiatives topics (section_id: 14)
      { section_id: 14, name: 'Major Government Schemes' },
      { section_id: 14, name: 'NITI Aayog' },
      { section_id: 14, name: 'Tax Reforms (GST, Direct Tax)' },
      
      // Environment & Ecology topics (section_id: 15)
      { section_id: 15, name: 'Ecosystems and Biodiversity' },
      { section_id: 15, name: 'Environmental Pollution' },
      { section_id: 15, name: 'Environmental Laws and Policies' },
      { section_id: 15, name: 'Climate Change and Global Warming' },
      { section_id: 15, name: 'Conservation Efforts (national parks, tiger reserves)' },
      { section_id: 15, name: 'Sustainable Development' },
      { section_id: 15, name: 'International Environmental Conventions (UNFCCC, CBD, Kyoto Protocol, Paris Agreement)' },
      
      // Science & Technology topics (section_id: 16)
      { section_id: 16, name: 'Space Technology' },
      { section_id: 16, name: 'Defence Technology' },
      { section_id: 16, name: 'Nuclear Technology' },
      { section_id: 16, name: 'Biotechnology' },
      { section_id: 16, name: 'IT & Computers' },
      { section_id: 16, name: 'Robotics and AI' },
      { section_id: 16, name: 'Scientific Institutions in India' },
      { section_id: 16, name: 'Developments in Health and Medicine' },
      
      // General Science topics (section_id: 17)
      { section_id: 17, name: 'Physics (basic mechanics, optics, electricity)' },
      { section_id: 17, name: 'Chemistry (basic concepts, everyday applications)' },
      { section_id: 17, name: 'Biology (human body, diseases, nutrition)' },
      
      // Ethics & Aptitude topics (section_id: 18)
      { section_id: 18, name: 'Ethics and Human Interface' },
      { section_id: 18, name: 'Attitude and Emotional Intelligence' },
      { section_id: 18, name: 'Moral Thinkers and Philosophers' },
      { section_id: 18, name: 'Public Service Values and Ethics in Administration' },
      { section_id: 18, name: 'Accountability and Ethical Governance' },
      { section_id: 18, name: 'Probity in Governance' },
      { section_id: 18, name: 'Case Studies on Administrative Issues' },
      
      // Current Affairs topics (section_id: 19)
      { section_id: 19, name: 'Government Policies' },
      { section_id: 19, name: 'International Relations' },
      { section_id: 19, name: 'Economic Developments' },
      { section_id: 19, name: 'Environment & Climate Events' },
      { section_id: 19, name: 'Science & Tech Innovations' },
      { section_id: 19, name: 'Social Justice Issues' },
      { section_id: 19, name: 'Sports, Awards, and Reports' },
      
      // Comprehension & Reasoning topics (section_id: 20)
      { section_id: 20, name: 'Reading Comprehension' },
      { section_id: 20, name: 'Logical Reasoning' },
      { section_id: 20, name: 'Analytical Ability' },
      
      // Quantitative Aptitude topics (section_id: 21)
      { section_id: 21, name: 'Basic Numeracy (up to Class X level)' },
      { section_id: 21, name: 'Data Interpretation' },
      { section_id: 21, name: 'Arithmetic, Percentages, Ratios' },
      { section_id: 21, name: 'Time, Distance, Work, Averages' }
    ];

    for (const topic of topicsData) {
      await db.execute(sql`
        INSERT INTO topics (section_id, name) 
        VALUES (${topic.section_id}, ${topic.name})
      `);
    }

    console.log("Comprehensive UPSC curriculum import completed successfully!");
    
    // Get counts
    const subjectCount = await db.execute(sql`SELECT COUNT(*) as count FROM subjects`);
    const sectionCount = await db.execute(sql`SELECT COUNT(*) as count FROM sections`);
    const topicCount = await db.execute(sql`SELECT COUNT(*) as count FROM topics`);
    
    return {
      subjects: subjectCount.rows[0].count,
      sections: sectionCount.rows[0].count,
      topics: topicCount.rows[0].count
    };

  } catch (error) {
    console.error("Error in schema update and import:", error);
    throw error;
  }
}

export { updateSchemaAndImportUPSC };