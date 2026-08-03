const { pool } = require('../../../src/config/db');
const { TABLE_SCHEMA } = require('../../../src/utils/constant');

const portalData = [
  {
    name: 'Admin Portal',
    slug: 'admin',
    description: 'Admin Portal',
    is_active: true,
    is_system: true,
  },
  {
    name: 'Retail Portal',
    slug: 'retail',
    description: 'Retail Portal',
    is_active: true,
    is_system: true,
  },
  {
    name: 'Seller Portal',
    slug: 'seller',
    description: 'Seller Portal',
    is_active: true,
    is_system: true,
  },
];

const seedPortalData = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const portal of portalData) {
      const { name, slug, description, is_active, is_system } = portal;
      const query = {
        name: 'seed-portal-data',
        text: `INSERT INTO ${TABLE_SCHEMA?.PORTAL}
                (name,slug,description,is_active,is_system) VALUES($1,$2,$3,$4,$5)
                ON CONFLICT(slug)
                DO UPDATE SET
                   name=EXCLUDED.name,
                   description=EXCLUDED.description
          `,
        values: [name, slug, description, is_active, is_system],
      };
      await client.query(query);
    }

    await client.query('COMMIT');
  } catch (error) {
    console.log('ERROR SEEDING PORTAL DATA : ', error);
  } finally {
    client.release();
  }
};

seedPortalData();
