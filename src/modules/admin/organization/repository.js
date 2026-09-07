const { pool } = require('../../../config/db.js');
const { TABLE_SCHEMA } = require('../../../utils/constant.js');

const checkmembership = async (membership_id) => {
  const client = await pool.connect();

  try {
    client.query('BEGIN');

    const query = {
      name: 'check-membership-is-valid-or-not',
      text: `SELECT * FROM ${TABLE_SCHEMA?.ORG_MEMBERSHIP} m WHERE organization_membership_id = $1 
      `,
      values: [membership_id],
    };

    const result = await client.query(query);
    client.query('COMMIT');
    return result?.rowCount > 0 ?? false;
  } catch (error) {
    console.log('Error : ', error);
  } finally {
    client.release();
  }
};

module.exports = {
  checkmembership,
};
