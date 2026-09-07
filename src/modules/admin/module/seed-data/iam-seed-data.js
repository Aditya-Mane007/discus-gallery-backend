const { pool } = require('../../../../config/db');
const { TABLE_SCHEMA } = require('../../../../utils/constant');
const {
  seedModuleData,
  seedResoucreData,
  fetchRootUser,
  seedResourcePermissionData,
} = require('../repository');

const iamData = [
  {
    module: {
      name: 'User Management',
      slug: 'user-management',
      description: 'Manage users',
    },

    resources: [
      {
        name: 'User',
        slug: 'user',
        description: 'Manage users',

        permissions: [
          {
            name: 'Create User',
            slug: 'user:create',
            action: 'create',
            description: 'Allows creating a new user',
          },
          {
            name: 'Read User',
            slug: 'user:read',
            action: 'read',
            description: 'Allows viewing user information',
          },
          {
            name: 'Update User',
            slug: 'user:update',
            action: 'update',
            description: 'Allows updating user information',
          },
          {
            name: 'Delete User',
            slug: 'user:delete',
            action: 'delete',
            description: 'Allows deleting a user',
          },
          {
            name: 'Activate User',
            slug: 'user:activate',
            action: 'activate',
            description: 'Allows activating a user',
          },
          {
            name: 'Deactivate User',
            slug: 'user:deactivate',
            action: 'deactivate',
            description: 'Allows deactivating a user',
          },
        ],
      },

      {
        name: 'User Group',
        slug: 'user-group',
        description: 'Manage user groups',

        permissions: [
          {
            name: 'Create User Group',
            slug: 'user-group:create',
            action: 'create',
            description: 'Allows creating a user group',
          },
          {
            name: 'Read User Group',
            slug: 'user-group:read',
            action: 'read',
            description: 'Allows viewing user groups',
          },
          {
            name: 'Update User Group',
            slug: 'user-group:update',
            action: 'update',
            description: 'Allows updating a user group',
          },
          {
            name: 'Delete User Group',
            slug: 'user-group:delete',
            action: 'delete',
            description: 'Allows deleting a user group',
          },
        ],
      },

      {
        name: 'Session',
        slug: 'session',
        description: 'Manage user sessions',

        permissions: [
          {
            name: 'Read Session',
            slug: 'session:read',
            action: 'read',
            description: 'Allows viewing user sessions',
          },
          {
            name: 'Revoke Session',
            slug: 'session:revoke',
            action: 'revoke',
            description: 'Allows revoking a user session',
          },
          {
            name: 'Revoke All Sessions',
            slug: 'session:revoke-all',
            action: 'revoke-all',
            description: 'Allows revoking all active sessions of a user',
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
    },

    resources: [
      {
        name: 'Organization',
        slug: 'organization',
        description: 'Manage organizations',

        permissions: [
          {
            name: 'Create Organization',
            slug: 'organization:create',
            action: 'create',
            description: 'Allows creating an organization',
          },
          {
            name: 'Read Organization',
            slug: 'organization:read',
            action: 'read',
            description: 'Allows viewing organization information',
          },
          {
            name: 'Update Organization',
            slug: 'organization:update',
            action: 'update',
            description: 'Allows updating organization information',
          },
          {
            name: 'Delete Organization',
            slug: 'organization:delete',
            action: 'delete',
            description: 'Allows deleting an organization',
          },
          {
            name: 'Suspend Organization',
            slug: 'organization:suspend',
            action: 'suspend',
            description: 'Allows suspending an organization',
          },
          {
            name: 'Activate Organization',
            slug: 'organization:activate',
            action: 'activate',
            description: 'Allows activating an organization',
          },
        ],
      },
    ],
  },

  {
    module: {
      name: 'Role Management',
      slug: 'role-management',
      description: 'Manage roles',
    },

    resources: [
      {
        name: 'Role',
        slug: 'role',
        description: 'Manage roles',

        permissions: [
          {
            name: 'Create Role',
            slug: 'role:create',
            action: 'create',
            description: 'Allows creating a role',
          },
          {
            name: 'Read Role',
            slug: 'role:read',
            action: 'read',
            description: 'Allows viewing roles',
          },
          {
            name: 'Update Role',
            slug: 'role:update',
            action: 'update',
            description: 'Allows updating a role',
          },
          {
            name: 'Delete Role',
            slug: 'role:delete',
            action: 'delete',
            description: 'Allows deleting a role',
          },
          {
            name: 'Assign Role',
            slug: 'role:assign',
            action: 'assign',
            description: 'Allows assigning a role to a user',
          },
        ],
      },
    ],
  },
];

const seedIAM = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userId = await fetchRootUser(client);

    for (const data of iamData) {
      const { name, slug, description } = data?.module;

      const moduleRes = await seedModuleData(
        client,
        name,
        slug,
        description,
        userId,
      );

      const moduleId = moduleRes;

      const resource = data?.resources;

      for (const resourceData of resource) {
        const resourceId = await seedResoucreData(
          client,
          resourceData?.name,
          resourceData?.slug,
          resourceData?.description,
          moduleId,
          userId,
        );

        const resourcePermission = resourceData?.permissions;

        for (const permissionData of resourcePermission) {
          const { name, slug, action, description } = permissionData;
          await seedResourcePermissionData(
            client,
            name,
            slug,
            action,
            description,
            resourceId,
            userId,
          );
        }
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    console.log('ERROR SEEDING IAM DATA : ', error);
  } finally {
    client.release();
  }
};

seedIAM();
