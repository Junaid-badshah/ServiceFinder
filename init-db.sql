-- MySQL dump 10.13  Distrib 8.4.11, for Linux (x86_64)
--
-- Host: localhost    Database: servicefinder
-- ------------------------------------------------------
-- Server version	8.4.11

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `commission_rules`
--

DROP TABLE IF EXISTS `commission_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commission_rules` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `active` bit(1) NOT NULL,
  `commission_percentage` decimal(38,2) NOT NULL,
  `service_id` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commission_rules`
--

LOCK TABLES `commission_rules` WRITE;
/*!40000 ALTER TABLE `commission_rules` DISABLE KEYS */;
INSERT INTO `commission_rules` VALUES (1,_binary '',15.00,1);
/*!40000 ALTER TABLE `commission_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `providers`
--

DROP TABLE IF EXISTS `providers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `providers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `description` varchar(1000) DEFAULT NULL,
  `experience` int DEFAULT NULL,
  `location` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(255) NOT NULL,
  `rating` double DEFAULT NULL,
  `service` varchar(255) NOT NULL,
  `available_days` varchar(255) DEFAULT NULL,
  `available_time` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `rate` double DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  `available` bit(1) DEFAULT NULL,
  `latitude` double NOT NULL,
  `longitude` double NOT NULL,
  `service_radius_km` double NOT NULL,
  `verification_status` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_service` (`service`),
  KEY `idx_location` (`location`),
  KEY `idx_service_location` (`service`,`location`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `providers`
--

LOCK TABLES `providers` WRITE;
/*!40000 ALTER TABLE `providers` DISABLE KEYS */;
INSERT INTO `providers` VALUES (8,'Expert electrician',5,'Karachi','Test Electrician','0300-9999999',0,'Electrician','Mon-Sat','10AM-7PM','test.provider@test.com',1500,6,_binary '',31.5204,74.3587,50,NULL),(9,'I AM TE BEST FULL STACK DEVELOPER',42,'Islaabad','anas khan','03248587317',0,'Computer Repair','Mon-Sat','10AM-11AM','anas17702@gmail.com',6000000,9,NULL,0,0,0,NULL),(13,' ihdn munu cjl[  uio iu ojioio noif',6,'i 10','anas khan','03248587317',0,'Carpenter','edojfokfp','dqwojfojo',NULL,1000,9,NULL,0,0,0,NULL),(14,' good and well ',12,'g11','aj khan','03029392244',0,'AC Technician','monday to sunday','298482389',NULL,1000,10,NULL,0,0,0,NULL);
/*!40000 ALTER TABLE `providers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `request_offers`
--

DROP TABLE IF EXISTS `request_offers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `request_offers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `provider_id` bigint NOT NULL,
  `request_id` bigint NOT NULL,
  `responded_at` datetime(6) DEFAULT NULL,
  `sent_at` datetime(6) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKnm7v0dutuaxnflpkoklvn4te4` (`provider_id`),
  KEY `FKlnedxbpxre1vrwgyttbn6uyhj` (`request_id`),
  CONSTRAINT `FKlnedxbpxre1vrwgyttbn6uyhj` FOREIGN KEY (`request_id`) REFERENCES `service_requests` (`id`),
  CONSTRAINT `FKnm7v0dutuaxnflpkoklvn4te4` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `request_offers`
--

LOCK TABLES `request_offers` WRITE;
/*!40000 ALTER TABLE `request_offers` DISABLE KEYS */;
INSERT INTO `request_offers` VALUES (2,8,10,'2026-10-22 16:54:07.227975','2026-10-22 16:46:31.566309','ACCEPTED'),(3,8,11,NULL,'2026-10-22 16:52:15.342586','PENDING');
/*!40000 ALTER TABLE `request_offers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `comment` varchar(1000) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `rating` int NOT NULL,
  `customer_id` bigint NOT NULL,
  `provider_id` bigint NOT NULL,
  `request_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKkquncb1glvrldaui8v52xfd5q` (`customer_id`),
  KEY `FKrsomnwai2734u8lqdqu5yd96x` (`provider_id`),
  KEY `FKot7y2mwkt0vijcv2vd5aduj4r` (`request_id`),
  CONSTRAINT `FKkquncb1glvrldaui8v52xfd5q` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKot7y2mwkt0vijcv2vd5aduj4r` FOREIGN KEY (`request_id`) REFERENCES `service_requests` (`id`),
  CONSTRAINT `FKrsomnwai2734u8lqdqu5yd96x` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_requests`
