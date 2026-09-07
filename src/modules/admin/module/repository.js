const { pool } = require('../../../config/db');
const { TABLE_SCHEMA } = require('../../../utils/constant');

const fetchRootUser = async (client) => {
  const email = process.env.ROOT_ACCOUNT_EMAIL;

  try {
    const query = {
      name: 'fetch-root-user-id',
      text: `SELECT * FROM ${TABLE_SCHEMA?.ADMIN_AUTH} WHERE email=$1 AND is_root=TRUE`,
      values: [email],
    };
    const result = await client.query(query);

    return result?.rows[0]?.user_id;
  } catch (error) {
    console.log(error);
  }
};

const seedModuleData = async (
  client,
  name,
  slug,
  description,
  user_id,
  display_order,
) => {
  console.log('STARTED : SEEDING MODULE DATA');
  try {
    const moduleDataQuery = {
      name: 'seed-module-data',
      text: `
      INSERT INTO ${TABLE_SCHEMA?.MODULES_MODULE}
      (name, slug, description, created_by, updated_by)
      VALUES ($1,$2,$3,$4,$4)
      ON CONFLICT (slug)
      DO UPDATE SET
        name=EXCLUDED.name,
        description=EXCLUDED.description
      RETURNING module_id
      `,
      values: [name, slug, description, user_id],
    };

    const moduleDataQueryRes = await client.query(moduleDataQuery);

    console.log('COMPLETED : SEEDING MODULE DATA');

    return moduleDataQueryRes.rows[0]?.module_id;
  } catch (error) {
    console.log('ERROR SEEDING MODULE DATA', error);
  }
};

const seedResoucreData = async (
  client,
  name,
  slug,
  description,
  module_id,
  user_id,
) => {
  try {
    console.log('STARTED : SEEDING RESOURCE DATA');

    const query = {
      name: 'seed-resource-data',
      text: `INSERT INTO ${TABLE_SCHEMA?.MODULES_RESOURCE}
            (name,slug,description,module_id,created_by,updated_by) 
            VALUES($1,$2,$3,$4,$5,$5)
            ON CONFLICT (module_id,slug)
            DO UPDATE SET
               name=EXCLUDED.name,
               description=EXCLUDED.description
            RETURNING resource_id
            `,
      values: [name, slug, description, module_id, user_id],
    };
    const result = await client.query(query);

    console.log('COMPLETED : SEEDING RESOURCE DATA');

    return result.rows[0].resource_id;
  } catch (error) {
    console.log(error);
  }
};

const seedResourcePermissionData = async (
  client,
  name,
  slug,
  action,
  description,
  resource_id,
  user_id,
) => {
  try {
    console.log('STARTED : SEEDING RESOURCE PERMISSION DATA');

    const query = {
      name: 'seed-resource-permission-data',
      text: `INSERT INTO ${TABLE_SCHEMA?.MODULES_RESOURCE_PERMISSION}
            (name,slug,action,description,resource_id,created_by,updated_by) 
            VALUES($1,$2,$3,$4,$5,$6,$6)
            ON CONFLICT (resource_id,slug,action)
            DO UPDATE SET
               name=EXCLUDED.name,
               description=EXCLUDED.description,
               action=EXCLUDED.action

            RETURNING resource_permission_id
            `,
      values: [name, slug, action, description, resource_id, user_id],
    };
    const result = await client.query(query);

    console.log('COMPLETED : SEEDING RESOURCE PERMISSION DATA');

    return result.rows[0].resource_id;
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  fetchRootUser,
  seedModuleData,
  seedResoucreData,
  seedResourcePermissionData,
};
