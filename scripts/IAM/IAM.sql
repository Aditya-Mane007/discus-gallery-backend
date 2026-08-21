CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE SCHEMA IF NOT EXISTS portal;

CREATE TABLE portal.portal (
    portal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name CITEXT NOT NULL,
    slug CITEXT NOT NULL UNIQUE,
    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_system BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name CITEXT NOT NULL,
    email CITEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,

    profile_photo_url TEXT,
    -- Legacy (keep temporarily for migration): nullable, being phased out
    jwt_secret TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    created_by UUID,
    updated_by UUID,

    CONSTRAINT fk_user_created_by
        FOREIGN KEY (created_by)
        REFERENCES auth.users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_user_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES auth.users(user_id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS auth.user_sessions(
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    user_id UUID NOT NULL,
    device_name TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    ip_address INET NOT NULL,
    user_agent TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    -- FIX: no longer defaults to NOW() — a new session must not be born "revoked"
    revoked_at TIMESTAMPTZ,
    revoked_by UUID,
    -- FIX: no default, and required — caller must set the actual TTL
    expires_at TIMESTAMPTZ NOT NULL,

    CONSTRAINT fk_user
        FOREIGN KEY(user_id)
        REFERENCES auth.users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_revoked_by
        FOREIGN KEY(revoked_by)
        REFERENCES auth.users(user_id)
        ON DELETE SET NULL
);

CREATE INDEX idx_user_sessions_user_id ON auth.user_sessions (user_id);
CREATE INDEX idx_user_sessions_refresh_token ON auth.user_sessions (refresh_token);


CREATE SCHEMA IF NOT EXISTS modules;
CREATE TABLE modules.module (
    module_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    portal_id UUID NOT NULL,

    name CITEXT NOT NULL,
    -- FIX: removed column-level UNIQUE (was redundant with / conflicting with
    -- the composite below). Slug is now unique per-portal, not globally.
    slug CITEXT NOT NULL,
    description TEXT,

    icon VARCHAR(100),
    display_order SMALLINT NOT NULL DEFAULT 0,

    is_system BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    created_by UUID,
    updated_by UUID,

    CONSTRAINT uq_module_portal_slug
        UNIQUE (portal_id, slug),

    CONSTRAINT fk_module_portal
        FOREIGN KEY (portal_id)
        REFERENCES portal.portal(portal_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_module_created_by
        FOREIGN KEY (created_by)
        REFERENCES auth.users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_module_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES auth.users(user_id)
        ON DELETE SET NULL
);

CREATE INDEX idx_module_portal_id ON modules.module (portal_id);

CREATE TABLE modules.resource (
    resource_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    module_id UUID NOT NULL,

    name CITEXT NOT NULL,
    -- FIX: removed column-level UNIQUE; slug unique per-module via composite below
    slug CITEXT NOT NULL,
    description TEXT,

    display_order SMALLINT NOT NULL DEFAULT 0,

    is_system BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    created_by UUID,
    updated_by UUID,

    CONSTRAINT uq_resource_module_slug
        UNIQUE (module_id, slug),

    CONSTRAINT fk_resource_module
        FOREIGN KEY (module_id)
        REFERENCES modules.module(module_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_resource_created_by
        FOREIGN KEY (created_by)
        REFERENCES auth.users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_resource_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES auth.users(user_id)
        ON DELETE SET NULL
);

CREATE INDEX idx_resource_module_id ON modules.resource (module_id);

CREATE TABLE modules.resource_permission (
    resource_permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    resource_id UUID NOT NULL,

    name CITEXT NOT NULL,
    -- FIX: removed column-level UNIQUE; slug unique per-resource via composite below
    slug CITEXT NOT NULL,
    action CITEXT NOT NULL,
    description TEXT,

    is_system BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    created_by UUID,
    updated_by UUID,

    CONSTRAINT uq_resource_permission_slug
        UNIQUE (resource_id, slug),

    CONSTRAINT uq_resource_permission_action
        UNIQUE (resource_id, action),

    CONSTRAINT fk_resource_permission_resource
        FOREIGN KEY (resource_id)
        REFERENCES modules.resource(resource_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_resource_permission_created_by
        FOREIGN KEY (created_by)
        REFERENCES auth.users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_resource_permission_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES auth.users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT chk_resource_permission_action
       CHECK (length(trim(action::text)) > 0),

    CONSTRAINT chk_module_slug
       CHECK (length(trim(slug::text)) > 0)
);

CREATE INDEX idx_resource_permission_resource_id ON modules.resource_permission (resource_id);


CREATE SCHEMA IF NOT EXISTS organization;
CREATE TABLE IF NOT EXISTS organization.organization (

    organization_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    portal_id UUID NOT NULL,

    -- FIX: removed column-level UNIQUE on name/slug; scoped to portal via
    -- the composite uq_org_slug below instead
    name CITEXT NOT NULL,
    slug CITEXT NOT NULL,
    description TEXT,

    email CITEXT,
    phone VARCHAR(20),

    logo_url TEXT,

    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    created_by UUID,
    updated_by UUID,

    CONSTRAINT uq_org_slug
        UNIQUE (portal_id, name, slug),

    CONSTRAINT fk_org_portal
        FOREIGN KEY (portal_id)
        REFERENCES portal.portal(portal_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_org_created_by
        FOREIGN KEY (created_by)
        REFERENCES auth.users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_org_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES auth.users(user_id)
        ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS organization.organization_membership (

    organization_membership_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,

    user_id UUID NOT NULL,

    is_owner BOOLEAN NOT NULL DEFAULT FALSE,

    status VARCHAR(30) NOT NULL DEFAULT 'active',

    joined_at TIMESTAMPTZ DEFAULT NOW(),

    invited_at TIMESTAMPTZ DEFAULT NOW(),

    -- FIX: no longer defaults to NOW() — a row should not claim to be
    -- activated/suspended before that actually happens
    activated_at TIMESTAMPTZ,

    suspended_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    created_by UUID,
    updated_by UUID,

    CONSTRAINT uq_org_user
        UNIQUE (organization_id, user_id),

    CONSTRAINT fk_membership_org
        FOREIGN KEY (organization_id)
        REFERENCES organization.organization(organization_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_membership_user
        FOREIGN KEY (user_id)
        REFERENCES auth.users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_membership_created_by
        FOREIGN KEY (created_by)
        REFERENCES auth.users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_membership_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES auth.users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT chk_membership_status
        CHECK (
            status IN (
                'pending',
                'active',
                'inactive',
                'suspended'
            )
        )
);

CREATE INDEX idx_org_membership_organization_id ON organization.organization_membership (organization_id);
CREATE INDEX idx_org_membership_user_id ON organization.organization_membership (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_single_owner_per_org
ON organization.organization_membership (organization_id)
WHERE is_owner = TRUE;

CREATE TABLE IF NOT EXISTS auth.permission_policy(
    policy_document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- FIX: UNIQUE added — one current policy document per membership,
    -- matching the data.data.policy_document.permissions read shape
    membership_id UUID NOT NULL UNIQUE,
    permission_version INTEGER DEFAULT 1,
    policy_document JSONB DEFAULT '{}'::JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    created_by UUID,
    updated_by UUID,

    CONSTRAINT fk_membership_id
        FOREIGN KEY(membership_id)
        REFERENCES organization.organization_membership(organization_membership_id)
        ON DELETE CASCADE,

     CONSTRAINT fk_permission_document_created_by
        FOREIGN KEY (created_by)
        REFERENCES auth.users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_permission_document_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES auth.users(user_id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS organization.organization_invitation (

    organization_invitation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,

    email CITEXT NOT NULL,

    token_hash TEXT NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'pending',

    expires_at TIMESTAMPTZ NOT NULL,

    accepted_at TIMESTAMPTZ,

    invited_by UUID NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_invitation_org
        FOREIGN KEY (organization_id)
        REFERENCES organization.organization(organization_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_invited_by
        FOREIGN KEY (invited_by)
        REFERENCES auth.users(user_id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_org_invitation_organization_id ON organization.organization_invitation (organization_id);
CREATE INDEX idx_org_invitation_token_hash ON organization.organization_invitation (token_hash);

-- {
--   "version": 3,
--   "permissions": {
--     "user:create": true,
--     "user:read": true,
--     "user:update": true,
--     "user:delete": false,

--     "organization:create": false,
--     "organization:read": true,

--     "seller:create": true,
--     "seller:update": true,
--     "seller:delete": false
--   }
-- }