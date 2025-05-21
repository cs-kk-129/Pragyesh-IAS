import { db } from './db';
import { subjects, topics, subtopics } from '@shared/schema';

// UPSC subjects structure based on the provided JSON
const upscSubjectsData = {
  "subjects": [
    {
      "name": "Indian History",
      "description": "Ancient, Medieval, and Modern history of the Indian subcontinent",
      "imageUrl": "/images/history.png",
      "topics": [
        {
          "name": "Ancient History",
          "description": "Study of prehistoric cultures, Indus Valley, Vedic Age, and ancient empires",
          "status": "not_started",
          "imageUrl": "/images/ancient-history.png",
          "subtopics": [
            {
              "name": "Prehistoric Cultures in India",
              "description": "Paleolithic, Mesolithic, and Neolithic cultures and their developments",
              "status": "not_started"
            },
            {
              "name": "Indus Valley Civilization",
              "description": "Urban planning, trade, art, and decline of the Harappan civilization",
              "status": "not_started"
            },
            {
              "name": "Vedic Age",
              "description": "Early and Later Vedic periods, social structure, and religious practices",
              "status": "not_started"
            },
            {
              "name": "Mahajanapadas & Rise of Jainism and Buddhism",
              "description": "16 Mahajanapadas, life of Buddha and Mahavira, and early religious movements",
              "status": "not_started"
            },
            {
              "name": "Mauryan Empire",
              "description": "Chandragupta Maurya, Ashoka, administration, and Mauryan art",
              "status": "not_started"
            },
            {
              "name": "Post-Mauryan Kingdoms",
              "description": "Kushanas, Satavahanas, and Indo-Greeks and their contributions",
              "status": "not_started"
            },
            {
              "name": "Gupta Age",
              "description": "Golden Age of India, Gupta rulers, administration, and cultural achievements",
              "status": "not_started"
            },
            {
              "name": "Post-Gupta Period",
              "description": "Harsha's empire, Chalukyas, Pallavas, and regional kingdoms",
              "status": "not_started"
            },
            {
              "name": "Early South Indian Kingdoms",
              "description": "Cholas, Cheras, Pandyas, and their administration, art, and culture",
              "status": "not_started"
            }
          ]
        },
        {
          "name": "Medieval History",
          "description": "Delhi Sultanate, Mughal Empire, and regional kingdoms of medieval India",
          "status": "not_started",
          "imageUrl": "/images/medieval-history.png",
          "subtopics": [
            {
              "name": "Early Medieval Period (750–1200 AD)",
              "description": "Tripartite struggle, Rajput kingdoms, and regional powers",
              "status": "not_started"
            },
            {
              "name": "Delhi Sultanate",
              "description": "Five dynasties, administration, art, and architecture",
              "status": "not_started"
            },
            {
              "name": "Vijayanagara and Bahmani Kingdoms",
              "description": "Southern kingdoms, administration, and cultural contributions",
              "status": "not_started"
            },
            {
              "name": "Mughal Empire",
              "description": "Major rulers from Babur to Aurangzeb, administration, and cultural developments",
              "status": "not_started"
            },
            {
              "name": "Marathas and Regional Kingdoms",
              "description": "Rise of Marathas, Shivaji, Peshwas, and other regional powers",
              "status": "not_started"
            },
            {
              "name": "Religious Movements: Bhakti & Sufi",
              "description": "Major saints, teachings, and social impact of religious movements",
              "status": "not_started"
            },
            {
              "name": "Administrative and Cultural Developments",
              "description": "Land revenue systems, art, architecture, and cultural synthesis",
              "status": "not_started"
            }
          ]
        },
        {
          "name": "Modern History",
          "description": "British colonization, freedom struggle, and modern Indian history",
          "status": "not_started",
          "imageUrl": "/images/modern-history.png",
          "subtopics": [
            {
              "name": "Advent of Europeans",
              "description": "Portuguese, Dutch, French, and British trading companies in India",
              "status": "not_started"
            },
            {
              "name": "British Expansion in India",
              "description": "Conquest strategies, battles, and consolidation of British power",
              "status": "not_started"
            },
            {
              "name": "Socio-Religious Reform Movements",
              "description": "Brahmo Samaj, Arya Samaj, and other reform movements of 19th century",
              "status": "not_started"
            },
            {
              "name": "Revolt of 1857",
              "description": "Causes, nature, spread, and significance of the First War of Independence",
              "status": "not_started"
            },
            {
              "name": "Indian National Movement: Pre-Congress",
              "description": "Early nationalist organizations and movements before 1885",
              "status": "not_started"
            },
            {
              "name": "INC Formation & Early Phase",
              "description": "Formation of Indian National Congress and Moderate phase (1885-1905)",
              "status": "not_started"
            },
            {
              "name": "Extremist Phase (1905–1919)",
              "description": "Swadeshi Movement, Home Rule Movement, and revolutionary activities",
              "status": "not_started"
            },
            {
              "name": "Gandhian Era (1919–1947)",
              "description": "Non-cooperation, Civil Disobedience, Quit India, and other movements",
              "status": "not_started"
            },
            {
              "name": "Constitutional Developments",
              "description": "From Regulating Act to Indian Independence Act and major reforms",
              "status": "not_started"
            },
            {
              "name": "Partition & Independence",
              "description": "Events leading to partition, independence, and integration of princely states",
              "status": "not_started"
            }
          ]
        }
      ]
    },
    {
      "name": "Art & Culture",
      "description": "Indian art forms, architecture, literature, and cultural heritage",
      "imageUrl": "/images/art-culture.png",
      "topics": [
        {
          "name": "Indian Culture",
          "description": "Comprehensive study of Indian cultural traditions and heritage",
          "status": "not_started",
          "imageUrl": "/images/indian-culture.png",
          "subtopics": [
            {
              "name": "Architecture",
              "description": "Ancient, medieval, and modern architectural styles and monuments",
              "status": "not_started"
            },
            {
              "name": "Sculpture and Iconography",
              "description": "Evolution of sculpture traditions and iconographic features",
              "status": "not_started"
            },
            {
              "name": "Paintings",
              "description": "Cave paintings, miniature styles, and modern Indian art",
              "status": "not_started"
            },
            {
              "name": "Music, Dance, Theatre",
              "description": "Classical and folk traditions of performing arts in India",
              "status": "not_started"
            },
            {
              "name": "Literature",
              "description": "Ancient texts, medieval literature, and modern literary traditions",
              "status": "not_started"
            },
            {
              "name": "Religion and Philosophy",
              "description": "Major religious and philosophical systems of India",
              "status": "not_started"
            },
            {
              "name": "UNESCO Heritage Sites",
              "description": "Cultural, natural, and mixed heritage sites in India",
              "status": "not_started"
            },
            {
              "name": "Fairs, Festivals and Cultural Institutions",
              "description": "Traditional celebrations and organizations promoting culture",
              "status": "not_started"
            }
          ]
        }
      ]
    },
    {
      "name": "Geography",
      "description": "Physical, human, and economic geography of India and the world",
      "imageUrl": "/images/geography.png",
      "topics": [
        {
          "name": "Physical Geography",
          "description": "Study of natural features, processes, and systems of the Earth",
          "status": "not_started",
          "imageUrl": "/images/physical-geography.png",
          "subtopics": [
            {
              "name": "Geomorphology",
              "description": "Study of landforms, their processes, and evolution",
              "status": "not_started"
            },
            {
              "name": "Climatology",
              "description": "Climate patterns, factors, and global climate systems",
              "status": "not_started"
            },
            {
              "name": "Oceanography",
              "description": "Ocean currents, marine resources, and ocean floor features",
              "status": "not_started"
            },
            {
              "name": "Biogeography",
              "description": "Distribution of flora and fauna and ecological regions",
              "status": "not_started"
            }
          ]
        },
        {
          "name": "Indian Geography",
          "description": "Geographical features and resources of the Indian subcontinent",
          "status": "not_started",
          "imageUrl": "/images/indian-geography.png",
          "subtopics": [
            {
              "name": "Physiographic Divisions",
              "description": "Major physical divisions of India and their characteristics",
              "status": "not_started"
            },
            {
              "name": "Climate and Weather",
              "description": "Monsoons, climatic regions, and weather patterns",
              "status": "not_started"
            },
            {
              "name": "Soil and Vegetation",
              "description": "Soil types, natural vegetation, and forest resources",
              "status": "not_started"
            },
            {
              "name": "Rivers and Water Resources",
              "description": "River systems, water management, and related issues",
              "status": "not_started"
            },
            {
              "name": "Agriculture",
              "description": "Cropping patterns, irrigation, and agricultural developments",
              "status": "not_started"
            },
            {
              "name": "Minerals and Energy Resources",
              "description": "Distribution and utilization of mineral and energy resources",
              "status": "not_started"
            },
            {
              "name": "Transport and Infrastructure",
              "description": "Transportation networks and infrastructure development",
              "status": "not_started"
            },
            {
              "name": "Disaster Management",
              "description": "Natural hazards, vulnerability, and disaster management strategies",
              "status": "not_started"
            }
          ]
        },
        {
          "name": "Human & Economic Geography",
          "description": "Population patterns, urbanization, and economic activities",
          "status": "not_started",
          "imageUrl": "/images/human-geography.png",
          "subtopics": [
            {
              "name": "Population and Demographics",
              "description": "Population growth, distribution, and demographic transition",
              "status": "not_started"
            },
            {
              "name": "Urbanization and Migration",
              "description": "Urban growth, migration patterns, and related challenges",
              "status": "not_started"
            },
            {
              "name": "Industries",
              "description": "Industrial development, location factors, and industrial regions",
              "status": "not_started"
            },
            {
              "name": "Trade and Transport",
              "description": "Trade patterns, transport networks, and global connections",
              "status": "not_started"
            },
            {
              "name": "Regional Development",
              "description": "Regional disparities, planning, and development strategies",
              "status": "not_started"
            }
          ]
        }
      ]
    },
    {
      "name": "Indian Polity & Governance",
      "description": "Constitution, political system, and governance in India",
      "imageUrl": "/images/polity.png",
      "topics": [
        {
          "name": "Constitution",
          "description": "Making, features, and amendments of the Indian Constitution",
          "status": "not_started",
          "imageUrl": "/images/constitution.png",
          "subtopics": [
            {
              "name": "Historical Background",
              "description": "Constitutional developments before independence and constitution-making",
              "status": "not_started"
            },
            {
              "name": "Preamble",
              "description": "Key elements, significance, and amendments to the Preamble",
              "status": "not_started"
            },
            {
              "name": "Fundamental Rights and Duties",
              "description": "Articles 12-35, restrictions, and constitutional remedies",
              "status": "not_started"
            },
            {
              "name": "Directive Principles of State Policy",
              "description": "Classification, implementation, and relationship with Fundamental Rights",
              "status": "not_started"
            },
            {
              "name": "Amendment Procedures",
              "description": "Types of amendments, major amendments, and basic structure doctrine",
              "status": "not_started"
            },
            {
              "name": "Constitutional Bodies",
              "description": "Election Commission, UPSC, CAG, and other constitutional bodies",
              "status": "not_started"
            }
          ]
        },
        {
          "name": "Political System",
          "description": "Structure and functioning of Indian political institutions",
          "status": "not_started",
          "imageUrl": "/images/political-system.png",
          "subtopics": [
            {
              "name": "Parliament",
              "description": "Structure, functions, procedures, and parliamentary committees",
              "status": "not_started"
            },
            {
              "name": "President and Vice-President",
              "description": "Election, powers, functions, and impeachment",
              "status": "not_started"
            },
            {
              "name": "Prime Minister and Council of Ministers",
              "description": "Appointment, powers, functions, and cabinet committees",
              "status": "not_started"
            },
            {
              "name": "Judiciary",
              "description": "Supreme Court, High Courts, judicial review, and PIL",
              "status": "not_started"
            },
            {
              "name": "Federalism",
              "description": "Centre-state relations, interstate relations, and special provisions",
              "status": "not_started"
            },
            {
              "name": "Emergency Provisions",
              "description": "National, state, and financial emergencies and their implications",
              "status": "not_started"
            },
            {
              "name": "Elections",
              "description": "Electoral system, reforms, and role of Election Commission",
              "status": "not_started"
            },
            {
              "name": "Political Parties",
              "description": "National and state parties, coalition politics, and anti-defection law",
              "status": "not_started"
            }
          ]
        },
        {
          "name": "Governance",
          "description": "Administrative structures and governance mechanisms in India",
          "status": "not_started",
          "imageUrl": "/images/governance.png",
          "subtopics": [
            {
              "name": "Civil Services",
              "description": "Structure, recruitment, training, and reforms",
              "status": "not_started"
            },
            {
              "name": "e-Governance",
              "description": "Digital India, initiatives, and challenges",
              "status": "not_started"
            },
            {
              "name": "Transparency and Accountability",
              "description": "Mechanisms for ensuring transparent and accountable governance",
              "status": "not_started"
            },
            {
              "name": "RTI, Citizen Charters",
              "description": "Right to Information Act and citizen empowerment",
              "status": "not_started"
            },
            {
              "name": "NGOs and SHGs",
              "description": "Role of civil society organizations in governance",
              "status": "not_started"
            },
            {
              "name": "Media's Role",
              "description": "Media as the fourth pillar and its evolving role",
              "status": "not_started"
            }
          ]
        }
      ]
    },
    {
      "name": "Indian Economy",
      "description": "Economic systems, policies, and development in India",
      "imageUrl": "/images/economics.png",
      "topics": [
        {
          "name": "Basic Concepts",
          "description": "Fundamental economic concepts and macroeconomic frameworks",
          "status": "not_started",
          "imageUrl": "/images/economic-concepts.png",
          "subtopics": [
            {
              "name": "National Income",
              "description": "GDP, GNP, NNP, and methods of calculating national income",
              "status": "not_started"
            },
            {
              "name": "Inflation",
              "description": "Types, causes, effects, and control measures",
              "status": "not_started"
            },
            {
              "name": "Monetary Policy",
              "description": "Objectives, instruments, and RBI's role",
              "status": "not_started"
            },
            {
              "name": "Fiscal Policy",
              "description": "Objectives, instruments, and FRBM Act",
              "status": "not_started"
            },
            {
              "name": "Banking System",
              "description": "Structure, functions, and reforms in the banking sector",
              "status": "not_started"
            },
            {
              "name": "Budget",
              "description": "Types, components, and budget-making process",
              "status": "not_started"
            }
          ]
        },
        {
          "name": "Economic Development",
          "description": "Economic growth, development challenges, and strategies",
          "status": "not_started",
          "imageUrl": "/images/economic-development.png",
          "subtopics": [
            {
              "name": "Planning in India",
              "description": "Five-Year Plans, NITI Aayog, and planning strategies",
              "status": "not_started"
            },
            {
              "name": "Poverty and Unemployment",
              "description": "Measurement, causes, and government initiatives",
              "status": "not_started"
            },
            {
              "name": "Inclusive Growth",
              "description": "Concept, challenges, and strategies for inclusiveness",
              "status": "not_started"
            },
            {
              "name": "Sustainable Development",
              "description": "Environmental concerns and sustainable economic practices",
              "status": "not_started"
            },
            {
              "name": "Demographic Dividend",
              "description": "India's demographic profile and its economic implications",
              "status": "not_started"
            }
          ]
        }
      ]
    },
    {
      "name": "Environment & Ecology",
      "description": "Environmental systems, conservation, and sustainable development",
      "imageUrl": "/images/environment.png",
      "topics": [
        {
          "name": "Environment",
          "description": "Ecosystems, biodiversity, and environmental challenges",
          "status": "not_started",
          "imageUrl": "/images/environment-topic.png",
          "subtopics": [
            {
              "name": "Ecosystems and Biodiversity",
              "description": "Structure, functions, and conservation of biodiversity",
              "status": "not_started"
            },
            {
              "name": "Pollution",
              "description": "Air, water, soil pollution, causes, effects, and control measures",
              "status": "not_started"
            },
            {
              "name": "Climate Change",
              "description": "Causes, impacts, and mitigation and adaptation strategies",
              "status": "not_started"
            },
            {
              "name": "Environmental Laws",
              "description": "Major environmental legislations and their implementation",
              "status": "not_started"
            },
            {
              "name": "Conservation Efforts",
              "description": "Protected areas, conservation projects, and peoples' movements",
              "status": "not_started"
            },
            {
              "name": "International Conventions",
              "description": "Major environmental agreements and India's commitments",
              "status": "not_started"
            }
          ]
        }
      ]
    }
  ]
};

