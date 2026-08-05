-- Depression App - MySQL schema
-- Run this once against a fresh database, e.g:
--   mysql -u root -p depression_app < schema.sql

CREATE DATABASE IF NOT EXISTS depression_app
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE depression_app;

-- ---------------------------------------------------------------
-- Core auth table, shared by both roles
-- ---------------------------------------------------------------
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('patient', 'doctor') NOT NULL,
  full_name     VARCHAR(150) NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------
-- Doctor profile
-- ---------------------------------------------------------------
CREATE TABLE doctors (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL UNIQUE,
  doctor_code     VARCHAR(20) NOT NULL UNIQUE, -- shown to patients at signup
  specialization  VARCHAR(150),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- Patient profile, linked to exactly one doctor
-- ---------------------------------------------------------------
CREATE TABLE patients (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL UNIQUE,
  doctor_id   INT NOT NULL,
  date_of_birth DATE,
  gender      VARCHAR(30),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT
);

-- ---------------------------------------------------------------
-- BDI-II attempts. total_score and severity are computed server-side
-- at write time -- never trust a client-submitted score.
-- ---------------------------------------------------------------
CREATE TABLE bdi_responses (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  patient_id    INT NOT NULL,
  answers_json  JSON NOT NULL,      -- 21 items, each 0-3
  total_score   TINYINT UNSIGNED NOT NULL, -- 0-63
  severity      ENUM('minimal', 'mild', 'moderate', 'severe') NOT NULL,
  taken_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  INDEX idx_patient_taken_at (patient_id, taken_at)
);

-- ---------------------------------------------------------------
-- Daily mood / feeling check-ins
-- ---------------------------------------------------------------
CREATE TABLE mood_logs (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  patient_id  INT NOT NULL,
  mood_score  TINYINT UNSIGNED NOT NULL, -- e.g. 1-10 self-reported scale
  notes       TEXT,
  logged_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  INDEX idx_patient_logged_at (patient_id, logged_at)
);

-- ---------------------------------------------------------------
-- Facial-expression AI results (only place the Python AI service writes to)
-- ---------------------------------------------------------------
CREATE TABLE emotion_captures (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  patient_id     INT NOT NULL,
  mood_log_id    INT,
  dominant_emotion VARCHAR(30) NOT NULL, -- e.g. sad, neutral, happy
  confidence     DECIMAL(4,3),
  captured_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (mood_log_id) REFERENCES mood_logs(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------
-- Assigned daily activities (yoga / meditation / music / physical activity)
-- ---------------------------------------------------------------
-- CREATE TABLE activities (
--   id            INT AUTO_INCREMENT PRIMARY KEY,
--   patient_id    INT NOT NULL,
--   category      ENUM('yoga', 'meditation', 'music', 'physical_activity') NOT NULL,
--   title         VARCHAR(150) NOT NULL,
--   description   VARCHAR(500),
--   assigned_date DATE NOT NULL,
--   completed     BOOLEAN DEFAULT FALSE,
--   completed_at  TIMESTAMP NULL,
--   FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
--   INDEX idx_patient_assigned_date (patient_id, assigned_date)
-- );

-- ---------------------------------------------------------------
-- Diet / physical activity recommendations, tracked separately from
-- the daily "activities" list since adherence is logged differently
-- ---------------------------------------------------------------
CREATE TABLE diet_recommendations (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  patient_id    INT NOT NULL,
  recommendation VARCHAR(500) NOT NULL,
  assigned_date DATE NOT NULL,
  followed      BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- Audit trail of what the recommendation engine suggested and why,
-- so the doctor dashboard can show a trend, not just the latest pick
-- ---------------------------------------------------------------
CREATE TABLE recommendation_log (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  patient_id    INT NOT NULL,
  based_on_severity ENUM('minimal', 'mild', 'moderate', 'severe') NOT NULL,
  suggested_category ENUM('yoga', 'meditation', 'music', 'physical_activity') NOT NULL,
  reason        VARCHAR(255),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);





CREATE TABLE cognitive_results (
  id INT NOT NULL AUTO_INCREMENT,
  patient_id INT NOT NULL,
  test_type ENUM('memory', 'attention', 'processing_speed', 'executive_function', 'visual_memory') NOT NULL,
  score INT UNSIGNED NOT NULL,
  details_json JSON DEFAULT NULL,
  taken_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY patient_id (patient_id),
  CONSTRAINT cognitive_results_ibfk_1 FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE
)