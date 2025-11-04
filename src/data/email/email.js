const { pool } = require("../../config/db")

const createEmailTable = async () => {
    try {
        const queryText = `
        CREATE TABLE IF NOT EXISTS emails(
        id BIGSERIAL NOT NULL PRIMARY KEY,
        email_address VARCHAR(255) NOT NULL,
        verification_number VARCHAR(255) NOT NULL,
        verification_link VARCHAR(255) NOT NULL,
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        uuser_id BIGINT NOT NULL,
        CONSTRAINT fk_user FOREIGN KEY(id) REFERENCES users(id))`
        const result = await pool.query(queryText)
        console.log("Emails Table Created Successfully : ", result);
    } catch (error) {
        console.log("Error : ", error)
    }
}

createEmailTable()


// node src/email/emai.js