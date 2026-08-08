const { pool } = require('../../../config/db.js');
const { TABLE_SCHEMA } = require('../../../utils/constant');

const getPermissionsQuery = async (membershipId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const query = {
      name: 'get-user-permisions',
      text: `SELECT permission_version,policy_document_id,policy_document FROM ${TABLE_SCHEMA?.PERMISSION_POLICY} WHERE membership_id = $1`,
      values: [membershipId],
    };

    const result = await client.query(query);

    await client.query('COMMIT');

    return result?.rows?.[0];
  } catch (error) {
    console.log('Error Fetching Permission : ', error);
    return error;
  } finally {
    await client.release();
  }
};

module.exports = {
  getPermissionsQuery,
};
