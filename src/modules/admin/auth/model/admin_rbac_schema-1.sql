-- PostgreSQL RBAC schema (v2)
-- Includes:
-- - safer naming (admin.users instead of admin.user)
-- - normalized role/permission joins
-- - user-specific permission overrides
-- - constraints, indexes, and sensible delete rules

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE SCHEMA IF NOT EXISTS admin;

-- =========================
-- USERS
-- =========================
CREATE TABLE IF NOT EXISTS admin.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email CITEXT NOT NULL UNIQUE,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  permission_version INTEGER NOT NULL DEFAULT 1,
  jwt_secret_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- USER SESSIONS
-- =========================
CREATE TABLE IF NOT EXISTS admin.user_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  device TEXT NOT NULL,
  ip INET,
  refresh_token_hash TEXT NOT NULL,
  revoked_status BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_user_sessions_user_id
    FOREIGN KEY (user_id)
    REFERENCES admin.users (id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id
  ON admin.user_sessions (user_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_active_revoked
  ON admin.user_sessions (is_active, revoked_status);

-- =========================
-- ROLES
-- =========================
CREATE TABLE IF NOT EXISTS admin.roles (
  role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_code TEXT NOT NULL UNIQUE,
  role_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- MODULES
-- =========================
  CREATE TABLE IF NOT EXISTS admin.modules (
    module_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_code TEXT NOT NULL UNIQUE,
    module_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

-- =========================
-- MODULE PERMISSIONS
-- =========================
CREATE TABLE IF NOT EXISTS admin.module_permissions (
  module_permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL,
  module_permission_code TEXT NOT NULL UNIQUE,
  module_permission_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_module_permissions_module_id
    FOREIGN KEY (module_id)
    REFERENCES admin.modules (module_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_module_permissions_module_id
  ON admin.module_permissions (module_id);

-- =========================
-- USER <-> ROLE (many-to-many)
-- =========================
CREATE TABLE IF NOT EXISTS admin.user_roles (
  user_role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role_id UUID NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID,
  CONSTRAINT fk_user_roles_user_id
    FOREIGN KEY (user_id)
    REFERENCES admin.users (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_role_id
    FOREIGN KEY (role_id)
    REFERENCES admin.roles (role_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_assigned_by
    FOREIGN KEY (assigned_by)
    REFERENCES admin.users (id)
    ON DELETE SET NULL,
  CONSTRAINT uq_user_roles_user_role UNIQUE (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id
  ON admin.user_roles (user_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_role_id
  ON admin.user_roles (role_id);

-- =========================
-- ROLE <-> MODULE_PERMISSION (many-to-many)
-- =========================
CREATE TABLE IF NOT EXISTS admin.role_permissions (
  role_permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL,
  module_permission_id UUID NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  granted_by UUID,
  CONSTRAINT fk_role_permissions_role_id
    FOREIGN KEY (role_id)
    REFERENCES admin.roles (role_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_role_permissions_module_permission_id
    FOREIGN KEY (module_permission_id)
    REFERENCES admin.module_permissions (module_permission_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_role_permissions_granted_by
    FOREIGN KEY (granted_by)
    REFERENCES admin.users (id)
    ON DELETE SET NULL,
  CONSTRAINT uq_role_permissions_role_permission UNIQUE (role_id, module_permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id
  ON admin.role_permissions (role_id);

CREATE INDEX IF NOT EXISTS idx_role_permissions_module_permission_id
  ON admin.role_permissions (module_permission_id);

-- =========================
-- USER PERMISSION OVERRIDES
-- =========================
CREATE TABLE IF NOT EXISTS admin.user_permissions (
  user_permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  module_permission_id UUID NOT NULL,
  is_allowed BOOLEAN NOT NULL,
  reason TEXT,
  granted_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_user_permissions_user_id
    FOREIGN KEY (user_id)
    REFERENCES admin.users (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_user_permissions_module_permission_id
    FOREIGN KEY (module_permission_id)
    REFERENCES admin.module_permissions (module_permission_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_user_permissions_granted_by
    FOREIGN KEY (granted_by)
    REFERENCES admin.users (id)
    ON DELETE SET NULL,
  CONSTRAINT uq_user_permissions_user_permission UNIQUE (user_id, module_permission_id)
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id
  ON admin.user_permissions (user_id);

CREATE INDEX IF NOT EXISTS idx_user_permissions_module_permission_id
  ON admin.user_permissions (module_permission_id);
