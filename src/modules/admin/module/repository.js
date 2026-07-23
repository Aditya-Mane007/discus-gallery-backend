const { pool } = require('../../../config/db');
const { TABLE_SCHEMA } = require('../../../utils/constant');

const fetchRootUser = () => {
    try {
        const query = {
            name : "fetch-root-user-id",
            query : `SELECT user_id FORM ${TABLE_SCHEMA?.ADMIN_AUTH} WHERE email=${process.env.ROOT_ACCOUNT_EMAIL} AND is_root=TRUE`
        }
        const result = await  pool.query(query)

        return result?.rows[0]?.user_id
    } catch (error) {
        console.log(error)
    }
}

const seedModuleData = (name, slug, description,user_id) => {
  try {
    const moduleDataQuery = {
      name: 'seed-module-data',
      text: `
      INSERT INTO ${TABLE_SCHEMA?.MODULES_MODULE}
      (name, slug, description,created_by,updated_by)
      VALUES ($1,$2,$3,$4,$4)
      ON CONFLICT (slug)
      DO UPDATE SET
        name=EXCLUDED.name
        description=EXCLUDED.description
      RETURNING module_id
      `,
      values: [name, slug, description,user_id],
    };

    const moduleDataQueryRes = await pool.query(moduleDataQuery);

    return moduleDataQueryRes.rows[0]?.module_id

  } catch (error) {
    console.log(error);
  }
};

const seedResoucreData = (name,slug,description,module_id,user_id) => {
    try {
        const query = {
            name : "seed-resource-data",
            text : `INSERT INTO ${TABLE_SCHEMA?.MODULES_RESOURCE}
            (name,slug,description,module_id,created_by,updated_by) 
            VALUES($1,$2,$3,$4,$5,$5)
            ON CONFLICT (module_id,slug)
            DO UPDATE SET
               name=EXCLUDED.name,
               description=EXCLUDED.description
            RETURNING resource_id
            `,
            values : [name,slug,description,module_id,user_id]
        }
        const result = await pool.query(query)

        return result.rows[0].resource_id
    } catch (error) {
        console.log(error)
    }
}

const seedResourcePermissionData = async(name,slug,description,resource_id,user_id) =>{
try {
        const query = {
            name : "seed-resource-permission-data",
            text : `INSERT INTO ${TABLE_SCHEMA?.MODULES_RESOURCE_PERMISSION}
            (name,slug,description,resource_id,created_by,updated_by) 
            VALUES($1,$2,$3,$4,$5,%5)
            ON CONFLICT (resource_id,slug)
            DO UPDATE SET
               name=EXCLUDED.name,
               description=EXCLUDED.description
            RETURNING resource_permission_id
            `,
            values : [name,slug,description,resource_id,user_id]
        }
        const result = await pool.query(query)

        return result.rows[0].resource_id
    } catch (error) {
        console.log(error)
    }
}


module.exports = {
    fetchRootUser,
    seedModuleData,
    seedResoucreData,
    seedResourcePermissionData
}