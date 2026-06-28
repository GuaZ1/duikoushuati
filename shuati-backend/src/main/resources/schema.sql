CREATE DATABASE IF NOT EXISTS shuati CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shuati;

DROP TABLE IF EXISTS answer_record;
DROP TABLE IF EXISTS wrong_notebook;
DROP TABLE IF EXISTS study_progress;
DROP TABLE IF EXISTS question_option;
DROP TABLE IF EXISTS question;
DROP TABLE IF EXISTS knowledge_point;
DROP TABLE IF EXISTS app_user;
DROP TABLE IF EXISTS subject;

CREATE TABLE subject (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(30),
    grade_range VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE knowledge_point (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    subject_id BIGINT NOT NULL,
    parent_id BIGINT,
    name VARCHAR(100) NOT NULL,
    level INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE app_user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    role VARCHAR(20) NOT NULL,
    phone VARCHAR(20),
    nickname VARCHAR(50),
    avatar VARCHAR(255),
    grade VARCHAR(20),
    school VARCHAR(100),
    created_at DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE question (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    subject_id BIGINT NOT NULL,
    knowledge_point_ids VARCHAR(255),
    type VARCHAR(30) NOT NULL,
    difficulty INT NOT NULL,
    content TEXT NOT NULL,
    answer TEXT,
    analysis TEXT,
    score INT,
    source VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE question_option (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    question_id BIGINT NOT NULL,
    option_key VARCHAR(10) NOT NULL,
    content TEXT NOT NULL,
    is_correct BOOLEAN
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE answer_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    student_answer TEXT,
    correct_status VARCHAR(20) NOT NULL,
    score INT,
    created_at DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wrong_notebook (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    wrong_count INT,
    last_wrong_at DATETIME,
    mastered BOOLEAN,
    UNIQUE KEY uk_student_question (student_id, question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE study_progress (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    subject_id BIGINT NOT NULL,
    knowledge_point_id BIGINT NOT NULL,
    practiced_count INT,
    correct_count INT,
    mastery_rate INT,
    UNIQUE KEY uk_user_subject_kp (user_id, subject_id, knowledge_point_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
