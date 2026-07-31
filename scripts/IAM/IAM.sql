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


CREATE SCHEMA IF NOT EXISTS modules;

CREATE TABLE modules.module (
    module_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    portal_id UUID NOT NULL,

    name CITEXT NOT NULL,
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
        REFERENCES admin.users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_module_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES admin.users(user_id)
        ON DELETE SET NULL
);


CREATE TABLE modules.resource (
    resource_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    module_id UUID NOT NULL,

    name CITEXT NOT NULL,
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
        REFERENCES admin.users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_resource_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES admin.users(user_id)
        ON DELETE SET NULL
);


CREATE TABLE modules.resource_permission (
    resource_permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    resource_id UUID NOT NULL,

    name CITEXT NOT NULL,
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
        REFERENCES admin.users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_resource_permission_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES admin.users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT chk_resource_permission_action
       CHECK (length(trim(action::text)) > 0),

    CONSTRAINT chk_module_slug
       CHECK (length(trim(slug::text)) > 0)
);