--

DROP TABLE IF EXISTS `service_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `service_requests` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `message` varchar(1000) DEFAULT NULL,
  `preferred_date` date DEFAULT NULL,
  `status` varchar(255) NOT NULL,
  `provider_id` bigint DEFAULT NULL,
  `user_id` bigint NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `location_note` varchar(255) DEFAULT NULL,
  `location_type` varchar(50) DEFAULT NULL,
  `preferred_time` time(6) DEFAULT NULL,
  `agreed_price` decimal(38,2) DEFAULT NULL,
  `commission_amount` decimal(38,2) DEFAULT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKtb63oejkuqh8rvn32pgopayy1` (`provider_id`),
  KEY `FKdnrpkrvtepdqqcxg1nqiq5edt` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_provider_status` (`provider_id`,`status`),
  KEY `idx_user_id_sr` (`user_id`),
  CONSTRAINT `FKdnrpkrvtepdqqcxg1nqiq5edt` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKtb63oejkuqh8rvn32pgopayy1` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_requests`
--

LOCK TABLES `service_requests` WRITE;
/*!40000 ALTER TABLE `service_requests` DISABLE KEYS */;
INSERT INTO `service_requests` VALUES (10,'i en e756ll.','2026-10-23','ACCEPTED',8,11,'2026-10-22 16:46:31.495622','Metro Bus Track, Srinagar Highway, G-9/4, Islamabad, Islamabad Capital Territory, 44000, Pakistan','','HOME','14:13:00.000000',1500.00,225.00,31.5204,74.3587),(11,'eryrtyrttrj hrwerhtrh','2026-10-23','REQUESTED',NULL,11,'2026-10-22 16:52:15.323170','Metro Bus Track, Srinagar Highway, G-9/4, Islamabad, Islamabad Capital Territory, 44000, Pakistan','','HOME','11:31:00.000000',NULL,NULL,31.5204,74.3587),(12,'efergergegrg','0004-12-23','REQUESTED',NULL,11,'2026-10-22 19:12:18.786320','Lahore, Pakistan','','HOME','03:34:00.000000',NULL,NULL,31.5204,74.3587);
/*!40000 ALTER TABLE `service_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `services`
--

DROP TABLE IF EXISTS `services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `services` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `active` bit(1) NOT NULL,
  `color` varchar(255) NOT NULL,
  `icon` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKh4rqgjwnqidx6mvj4i22dxwxe` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `services`
--

