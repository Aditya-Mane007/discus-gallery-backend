const { HASHED_SALT, TABLE_SCHEMA } = require('../../../../utils/constant.js');
const { pool } = require('../../../../config/db.js');
const bcrypt = require('bcrypt');
// Portal Data
const portalData = [
  {
    name: 'Admin Portal',
    slug: 'admin',
    description: 'Admin Portal',
    is_active: true,
  },
  {
    name: 'Retail Portal',
    slug: 'retail',
    description: 'Retail Portal',
    is_active: true,
  },
  {
    name: 'Seller Portal',
    slug: 'seller',
    description: 'Seller Portal',
    is_active: true,
  },
];

const seedPortalData = async (name, slug, description) => {
  try {
    const query = {
      name: 'seed-portal-data',
      text: `INSERT INTO ${TABLE_SCHEMA.ADMIN_PORTAL} (name, slug, description) VALUES ($1, $2, $3) ON CONFLICT (slug) DO NOTHING`,
      values: [name, slug, description],
    };

    const result = await pool.query(query);

    return result;
  } catch (error) {
    console.log('Error Seeding Portal Data : ', error);
  }
};

const getPortalIdBySlug = async (slug) => {
  const query = {
    name: 'get-portal-id_by-slug',
    text: `SELECT * FROM ${TABLE_SCHEMA.ADMIN_PORTAL} WHERE slug=$1`,
    values: [slug],
  };
  const result = await pool.query(query);

  return result;
};

const seedRootUserData = async (
  name,
  email,
  password_hash,
  jwt_secret,
  is_root,
) => {
  try {
    const portal = 'admin'; // single quotes for text string and double quotes for column and table string
    const adminPortaRes = await getPortalIdBySlug(portal);
    const query = {
      name: 'seed-root-user-data',
      text: `INSERT INTO ${TABLE_SCHEMA.ADMIN_AUTH} (name, email, password_hash,portal_id, jwt_secret,is_root) VALUES ($1, $2, $3, $4, $5, $6)`,
      values: [
        name,
        email,
        password_hash,
        adminPortaRes?.rows[0]?.portal_id,
        jwt_secret,
        is_root,
      ],
    };

    const result = await pool.query(query);

    return result;
  } catch (error) {
    console.log('Error Seeding Root User Data : ', error);
  }
};

// seedPortalData("Discus Gallery Root Account", "adityamane27023@gmail.com",password_hash,process.env.ROOT_ACCOUNT_JWT_SECRET,true);

const authSeedData = async () => {
  const password_hash = await bcrypt.hash(
    process.env.ROOT_ACCOUNT_PASSWORD,
    HASHED_SALT,
  );
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const portalDataRes = portalData.forEach((portal) => {
      seedPortalData(portal.name, portal.slug, portal.description);
    });
    seedRootUserData(
      'Discus Gallery',
      'adityamane27023@gmail.com',
      password_hash,
      process.env.ROOT_ACCOUNT_JWT_SECRET,
      true,
    );

    await client.query('COMMIT');
    console.log('Auth Seed Data Seeded Successfully');
  } catch (error) {
    console.log('Error Seeding Auth Data : ', error);
    await client.query('ROLLBACK');
  } finally {
    client.release();
  }
};

authSeedData();
