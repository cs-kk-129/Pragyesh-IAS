
-- Create Tables
CREATE TABLE subjects (
    subject_id INT PRIMARY KEY,
    subject_name VARCHAR(255) NOT NULL
);

CREATE TABLE sections (
    section_id INT PRIMARY KEY,
    subject_id INT,
    section_name VARCHAR(255) NOT NULL,
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id)
);

CREATE TABLE topics (
    topic_id INT PRIMARY KEY,
    section_id INT,
    topic_name VARCHAR(255) NOT NULL,
    FOREIGN KEY (section_id) REFERENCES sections(section_id)
);

-- Insert Data into subjects
INSERT INTO subjects (subject_id, subject_name) VALUES
(1, 'Indian History'),
(2, 'Art & Culture'),
(3, 'Geography'),
(4, 'Indian Polity & Governance'),
(5, 'Indian Economy'),
(6, 'Environment & Ecology'),
(7, 'Science & Technology'),
(8, 'General Science'),
(9, 'Ethics, Integrity & Aptitude (GS Paper IV)'),
(10, 'Current Affairs'),
(11, 'CSAT (Prelims Paper II)');

-- Insert Data into sections
INSERT INTO sections (section_id, subject_id, section_name) VALUES
(1, 1, 'Ancient History'),
(2, 1, 'Medieval History'),
(3, 1, 'Modern History'),
(4, 2, 'Art & Culture Topics'),
(5, 3, 'Physical Geography'),
(6, 3, 'Indian Geography'),
(7, 3, 'Human & Economic Geography'),
(8, 4, 'Constitution of India'),
(9, 4, 'Political System'),
(10, 4, 'Governance'),
(11, 5, 'Basic Concepts'),
(12, 5, 'Economic Development'),
(13, 5, 'Sectors of Economy'),
(14, 5, 'Government Initiatives'),
(15, 6, 'Environment & Ecology Topics'),
(16, 7, 'Science & Technology Topics'),
(17, 8, 'General Science Topics'),
(18, 9, 'Ethics & Aptitude'),
(19, 10, 'Current Affairs Topics'),
(20, 11, 'Comprehension & Reasoning'),
(21, 11, 'Quantitative Aptitude');