async function seed() {
  console.log('🌱 Seeding subjects, topics and subtopics...');
  
  // Clear existing data first to avoid duplicates
  try {
    console.log('Clearing existing data...');
    await db.delete(subtopics);
    await db.delete(topics);
    await db.delete(subjects);
    console.log('✅ Existing data cleared');
  } catch (error) {
    console.error('Error clearing existing data:', error);
  }
  
  // Insert subjects
  const insertedSubjects = [];
  for (const subject of upscSubjectsData.subjects) {
    try {
      const [insertedSubject] = await db.insert(subjects).values({
        name: subject.name,
        description: subject.description,
        imageUrl: subject.imageUrl
      }).returning();
      
      insertedSubjects.push(insertedSubject);
      console.log(`✅ Added subject: ${subject.name}`);
      
      // Insert topics for this subject
      if (subject.topics && subject.topics.length > 0) {
        for (const topic of subject.topics) {
          const [insertedTopic] = await db.insert(topics).values({
            name: topic.name,
            description: topic.description,
            subjectId: insertedSubject.id,
            status: topic.status || 'not_started',
            imageUrl: topic.imageUrl || `/images/${topic.name.toLowerCase().replace(/\s+/g, '-')}.png`
          }).returning();
          
          // Insert subtopics for this topic
          if (topic.subtopics && topic.subtopics.length > 0) {
            const subtopicsToInsert = topic.subtopics.map(subtopic => ({
              name: subtopic.name,
              description: subtopic.description || `Study material for ${subtopic.name}`,
              topicId: insertedTopic.id,
              status: subtopic.status || 'not_started',
              imageUrl: subtopic.imageUrl || null
            }));
            
            const insertedSubtopicsResult = await db.insert(subtopics).values(subtopicsToInsert).returning();
            console.log(`✅ Added ${insertedSubtopicsResult.length} subtopics for ${topic.name}`);
          }
        }
        
        console.log(`✅ Added topics for ${subject.name}`);
      }
    } catch (error) {
      console.error(`Error adding ${subject.name}:`, error);
    }
  }
  
  console.log(`✅ Added ${insertedSubjects.length} subjects with their topics and subtopics`);
  console.log('✅ Seeding completed successfully!');
}

export default seed;