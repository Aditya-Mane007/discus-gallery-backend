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
          },
          {
            name: 'Read User',
            slug: 'user:read',
            action: 'read',
            description: 'View user details',
          },
          {
            name: 'Update User',
            slug: 'user:update',
            action: 'update',
            description: 'Update user details',
          },
          {
            name: 'Delete User',
            slug: 'user:delete',
            action: 'delete',
            description: 'Delete user',
          },
          {
            name: 'Activate User',
            slug: 'user:activate',
            action: 'activate',
            description: 'Activate user',
          },
          {
            name: 'Deactivate User',
            slug: 'user:deactivate',
            action: 'deactivate',
            description: 'Deactivate user',
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
          },
          {
            name: 'Read Membership',
            slug: 'membership:read',
            action: 'read',
            description: 'View memberships',
          },
          {
            name: 'Update Membership',
            slug: 'membership:update',
            action: 'update',
            description: 'Update membership',
          },
          {
            name: 'Delete Membership',
            slug: 'membership:delete',
            action: 'delete',
            description: 'Remove user from organization',
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
          },
          {
            name: 'Revoke Session',
            slug: 'session:revoke',
            action: 'revoke',
            description: 'Revoke a user session',
          },
          {
            name: 'Revoke All Sessions',
            slug: 'session:revoke-all',
            action: 'revoke-all',
            description: 'Revoke all sessions',
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
          },
          {
            name: 'Read Organization',
            slug: 'organization:read',
            action: 'read',
            description: 'View organization',
          },
          {
            name: 'Update Organization',
            slug: 'organization:update',
            action: 'update',
            description: 'Update organization',
          },
          {
            name: 'Delete Organization',
            slug: 'organization:delete',
            action: 'delete',
            description: 'Delete organization',
          },
          {
            name: 'Suspend Organization',
            slug: 'organization:suspend',
            action: 'suspend',
            description: 'Suspend organization',
          },
          {
            name: 'Activate Organization',
            slug: 'organization:activate',
            action: 'activate',
            description: 'Activate organization',
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
          },
          {
            name: 'View Invitations',
            slug: 'invitation:read',
            action: 'read',
            description: 'View invitations',
          },
          {
            name: 'Resend Invitation',
            slug: 'invitation:resend',
            action: 'resend',
            description: 'Resend invitation',
          },
          {
            name: 'Cancel Invitation',
            slug: 'invitation:cancel',
            action: 'cancel',
            description: 'Cancel invitation',
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
          },
          {
            name: 'Read Role',
            slug: 'role:read',
            action: 'read',
            description: 'View role',
          },
          {
            name: 'Update Role',
            slug: 'role:update',
            action: 'update',
            description: 'Update role',
          },
          {
            name: 'Delete Role',
            slug: 'role:delete',
            action: 'delete',
            description: 'Delete role',
          },
          {
            name: 'Assign Role',
            slug: 'role:assign',
            action: 'assign',
            description: 'Assign role to membership',
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
          },
          {
            name: 'Read Role Group',
            slug: 'role-group:read',
            action: 'read',
            description: 'View role groups',
          },
          {
            name: 'Update Role Group',
            slug: 'role-group:update',
            action: 'update',
            description: 'Update role group',
          },
          {
            name: 'Delete Role Group',
            slug: 'role-group:delete',
            action: 'delete',
            description: 'Delete role group',
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
          },
          {
            name: 'Read Policy',
            slug: 'policy:read',
            action: 'read',
            description: 'View policy',
          },
          {
            name: 'Update Policy',
            slug: 'policy:update',
            action: 'update',
            description: 'Update policy',
          },
          {
            name: 'Delete Policy',
            slug: 'policy:delete',
            action: 'delete',
            description: 'Delete policy',
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
          },
          {
            name: 'Read User Group',
            slug: 'user-group:read',
            action: 'read',
            description: 'View user groups',
          },
          {
            name: 'Update User Group',
            slug: 'user-group:update',
            action: 'update',
            description: 'Update user group',
          },
          {
            name: 'Delete User Group',
            slug: 'user-group:delete',
            action: 'delete',
            description: 'Delete user group',
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

    const adminPortalId = await client.query(getPortalAdminDataQuery);
    for (moduelesData of module_resource_seed_data) {
      const module = moduelesData?.module;
      const insertModuelData = {
        name: 'insert-module-data',
        text: `INSERT INTO ${TABLE_SCHEMA?.MODULES_MODULE} 
                (portal_id,name,slug,description,icon,display_order,is_system,is_active) 
                VALUES($1,$2,$3,$4,$5,$6,$7,$8)  
                ON CONFLICT (slug)
                DO UPDATE SET
                   name=EXCLUDED.name
                   description=EXCLUDED.description
                
                RETURNING module_id
        `,
        VALUES: [
          adminPortalId,
          module?.name,
          module?.slug,
          module?.description,
          module?.icon,
          module?.display_order,
          module?.is_system,
          module?.is_active,
        ],
      };

      const resources = moduelesData?.module?.resources;

      const moduleId = insertModuelData;

      for (const resource of resources) {
        const insertResourcelData = {
          name: 'insert-module-data',
          text: `INSERT INTO ${TABLE_SCHEMA?.MODULES_RESOURCE} 
                (module_id,portal_id,name,slug,description,icon,display_order,is_system,is_active) 
                VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)  
                ON CONFLICT (slug)
                DO UPDATE SET
                   name=EXCLUDED.name
                   description=EXCLUDED.description
                
                RETURNING resource_id
        `,
          VALUES: [
            moduleId,
            adminPortalId,
            resource?.name,
            resource?.slug,
            resource?.description,
            resource?.icon,
            resource?.display_order,
            resource?.is_system,
            resource?.is_active,
          ],
        };

        const resourceId = insertResourcelData;

        const resourcePermissionData =
          moduelesData?.module?.resources?.permissions;
      }

      const insertResourcePermission = {
        name: 'insert-resoruce-permission-data',
        text: `INSERT INTO ${TABLE_SCHEMA?.MODULES_RESOURCE_PERMISSION}
                (resource_id,name,slug,action,description,is_system,is_active)
                VALUES($1,$2,$3,$4,$5,$6,$7)
                ON CONFLIT (slug)
                DO UPDATE SET
                   name=EXCLUDED.name
                   description=EXCLUDED.description
        `,
        values: [
          resource_id,
          name,
          slug,
          action,
          description,
          is_system,
          is_active,
        ],
      };
    }

    await client.query('COMMIT');
  } catch (error) {
    console.log('ERROR SEEDING MODULES DATA : ', error);
    await client.query('ROLLBACK');
  } finally {
    await client.release();
  }
};
