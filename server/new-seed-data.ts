import { db } from './db';
import { subjects, topics, subtopics } from '@shared/schema';

// Comprehensive UPSC curriculum based on the provided document
async function seedComprehensiveUPSC() {
  console.log("Starting comprehensive UPSC curriculum seeding...");

  try {
    // Clear existing data
    await db.delete(subtopics);
    await db.delete(topics);
    await db.delete(subjects);
    
    console.log("Cleared existing data");

    // Create main subjects based on UPSC curriculum
    const subjectsData = [
      {
        name: "History",
        description: "Ancient, Medieval, Modern Indian History, and World History",
        category: "Static GS"
      },
      {
        name: "Geography", 
        description: "Physical Geography, Indian Geography, Human & Economic Geography",
        category: "Static GS"
      },
      {
        name: "Indian Polity",
        description: "Constitution, Government Structure, Judiciary, Federal Relations",
        category: "Static GS"
      },
      {
        name: "Indian Economy",
        description: "Economic Development, Planning, Agriculture, Industry, Infrastructure",
        category: "Static GS"
      },
      {
        name: "Indian Culture",
        description: "Architecture, Music, Dance, Literature, Religions, Philosophy",
        category: "Static GS"
      },
      {
        name: "Environment & Ecology",
        description: "Environmental Conservation, Biodiversity, Climate Change",
        category: "Static GS"
      },
      {
        name: "Science & Technology",
        description: "General Science, Space Technology, IT, Biotechnology",
        category: "Static GS"
      },
      {
        name: "Current Affairs",
        description: "National and International Events, Government Schemes, Policies",
        category: "Dynamic GS"
      }
    ];

    const insertedSubjects = await db.insert(subjects).values(subjectsData).returning();
    console.log(`Inserted ${insertedSubjects.length} subjects`);

    // Create topics for each subject
    const topicsData = [];

    // History Topics
    const historySubject = insertedSubjects.find(s => s.name === "History");
    if (historySubject) {
      topicsData.push(
        {
          subjectId: historySubject.id,
          name: "Ancient Indian History",
          description: "Prehistoric cultures, IVC, Vedic society, Mauryan and Gupta empires",
          status: "not_started"
        },
        {
          subjectId: historySubject.id,
          name: "Medieval Indian History",
          description: "Early medieval dynasties, Delhi Sultanate, Mughal Empire, Marathas",
          status: "not_started"
        },
        {
          subjectId: historySubject.id,
          name: "Modern Indian History",
          description: "British expansion, Revolt of 1857, Freedom struggle, Social reforms",
          status: "not_started"
        },
        {
          subjectId: historySubject.id,
          name: "Post-Independence Consolidation",
          description: "Integration of princely states, economic development since 1947",
          status: "not_started"
        },
        {
          subjectId: historySubject.id,
          name: "World History",
          description: "Renaissance, Revolutions, World Wars, Cold War developments",
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
          description: "Geomorphology, Climatology, Oceanography, Biogeography",
          status: "not_started"
        },
        {
          subjectId: geoSubject.id,
          name: "Indian Geography",
          description: "Physical features, Climate, Agriculture, Industries, Transport",
          status: "not_started"
        },
        {
          subjectId: geoSubject.id,
          name: "Human and Economic Geography",
          description: "Population, Settlements, Human Development, Resource Geography",
          status: "not_started"
        },
        {
          subjectId: geoSubject.id,
          name: "Contemporary and Applied Issues",
          description: "Urban floods, Climate change, Environmental conflicts",
          status: "not_started"
        }
      );
    }

    // Indian Polity Topics
    const politySubject = insertedSubjects.find(s => s.name === "Indian Polity");
    if (politySubject) {
      topicsData.push(
        {
          subjectId: politySubject.id,
          name: "Constitution and its Development",
          description: "Historical background, Making of Constitution, Salient features",
          status: "not_started"
        },
        {
          subjectId: politySubject.id,
          name: "Fundamental Rights, Duties and DPSPs",
          description: "Rights (Art 12-35), DPSPs (Art 36-51), Duties (Art 51A)",
          status: "not_started"
        },
        {
          subjectId: politySubject.id,
          name: "Union Government",
          description: "President, PM, Parliament: Structure, Powers, Budget",
          status: "not_started"
        },
        {
          subjectId: politySubject.id,
          name: "State Government",
          description: "Governor, CM, State Legislature (Unicameral/Bicameral)",
          status: "not_started"
        },
        {
          subjectId: politySubject.id,
          name: "Judiciary",
          description: "Supreme Court, High Courts, Judicial Review, Reforms",
          status: "not_started"
        },
        {
          subjectId: politySubject.id,
          name: "Federal Structure",
          description: "Centre-State Relations, Inter-State Relations, Federalism",
          status: "not_started"
        },
        {
          subjectId: politySubject.id,
          name: "Constitutional and Statutory Bodies",
          description: "Election Commission, UPSC, Finance Commission, CAG, NHRC",
          status: "not_started"
        },
        {
          subjectId: politySubject.id,
          name: "Local Self Government",
          description: "Panchayati Raj (73rd Amendment), Urban Local Bodies (74th)",
          status: "not_started"
        }
      );
    }

    // Indian Economy Topics
    const economySubject = insertedSubjects.find(s => s.name === "Indian Economy");
    if (economySubject) {
      topicsData.push(
        {
          subjectId: economySubject.id,
          name: "Basic Concepts of Economy",
          description: "National Income, Inflation, Monetary vs Fiscal Policy",
          status: "not_started"
        },
        {
          subjectId: economySubject.id,
          name: "Economic Planning and Development",
          description: "Five-Year Plans, NITI Aayog, Poverty, Unemployment",
          status: "not_started"
        },
        {
          subjectId: economySubject.id,
          name: "Agriculture and Allied Sectors",
          description: "Land Reforms, Green Revolution, Agricultural Marketing",
          status: "not_started"
        },
        {
          subjectId: economySubject.id,
          name: "Industry and Infrastructure",
          description: "Industrial Policies, Make in India, MSME, Infrastructure",
          status: "not_started"
        },
        {
          subjectId: economySubject.id,
          name: "Services and External Sector",
          description: "Banking, Insurance, Trade Policies, FDI, WTO",
          status: "not_started"
        },
        {
          subjectId: economySubject.id,
          name: "Public Finance",
          description: "Budget, Taxation, Fiscal Deficit, GST Implementation",
          status: "not_started"
        }
      );
    }

    const insertedTopics = await db.insert(topics).values(topicsData).returning();
    console.log(`Inserted ${insertedTopics.length} topics`);

    // Create comprehensive subtopics
    const subtopicsData = [];

    // Ancient Indian History subtopics
    const ancientTopic = insertedTopics.find(t => t.name === "Ancient Indian History");
    if (ancientTopic) {
      subtopicsData.push(
        {
          topicId: ancientTopic.id,
          name: "Prehistoric Cultures",
          description: "Stone, Bronze, Iron Ages; Pastoral & Farming Communities",
          status: "not_started"
        },
        {
          topicId: ancientTopic.id,
          name: "Indus Valley Civilization (IVC)",
          description: "Society, Economy, Religion, Art; Decline theories",
          status: "not_started"
        },
        {
          topicId: ancientTopic.id,
          name: "Vedic Society",
          description: "Early & Later Vedic phases; Polity, Economy, Religion",
          status: "not_started"
        },
        {
          topicId: ancientTopic.id,
          name: "Pre-Mauryan Period",
          description: "Second Urbanization, Mahajanapadas, Jainism and Buddhism",
          status: "not_started"
        },
        {
          topicId: ancientTopic.id,
          name: "Mauryan Empire",
          description: "Rise, Administration, Ashoka's reign, Decline",
          status: "not_started"
        },
        {
          topicId: ancientTopic.id,
          name: "Post-Mauryan Developments",
          description: "Kushanas, Satavahanas, Indo-Greeks",
          status: "not_started"
        },
        {
          topicId: ancientTopic.id,
          name: "Gupta Empire",
          description: "Golden Age, Administration, Cultural achievements",
          status: "not_started"
        },
        {
          topicId: ancientTopic.id,
          name: "Sangam Age and South Indian Dynasties",
          description: "Tamil literature, Cholas, Cheras, Pandyas",
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
          description: "Earth structure, Plate Tectonics, Landforms, Volcanoes, Earthquakes",
          status: "not_started"
        },
        {
          topicId: physicalGeoTopic.id,
          name: "Climatology",
          description: "Atmosphere composition, Temperature, Pressure, Winds, Monsoons",
          status: "not_started"
        },
        {
          topicId: physicalGeoTopic.id,
          name: "Oceanography",
          description: "Ocean floor relief, Temperature, Currents, Tides, Marine resources",
          status: "not_started"
        },
        {
          topicId: physicalGeoTopic.id,
          name: "Biogeography and Soils",
          description: "Ecosystems, Biomes, Soil formation, Conservation",
          status: "not_started"
        },
        {
          topicId: physicalGeoTopic.id,
          name: "Environmental Geography",
          description: "Natural hazards, Conservation, Biodiversity, Sustainable development",
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
          name: "Physical Features",
          description: "Geological structure, Himalayan and Peninsular regions, Plains",
          status: "not_started"
        },
        {
          topicId: indianGeoTopic.id,
          name: "Drainage System",
          description: "Himalayan and Peninsular rivers, River systems, Interlinking",
          status: "not_started"
        },
        {
          topicId: indianGeoTopic.id,
          name: "Climate",
          description: "Indian Monsoon mechanisms, Seasons, Climatic regions",
          status: "not_started"
        },
        {
          topicId: indianGeoTopic.id,
          name: "Soils and Natural Vegetation",
          description: "Soil types, Forest types, Conservation initiatives",
          status: "not_started"
        },
        {
          topicId: indianGeoTopic.id,
          name: "Agriculture",
          description: "Cropping patterns, Major crops, Government schemes (PM-KISAN, PMFBY)",
          status: "not_started"
        },
        {
          topicId: indianGeoTopic.id,
          name: "Industries and Minerals",
          description: "Industrial regions, Mineral distribution, PLI Scheme",
          status: "not_started"
        },
        {
          topicId: indianGeoTopic.id,
          name: "Transport and Infrastructure",
          description: "Road, Rail, Air, Water transport; PM Gati Shakti, Bharatmala, Sagarmala",
          status: "not_started"
        }
      );
    }

    // Constitution and Development subtopics
    const constitutionTopic = insertedTopics.find(t => t.name === "Constitution and its Development");
    if (constitutionTopic) {
      subtopicsData.push(
        {
          topicId: constitutionTopic.id,
          name: "Historical Background (1773-1947)",
          description: "Government of India Acts, Evolution of constitutional framework",
          status: "not_started"
        },
        {
          topicId: constitutionTopic.id,
          name: "Making of Constitution & Constituent Assembly",
          description: "Formation, Debates, Key personalities, Decision-making process",
          status: "not_started"
        },
        {
          topicId: constitutionTopic.id,
          name: "Salient Features of Indian Constitution",
          description: "Unique characteristics, Borrowed features, Comparison with other constitutions",
          status: "not_started"
        },
        {
          topicId: constitutionTopic.id,
          name: "Preamble",
          description: "Philosophy, Objectives, Amendments to Preamble",
          status: "not_started"
        }
      );
    }

    // Basic Economic Concepts subtopics
    const basicEcoTopic = insertedTopics.find(t => t.name === "Basic Concepts of Economy");
    if (basicEcoTopic) {
      subtopicsData.push(
        {
          topicId: basicEcoTopic.id,
          name: "National Income and Related Aggregates",
          description: "GDP, GNP, NDP calculations and measurements",
          status: "not_started"
        },
        {
          topicId: basicEcoTopic.id,
          name: "Inflation and Price Indices",
          description: "CPI, WPI, causes and effects of inflation",
          status: "not_started"
        },
        {
          topicId: basicEcoTopic.id,
          name: "Monetary vs Fiscal Policy",
          description: "RBI tools, Government expenditure, Budget policies",
          status: "not_started"
        },
        {
          topicId: basicEcoTopic.id,
          name: "Micro vs Macro Economics",
          description: "Individual vs aggregate economic behavior and analysis",
          status: "not_started"
        }
      );
    }

    const insertedSubtopics = await db.insert(subtopics).values(subtopicsData).returning();
    console.log(`Inserted ${insertedSubtopics.length} subtopics`);

    console.log("Comprehensive UPSC curriculum seeding completed successfully!");
    return { subjects: insertedSubjects.length, topics: insertedTopics.length, subtopics: insertedSubtopics.length };

  } catch (error) {
    console.error("Error seeding comprehensive UPSC curriculum:", error);
    throw error;
  }
}

export { seedComprehensiveUPSC };