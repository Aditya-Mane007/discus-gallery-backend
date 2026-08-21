const { pool } = require('../../../src/config/db');
const { TABLE_SCHEMA } = require('../../../src/utils/constant');

const module_resource_seed_data = [
  {
    module: {
      name: 'User Management',
      slug: 'user-management',
      description: 'Manage users and their access',
      icon: 'users',
      display_order: 1,
      is_system: true,
      is_active: true,
    },

    resources: [
      {
        name: 'User',
        slug: 'user',
        description: 'Manage users',
        display_order: 1,
        is_system: true,
        is_active: true,

        permissions: [
          {
            name: 'Create User',
            slug: 'user:create',
            action: 'create',
            description: 'Create a new user',
            is_system: true,
            is_active: true,
          },
          {
            name: 'Read User',
            slug: 'user:read',
            action: 'read',
            description: 'View user details',
            is_system: true,
            is_active: true,
          },
          {
            name: 'Update User',
            slug: 'user:update',
            action: 'update',
            description: 'Update user details',
            is_system: true,
            is_active: true,
          },
          {
            name: 'Delete User',
            slug: 'user:delete',
            action: 'delete',
            description: 'Delete user',
            is_system: true,
            is_active: true,
          },
          {
            name: 'Activate User',
            slug: 'user:activate',
            action: 'activate',
            description: 'Activate user',
            is_system: true,
            is_active: true,
          },
          {
            name: 'Deactivate User',
            slug: 'user:deactivate',
            action: 'deactivate',
            description: 'Deactivate user',
            is_system: true,
            is_active: true,
          },
        ],
      },

      {
        name: 'Membership',
        slug: 'membership',
        description: 'Manage organization memberships',
        display_order: 2,
        is_system: true,
        is_active: true,

        permissions: [
          {
            name: 'Create Membership',
            slug: 'membership:create',
            action: 'create',
            description: 'Add user to organization',
            is_system: true,
            is_active: true,
          },
          {
            name: 'Read Membership',
            slug: 'membership:read',
            action: 'read',
            description: 'View memberships',
            is_system: true,
            is_active: true,
          },
          {
            name: 'Update Membership',
            slug: 'membership:update',
            action: 'update',
            description: 'Update membership',
            is_system: true,
            is_active: true,
          },
          {
            name: 'Delete Membership',
            slug: 'membership:delete',
            action: 'delete',
            description: 'Remove user from organization',
            is_system: true,
            is_active: true,
          },
        ],
      },

      {
        name: 'Session',
        slug: 'session',
        description: 'Manage user sessions',
        display_order: 3,
        is_system: true,
        is_active: true,

        permissions: [
          {
            name: 'View Sessions',
            slug: 'session:read',
            action: 'read',
            description: 'View user sessions',
            is_system: true,
            is_active: true,
          },
          {
            name: 'Revoke Session',
            slug: 'session:revoke',
            action: 'revoke',
            description: 'Revoke a user session',
            is_system: true,
            is_active: true,
          },
          {
            name: 'Revoke All Sessions',
            slug: 'session:revoke-all',
            action: 'revoke-all',
            description: 'Revoke all sessions',
            is_system: true,
            is_active: true,
          },
        ],
      },
    ],
  },

  {
    module: {
      name: 'Organization Management',
      slug: 'organization-management',
      description: 'Manage organizations',
      icon: 'building',
      display_order: 2,
      is_system: true,
      is_active: true,
    },

    resources: [
      {
        name: 'Organization',
        slug: 'organization',
        description: 'Manage organizations',
        display_order: 1,
        is_system: true,
        is_active: true,

        permissions: [
          {
            name: 'Create Organization',
            slug: 'organization:create',
            action: 'create',
            description: 'Create organization',
            is_system: true,
            is_active: true,
          },
          {
            name: 'Read Organization',
            slug: 'organization:read',
            action: 'read',
            description: 'View organization',
            is_system: true,
            is_active: true,
          },
          {
            name: 'Update Organization',
            slug: 'organization:update',
            action: 'update',
            description: 'Update organization',
            is_system: true,
            is_active: true,
          },
          {
            name: 'Delete Organization',
            slug: 'organization:delete',
            action: 'delete',
            description: 'Delete organization',
            is_system: true,
            is_active: true,
          },
          {
            name: 'Suspend Organization',
            slug: 'organization:suspend',
            action: 'suspend',
            description: 'Suspend organization',
            is_system: true,
            is_active: true,
          },
          {
            name: 'Activate Organization',
            slug: 'organization:activate',
            action: 'activate',
            description: 'Activate organization',
            is_system: true,
            is_active: true,
          },
        ],
      },

      {
        name: 'Invitation',
        slug: 'invitation',
        description: 'Manage organization invitations',
        display_order: 2,
        is_system: true,
        is_active: true,

        permissions: [
          {
            name: 'Invite User',
            slug: 'invitation:create',
            action: 'create',
            description: 'Invite user to organization',
            is_system: true,
            is_active: true,
          },
          {
            name: 'View Invitations',
            slug: 'invitation:read',
            action: 'read',
            description: 'View invitations',
            is_system: true,
            is_active: true,
          },
          {
            name: 'Resend Invitation',
            slug: 'invitation:resend',
            action: 'resend',
            description: 'Resend invitation',
            is_system: true,
            is_active: true,
          },
          {
            name: 'Cancel Invitation',
            slug: 'invitation:cancel',
            action: 'cancel',
            description: 'Cancel invitation',
            is_system: true,
            is_active: true,
          },
        ],
      },
    ],
  },

  {
    module: {
      name: 'Role & Permission Management',
      slug: 'role-management',
      description: 'Manage roles and permissions',
      icon: 'shield',
      display_order: 3,
      is_system: true,
      is_active: true,
    },

    resources: [
      {
        name: 'Role',
        slug: 'role',
        description: 'Manage roles',
        display_order: 1,
        is_system: true,
        is_active: true,

        permissions: [
          {
            name: 'Create Role',
            slug: 'role:create',
            action: 'create',
            description: 'Create role',
            is_system: true,
            is_active: true,
          },
          {
            name: 'Read Role',
            slug: 'role:read',
            action: 'read',
            description: 'View role',
            is_system: true,
            is_active: true,
          },
          {
            name: 'Update Role',
            slug: 'role:update',
            action: 'update',
            description: 'Update role',
            is_system: true,
            is_active: true,
          },
          {
            name: 'Delete Role',
            slug: 'role:delete',
            action: 'delete',
            description: 'Delete role',
            is_system: true,
            is_active: true,
          },
          {
            name: 'Assign Role',
            slug: 'role:assign',
            action: 'assign',
            description: 'Assign role to membership',
            is_system: true,
            is_active: true,
          },
        ],
      },

      {
        name: 'Role Group',
        slug: 'role-group',
        description: 'Manage role groups',
        display_order: 2,
        is_system: true,
        is_active: true,

        permissions: [
          {
            name: 'Create Role Group',
            slug: 'role-group:create',
            action: 'create',
            description: 'Create role group',
            is_system: true,
            is_active: true,
          },
          {
            name: 'Read Role Group',
            slug: 'role-group:read',
            action: 'read',
            description: 'View role groups',
            is_system: true,
            is_active: true,
          },
          {
            name: 'Update Role Group',
            slug: 'role-group:update',
            action: 'update',
            description: 'Update role group',
            is_system: true,
            is_active: true,
          },
          {
            name: 'Delete Role Group',
            slug: 'role-group:delete',
            action: 'delete',
            description: 'Delete role group',
            is_system: true,
            is_active: true,
          },
        ],
      },

      {
        name: 'Policy',
        slug: 'policy',
        description: 'Manage policies',
        display_order: 3,
        is_system: true,
        is_active: true,

        permissions: [
          {
            name: 'Create Policy',
            slug: 'policy:create',
            action: 'create',
            description: 'Create policy',
            is_system: true,
            is_active: true,
          },
          {
            name: 'Read Policy',
            slug: 'policy:read',
            action: 'read',
            description: 'View policy',
            is_system: true,
            is_active: true,
          },
          {
            name: 'Update Policy',
            slug: 'policy:update',
            action: 'update',
            description: 'Update policy',
            is_system: true,
            is_active: true,
          },
          {
            name: 'Delete Policy',
            slug: 'policy:delete',
            action: 'delete',
            description: 'Delete policy',
            is_system: true,
            is_active: true,
          },
        ],
      },

      {
        name: 'User Group',
        slug: 'user-group',
        description: 'Manage user groups',
        display_order: 4,
        is_system: true,
        is_active: true,

        permissions: [
          {
            name: 'Create User Group',
            slug: 'user-group:create',
            action: 'create',
            description: 'Create user group',
            is_system: true,
            is_active: true,
          },
          {
            name: 'Read User Group',
            slug: 'user-group:read',
            action: 'read',
            description: 'View user groups',
            is_system: true,
            is_active: true,
          },
          {
            name: 'Update User Group',
            slug: 'user-group:update',
            action: 'update',
            description: 'Update user group',
            is_system: true,
            is_active: true,
          },
          {
            name: 'Delete User Group',
            slug: 'user-group:delete',
            action: 'delete',
            description: 'Delete user group',
            is_system: true,
            is_active: true,
          },
        ],
      },
    ],
  },
];

