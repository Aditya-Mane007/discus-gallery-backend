const { pool } = require('../../../config/db.js');
const { TABLE_SCHEMA } = require('../../../utils/constant');
const { getTableMetaData } = require('../../../utils/utils.js');

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

// SELECT id, name, price, category
// FROM products
// ORDER BY category ASC, price DESC
// LIMIT 5 OFFSET 0;

// const getModuleList = async (limit, offset, orderBy) => {
//   const client = await pool.connect();
//   // 1. Sanitize/validate dynamic identifiers since they can't be parameterized ($3)
//   const allowedColumns = ['module_id', 'name', 'portal_id', 'is_active']; // Add your valid columns here
//   const formattedOrderBy =
//     (allowedColumns.includes(orderBy) ?? 'module_id') ? orderBy : 'module_id';

//   try {
//     await client.query('BEGIN');
//     const query = {
//       name: 'get-module-list',
//       text: `SELECT
//               name,
//               portal_id,
//               description,
//               is_system,
//               is_active,
//               COUNT(*) AS total_count,
//               (COUNT(*) > ($2 + $1)) AS has_next_page

//             FROM ${TABLE_SCHEMA?.MODULES_MODULE}
//             ORDER BY ${formattedOrderBy}
//             LIMIT $1 OFFSET $2;

//       `,
//       values: [limit, offset], // Removed formattedOrderBy from here
//     };

//     // Because there are two queries, result will be an array: [result1, result2]
//     const results = await client.query(query);

//     console.log('RESULTS : ', results?.rows[0]);

//     // // 2. Extract only the clean row data instead of returning the raw pg result
//     // const modules = results[0].rows[];
//     // const meta = results[1].rows[0];

//     await client.query('COMMIT');
//     return true;
//     // return {
//     //   modules,
//     //   totalCount: parseInt(meta.total_count, 10),
//     //   hasNextPage: meta.has_next_page,
//     // };
//   } catch (error) {
//     console.error('Error : ', error);
//     throw error; // Rethrow so your controller layer knows the request failed
//   } finally {
//     await client.release();
//   }
// };

const getModuleList = async (limit, offset, orderBy, searchText) => {
  const client = await pool.connect();

  const allowedColumns = ['module_id', 'name', 'portal_id', 'is_active'];

  const formattedOrderBy = orderBy ?? 'module_id';

  const formatedSearchtext = searchText ?? '';

  try {
    await client.query('BEGIN');
    const query = {
      text: `
        SELECT 
          module_id,
          name,
          portal_id,
          description,
          is_system,
          is_active,
          COUNT(*) OVER() AS total_records        
        FROM ${TABLE_SCHEMA.MODULES_MODULE}
        WHERE name ILIKE '%${formatedSearchtext}%' OR "description" ILIKE '%${formatedSearchtext}%'
        ORDER BY ${formattedOrderBy}
        LIMIT $1 OFFSET $2;
        `,
      values: [limit, offset],
    };

    const result = await client.query(query);

    await client.query('COMMIT');

    const totalRecords =
      result?.rows?.length > 0 ? Number(result?.rows[0]?.total_records) : 0;
    const rowCount = result?.rowCount;

    return {
      data: result?.rows ?? [],
      meta: {
        ...getTableMetaData(offset, rowCount, totalRecords),
      },
    };
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  fetchRootUser,
  seedModuleData,
  seedResoucreData,
  seedResourcePermissionData,
  getModuleList,
};
