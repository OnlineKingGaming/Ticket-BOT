CREATE TABLE IF NOT EXISTS log_channels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guild_id VARCHAR(255) NOT NULL,
    channel_id VARCHAR(255) NOT NULL,
    UNIQUE KEY unique_log_channel (guild_id)
);
