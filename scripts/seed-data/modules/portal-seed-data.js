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
  if (!TABLE_SCHEMA?.PORTAL) {
    throw new Error(
      'TABLE_SCHEMA.PORTAL is not defined — check src/utils/constant',
    );
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const portal of portalData) {
      const { name, slug, description, is_active, is_system } = portal;
      const query = {
        name: 'seed-portal-data',
        text: `INSERT INTO ${TABLE_SCHEMA.PORTAL}
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
    console.log('Portal data seeded successfully.');
  } catch (error) {
    // FIX: roll back so the connection isn't returned to the pool
    // mid-transaction (which poisons the next query to reuse it)
    await client.query('ROLLBACK');
    console.error('ERROR SEEDING PORTAL DATA : ', error);
    // FIX: rethrow so the caller / process knows this failed
    throw error;
  } finally {
    client.release();
  }
};

// FIX: surface failure as a non-zero exit code, and close the pool either
// way so the process doesn't hang on open idle connections.
seedPortalData()
  .then(() => pool.end())
  .catch(async (error) => {
    await pool.end();
    process.exitCode = 1;
  });
