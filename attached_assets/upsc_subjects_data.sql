
CREATE TABLE Subjects (
    subject_id TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE Topics (
    topic_id TEXT PRIMARY KEY,
    subject_id TEXT,
    name TEXT NOT NULL,
    FOREIGN KEY (subject_id) REFERENCES Subjects(subject_id)
);

CREATE TABLE Subtopics (
    subtopic_id TEXT PRIMARY KEY,
    topic_id TEXT,
    name TEXT NOT NULL,
    FOREIGN KEY (topic_id) REFERENCES Topics(topic_id)
);

INSERT INTO Subjects (subject_id, name) VALUES ('86225571-8425-40cc-892f-970cad7e8e6a', 'Indian History');
INSERT INTO Topics (topic_id, subject_id, name) VALUES ('2fcfd1e0-88e0-485d-8ccb-0b564a8c3eaf', '86225571-8425-40cc-892f-970cad7e8e6a', 'Ancient History');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('bfc90f02-5b3f-4495-a128-fcdec8dde08d', '2fcfd1e0-88e0-485d-8ccb-0b564a8c3eaf', 'Prehistoric Cultures in India');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('a30044e3-594d-4c76-901e-417d0a9cddc3', '2fcfd1e0-88e0-485d-8ccb-0b564a8c3eaf', 'Indus Valley Civilization');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('772ce44a-4c32-4d45-8c63-a13e493add25', '2fcfd1e0-88e0-485d-8ccb-0b564a8c3eaf', 'Vedic Age');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('b077de29-e285-4026-9723-03f9bccad5f1', '2fcfd1e0-88e0-485d-8ccb-0b564a8c3eaf', 'Mahajanapadas & Rise of Jainism and Buddhism');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('ea9b106e-4fbe-4090-91e0-b94c79023d5c', '2fcfd1e0-88e0-485d-8ccb-0b564a8c3eaf', 'Mauryan Empire');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('9b5d501e-5099-47ff-a313-a8b3df8d45b0', '2fcfd1e0-88e0-485d-8ccb-0b564a8c3eaf', 'Post-Mauryan Kingdoms');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('dc9a2f44-59df-47b3-8826-decc15be19a3', '2fcfd1e0-88e0-485d-8ccb-0b564a8c3eaf', 'Gupta Age');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('623acb5c-aa23-4dba-b65d-115a8a74b6c3', '2fcfd1e0-88e0-485d-8ccb-0b564a8c3eaf', 'Post-Gupta Period');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('60a7d0e7-9721-49ed-b85b-4561ef6ba558', '2fcfd1e0-88e0-485d-8ccb-0b564a8c3eaf', 'Early South Indian Kingdoms');
INSERT INTO Topics (topic_id, subject_id, name) VALUES ('313a7815-368c-465a-832f-bf75d2c66e4c', '86225571-8425-40cc-892f-970cad7e8e6a', 'Medieval History');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('7bb9ae26-ebe1-4b99-b4f3-10ae7194981d', '313a7815-368c-465a-832f-bf75d2c66e4c', 'Early Medieval Period (750–1200 AD)');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('c0984108-d2de-45db-b2b7-28eda8de8077', '313a7815-368c-465a-832f-bf75d2c66e4c', 'Delhi Sultanate');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('5cdc7f74-c357-467d-aa08-d94d21461b38', '313a7815-368c-465a-832f-bf75d2c66e4c', 'Vijayanagara and Bahmani Kingdoms');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('62910484-fb9a-4e68-bd07-56640d48c142', '313a7815-368c-465a-832f-bf75d2c66e4c', 'Mughal Empire');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('eb00ed24-b727-4a51-a70c-1283559ffcd2', '313a7815-368c-465a-832f-bf75d2c66e4c', 'Marathas and Regional Kingdoms');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('8d752da9-f9ad-4dbc-b24a-8e6dd28b8984', '313a7815-368c-465a-832f-bf75d2c66e4c', 'Religious Movements: Bhakti & Sufi');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('da752514-ceb6-4cbf-997a-62126aa2a79b', '313a7815-368c-465a-832f-bf75d2c66e4c', 'Administrative and Cultural Developments');
INSERT INTO Topics (topic_id, subject_id, name) VALUES ('04ee2551-e6c6-4b96-a020-f9cd0866bc38', '86225571-8425-40cc-892f-970cad7e8e6a', 'Modern History');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('6d151329-990e-4c6f-af17-fe639852ebc3', '04ee2551-e6c6-4b96-a020-f9cd0866bc38', 'Advent of Europeans');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('c3d9612f-b5c6-491b-8ff0-30babd6e047a', '04ee2551-e6c6-4b96-a020-f9cd0866bc38', 'British Expansion in India');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('50f2a7fa-391d-49e4-9d17-3dd9a6565853', '04ee2551-e6c6-4b96-a020-f9cd0866bc38', 'Socio-Religious Reform Movements');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('cc16a089-16d8-473c-906e-aa081382cf2e', '04ee2551-e6c6-4b96-a020-f9cd0866bc38', 'Revolt of 1857');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('88e71af6-01ab-4da2-a8a3-3bc9c872a865', '04ee2551-e6c6-4b96-a020-f9cd0866bc38', 'Indian National Movement: Pre-Congress');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('a52670dc-3084-45dd-9565-adb90453fcfb', '04ee2551-e6c6-4b96-a020-f9cd0866bc38', 'INC Formation & Early Phase');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('2b3e75cb-b843-48a4-a6ea-1477c799c969', '04ee2551-e6c6-4b96-a020-f9cd0866bc38', 'Extremist Phase (1905–1919)');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('cc0bd17f-b926-4877-ae0d-39f7f8c7785d', '04ee2551-e6c6-4b96-a020-f9cd0866bc38', 'Gandhian Era (1919–1947)');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('a85f9e3a-a901-4076-a3e9-6b3396f33139', '04ee2551-e6c6-4b96-a020-f9cd0866bc38', 'Constitutional Developments');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('38c9829b-c436-4d8e-b62f-5cfec31e397f', '04ee2551-e6c6-4b96-a020-f9cd0866bc38', 'Partition & Independence');
INSERT INTO Subjects (subject_id, name) VALUES ('dd39a406-c786-4f4d-9a3f-51196e72eaf2', 'Art & Culture');
INSERT INTO Topics (topic_id, subject_id, name) VALUES ('8f64b6e8-7cee-4086-9620-575f341d3a7d', 'dd39a406-c786-4f4d-9a3f-51196e72eaf2', 'Indian Culture');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('f1f97c91-a435-4050-9c97-7a088eccb953', '8f64b6e8-7cee-4086-9620-575f341d3a7d', 'Architecture');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('732bb6f8-d024-429f-81b3-a7b6f3eb02f9', '8f64b6e8-7cee-4086-9620-575f341d3a7d', 'Sculpture and Iconography');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('9b237c92-dea3-4e66-89c8-b9a5cdca5b4b', '8f64b6e8-7cee-4086-9620-575f341d3a7d', 'Paintings');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('35c4c299-51f2-4c63-a4f7-b95be8e6a228', '8f64b6e8-7cee-4086-9620-575f341d3a7d', 'Music, Dance, Theatre');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('c42c9be5-3468-49f3-91c2-3a9da8c6dbcd', '8f64b6e8-7cee-4086-9620-575f341d3a7d', 'Literature');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('987913fb-8ca3-4764-877b-fffab5bbfc3c', '8f64b6e8-7cee-4086-9620-575f341d3a7d', 'Religion and Philosophy');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('602855c9-4abb-49f0-bf2b-dfe30cea66b2', '8f64b6e8-7cee-4086-9620-575f341d3a7d', 'UNESCO Heritage Sites');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('88bf3303-869c-485a-a1b6-53fe0d3771a7', '8f64b6e8-7cee-4086-9620-575f341d3a7d', 'Fairs, Festivals and Cultural Institutions');
INSERT INTO Subjects (subject_id, name) VALUES ('9d5371dc-ed47-4100-a2ca-19c8b85d3c53', 'Geography');
INSERT INTO Topics (topic_id, subject_id, name) VALUES ('30f62fe1-46aa-4810-887c-67ad25fb33f1', '9d5371dc-ed47-4100-a2ca-19c8b85d3c53', 'Physical Geography');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('ceb13ade-28e4-4c3f-be75-65728a3153b9', '30f62fe1-46aa-4810-887c-67ad25fb33f1', 'Geomorphology');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('abac419f-36ff-42f7-ba89-aa27bd7f4846', '30f62fe1-46aa-4810-887c-67ad25fb33f1', 'Climatology');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('419a80e5-38f3-49eb-9818-623598778e25', '30f62fe1-46aa-4810-887c-67ad25fb33f1', 'Oceanography');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('43da4d38-6392-4e15-aa50-e65943a46e32', '30f62fe1-46aa-4810-887c-67ad25fb33f1', 'Biogeography');
INSERT INTO Topics (topic_id, subject_id, name) VALUES ('933948ea-99f2-446f-9112-cc662ff65b72', '9d5371dc-ed47-4100-a2ca-19c8b85d3c53', 'Indian Geography');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('524255f0-e206-47e2-a2a5-bd15e8635450', '933948ea-99f2-446f-9112-cc662ff65b72', 'Physiographic Divisions');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('4282cc8f-585e-46f0-8496-ca117b227690', '933948ea-99f2-446f-9112-cc662ff65b72', 'Climate and Weather');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('52ece75a-d437-46a3-9c6d-591d642d2e03', '933948ea-99f2-446f-9112-cc662ff65b72', 'Soil and Vegetation');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('21da4c38-84a7-4d8a-9e33-f2fce0991485', '933948ea-99f2-446f-9112-cc662ff65b72', 'Rivers and Water Resources');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('160b12d8-754e-4090-910b-c2e147cde18f', '933948ea-99f2-446f-9112-cc662ff65b72', 'Agriculture');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('17967776-ffa8-4255-b774-a00c68993d22', '933948ea-99f2-446f-9112-cc662ff65b72', 'Minerals and Energy Resources');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('c09617cf-906d-46df-8c60-4a3d8fa35312', '933948ea-99f2-446f-9112-cc662ff65b72', 'Transport and Infrastructure');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('79f87bfd-ac35-459a-aa83-acfcdafd148b', '933948ea-99f2-446f-9112-cc662ff65b72', 'Disaster Management');
INSERT INTO Topics (topic_id, subject_id, name) VALUES ('56fd2f57-d048-44a2-94da-0f6162a97d80', '9d5371dc-ed47-4100-a2ca-19c8b85d3c53', 'Human & Economic Geography');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('efd049e9-e6e5-4375-a713-4d8797402637', '56fd2f57-d048-44a2-94da-0f6162a97d80', 'Population and Demographics');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('78852099-e4d8-407a-bb9c-db8e41e605a4', '56fd2f57-d048-44a2-94da-0f6162a97d80', 'Urbanization and Migration');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('c60b2b64-172a-4e09-9df3-4be1d2b65eba', '56fd2f57-d048-44a2-94da-0f6162a97d80', 'Industries');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('3c813058-f1ad-47dc-82ac-9e9eaaaf6690', '56fd2f57-d048-44a2-94da-0f6162a97d80', 'Trade and Transport');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('0856b336-ff48-4878-91ed-2fa96c20e75b', '56fd2f57-d048-44a2-94da-0f6162a97d80', 'Regional Development');
INSERT INTO Subjects (subject_id, name) VALUES ('e976e523-4caf-41f2-b909-e5192906107a', 'Indian Polity & Governance');
INSERT INTO Topics (topic_id, subject_id, name) VALUES ('09d04eb7-e2ef-4512-8c30-6357630b2001', 'e976e523-4caf-41f2-b909-e5192906107a', 'Constitution');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('633eb1ac-5f67-4780-8999-a5b40fde1297', '09d04eb7-e2ef-4512-8c30-6357630b2001', 'Historical Background');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('f8fd3d39-2f68-446f-bdee-d5391a283642', '09d04eb7-e2ef-4512-8c30-6357630b2001', 'Preamble');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('145a4827-964b-4a26-95a2-e4cdff34e22a', '09d04eb7-e2ef-4512-8c30-6357630b2001', 'Fundamental Rights and Duties');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('a7459089-d0a9-4ccd-b276-87caf3d92469', '09d04eb7-e2ef-4512-8c30-6357630b2001', 'Directive Principles of State Policy');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('2e504594-645a-470c-ad5c-a7b25c67e7bf', '09d04eb7-e2ef-4512-8c30-6357630b2001', 'Amendment Procedures');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('9af36d72-b0ac-495c-abac-3b20fed569e8', '09d04eb7-e2ef-4512-8c30-6357630b2001', 'Constitutional Bodies');
INSERT INTO Topics (topic_id, subject_id, name) VALUES ('90bd5d37-7cf3-4c2b-a029-4e887869f776', 'e976e523-4caf-41f2-b909-e5192906107a', 'Political System');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('67057f78-c71b-4786-b8d8-50831c82bd6b', '90bd5d37-7cf3-4c2b-a029-4e887869f776', 'Parliament');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('01f16bcb-6bc9-4913-9a2a-b55b55c12d30', '90bd5d37-7cf3-4c2b-a029-4e887869f776', 'President and Vice-President');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('adfa9db1-0999-4480-9a7a-17d8a8dfd482', '90bd5d37-7cf3-4c2b-a029-4e887869f776', 'Prime Minister and Council of Ministers');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('7e29aea2-2cad-4d2f-9767-1fb7bd292187', '90bd5d37-7cf3-4c2b-a029-4e887869f776', 'Judiciary');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('38d6d8ec-2934-4e19-a2fd-5fde8f368e05', '90bd5d37-7cf3-4c2b-a029-4e887869f776', 'Federalism');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('7bfadec6-2cca-4b73-b73b-409453438b59', '90bd5d37-7cf3-4c2b-a029-4e887869f776', 'Emergency Provisions');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('ca88c7f5-b482-47b2-9fae-67cae86b13f5', '90bd5d37-7cf3-4c2b-a029-4e887869f776', 'Elections');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('272a113e-81c4-4ed7-9735-0178246f88f4', '90bd5d37-7cf3-4c2b-a029-4e887869f776', 'Political Parties');
INSERT INTO Topics (topic_id, subject_id, name) VALUES ('3d1e9bad-f632-4542-9880-4eb5ad7edb66', 'e976e523-4caf-41f2-b909-e5192906107a', 'Governance');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('c8ad5e95-bddc-4816-b57f-cac867be68c2', '3d1e9bad-f632-4542-9880-4eb5ad7edb66', 'Civil Services');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('84c8a4f7-0e65-4944-be91-ed8dd708d76f', '3d1e9bad-f632-4542-9880-4eb5ad7edb66', 'e-Governance');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('593df337-87f9-4517-9447-9e0e53e51b8a', '3d1e9bad-f632-4542-9880-4eb5ad7edb66', 'Transparency and Accountability');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('37108abb-2383-49ba-bb02-440c91dcadb5', '3d1e9bad-f632-4542-9880-4eb5ad7edb66', 'RTI, Citizen Charters');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('f19f2992-8d1f-4e4f-8c5b-859567bdda21', '3d1e9bad-f632-4542-9880-4eb5ad7edb66', 'NGOs and SHGs');
INSERT INTO Subtopics (subtopic_id, topic_id, name) VALUES ('daa06f3b-3118-420f-b5b4-2559d291cb50', '3d1e9bad-f632-4542-9880-4eb5ad7edb66', 'Media's Role');