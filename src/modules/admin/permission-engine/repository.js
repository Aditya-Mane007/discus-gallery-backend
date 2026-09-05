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

const getUserPermissions = async (membershipId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const query = {
      name: 'genrate-permission-policy',
      text: `SELECT 
  membership.organization_id,
  membership.user_id,
  membership.organization_membership_id,
  role.name,
  role.slug
FROM organization.organization_membership membership
LEFT JOIN organization.membership_role member_role
ON membership.organization_membership_id = member_role.organization_membership_id
LEFT JOIN organization.role
ON member_role.role_id = role.role_id;

SELECT 
  membership.organization_id,
  membership.user_id,
  membership.organization_membership_id,
  role_group.name,
  role_group.slug
FROM organization.organization_membership membership
LEFT JOIN organization.membership_role_group member_role_group
ON membership.organization_membership_id = member_role_group.organization_membership_id
LEFT JOIN organization.role_group role_group
ON member_role_group.role_group_id = role_group.role_group_id

WHERE membership.user_id = '1606abf5-12dc-49fa-af0e-d39f914a5482';


SELECT 
  membership.organization_id,
  membership.user_id,
  membership.organization_membership_id,
  user_group.name,
  user_group.slug
FROM organization.organization_membership membership
LEFT JOIN organization.membership_user_group member_user_group
ON membership.organization_membership_id = member_user_group.organization_membership_id
LEFT JOIN organization.user_group user_group
ON member_user_group.user_group_id = user_group.user_group_id

WHERE membership.user_id = '1606abf5-12dc-49fa-af0e-d39f914a5482'

      `,
    };
  } catch (error) {
    console.log('Error Fetching Permission : ', error);
  } finally {
    await client.release();
  }
};

module.exports = {
  getPermissionsQuery,
};