const seedModuleResourceData = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const getPortalAdminDataQuery = {
      name: 'get-admin-portal-data',
      text: `SELECT portal_id FROM ${TABLE_SCHEMA?.PORTAL} WHERE slug='admin'`,
    };

    const adminPortalRes = await client.query(getPortalAdminDataQuery);

    const adminPortalId = adminPortalRes?.rows[0]?.portal_id;

    // FIX: fail fast with a clear message instead of letting portal_id
    // go through as null and surface as an opaque FK-violation error.
    if (!adminPortalId) {
      throw new Error(
        "Admin portal not found (slug='admin'). Run the portal seed before this script.",
      );
    }

    // FIX: added missing `const` — was an implicit global before.
    for (const moduleData of module_resource_seed_data) {
      const module = moduleData?.module;

      const insertModuleData = {
        name: 'insert-module-data',
        text: `INSERT INTO ${TABLE_SCHEMA?.MODULES_MODULE} 
                (portal_id,name,slug,description,icon,display_order,is_system,is_active) 
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
                -- FIX: conflict target now matches the composite unique
                -- constraint (portal_id, slug) — a bare (slug) target no
                -- longer exists on this table.
                ON CONFLICT (portal_id, slug)
                DO UPDATE SET
                   name=EXCLUDED.name,
                   description=EXCLUDED.description

                RETURNING module_id;
        `,
        values: [
          adminPortalId, // $1 (uuid)
          module?.name || '', // $2 (public.citext)
          module?.slug || '', // $3 (public.citext)
          module?.description || null, // $4 (text NULL)
          module?.icon || null, // $5 (character varying)
          Number(module?.display_order) || 0, // $6 (smallint)
          Boolean(module?.is_system), // $7 (boolean)
          Boolean(module?.is_active),
        ],
      };

      const moduleDataRes = await client.query(insertModuleData);

      const resources = moduleData?.resources;

      const moduleId = moduleDataRes?.rows[0]?.module_id;

      for (const resource of resources) {
        const insertResourceData = {
          name: 'insert-resource-data',
          text: `INSERT INTO ${TABLE_SCHEMA?.MODULES_RESOURCE} 
                (module_id,name,slug,description,display_order,is_system,is_active) 
                VALUES($1,$2,$3,$4,$5,$6,$7)  
                -- FIX: conflict target matches (module_id, slug)
                ON CONFLICT (module_id, slug)
                DO UPDATE SET
                   name=EXCLUDED.name,
                   description=EXCLUDED.description
                
                RETURNING resource_id;
        `,
          values: [
            moduleId,
            resource?.name,
            resource?.slug,
            resource?.description,
            resource?.display_order,
            resource?.is_system,
            resource?.is_active,
          ],
        };

        const resourceDataRes = await client.query(insertResourceData);

        const resourceId = resourceDataRes?.rows[0]?.resource_id;

        const resourcePermissionData = resource?.permissions;

        for (const permission of resourcePermissionData) {
          const { name, slug, action, description, is_system, is_active } =
            permission;
          const insertResourcePermission = {
            name: 'insert-resource-permission-data',
            text: `INSERT INTO ${TABLE_SCHEMA?.MODULES_RESOURCE_PERMISSION}
                    (resource_id,name,slug,action,description,is_system,is_active)
                    VALUES($1,$2,$3,$4,$5,$6,$7)
                    -- FIX: conflict target matches (resource_id, slug)
                    ON CONFLICT (resource_id, slug)
                    DO UPDATE SET
                       name=EXCLUDED.name,
                       description=EXCLUDED.description;
            `,
            values: [
              resourceId,
              name,
              slug,
              action,
              description,
              is_system,
              is_active,
            ],
          };

          await client.query(insertResourcePermission);
        }
      }
    }

    await client.query('COMMIT');
    console.log('Module/resource/permission data seeded successfully.');
  } catch (error) {
    // FIX: rollback before logging isn't required, but rethrow so the
    // caller / process knows this failed.
    await client.query('ROLLBACK');
    console.error('ERROR SEEDING MODULES DATA : ', error);
    throw error;
  } finally {
    client.release();
  }
};

// FIX: surface failure as a non-zero exit code, and close the pool
// (only appropriate if this pool is exclusive to this seed script).
seedModuleResourceData()
  .then(() => pool.end())
  .catch(async () => {
    await pool.end();
    process.exitCode = 1;
  });
