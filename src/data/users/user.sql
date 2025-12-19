CREATE TABLE IF NOT EXISTS  users(
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    profile_photo VARCHAR(255),
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
    otp_attempts INTEGER DEFAULT 3
    otp INTEGER,
    otp_created_at TIMESTAMP
)
