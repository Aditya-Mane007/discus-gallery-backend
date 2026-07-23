const { pool } = require('../../../../config/db');
const { TABLE_SCHEMA } = require('../../../../utils/constant');
const { seedModuleData, seedResoucreData } = require('../repository');

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
          'create',
          'read',
          'update',
          'delete',
          'activate',
          'deactivate',
        ],
      },

      {
        name: 'User Group',
        slug: 'user-group',
        description: 'Manage user groups',

        permissions: ['create', 'read', 'update', 'delete'],
      },

      {
        name: 'Session',
        slug: 'session',
        description: 'Manage sessions',

        permissions: ['read', 'revoke', 'revoke-all'],
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
        description: 'Organization',

        permissions: [
          'create',
          'read',
          'update',
          'delete',
          'suspend',
          'activate',
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
        description: 'Role',

        permissions: ['create', 'read', 'update', 'delete', 'assign'],
      },
    ],
  },
];

const seedIAM = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userId = await fetchRootUser();

    for (const data of iamData) {
      const { moduleName, moduleSlug, moduleDescription } = data?.module;
      const moduleRes = await seedModuleData(
        moduleName,
        moduleSlug,
        moduleDescription,
        userId,
      );

      const moduleId = moduleRes;

      const { resourceName, resourceSlug, resourceDescription } =
        data?.resources;

      const resourceRes = await seedResoucreData(
        resourceName,
        resourceSlug,
        resourceDescription,
        moduleId,
        userId,
      );

      const resourcePermission = data?.permissions;

      const resourceId = await seedResourcePermissionData();
    }

    await client.query('COMMIT');
  } catch (error) {
    console.log(error);
  }
};
