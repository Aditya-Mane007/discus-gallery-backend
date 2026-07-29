CREATE SCHEMA IF NOT EXISTS modules;

CREATE TABLE IF NOT EXISTS modules.module (
    module_id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,

    name CITEXT NOT NULL,
    slug CITEXT NOT NULL UNIQUE,
    description TEXT,

    icon VARCHAR(100),
    display_order SMALLINT DEFAULT 0,

    is_system BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    created_by UUID,
    updated_by UUID,

    CONSTRAINT fk_module_created_by
        FOREIGN KEY (created_by)
        REFERENCES admin.users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_module_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES admin.users(user_id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS modules.resource (
    resource_id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,

    module_id UUID NOT NULL,

    name CITEXT NOT NULL,
    slug CITEXT NOT NULL,

    description TEXT,

    display_order SMALLINT DEFAULT 0,

    is_system BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    created_by UUID,
    updated_by UUID,

    CONSTRAINT uq_resource_slug
        UNIQUE(module_id, slug),

    CONSTRAINT fk_resource_module
        FOREIGN KEY(module_id)
        REFERENCES modules.module(module_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_resource_created_by
        FOREIGN KEY(created_by)
        REFERENCES admin.users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_resource_updated_by
        FOREIGN KEY(updated_by)
        REFERENCES admin.users(user_id)
        ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS modules.resource_permission(
    resource_permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    name CITEXT NOT NULL,
    description CITEXT NOT NULL,
    slug CITEXT NOT NULL,
    action CITEXT NOT NULL,
    resource_id UUID NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,

    CONSTRAINT uq_resource_permission
       UNIQUE(resource_id,slug,action),

    CONSTRAINT fk_resource
       FOREIGN KEY (resource_id)
       REFERENCES modules.resource(resource_id)
       ON DELETE RESTRICT,
    
    CONSTRAINT fk_created_by
       FOREIGN KEY (created_by) 
       REFERENCES admin.users(user_id)
       ON DELETE SET NULL,
    
    CONSTRAINT fk_updated_by
       FOREIGN KEY (updated_by)
       REFERENCES admin.users(user_id)
       ON DELETE SET NULL
)