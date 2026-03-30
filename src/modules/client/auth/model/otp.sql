CREATE TABLE IF NOT EXISTS otp(
    otp_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    otp INTEGER,
    otp_created_at TIMESTAMPTZ,
    otp_expires_at TIMESTAMPTZ,
    user_id UUID,
    is_otp_active BOOLEAN DEFAULT false,
    CONSTRAINT fk_user_id
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE SET NULL
)