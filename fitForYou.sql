-- --------------------------------------------------------
-- 호스트:                          127.0.0.1
-- 서버 버전:                        10.4.32-MariaDB - mariadb.org binary distribution
-- 서버 OS:                        Win64
-- HeidiSQL 버전:                  12.3.0.6589
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- fitforyou 데이터베이스 구조 내보내기
CREATE DATABASE IF NOT EXISTS `fitforyou` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;
USE `fitforyou`;

-- 테이블 fitforyou.add_info 구조 내보내기
CREATE TABLE IF NOT EXISTS `add_info` (
  `info_id` int(11) NOT NULL AUTO_INCREMENT,
  `member_id` int(11) NOT NULL,
  `height` int(11) DEFAULT NULL COMMENT '키(cm)',
  `weight` int(11) DEFAULT NULL COMMENT '몸무게(kg)',
  `disease` varchar(200) DEFAULT NULL COMMENT '병력사항',
  PRIMARY KEY (`info_id`),
  UNIQUE KEY `add_info_member_id_key` (`member_id`),
  CONSTRAINT `add_info_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `user` (`member_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 fitforyou.ai_chat 구조 내보내기
CREATE TABLE IF NOT EXISTS `ai_chat` (
  `chat_id` int(11) NOT NULL AUTO_INCREMENT,
  `member_id` int(11) NOT NULL,
  `prompt_type` enum('diet','workout','general') NOT NULL COMMENT '요청 타입',
  `user_input` text NOT NULL COMMENT '사용자 입력 프롬프트',
  `ai_response` text NOT NULL COMMENT 'AI 응답',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`chat_id`),
  KEY `ai_chat_created_at_idx` (`created_at`),
  KEY `ai_chat_member_id_prompt_type_idx` (`member_id`,`prompt_type`),
  CONSTRAINT `ai_chat_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `user` (`member_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 fitforyou.saved_diets 구조 내보내기
CREATE TABLE IF NOT EXISTS `saved_diets` (
  `diet_id` int(11) NOT NULL AUTO_INCREMENT,
  `member_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `breakfast` text DEFAULT NULL,
  `lunch` text DEFAULT NULL,
  `dinner` text DEFAULT NULL,
  `snack` text DEFAULT NULL,
  `total_calories` int(11) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`diet_id`),
  KEY `idx_member_date` (`member_id`,`date`),
  KEY `idx_saved_diets_member_date_desc` (`member_id`,`date`),
  KEY `saved_diets_created_at_idx` (`created_at`),
  CONSTRAINT `saved_diets_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `user` (`member_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 fitforyou.saved_workouts 구조 내보내기
CREATE TABLE IF NOT EXISTS `saved_workouts` (
  `workout_id` int(11) NOT NULL AUTO_INCREMENT,
  `member_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `workout_type` varchar(100) DEFAULT NULL,
  `duration` varchar(20) DEFAULT NULL,
  `intensity` enum('low','medium','high') DEFAULT NULL,
  `target_muscles` text DEFAULT NULL,
  `exercises` text DEFAULT NULL,
  `estimated_calories` int(11) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`workout_id`),
  KEY `idx_member_date` (`member_id`,`date`),
  KEY `idx_saved_workouts_member_date_desc` (`member_id`,`date`),
  KEY `saved_workouts_created_at_idx` (`created_at`),
  KEY `saved_workouts_intensity_idx` (`intensity`),
  KEY `saved_workouts_workout_type_idx` (`workout_type`),
  CONSTRAINT `saved_workouts_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `user` (`member_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 fitforyou.user 구조 내보내기
CREATE TABLE IF NOT EXISTS `user` (
  `member_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(40) NOT NULL,
  `password` varchar(60) NOT NULL,
  `nickname` varchar(30) NOT NULL,
  `gender` enum('male','female') NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`member_id`),
  UNIQUE KEY `user_user_id_key` (`user_id`),
  KEY `user_nickname_idx` (`nickname`),
  KEY `user_user_id_idx` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 내보낼 데이터가 선택되어 있지 않습니다.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