-- Insert Data into topics
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (1, 1, 'Prehistoric Cultures in India');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (2, 1, 'Indus Valley Civilization');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (3, 1, 'Vedic Age');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (4, 1, 'Mahajanapadas & Rise of Jainism and Buddhism');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (5, 1, 'Mauryan Empire');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (6, 1, 'Post-Mauryan Kingdoms');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (7, 1, 'Gupta Age');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (8, 1, 'Post-Gupta Period');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (9, 1, 'Early South Indian Kingdoms');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (10, 2, 'Early Medieval Period (750–1200 AD)');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (11, 2, 'Delhi Sultanate');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (12, 2, 'Vijayanagara and Bahmani Kingdoms');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (13, 2, 'Mughal Empire');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (14, 2, 'Marathas and Regional Kingdoms');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (15, 2, 'Religious Movements: Bhakti & Sufi');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (16, 2, 'Administrative and Cultural Developments');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (17, 3, 'Advent of Europeans');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (18, 3, 'British Expansion in India');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (19, 3, 'Socio-Religious Reform Movements');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (20, 3, 'Revolt of 1857');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (21, 3, 'Indian National Movement: Pre-Congress (1858–1885)');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (22, 3, 'INC Formation & Early Phase');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (23, 3, 'Extremist Phase (1905–1919)');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (24, 3, 'Gandhian Era (1919–1947)');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (25, 3, 'Constitutional Developments');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (26, 3, 'Partition & Independence');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (27, 4, 'Indian Architecture (Ancient to Modern)');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (28, 4, 'Sculpture and Iconography');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (29, 4, 'Indian Paintings');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (30, 4, 'Performing Arts: Music, Dance, Theatre');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (31, 4, 'Literature (Sanskrit, Tamil, Regional)');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (32, 4, 'Religion and Philosophy');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (33, 4, 'UNESCO Heritage Sites in India');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (34, 4, 'Fairs, Festivals and Cultural Institutions');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (35, 5, 'Geomorphology');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (36, 5, 'Climatology');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (37, 5, 'Oceanography');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (38, 5, 'Biogeography');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (39, 6, 'Physiographic Divisions');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (40, 6, 'Climate and Weather Patterns');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (41, 6, 'Soil and Natural Vegetation');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (42, 6, 'Rivers and Water Resources');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (43, 6, 'Agriculture');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (44, 6, 'Mineral and Energy Resources');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (45, 6, 'Transport and Infrastructure');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (46, 6, 'Natural Hazards and Disaster Management');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (47, 7, 'Population and Demographics');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (48, 7, 'Urbanization and Migration');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (49, 7, 'Industries and Manufacturing');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (50, 7, 'Trade and Transport');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (51, 7, 'Regional Development');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (52, 8, 'Historical Background');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (53, 8, 'Preamble');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (54, 8, 'Fundamental Rights and Duties');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (55, 8, 'Directive Principles of State Policy');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (56, 8, 'Amendment Procedures');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (57, 8, 'Constitutional Bodies');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (58, 9, 'Parliament');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (59, 9, 'President and Vice-President');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (60, 9, 'Prime Minister and Council of Ministers');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (61, 9, 'Judiciary (Supreme Court, High Courts)');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (62, 9, 'Federalism and Centre-State Relations');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (63, 9, 'Emergency Provisions');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (64, 9, 'Elections and Representation');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (65, 9, 'Political Parties and Pressure Groups');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (66, 10, 'Civil Services');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (67, 10, 'e-Governance');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (68, 10, 'Transparency and Accountability');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (69, 10, 'RTI, Citizen Charters, Grievance Redressal');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (70, 10, 'NGOs and SHGs');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (71, 10, 'Role of Media');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (72, 11, 'National Income');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (73, 11, 'Inflation and Deflation');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (74, 11, 'Monetary and Fiscal Policy');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (75, 11, 'Banking and Financial Institutions');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (76, 11, 'Budgeting');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (77, 12, 'Planning in India');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (78, 12, 'Poverty and Unemployment');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (79, 12, 'Inclusive Growth');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (80, 12, 'Sustainable Development Goals');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (81, 12, 'Demographic Dividend');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (82, 13, 'Agriculture and Allied Sectors');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (83, 13, 'Industry and Infrastructure');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (84, 13, 'Services Sector');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (85, 13, 'MSMEs');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (86, 14, 'Major Government Schemes');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (87, 14, 'NITI Aayog');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (88, 14, 'Tax Reforms (GST, Direct Tax)');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (89, 15, 'Ecosystems and Biodiversity');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (90, 15, 'Environmental Pollution');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (91, 15, 'Environmental Laws and Policies');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (92, 15, 'Climate Change and Global Warming');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (93, 15, 'Conservation Efforts (national parks, tiger reserves)');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (94, 15, 'Sustainable Development');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (95, 15, 'International Environmental Conventions (UNFCCC, CBD, Kyoto Protocol, Paris Agreement)');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (96, 16, 'Space Technology');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (97, 16, 'Defence Technology');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (98, 16, 'Nuclear Technology');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (99, 16, 'Biotechnology');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (100, 16, 'IT & Computers');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (101, 16, 'Robotics and AI');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (102, 16, 'Scientific Institutions in India');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (103, 16, 'Developments in Health and Medicine');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (104, 17, 'Physics (basic mechanics, optics, electricity)');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (105, 17, 'Chemistry (basic concepts, everyday applications)');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (106, 17, 'Biology (human body, diseases, nutrition)');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (107, 18, 'Ethics and Human Interface');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (108, 18, 'Attitude and Emotional Intelligence');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (109, 18, 'Moral Thinkers and Philosophers');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (110, 18, 'Public Service Values and Ethics in Administration');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (111, 18, 'Accountability and Ethical Governance');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (112, 18, 'Probity in Governance');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (113, 18, 'Case Studies on Administrative Issues');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (114, 19, 'Government Policies');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (115, 19, 'International Relations');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (116, 19, 'Economic Developments');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (117, 19, 'Environment & Climate Events');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (118, 19, 'Science & Tech Innovations');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (119, 19, 'Social Justice Issues');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (120, 19, 'Sports, Awards, and Reports');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (121, 20, 'Reading Comprehension');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (122, 20, 'Logical Reasoning');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (123, 20, 'Analytical Ability');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (124, 21, 'Basic Numeracy (up to Class X level)');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (125, 21, 'Data Interpretation');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (126, 21, 'Arithmetic, Percentages, Ratios');
INSERT INTO topics (topic_id, section_id, topic_name) VALUES (127, 21, 'Time, Distance, Work, Averages');