LOCK TABLES `services` WRITE;
/*!40000 ALTER TABLE `services` DISABLE KEYS */;
INSERT INTO `services` VALUES (1,_binary '','bg-yellow-500','⚡','Electrician'),(2,_binary '','bg-blue-500','🔧','Plumber'),(3,_binary '','bg-cyan-500','❄️','AC Technician'),(4,_binary '','bg-purple-500','💻','Computer Repair'),(5,_binary '','bg-green-500','📚','Tutor'),(6,_binary '','bg-pink-500','🎨','Painter'),(7,_binary '','bg-orange-500','🪚','Carpenter'),(8,_binary '','bg-indigo-500','📱','Mobile Repair'),(9,_binary '','bg-teal-500','🧹','Cleaning Service'),(10,_binary '','bg-red-500','📦','Mover & Packer'),(11,_binary '','bg-rose-500','💇','Beautician'),(12,_binary '','bg-gray-500','🔨','Other'),(13,_binary '','bg-red-500','🚜','Lawn care'),(14,_binary '','bg-teal-500','🍝','chef'),(15,_binary '','bg-purple-500','🧑‍✈','Car driver');
/*!40000 ALTER TABLE `services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(255) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` enum('ADMIN','CUSTOMER','PROVIDER') NOT NULL,
  `profile_picture` longtext,
  `profile_completed` bit(1) NOT NULL,
  `wallet_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK6dotkott2kjsp8vw4d0m25fb7` (`email`),
  UNIQUE KEY `UK1vggin5xlv1ptduwmtp1rm16` (`wallet_id`),
  CONSTRAINT `FKcf6cgic6n7ek155uj81npsbcm` FOREIGN KEY (`wallet_id`) REFERENCES `wallets` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'junaid@test.com','junaid','03119392757',NULL,'ADMIN',NULL,_binary '\0',NULL),(2,'junaid.test1@gmail.com','junaid badshh','03119392244',NULL,'ADMIN',NULL,_binary '\0',NULL),(3,'customer@test.com','Customer Demo','0300-1111111','123456','CUSTOMER',NULL,_binary '\0',NULL),(4,'provider@test.com','Provider Demo','0300-2222222','123456','PROVIDER',NULL,_binary '\0',NULL),(5,'admin@test.com','Admin Demo','0300-3333333','admin123','ADMIN',NULL,_binary '\0',NULL),(6,'test.provider@test.com','Test Electrician','0300-9999999','test123','PROVIDER',NULL,_binary '\0',NULL),(7,'03248587317@customer.local','anas khan','03248587317','03248587317','CUSTOMER',NULL,_binary '\0',NULL),(8,'03029392244@customer.local','vikcuched wcfvvv','03029392244','03029392244','CUSTOMER',NULL,_binary '\0',NULL),(9,'anas17702@gmail.com','anas khan','03248587317','ASDFGHJKL','PROVIDER',NULL,_binary '\0',NULL),(10,'junaidoffice429@gmail.com','aj khan','03029392244','junaid244','PROVIDER',NULL,_binary '\0',NULL),(11,'03125756192@customer.local','raza khan','03125756192','raza123','CUSTOMER',NULL,_binary '\0',NULL),(12,'junaidbadshah429@gmail.com','Junaid Badshah','','','CUSTOMER',NULL,_binary '\0',NULL),(13,'abbas1420018@gmail.com','abbas khan','','abbas123','CUSTOMER',NULL,_binary '\0',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wallet_transactions`
--

DROP TABLE IF EXISTS `wallet_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wallet_transactions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `amount` decimal(38,2) NOT NULL,
  `booking_id` bigint DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `reference_id` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `transaction_type` varchar(255) NOT NULL,
  `wallet_id` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wallet_transactions`
--

LOCK TABLES `wallet_transactions` WRITE;
/*!40000 ALTER TABLE `wallet_transactions` DISABLE KEYS */;
INSERT INTO `wallet_transactions` VALUES (1,1000.00,NULL,'2026-10-22 15:05:48.222453','MOCK_TXN_1792663548215','SUCCESS','TOP_UP',1),(2,80.00,4,'2026-10-22 15:43:18.028461',NULL,'SUCCESS','COMMISSION_DEDUCTION',1),(3,1000.00,NULL,'2026-10-22 15:51:53.418951','MOCK_TXN_1792666313412','SUCCESS','TOP_UP',3),(4,10000.00,NULL,'2026-10-22 15:52:18.061845','MOCK_TXN_1792666338048','SUCCESS','TOP_UP',3),(5,6000000.00,NULL,'2026-10-22 16:02:24.559181','MOCK_TXN_1792666944537','SUCCESS','TOP_UP',3),(6,600000.00,8,'2026-10-22 16:02:27.461637',NULL,'SUCCESS','COMMISSION_DEDUCTION',3),(7,150.00,9,'2026-10-22 16:40:26.111557',NULL,'SUCCESS','COMMISSION_DEDUCTION',1),(8,225.00,10,'2026-10-22 16:54:07.216840',NULL,'SUCCESS','COMMISSION_DEDUCTION',1);
/*!40000 ALTER TABLE `wallet_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wallets`
--

DROP TABLE IF EXISTS `wallets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wallets` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `balance` decimal(38,2) NOT NULL,
  `currency` varchar(255) NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKsswfdl9fq40xlkove1y5kc7kv` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wallets`
--

LOCK TABLES `wallets` WRITE;
/*!40000 ALTER TABLE `wallets` DISABLE KEYS */;
INSERT INTO `wallets` VALUES (1,545.00,'PKR',6),(3,5411000.00,'PKR',9),(5,0.00,'PKR',11);
/*!40000 ALTER TABLE `wallets` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-22 14:52:38
