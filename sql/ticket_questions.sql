CREATE TABLE IF NOT EXISTS ticket_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guild_id VARCHAR(255) NOT NULL,
    variant_name VARCHAR(255) NOT NULL,
    question_index INT NOT NULL,
    question_title VARCHAR(255) NOT NULL,
    question_placeholder VARCHAR(255) NOT NULL,
    question_type VARCHAR(255) NOT NULL,
    question TEXT NOT NULL,
    UNIQUE KEY unique_question (guild_id, variant_name, question_index)
);
