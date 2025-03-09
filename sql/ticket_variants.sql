CREATE TABLE IF NOT EXISTS ticket_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guild_id VARCHAR(255) NOT NULL,
    variant_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    emoji VARCHAR(255) DEFAULT NULL,
    role_id VARCHAR(255) NOT NULL,
    category_id VARCHAR(255) DEFAULT NULL,
    UNIQUE KEY unique_variant (guild_id, variant_name)
);
