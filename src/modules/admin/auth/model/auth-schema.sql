
CREATE SCHEMA IF NOT EXISTS admin;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;


CREATE TABLE IF NOT EXISTS admin.portal(
  portal_id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  name CITEXT NOT NULL,
  slug CITEXT NOT NULL,
  description CITEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin.users(
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name CITEXT NOT NULL,
    email CITEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    profile_photo_url TEXT,
    portal_id UUID NOT NULL,
    permission_version INTEGER NOT NULL DEFAULT 1,
    is_root BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    updated_by UUID,

    CONSTRAINT fk_portal
        FOREIGN KEY (portal_id)
        REFERENCES admin.portal(portal_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_created_by
        FOREIGN KEY (created_by)
        REFERENCES admin.users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES admin.users(user_id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS admin.user_sessions(
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    refresh_token_hash TEXT NOT NULL,
    session_secret TEXT NOT NULL,
    device_name TEXT NOT NULL,
    ip_address INET NOT NULL,
    user_agent TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID,

    CONSTRAINT fk_user
        FOREIGN KEY(user_id)
        REFERENCES admin.users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_revoked_by
        FOREIGN KEY(revoked_by)
        REFERENCES admin.users(user_id)
        ON DELETE SET NULL
);