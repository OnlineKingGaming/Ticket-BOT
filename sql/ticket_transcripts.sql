CREATE TABLE IF NOT EXISTS ticket_transcripts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guild_id VARCHAR(255) NOT NULL,
    channel_id VARCHAR(255) NOT NULL,
    messages TEXT NOT NULL,
    UNIQUE KEY unique_transcript (guild_id, channel_id)
);
