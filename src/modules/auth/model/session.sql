CREATE TABLE IF NOT EXISTS sessions(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    refresh_token TEXT NOT NULL,
    user_id UUID,
    CONSTRAINT fk_user_id
        FOREIGN KEY(user_id)
        REFERENCES auth.users(id)
        ON DELETE SET NULL
)
