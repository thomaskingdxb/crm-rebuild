-- Reference/lookup data only (dropdown options, pipeline stages, etc).
-- Not client data — safe to ship with the template and re-run on any fresh project.
-- IDs are preserved to match hardcoded references elsewhere in the app.

INSERT INTO activity_types (id, name, display_order) VALUES
(1,'Call',1),(2,'Meeting',2),(3,'Whatsapp',3),(4,'MA',4),(5,'BM',5),(6,'Viewing',6),(7,'Other',7),(8,'Follow up message',8),(9,'Note',9);
SELECT setval('activity_types_id_seq', (SELECT max(id) FROM activity_types));

INSERT INTO areas (id, name, display_order) VALUES
(1,'Arjan',1),(2,'Arabian Ranches',2),(3,'Arabian Ranches 2',3),(4,'Arabian Ranches 3',4),(5,'Business Bay',5),(6,'Creek Harbour',6),(7,'Damac Hills 1',7),(8,'Damac Hills 2',8),(9,'Damac Lagoons',9),(10,'Downtown Dubai',10),(11,'Dubai Hills',11),(12,'Dubai Land',12),(13,'Dubai South',13),(14,'Emaar Beachfront',14),(15,'JLT',15),(16,'JVC',16),(17,'Marina',17),(18,'Maritime City',18),(19,'Media City',19),(20,'Meydan',20),(21,'Oxford',21),(22,'Production City',22),(23,'Palm Jebel Ali',23),(24,'Palm Jumeriah',24),(25,'Ras Al Khaimah',25),(26,'Reem',26),(27,'Jumeriah Springs',27),(28,'Motor City',28),(29,'Open',29),(30,'Sports City',30),(31,'Town Square',31),(32,'Mira Oasis',32),(33,'Sidra 1',33),(34,'Sidra 2',34),(35,'Mushrif Park',35),(36,'Al Khawaneej 1',36),(37,'Al Khawaneej 2',37),(38,'Silicon Oasis',38),(39,'JVT',39),(40,'The Villa',40),(41,'Al Jeddaf',41),(42,'South Bay 2',42),(43,'South Bay 3',43),(44,'RAK Central',44),(45,'Al Marjan Island',45),(46,'Al Furjan',46),(47,'Barsha Heights',47),(48,'Studio City',48);
SELECT setval('areas_id_seq', (SELECT max(id) FROM areas));

INSERT INTO bathroom_counts (id, name, display_order) VALUES
(1,'1',1),(2,'2',2),(3,'3',3),(4,'4',4),(5,'5',5),(6,'6',6),(7,'7',7),(8,'8',8),(9,'9',9),(10,'10',10),(11,'11',11),(12,'12',12),(13,'13',13),(14,'14',14),(15,'15',15);
SELECT setval('bathroom_counts_id_seq', (SELECT max(id) FROM bathroom_counts));

INSERT INTO bedroom_counts (id, name, display_order) VALUES
(1,'Studio',0),(2,'1',1),(3,'2',2),(4,'3',3),(5,'4',4),(6,'5',5),(7,'6',6),(8,'7',7),(9,'8',8),(10,'9',9),(11,'10',10);
SELECT setval('bedroom_counts_id_seq', (SELECT max(id) FROM bedroom_counts));

INSERT INTO client_statuses (id, name, display_order) VALUES
(1,'Ongoing',1),(2,'Closed',2),(3,'Unresponsive',3);
SELECT setval('client_statuses_id_seq', (SELECT max(id) FROM client_statuses));

INSERT INTO client_types (id, name, display_order) VALUES
(1,'Agent',1),(2,'Buyer',2),(3,'Investor',3),(4,'Lead',4),(5,'Owner',5),(6,'Tenant',6),(7,'Buyer - Distress',7);
SELECT setval('client_types_id_seq', (SELECT max(id) FROM client_types));

INSERT INTO deal_priorities (id, name, display_order) VALUES
(1,'Dead',1),(2,'Cold',2),(3,'Warm',3),(4,'Hot',4),(5,'Future prospect',5),(6,'Closed',6);
SELECT setval('deal_priorities_id_seq', (SELECT max(id) FROM deal_priorities));

INSERT INTO deal_stages (id, name, category, display_order) VALUES
(1,'Unstaged','sale',1),(2,'MOU signed','sale',2),(3,'Valuation','sale',3),(4,'FOL','sale',4),(5,'NOC','sale',5),(6,'Transfer','sale',6),(7,'Completed','sale',7),
(8,'Unstaged','rental',1),(9,'Agreed','rental',2),(10,'Contract signed','rental',3),(11,'Payment received','rental',4),(12,'Ejari/Move in','rental',5),(13,'Completed','rental',6);
SELECT setval('deal_stages_id_seq', (SELECT max(id) FROM deal_stages));

