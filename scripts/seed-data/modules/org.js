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
  // FIX: fail fast and clearly if required env vars are missing, instead
  // of bcrypt throwing an opaque error on `undefined`.
  const requiredEnv = [
    'ROOT_ACCOUNT_NAME',
    'ROOT_ACCOUNT_EMAIL',
    'ROOT_ACCOUNT_PASSWORD',
    'ROOT_ACCOUNT_JWT_SECRET',
  ];
  const missingEnv = requiredEnv.filter((key) => !process.env[key]);
  if (missingEnv.length) {
    throw new Error(`Missing required env vars: ${missingEnv.join(', ')}`);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const getPortalAdminDataQuery = {
      name: 'get-admin-portal-data',
      text: `SELECT portal_id FROM ${TABLE_SCHEMA?.PORTAL} WHERE slug='admin'`,
    };

    const adminPortalRes = await client.query(getPortalAdminDataQuery);
    const adminPortalId = adminPortalRes?.rows[0]?.portal_id;

    // FIX: fail with a clear message instead of inserting null portal_id
    if (!adminPortalId) {
      throw new Error(
        "Admin portal not found (slug='admin'). Run the portal seed before this script.",
      );
    }

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

      // FIX: removed the premature COMMIT here — the user/membership/policy
      // inserts below must be part of the SAME transaction as the org
      // insert. Committing here made everything after it un-rollback-able.
    }

    const password_hash = await bcrypt.hash(
      process.env.ROOT_ACCOUNT_PASSWORD,
      HASHED_SALT,
    );

    // FIX: idempotent upsert on email, so re-running the seed doesn't
    // blow up on a duplicate-key error. DO UPDATE (rather than DO
    // NOTHING) keeps RETURNING working on conflict too.
    const query = {
      name: 'seed-root-user-data',
      text: `INSERT INTO ${TABLE_SCHEMA.ADMIN_AUTH} (name, email, password_hash, jwt_secret)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (email)
             DO UPDATE SET name = EXCLUDED.name
             RETURNING user_id`,
      values: [
        process.env.ROOT_ACCOUNT_NAME,
        process.env.ROOT_ACCOUNT_EMAIL,
        password_hash,
        process.env.ROOT_ACCOUNT_JWT_SECRET,
      ],
    };

    const userRes = await client.query(query);
    const userId = userRes?.rows[0]?.user_id;

    // FIX: idempotent upsert on (organization_id, user_id), and explicitly
    // set activated_at since the schema no longer defaults it to NOW() —
    // this membership is created directly as active, so activated_at
    // must be stamped or the row is left inconsistent (active but never
    // "activated").
    const insertRootUserMembershipQuery = {
      name: 'insert-root-user-membership',
      text: `INSERT INTO ${TABLE_SCHEMA?.ORG_MEMBERSHIP}
             (user_id, organization_id, is_owner, status, activated_at)
             VALUES ($1, $2, $3, 'active', NOW())
             ON CONFLICT (organization_id, user_id)
             DO UPDATE SET is_owner = EXCLUDED.is_owner
             RETURNING organization_membership_id`,
      values: [userId, orgId, true],
    };

    const membershipRes = await client.query(insertRootUserMembershipQuery);
    const membershipId = membershipRes?.rows[0]?.organization_membership_id;

    const fetchRootResourcePermissionQuery = {
      name: 'fetch-root-resource-permission',
      text: `SELECT slug FROM ${TABLE_SCHEMA?.MODULES_RESOURCE_PERMISSION}`,
    };

    const res = await client.query(fetchRootResourcePermissionQuery);

    // Build { "<slug>": true, ... } from all known permission slugs
    const permissionsObj = {};
    for (const row of res?.rows ?? []) {
      if (row?.slug) permissionsObj[row.slug] = true;
    }

    const policyDocument = {
      permission_version: 1,
      permissions: permissionsObj,
    };

    // FIX: idempotent upsert on membership_id (now UNIQUE per the schema
    // fix), so re-running doesn't hit a duplicate-key error.
    const insertRootUserPolicyQuery = {
      name: 'insert-root-user-policy',
      text: `INSERT INTO ${TABLE_SCHEMA?.PERMISSION_POLICY} (membership_id, policy_document)
             VALUES ($1, $2::jsonb)
             ON CONFLICT (membership_id)
             DO UPDATE SET policy_document = EXCLUDED.policy_document,
                           updated_at = NOW()
             RETURNING policy_document_id`,
      values: [membershipId, JSON.stringify(policyDocument)],
    };

    await client.query(insertRootUserPolicyQuery);

    // FIX: single COMMIT at the very end, once every step has succeeded.
    await client.query('COMMIT');

    console.log('Root org/user/membership/policy seeded successfully.');
    console.log('USER ID : ', userId);
    console.log('ORG ID  : ', orgId);
  } catch (error) {
    // FIX: actually roll back on failure.
    await client.query('ROLLBACK');
    console.error('Error seeding root org data : ', error);
    // FIX: rethrow so the caller / process knows this failed.
    throw error;
  } finally {
    client.release();
  }
};

// FIX: surface failure as a non-zero exit code, and close the pool
// (only appropriate if this pool is exclusive to this seed script).
seedRootOrg()
  .then(() => pool.end())
  .catch(async () => {
    await pool.end();
    process.exitCode = 1;
  });
