import { db } from './db';
import { subjects, topics, subtopics } from '@shared/schema';

async function seed() {
  console.log('🌱 Seeding subjects, topics and subtopics...');
  
  // Add subjects
  const subjectData = [
    {
      name: 'Indian Polity',
      description: 'Study of political systems, governance, and constitutional framework of India',
      imageUrl: '/images/polity.png'
    },
    {
      name: 'Indian History',
      description: 'Ancient, Medieval, and Modern history of the Indian subcontinent',
      imageUrl: '/images/history.png'
    },
    {
      name: 'Geography',
      description: 'Physical, human, and economic geography of India and the world',
      imageUrl: '/images/geography.png'
    },
    {
      name: 'Economics',
      description: 'Indian economy, development, and economic theories and models',
      imageUrl: '/images/economics.png'
    },
    {
      name: 'Environment & Ecology',
      description: 'Biodiversity conservation, climate change, and environmental policies',
      imageUrl: '/images/environment.png'
    }
  ];

  // Insert subjects
  const insertedSubjects = await Promise.all(
    subjectData.map(async (subject) => {
      const [inserted] = await db.insert(subjects).values(subject).returning();
      return inserted;
    })
  );
  
  console.log(`✅ Added ${insertedSubjects.length} subjects`);

  // Add topics for Indian Polity
  const polityId = insertedSubjects.find(s => s.name === 'Indian Polity')?.id;
  if (polityId) {
    const polityTopics = [
      {
        name: 'Constitution',
        description: 'Making, features, amendments and significant provisions of the Indian Constitution',
        subjectId: polityId,
        status: 'not_started',
        imageUrl: '/images/constitution.png'
      },
      {
        name: 'Parliament',
        description: 'Structure, functions, procedures and powers of the Indian Parliament',
        subjectId: polityId,
        status: 'not_started',
        imageUrl: '/images/parliament.png'
      },
      {
        name: 'Judiciary',
        description: 'Supreme Court, High Courts, judicial review and judicial activism',
        subjectId: polityId,
        status: 'not_started',
        imageUrl: '/images/judiciary.png'
      },
      {
        name: 'Executive',
        description: 'President, Prime Minister, Council of Ministers and their powers',
        subjectId: polityId,
        status: 'not_started',
        imageUrl: '/images/executive.png'
      },
      {
        name: 'Federal Structure',
        description: 'Centre-state relations, Governor, state legislatures and local governments',
        subjectId: polityId,
        status: 'not_started',
        imageUrl: '/images/federal.png'
      }
    ];
    
    // Insert polity topics
    const insertedPolityTopics = await Promise.all(
      polityTopics.map(async (topic) => {
        const [inserted] = await db.insert(topics).values(topic).returning();
        return inserted;
      })
    );
    
    console.log(`✅ Added ${insertedPolityTopics.length} topics for Indian Polity`);
    
    // Add subtopics for Constitution
    const constitutionId = insertedPolityTopics.find(t => t.name === 'Constitution')?.id;
    if (constitutionId) {
      const constitutionSubtopics = [
        {
          name: 'Making of the Constitution',
          description: 'Constituent Assembly, drafting process, and influences on the Indian Constitution',
          topicId: constitutionId,
          status: 'not_started',
          imageUrl: '/images/making-constitution.png'
        },
        {
          name: 'Fundamental Rights',
          description: 'Articles 12-35: Right to Equality, Freedom, Against Exploitation, etc.',
          topicId: constitutionId,
          status: 'not_started',
          imageUrl: '/images/fundamental-rights.png'
        },
        {
          name: 'Directive Principles',
          description: 'Articles 36-51: Social, economic, and political principles for governance',
          topicId: constitutionId,
          status: 'not_started',
          imageUrl: '/images/directive-principles.png'
        },
        {
          name: 'Constitutional Amendments',
          description: 'Procedure, important amendments, and their impacts on governance',
          topicId: constitutionId,
          status: 'not_started',
          imageUrl: '/images/amendments.png'
        }
      ];
      
      // Insert constitution subtopics
      const insertedSubtopics = await Promise.all(
        constitutionSubtopics.map(async (subtopic) => {
          const [inserted] = await db.insert(subtopics).values(subtopic).returning();
          return inserted;
        })
      );
      
      console.log(`✅ Added ${insertedSubtopics.length} subtopics for Constitution`);
    }
  }
  
  // Add topics for Indian History
  const historyId = insertedSubjects.find(s => s.name === 'Indian History')?.id;
  if (historyId) {
    const historyTopics = [
      {
        name: 'Ancient India',
        description: 'Indus Valley Civilization, Vedic Period, Mauryan and Gupta Empires',
        subjectId: historyId,
        status: 'not_started',
        imageUrl: '/images/ancient-india.png'
      },
      {
        name: 'Medieval India',
        description: 'Delhi Sultanate, Mughal Empire, Vijayanagara and Maratha kingdoms',
        subjectId: historyId,
        status: 'not_started',
        imageUrl: '/images/medieval-india.png'
      },
      {
        name: 'Modern India',
        description: 'British colonization, freedom struggle, and post-independence developments',
        subjectId: historyId,
        status: 'not_started',
        imageUrl: '/images/modern-india.png'
      },
      {
        name: 'Art and Culture',
        description: 'Classical and folk arts, architecture, literature and cultural heritage',
        subjectId: historyId,
        status: 'not_started',
        imageUrl: '/images/art-culture.png'
      }
    ];
    
    // Insert history topics
    const insertedHistoryTopics = await Promise.all(
      historyTopics.map(async (topic) => {
        const [inserted] = await db.insert(topics).values(topic).returning();
        return inserted;
      })
    );
    
    console.log(`✅ Added ${insertedHistoryTopics.length} topics for Indian History`);
  }
  
  console.log('✅ Seeding completed successfully!');
}

export default seed;