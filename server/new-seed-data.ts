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

    // Medieval Indian History subtopics
    const medievalTopic = insertedTopics.find(t => t.name === "Medieval Indian History");
    if (medievalTopic) {
      subtopicsData.push(
        {
          topicId: medievalTopic.id,
          name: "Early Medieval Dynasties (750–1200)",
          description: "Rajput, Chalukya, Rashtrakuta, Pallava rule",
          status: "not_started"
        },
        {
          topicId: medievalTopic.id,
          name: "Early Muslim Invasions",
          description: "Sindh invasions, Ghazni raids, Ghurid conquests",
          status: "not_started"
        },
        {
          topicId: medievalTopic.id,
          name: "Delhi Sultanate (1206–1526)",
          description: "Slave, Khalji, Tughlaq, Sayyid, Lodi dynasties",
          status: "not_started"
        },
        {
          topicId: medievalTopic.id,
          name: "Vijayanagar and Bahmani Kingdoms",
          description: "Southern Indian regional kingdoms and their contributions",
          status: "not_started"
        },
        {
          topicId: medievalTopic.id,
          name: "Rise of Mughals",
          description: "Babur, Humayun, establishment of Mughal rule",
          status: "not_started"
        },
        {
          topicId: medievalTopic.id,
          name: "Mughal Administration & Culture",
          description: "Society, Religion, Culture, Administration under Mughals",
          status: "not_started"
        },
        {
          topicId: medievalTopic.id,
          name: "Marathas and Shivaji",
          description: "Rise of Maratha power, Shivaji's administration",
          status: "not_started"
        }
      );
    }

    // Modern Indian History subtopics
    const modernTopic = insertedTopics.find(t => t.name === "Modern Indian History");
    if (modernTopic) {
      subtopicsData.push(
        {
          topicId: modernTopic.id,
          name: "Decline of Mughals & Rise of Regional States",
          description: "Weakening of central authority, emergence of regional powers",
          status: "not_started"
        },
        {
          topicId: modernTopic.id,
          name: "Advent of Europeans",
          description: "Portuguese, Dutch, French, British arrival and establishment",
          status: "not_started"
        },
        {
          topicId: modernTopic.id,
          name: "British Expansion in India",
          description: "Wars (Plassey, Buxar, Mysore, Punjab), territorial expansion",
          status: "not_started"
        },
        {
          topicId: modernTopic.id,
          name: "Revolt of 1857",
          description: "Causes, course, consequences, significance of the Great Revolt",
          status: "not_started"
        },
        {
          topicId: modernTopic.id,
          name: "Economic Policies of British",
          description: "Drain of wealth, land revenue systems, deindustrialization",
          status: "not_started"
        },
        {
          topicId: modernTopic.id,
          name: "National Movements (1858–1905)",
          description: "Moderate phase, early Congress, constitutional methods",
          status: "not_started"
        },
        {
          topicId: modernTopic.id,
          name: "Extremist Movement (1905–1919)",
          description: "Swadeshi movement, revolutionary nationalism, Bal-Pal-Lal",
          status: "not_started"
        },
        {
          topicId: modernTopic.id,
          name: "Gandhian Era (1919–1947)",
          description: "Non-cooperation, Civil Disobedience, Quit India movements",
          status: "not_started"
        }
      );
    }

    // Human and Economic Geography subtopics
    const humanGeoTopic = insertedTopics.find(t => t.name === "Human and Economic Geography");
    if (humanGeoTopic) {
      subtopicsData.push(
        {
          topicId: humanGeoTopic.id,
          name: "Population and Settlements",
          description: "Demographic features, density, migration, urbanization",
          status: "not_started"
        },
        {
          topicId: humanGeoTopic.id,
          name: "Human Development",
          description: "HDI indicators, literacy, sex ratio, family planning",
          status: "not_started"
        },
        {
          topicId: humanGeoTopic.id,
          name: "Settlements and Urban Planning",
          description: "Rural and urban settlements, Smart Cities missions",
          status: "not_started"
        },
        {
          topicId: humanGeoTopic.id,
          name: "Resource Geography",
          description: "Land, water, energy, forest resources and conservation",
          status: "not_started"
        },
        {
          topicId: humanGeoTopic.id,
          name: "Economic Geography",
          description: "Agriculture, industries, services, trade and transport",
          status: "not_started"
        }
      );
    }

    // Fundamental Rights, Duties and DPSPs subtopics
    const rightsTopics = insertedTopics.find(t => t.name === "Fundamental Rights, Duties and DPSPs");
    if (rightsTopics) {
      subtopicsData.push(
        {
          topicId: rightsTopics.id,
          name: "Fundamental Rights (Art. 12–35)",
          description: "Right to equality, freedom, constitutional remedies",
          status: "not_started"
        },
        {
          topicId: rightsTopics.id,
          name: "Directive Principles (Art. 36–51)",
          description: "State policy guidelines, socio-economic objectives",
          status: "not_started"
        },
        {
          topicId: rightsTopics.id,
          name: "Fundamental Duties (Art. 51A)",
          description: "Citizens' constitutional duties and responsibilities",
          status: "not_started"
        }
      );
    }

    // Union Government subtopics
    const unionGovTopic = insertedTopics.find(t => t.name === "Union Government");
    if (unionGovTopic) {
      subtopicsData.push(
        {
          topicId: unionGovTopic.id,
          name: "President and Vice President",
          description: "Election, powers, functions, impeachment process",
          status: "not_started"
        },
        {
          topicId: unionGovTopic.id,
          name: "Prime Minister and Council of Ministers",
          description: "Appointment, powers, collective responsibility",
          status: "not_started"
        },
        {
          topicId: unionGovTopic.id,
          name: "Parliament: Structure and Powers",
          description: "Lok Sabha, Rajya Sabha, legislative procedures",
          status: "not_started"
        },
        {
          topicId: unionGovTopic.id,
          name: "Parliamentary Committees and Budget",
          description: "Committee system, budget process, financial oversight",
          status: "not_started"
        }
      );
    }

    // Economic Planning and Development subtopics
    const planningTopic = insertedTopics.find(t => t.name === "Economic Planning and Development");
    if (planningTopic) {
      subtopicsData.push(
        {
          topicId: planningTopic.id,
          name: "Planning Commission to NITI Aayog",
          description: "Evolution of planning machinery, institutional changes",
          status: "not_started"
        },
        {
          topicId: planningTopic.id,
          name: "Five-Year Plans",
          description: "Objectives, achievements, and outcomes of different plans",
          status: "not_started"
        },
        {
          topicId: planningTopic.id,
          name: "Poverty and Unemployment",
          description: "Measurement, trends, government schemes and policies",
          status: "not_started"
        },
        {
          topicId: planningTopic.id,
          name: "Human Development Indicators",
          description: "HDI, MPI, quality of life measurements",
          status: "not_started"
        }
      );
    }

    // Agriculture and Allied Sectors subtopics
    const agricultureTopic = insertedTopics.find(t => t.name === "Agriculture and Allied Sectors");
    if (agricultureTopic) {
      subtopicsData.push(
        {
          topicId: agricultureTopic.id,
          name: "Land Reforms and Green Revolution",
          description: "Land redistribution, HYV seeds, agricultural modernization",
          status: "not_started"
        },
        {
          topicId: agricultureTopic.id,
          name: "Cropping Patterns and Major Crops",
          description: "Kharif, Rabi, Zaid crops, regional crop distribution",
          status: "not_started"
        },
        {
          topicId: agricultureTopic.id,
          name: "Agricultural Marketing and MSP",
          description: "APMC, FPOs, minimum support price system",
          status: "not_started"
        },
        {
          topicId: agricultureTopic.id,
          name: "Government Schemes",
          description: "PM-KISAN, PMFBY, soil health card, crop insurance",
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