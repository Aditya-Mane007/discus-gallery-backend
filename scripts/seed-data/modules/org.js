const { pool } = require('../../../src/config/db');
const { TABLE_SCHEMA, HASHED_SALT } = require('../../../src/utils/constant');
const bcrypt = require('bcrypt');

const org_seed_data = [
  {
    name: 'Discus Gallery',
    slug: 'discus-gallery',
    description:
      'Discus Gallery is a platform for showcasing and selling art pieces from various artists around the world.',
    email: 'adityamane27023@gmail.com',
    phone: '9326549507',
    logo_url: 'https://discusgallery.in/favicon.ico',
    is_active: true,
    is_system: true,
  },
];

const seedRootOrg = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const getPortalAdminDataQuery = {
      name: 'get-admin-portal-data',
      text: `SELECT portal_id FROM ${TABLE_SCHEMA?.PORTAL} WHERE slug='admin'`,
    };

    const adminPortalRes = await client.query(getPortalAdminDataQuery);

    const adminPortalId = adminPortalRes?.rows[0]?.portal_id;

    let orgId;

    for (const org of org_seed_data) {
      const {
        name,
        slug,
        description,
        email,
        phone,
        logo_url,
        is_system,
        is_active,
      } = org;

      const seedOrgDataQuery = {
        name: 'seed-org-data',
        text: `INSERT INTO ${TABLE_SCHEMA?.ORG} 
        (portal_id,name,slug,description,email,phone,logo_url,is_system,is_active)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT(portal_id,name,slug)
        DO UPDATE SET
           description=EXCLUDED.description
        RETURNING organization_id
        `,
        values: [
          adminPortalId,
          name,
          slug,
          description,
          email,
          phone,
          logo_url,
          is_system,
          is_active,
        ],
      };

      const orgRes = await client.query(seedOrgDataQuery);

      orgId = orgRes?.rows[0]?.organization_id;

      await client.query('COMMIT');
    }

    const password_hash = await bcrypt.hash(
      process.env.ROOT_ACCOUNT_PASSWORD,
      HASHED_SALT,
    );
    const query = {
      name: 'seed-root-user-data',
      text: `INSERT INTO ${TABLE_SCHEMA.ADMIN_AUTH} (name, email, password_hash, jwt_secret) VALUES ($1, $2, $3, $4) RETURNING user_id`,
      values: [
        process.env.ROOT_ACCOUNT_NAME,
        process.env.ROOT_ACCOUNT_EMAIL,
        password_hash,
        process.env.ROOT_ACCOUNT_JWT_SECRET,
      ],
    };

    const userRes = await client.query(query);

    const userId = userRes?.rows[0]?.user_id;

    console.log('USER ID : ', userId);
    console.log('orgId : ', orgId);

    const fetchRootResourcePermissionQuery = {
      name: 'fetch-root-resource-permission',
      text: `SELECT slug FROM ${TABLE_SCHEMA?.MODULES_RESOURCE_PERMISSION}`,
    };

    const res = await client.query(fetchRootResourcePermissionQuery);

    const perrmissionObj = {};

    const rootUserPermission = res?.rows
      .map((row) => ({ [row?.slug]: true }))
      ?.map(
        (obj) => (perrmissionObj[Object.keys(obj)] = obj[Object.keys(obj)]),
      );

    const policyDocument = {
      permission_version: 1,
      permissions: {
        ...perrmissionObj,
      },
    };

    const insertRootUserPolicyQuery = {
      name: 'insert-root-user-policy',
      text: `INSERT INTO ${TABLE_SCHEMA?.PERMISSION_POLICY} (policy_document) VALUES ($1::jsonb) RETURNING policy_document_id`,
      values: [JSON.stringify(policyDocument)],
    };

    const permissionRes = await client.query(insertRootUserPolicyQuery);

    const permissionId = permissionRes?.rows[0]?.policy_document_id;

    console.log('permissionId ID : ', permissionId);

    const insertRootUserMembershipQuery = {
      name: 'insert-root-user-membership',
      text: `INSERT INTO ${TABLE_SCHEMA?.ORG_MEMBERSHIP} (user_id, policy_document_id,organization_id,is_owner,permission_version) VALUES ($1,$2,$3,$4,$5)`,
      values: [userId, permissionId, orgId, true, 1],
    };

    await client.query(insertRootUserMembershipQuery);
  } catch (error) {
    console.log('Error seeding org data : ', error);
  } finally {
    await client.release();
  }
};

// const seedRootUserData = async (
//   client,
//   name,
//   email,
//   password_hash,
//   jwt_secret,
//   is_root,
// ) => {
//   try {
//     const query = {
//       name: 'seed-root-user-data',
//       text: `INSERT INTO ${TABLE_SCHEMA.ADMIN_AUTH} (name, email, password_hash, jwt_secret) VALUES ($1, $2, $3, $4)`,
//       values: [name, email, password_hash, jwt_secret],
//     };

//     const result = await client.query(query);

//     return result;
//   } catch (error) {
//     console.log('ERROR : SEEDING ROOT USER ', error);
//   }
// };

const seedRootuser = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const password_hash = await bcrypt.hash(
      process.env.ROOT_ACCOUNT_PASSWORD,
      HASHED_SALT,
    );
    const query = {
      name: 'seed-root-user-data',
      text: `INSERT INTO ${TABLE_SCHEMA.ADMIN_AUTH} (name, email, password_hash, jwt_secret) VALUES ($1, $2, $3, $4)`,
      values: [
        process.env.ROOT_ACCOUNT_NAME,
        process.env.ROOT_ACCOUNT_EMAIL,
        password_hash,
        process.env.ROOT_ACCOUNT_JWT_SECRET,
      ],
    };

    const result = await client.query(query);

    await client.query('COMMIT');
  } catch (error) {
    console.log('ERROR SEEDING ROOT USER ', error);
  } finally {
    await client.release();
  }
};

const seedRootUserPolicy = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const fetchRootResourcePermissionQuery = {
      name: 'fetch-root-resource-permission',
      text: `SELECT slug FROM ${TABLE_SCHEMA?.MODULES_RESOURCE_PERMISSION}`,
    };

    const res = await client.query(fetchRootResourcePermissionQuery);

    const perrmissionObj = {};

    const rootUserPermission = res?.rows
      .map((row) => ({ [row?.slug]: true }))
      ?.map(
        (obj) => (perrmissionObj[Object.keys(obj)] = obj[Object.keys(obj)]),
      );

    const policyDocument = {
      permission_version: 1,
      permissions: {
        ...perrmissionObj,
      },
    };

    const insertRootUserPolicyQuery = {
      name: 'insert-root-user-policy',
      text: `INSERT INTO ${TABLE_SCHEMA?.PERMISSION_POLICY} (policy_document) VALUES ($1::jsonb)`,
      values: [JSON.stringify(policyDocument)],
    };

    const permissionRes = await client.query(insertRootUserPolicyQuery);

    await client.query('COMMIT');
  } catch (error) {
    console.log('ERROR SEEDING ROOT USER POLICY ', error);
  } finally {
    await client.release();
  }
};

const seedRootUserMembeship = async () => {};

seedRootOrg();
// seedRootuser();

// seedRootUserPolicy();