INSERT INTO deal_types (id, name, display_order) VALUES
(1,'Rental',1),(2,'Secondary - ready',2),(3,'Secondary - offplan',3),(4,'Offplan',4);
SELECT setval('deal_types_id_seq', (SELECT max(id) FROM deal_types));

-- Developers: Dubai-market specific. Edit/replace freely for other markets.
INSERT INTO developers (id, name, display_order) VALUES
(1,'Azizi',1),(2,'Aqua',2),(3,'Binghatti',3),(4,'Damac',4),(5,'Danube',5),(6,'Deyaar',6),(7,'Ellington',7),(8,'Five',8),(9,'Emaar',9),(10,'HMB Homes',10),(11,'Meraaas',11),(12,'Oxford',12),(13,'Select Group',13),(14,'Sobha',14),(15,'Tiger',15),(16,'Richmind',16),(17,'Laya',17),(18,'Prescott',18),(19,'Dubai South Properties',19),(20,'Condor',20),(21,'TownX Real Estate Development',21),(22,'Karma',22),(23,'Avelon',23),(24,'Mirfa',24),(25,'Iman',25),(26,'Imtiaz',26),(27,'Major',27),(28,'Rabdan',28),(29,'Tabeer',29);
SELECT setval('developers_id_seq', (SELECT max(id) FROM developers));

INSERT INTO enquiry_types (id, name, display_order) VALUES
(1,'Sale',1),(2,'Rental',2);
SELECT setval('enquiry_types_id_seq', (SELECT max(id) FROM enquiry_types));

INSERT INTO lead_sources (id, name, display_order) VALUES
(1,'Cold Call',1),(2,'Refferal',2),(3,'Social Media',3),(4,'PR',4),(5,'Portals',5),(6,'Other',6);
SELECT setval('lead_sources_id_seq', (SELECT max(id) FROM lead_sources));

INSERT INTO lead_stages (id, name, display_order) VALUES
(1,'New',1),(2,'Unqualified',2),(3,'Qualified',3),(4,'Options sent',4),(5,'Viewing',5),(6,'Negotiating',6),(7,'Future prospect',7),(8,'Closed - Lost',8),(9,'Closed - Won',9),(10,'Unresponsive',10),(11,'Deal agreed',11);
SELECT setval('lead_stages_id_seq', (SELECT max(id) FROM lead_stages));

INSERT INTO listing_statuses (id, name, display_order) OVERRIDING SYSTEM VALUE VALUES
(1,'Property Listed',1),(2,'Exclusive',2),(3,'Pocket Listing',3),(4,'Not Listed',4),(5,'Withdrawn',5),(6,'Listing Expired',6);
SELECT setval('listing_statuses_id_seq', (SELECT max(id) FROM listing_statuses));

INSERT INTO progress_statuses (id, name, display_order) VALUES
(1,'Pending',1),(2,'In Progress',2),(3,'Completed',3);
SELECT setval('progress_statuses_id_seq', (SELECT max(id) FROM progress_statuses));

INSERT INTO property_statuses (id, name, display_order) VALUES
(1,'Ready',1),(2,'Off plan',2),(4,'For sale',4),(5,'For rent',5),(6,'Rented',6),(7,'Sold',7),(8,'Vacant',8),(9,'Off market',9),(10,'Distress',10),(11,'End user',NULL);
SELECT setval('property_statuses_id_seq', (SELECT max(id) FROM property_statuses));

INSERT INTO property_types (id, name, display_order) VALUES
(1,'Apartment',1),(2,'Villa',2),(3,'Townhouse',3),(4,'Hotel Apartment',4),(5,'Commercial',5),(6,'Office',6);
SELECT setval('property_types_id_seq', (SELECT max(id) FROM property_types));

INSERT INTO task_types (id, name, display_order) VALUES
(1,'Viewing',1),(2,'Call',2),(3,'Meeting',3),(4,'Listing',4),(5,'Enquiry',5),(6,'Todays to do list',6),(7,'Tomorrow',7),(8,'Completed',8),(9,'Future task',9),(10,'In progress',10),(11,'Market Update',11),(12,'Cheque Deposit',12);
SELECT setval('task_types_id_seq', (SELECT max(id) FROM task_types));

INSERT INTO view_types (id, name, display_order) VALUES
(1,'Amenities',1),(2,'Burj - full',2),(3,'Community',3),(4,'Golf Course',4),(5,'Lagoon - full',5),(6,'Partial lagoon',6),(7,'Pool',7),(8,'Park',8),(9,'Marina - full',9),(10,'Marina - partial',10),(11,'Road Facing',11),(12,'Garden',12),(13,'Burj - partial',13),(14,'Lagoon - partial',14),(15,'Skyline',15);
SELECT setval('view_types_id_seq', (SELECT max(id) FROM view_types));
