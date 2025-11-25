CREATE TABLE IF NOT EXISTS emails(
    id BIGSERIAL NOT NULL PRIMARY KEY,
    email_address VARCHAR(255) NOT NULL,
    verification_number VARCHAR(255) NOT NULL,
    verification_link VARCHAR(255) NOT NULL,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id BIGINT NOT NULL,
    CONSTRAINT fk_user FOREIGN KEY(id) REFERENCES users(id),
)