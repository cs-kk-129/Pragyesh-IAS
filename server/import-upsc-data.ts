import { db } from './db';
import { subjects, topics, subtopics } from '@shared/schema';

// Import the comprehensive UPSC curriculum data from the provided SQL file
async function importUPSCCurriculum() {
  console.log("Starting UPSC curriculum import from provided SQL data...");

  try {
    // Clear existing data
    await db.delete(subtopics);
    await db.delete(topics);
    await db.delete(subjects);
    
    console.log("Cleared existing data");

    // Create subjects based on the SQL file
    const subjectsData = [
      {
        name: "Indian History",
        description: "Ancient, Medieval, and Modern Indian History covering all major periods and events",
        category: "History"
      },
      {
        name: "Art & Culture",
        description: "Indian art, architecture, literature, music, dance, religion, and cultural heritage",
        category: "Culture"
      },
      {
        name: "Geography",
        description: "Physical Geography, Indian Geography, Human & Economic Geography",
        category: "Geography"
      },
      {
        name: "Indian Polity & Governance",
        description: "Constitution, Political System, Governance, and Administrative structures",
        category: "Polity"
      }
    ];

    const insertedSubjects = await db.insert(subjects).values(subjectsData).returning();
    console.log(`Inserted ${insertedSubjects.length} subjects`);

    // Create topics for each subject
    const topicsData = [];

    // Indian History Topics
    const historySubject = insertedSubjects.find(s => s.name === "Indian History");
    if (historySubject) {
      topicsData.push(
        {
          subjectId: historySubject.id,
          name: "Ancient History",
          description: "Prehistoric cultures to post-Gupta period covering major ancient civilizations",
          status: "not_started"
        },
        {
          subjectId: historySubject.id,
          name: "Medieval History",
          description: "Early medieval period through Mughal empire and regional kingdoms",
          status: "not_started"
        },
        {
          subjectId: historySubject.id,
          name: "Modern History",
          description: "European advent through independence and partition of India",
          status: "not_started"
        }
      );
    }

    // Art & Culture Topics
    const cultureSubject = insertedSubjects.find(s => s.name === "Art & Culture");
    if (cultureSubject) {
      topicsData.push(
        {
          subjectId: cultureSubject.id,
          name: "Indian Culture",
          description: "Architecture, sculpture, paintings, music, dance, literature, and heritage",
          status: "not_started"
        }
      );
    }

    // Geography Topics
    const geoSubject = insertedSubjects.find(s => s.name === "Geography");
    if (geoSubject) {
      topicsData.push(
        {
          subjectId: geoSubject.id,
          name: "Physical Geography",
          description: "Geomorphology, climatology, oceanography, and biogeography",
          status: "not_started"
        },
        {
          subjectId: geoSubject.id,
          name: "Indian Geography",
          description: "Physical features, climate, resources, agriculture, and infrastructure of India",
          status: "not_started"
        },
        {
          subjectId: geoSubject.id,
          name: "Human & Economic Geography",
          description: "Population, urbanization, industries, trade, and regional development",
          status: "not_started"
        }
      );
    }

    // Indian Polity & Governance Topics
    const politySubject = insertedSubjects.find(s => s.name === "Indian Polity & Governance");
    if (politySubject) {
      topicsData.push(
        {
          subjectId: politySubject.id,
          name: "Constitution",
          description: "Historical background, fundamental rights, duties, and constitutional framework",
          status: "not_started"
        },
        {
          subjectId: politySubject.id,
          name: "Political System",
          description: "Parliament, executive, judiciary, federalism, and emergency provisions",
          status: "not_started"
        },
        {
          subjectId: politySubject.id,
          name: "Governance",
          description: "Civil services, e-governance, transparency, and administrative reforms",
          status: "not_started"
        }
      );
    }

    const insertedTopics = await db.insert(topics).values(topicsData).returning();
    console.log(`Inserted ${insertedTopics.length} topics`);

    // Create comprehensive subtopics based on the SQL file
    const subtopicsData = [];

    // Ancient History subtopics
    const ancientTopic = insertedTopics.find(t => t.name === "Ancient History");
    if (ancientTopic) {
      subtopicsData.push(
        {
          topicId: ancientTopic.id,
          name: "Prehistoric Cultures in India",
          description: "Paleolithic, Mesolithic, and Neolithic cultures and their developments",
          status: "not_started"
        },
        {
          topicId: ancientTopic.id,
          name: "Indus Valley Civilization",
          description: "Urban planning, trade, art, and decline of the Harappan civilization",
          status: "not_started"
        },
        {
          topicId: ancientTopic.id,
          name: "Vedic Age",
          description: "Early and Later Vedic periods, social structure, and religious practices",
          status: "not_started"
        },
        {
          topicId: ancientTopic.id,
          name: "Mahajanapadas & Rise of Jainism and Buddhism",
          description: "16 Mahajanapadas, life of Buddha and Mahavira, early religious movements",
          status: "not_started"
        },
        {
          topicId: ancientTopic.id,
          name: "Mauryan Empire",
          description: "Chandragupta Maurya, Ashoka, administration, and Mauryan art",
          status: "not_started"
        },
        {
          topicId: ancientTopic.id,
          name: "Post-Mauryan Kingdoms",
          description: "Kushanas, Satavahanas, Indo-Greeks and their contributions",
          status: "not_started"
        },
        {
          topicId: ancientTopic.id,
          name: "Gupta Age",
          description: "Golden Age of India, Gupta rulers, administration, and cultural achievements",
          status: "not_started"
        },
        {
          topicId: ancientTopic.id,
          name: "Post-Gupta Period",
          description: "Regional kingdoms and political developments after Gupta decline",
          status: "not_started"
        },
        {
          topicId: ancientTopic.id,
          name: "Early South Indian Kingdoms",
          description: "Sangam period, Cholas, Cheras, Pandyas, and early southern dynasties",
          status: "not_started"
        }
      );
    }

    // Medieval History subtopics
    const medievalTopic = insertedTopics.find(t => t.name === "Medieval History");
    if (medievalTopic) {
      subtopicsData.push(
        {
          topicId: medievalTopic.id,
          name: "Early Medieval Period (750–1200 AD)",
          description: "Rajput kingdoms, Chalukyas, Rashtrakutas, and regional powers",
          status: "not_started"
        },
        {
          topicId: medievalTopic.id,
          name: "Delhi Sultanate",
          description: "Slave, Khalji, Tughlaq, Sayyid, and Lodi dynasties",
          status: "not_started"
        },
        {
          topicId: medievalTopic.id,
          name: "Vijayanagara and Bahmani Kingdoms",
          description: "South Indian regional kingdoms and their administrative systems",
          status: "not_started"
        },
        {
          topicId: medievalTopic.id,
          name: "Mughal Empire",
          description: "Babur to Aurangzeb, administration, culture, and decline",
          status: "not_started"
        },
        {
          topicId: medievalTopic.id,
          name: "Marathas and Regional Kingdoms",
          description: "Shivaji, Maratha confederacy, and other regional powers",
          status: "not_started"
        },
        {
          topicId: medievalTopic.id,
          name: "Religious Movements: Bhakti & Sufi",
          description: "Medieval religious reform movements and their social impact",
          status: "not_started"
        },
        {
          topicId: medievalTopic.id,
          name: "Administrative and Cultural Developments",
          description: "Medieval administrative systems, art, architecture, and literature",
          status: "not_started"
        }
      );
    }

    // Modern History subtopics
    const modernTopic = insertedTopics.find(t => t.name === "Modern History");
    if (modernTopic) {
      subtopicsData.push(
        {
          topicId: modernTopic.id,
          name: "Advent of Europeans",
          description: "Portuguese, Dutch, French, and British arrival in India",
          status: "not_started"
        },
        {
          topicId: modernTopic.id,
          name: "British Expansion in India",
          description: "Wars, treaties, and territorial expansion by the British",
          status: "not_started"
        },
        {
          topicId: modernTopic.id,
          name: "Socio-Religious Reform Movements",
          description: "Raja Ram Mohan Roy, Arya Samaj, Brahmo Samaj, and other reforms",
          status: "not_started"
        },
        {
          topicId: modernTopic.id,
          name: "Revolt of 1857",
          description: "Causes, course, consequences, and significance of the Great Revolt",
          status: "not_started"
        },
        {
          topicId: modernTopic.id,
          name: "Indian National Movement: Pre-Congress",
          description: "Early nationalist organizations and movements before INC formation",
          status: "not_started"
        },
        {
          topicId: modernTopic.id,
          name: "INC Formation & Early Phase",
          description: "Formation of Congress, moderate leaders, and early demands",
          status: "not_started"
        },
        {
          topicId: modernTopic.id,
          name: "Extremist Phase (1905–1919)",
          description: "Swadeshi movement, revolutionary nationalism, and extremist leaders",
          status: "not_started"
        },
        {
          topicId: modernTopic.id,
          name: "Gandhian Era (1919–1947)",
          description: "Gandhi's movements: Non-cooperation, Civil Disobedience, Quit India",
          status: "not_started"
        },
        {
          topicId: modernTopic.id,
          name: "Constitutional Developments",
          description: "Government of India Acts and constitutional evolution",
          status: "not_started"
        },
        {
          topicId: modernTopic.id,
          name: "Partition & Independence",
          description: "Two-nation theory, partition, and independence process",
          status: "not_started"
        }
      );
    }

    // Indian Culture subtopics
    const cultureTopic = insertedTopics.find(t => t.name === "Indian Culture");
    if (cultureTopic) {
      subtopicsData.push(
        {
          topicId: cultureTopic.id,
          name: "Architecture",
          description: "Ancient to modern Indian architectural styles and monuments",
          status: "not_started"
        },
        {
          topicId: cultureTopic.id,
          name: "Sculpture and Iconography",
          description: "Indian sculptural traditions and religious iconography",
          status: "not_started"
        },
        {
          topicId: cultureTopic.id,
          name: "Paintings",
          description: "Traditional Indian painting schools and styles",
          status: "not_started"
        },
        {
          topicId: cultureTopic.id,
          name: "Music, Dance, Theatre",
          description: "Classical and folk traditions in performing arts",
          status: "not_started"
        },
        {
          topicId: cultureTopic.id,
          name: "Literature",
          description: "Sanskrit, regional literatures, and modern Indian writing",
          status: "not_started"
        },
        {
          topicId: cultureTopic.id,
          name: "Religion and Philosophy",
          description: "Hindu, Buddhist, Jain philosophies and religious traditions",
          status: "not_started"
        },
        {
          topicId: cultureTopic.id,
          name: "UNESCO Heritage Sites",
          description: "World Heritage Sites in India and their significance",
          status: "not_started"
        },
        {
          topicId: cultureTopic.id,
          name: "Fairs, Festivals and Cultural Institutions",
          description: "Traditional festivals, fairs, and cultural organizations",
          status: "not_started"
        }
      );
    }

    // Physical Geography subtopics
    const physicalGeoTopic = insertedTopics.find(t => t.name === "Physical Geography");
    if (physicalGeoTopic) {
      subtopicsData.push(
        {
          topicId: physicalGeoTopic.id,
          name: "Geomorphology",
          description: "Earth's structure, plate tectonics, landforms, and geological processes",
          status: "not_started"
        },
        {
          topicId: physicalGeoTopic.id,
          name: "Climatology",
          description: "Atmosphere, weather patterns, climate zones, and meteorology",
          status: "not_started"
        },
        {
          topicId: physicalGeoTopic.id,
          name: "Oceanography",
          description: "Ocean currents, tides, marine resources, and oceanic processes",
          status: "not_started"
        },
        {
          topicId: physicalGeoTopic.id,
          name: "Biogeography",
          description: "Ecosystems, biodiversity, natural vegetation, and environmental zones",
          status: "not_started"
        }
      );
    }

    // Indian Geography subtopics
    const indianGeoTopic = insertedTopics.find(t => t.name === "Indian Geography");
    if (indianGeoTopic) {
      subtopicsData.push(
        {
          topicId: indianGeoTopic.id,
          name: "Physiographic Divisions",
          description: "Himalayas, Indo-Gangetic plains, Peninsular plateau, and coastal regions",
          status: "not_started"
        },
        {
          topicId: indianGeoTopic.id,
          name: "Climate and Weather",
          description: "Monsoons, seasons, regional climatic variations in India",
          status: "not_started"
        },
        {
          topicId: indianGeoTopic.id,
          name: "Soil and Vegetation",
          description: "Indian soil types, forest cover, and natural vegetation patterns",
          status: "not_started"
        },
        {
          topicId: indianGeoTopic.id,
          name: "Rivers and Water Resources",
          description: "Major river systems, water conservation, and irrigation projects",
          status: "not_started"
        },
        {
          topicId: indianGeoTopic.id,
          name: "Agriculture",
          description: "Crop patterns, agricultural regions, and farming practices",
          status: "not_started"
        },
        {
          topicId: indianGeoTopic.id,
          name: "Minerals and Energy Resources",
          description: "Mineral distribution, energy sources, and resource management",
          status: "not_started"
        },
        {
          topicId: indianGeoTopic.id,
          name: "Transport and Infrastructure",
          description: "Transportation networks, ports, airports, and connectivity",
          status: "not_started"
        },
        {
          topicId: indianGeoTopic.id,
          name: "Disaster Management",
          description: "Natural disasters, vulnerability, and disaster preparedness",
          status: "not_started"
        }
      );
    }

    // Human & Economic Geography subtopics
    const humanGeoTopic = insertedTopics.find(t => t.name === "Human & Economic Geography");
    if (humanGeoTopic) {
      subtopicsData.push(
        {
          topicId: humanGeoTopic.id,
          name: "Population and Demographics",
          description: "Population distribution, density, growth, and demographic trends",
          status: "not_started"
        },
        {
          topicId: humanGeoTopic.id,
          name: "Urbanization and Migration",
          description: "Urban growth, migration patterns, and city development",
          status: "not_started"
        },
        {
          topicId: humanGeoTopic.id,
          name: "Industries",
          description: "Industrial location, types, and regional industrial development",
          status: "not_started"
        },
        {
          topicId: humanGeoTopic.id,
          name: "Trade and Transport",
          description: "Trade patterns, transportation systems, and commercial geography",
          status: "not_started"
        },
        {
          topicId: humanGeoTopic.id,
          name: "Regional Development",
          description: "Regional planning, development schemes, and spatial disparities",
          status: "not_started"
        }
      );
    }

    // Constitution subtopics
    const constitutionTopic = insertedTopics.find(t => t.name === "Constitution");
    if (constitutionTopic) {
      subtopicsData.push(
        {
          topicId: constitutionTopic.id,
          name: "Historical Background",
          description: "Evolution of constitutional framework from 1773 to 1947",
          status: "not_started"
        },
        {
          topicId: constitutionTopic.id,
          name: "Preamble",
          description: "Philosophy, objectives, and key principles of the Constitution",
          status: "not_started"
        },
        {
          topicId: constitutionTopic.id,
          name: "Fundamental Rights and Duties",
          description: "Constitutional rights and citizens' fundamental duties",
          status: "not_started"
        },
        {
          topicId: constitutionTopic.id,
          name: "Directive Principles of State Policy",
          description: "Guidelines for state policy and governance objectives",
          status: "not_started"
        },
        {
          topicId: constitutionTopic.id,
          name: "Amendment Procedures",
          description: "Constitutional amendment process and major amendments",
          status: "not_started"
        },
        {
          topicId: constitutionTopic.id,
          name: "Constitutional Bodies",
          description: "Election Commission, UPSC, CAG, and other constitutional institutions",
          status: "not_started"
        }
      );
    }

    // Political System subtopics
    const politicalTopic = insertedTopics.find(t => t.name === "Political System");
    if (politicalTopic) {
      subtopicsData.push(
        {
          topicId: politicalTopic.id,
          name: "Parliament",
          description: "Lok Sabha, Rajya Sabha, legislative process, and parliamentary committees",
          status: "not_started"
        },
        {
          topicId: politicalTopic.id,
          name: "President and Vice-President",
          description: "Election, powers, functions, and constitutional role",
          status: "not_started"
        },
        {
          topicId: politicalTopic.id,
          name: "Prime Minister and Council of Ministers",
          description: "Executive powers, cabinet system, and ministerial responsibility",
          status: "not_started"
        },
        {
          topicId: politicalTopic.id,
          name: "Judiciary",
          description: "Supreme Court, High Courts, judicial review, and judicial activism",
          status: "not_started"
        },
        {
          topicId: politicalTopic.id,
          name: "Federalism",
          description: "Centre-state relations, distribution of powers, and federal structure",
          status: "not_started"
        },
        {
          topicId: politicalTopic.id,
          name: "Emergency Provisions",
          description: "National emergency, President's rule, and financial emergency",
          status: "not_started"
        },
        {
          topicId: politicalTopic.id,
          name: "Elections",
          description: "Electoral process, Election Commission, and electoral reforms",
          status: "not_started"
        },
        {
          topicId: politicalTopic.id,
          name: "Political Parties",
          description: "Party system, coalition politics, and political developments",
          status: "not_started"
        }
      );
    }

    // Governance subtopics
    const governanceTopic = insertedTopics.find(t => t.name === "Governance");
    if (governanceTopic) {
      subtopicsData.push(
        {
          topicId: governanceTopic.id,
          name: "Civil Services",
          description: "Administrative structure, civil service reforms, and bureaucracy",
          status: "not_started"
        },
        {
          topicId: governanceTopic.id,
          name: "e-Governance",
          description: "Digital governance initiatives, online services, and technology in administration",
          status: "not_started"
        },
        {
          topicId: governanceTopic.id,
          name: "Transparency and Accountability",
          description: "Good governance principles, transparency mechanisms, and accountability",
          status: "not_started"
        },
        {
          topicId: governanceTopic.id,
          name: "RTI, Citizen Charters",
          description: "Right to Information, citizen services, and public grievances",
          status: "not_started"
        },
        {
          topicId: governanceTopic.id,
          name: "NGOs and SHGs",
          description: "Non-governmental organizations, self-help groups, and civil society",
          status: "not_started"
        },
        {
          topicId: governanceTopic.id,
          name: "Media's Role",
          description: "Media in democracy, press freedom, and information dissemination",
          status: "not_started"
        }
      );
    }

    const insertedSubtopics = await db.insert(subtopics).values(subtopicsData).returning();
    console.log(`Inserted ${insertedSubtopics.length} subtopics`);

    console.log("UPSC curriculum import completed successfully!");
    return { subjects: insertedSubjects.length, topics: insertedTopics.length, subtopics: insertedSubtopics.length };

  } catch (error) {
    console.error("Error importing UPSC curriculum:", error);
    throw error;
  }
}

export { importUPSCCurriculum };