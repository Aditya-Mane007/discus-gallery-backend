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

const generatePermissionPolicy = async (membershipId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const allowedPermissionQuery = {
      name: 'allowed-permission-query',
      text: `SELECT 
              membership.organization_id,
              membership.user_id,
              membership.organization_membership_id,
              resourcePermission.name,
              resourcePermission.slug
              resourcePermission.description
              resourcePermission.action

            FROM ${TABLE_SCHEMA?.ORG_MEMBERSHIP} membership
            LEFT JOIN ${TABLE_SCHEMA?.ORG_MEMBERSHIP_ROLE} member_role
            ON membership.organization_membership_id = member_role.organization_membership_id
            LEFT JOIN ${TABLE_SCHEMA?.ORGANIZATION_ROLE} role
            ON member_role.role_id = role.role_id
            LEFT JOIN ${TABLE_SCHEMA?.ORGANIZATION_ROLE_PERMISSION} role_permission
            ON role.role_id = role_permission.role_id
            LEFT JOIN ${TABLE_SCHEMA?.MODULES_RESOURCE_PERMISSION} resourcePermission
            ON role_permission.resource_permission_id = resourcePermission.resource_permission_id
            WHERE membership.user_id = $1
          
            UNION
          
            SELECT 
              membership.organization_id,
              membership.user_id,
              membership.organization_membership_id,
              resourcePermission.name,
              resourcePermission.slug,
              resourcePermission.description,
              resourcePermission.action
            FROM ${TABLE_SCHEMA?.ORG_MEMBERSHIP} membership
            LEFT JOIN ${TABLE_SCHEMA?.ORG_MEMBERSHIP_ROLE_GROUP} member_role_group
            ON membership.organization_membership_id = member_role_group.organization_membership_id
            LEFT JOIN ${TABLE_SCHEMA?.ORGANIZATION_ROLE_GROUP} role_group
            ON member_role_group.role_group_id = role_group.role_group_id
            LEFT JOIN ${TABLE_SCHEMA?.ORGANIZATION_ROLE_GROUP_PERMISSION} role_group_permission
            ON role_group.role_group_id = role_group_permission.role_group_id
            LEFT JOIN ${TABLE_SCHEMA?.MODULES_RESOURCE_PERMISSION} resourcePermission
            ON role_group_permission.resource_permission_id = resourcePermission.resource_permission_id
            WHERE membership.user_id = $1

            UNION

            SELECT 
              membership.organization_id,
              membership.user_id,
              membership.organization_membership_id,
              resourcePermission.name,
              resourcePermission.slug,
              resourcePermission.description,
              resourcePermission.action
            FROM ${TABLE_SCHEMA?.ORG_MEMBERSHIP} membership
            LEFT JOIN ${TABLE_SCHEMA?.ORG_MEMBERSHIP_USER_GROUP} member_user_group
            ON membership.organization_membership_id = member_user_group.organization_membership_id
            LEFT JOIN ${TABLE_SCHEMA?.ORGANIZATION_USER_GROUP} user_group
            ON member_user_group.user_group_id = user_group.user_group_id
            LEFT JOIN ${TABLE_SCHEMA?.ORGANIZATION_USER_GROUP_PERMISSION} user_group_permission
            ON user_group.user_group_id = user_group_permission.user_group_id
            LEFT JOIN ${TABLE_SCHEMA?.MODULES_RESOURCE_PERMISSION} resourcePermission
            ON user_group_permission.resource_permission_id = resourcePermission.resource_permission_id
            WHERE membership.user_id = $1;

            UNION

            SELECT 
              membership.organization_id,
              membership.user_id,
              membership.organization_membership_id,
              resourcePermission.name,
              resourcePermission.slug,
              resourcePermission.description,
              resourcePermission.action
            FROM ${TABLE_SCHEMA?.ORG_MEMBERSHIP} membership
            LEFT JOIN ${TABLE_SCHEMA?.MEMBERSHIP_PERMISSION} membership_permission
            ON membership.organization_membership_id = membership_permission.organization_membership_id
            LEFT JOIN ${TABLE_SCHEMA?.MODULES_RESOURCE_PERMISSION} resourcePermission
            ON membership_permission.resource_permission_id = resourcePermission.resource_permission_id
            WHERE membership.user_id = $1;
          `,
      values: [membershipId],
    };

    const deniedPermissionQuery = {
      name: 'denied-permission-query',
      text: `SELECT 
              membership.organization_id,
              membership.user_id,
              membership.organization_membership_id,
              resourcePermission.name,
              resourcePermission.slug
              resourcePermission.description
              resourcePermission.action
            FROM ${TABLE_SCHEMA?.ORG_MEMBERSHIP} membership
            LEFT JOIN ${TABLE_SCHEMA?.ORG_DENIED_MEMBERSHIP} denied_permission
            ON membership.organization_membership_id = denied_permission.organization_membership_id
            LEFT JOIN ${TABLE_SCHEMA?.MODULES_RESOURCE_PERMISSION} resourcePermission
            ON denied_permission.resource_permission_id = resourcePermission.resource_permission_id
            WHERE membership.user_id = $1; 
      `,
      values: [membershipId],
    };

    const allowedPermission = (await pool.query(allowedPermissionQuery)).rows;
    const deniedPermission = (await pool.query(deniedPermissionQuery)).rows;

    const allowedPermissionObjet = {};

    if (allowedPermission.length > 0) {
      for (let i = 0; i < allowedPermission.length; i++) {
        const slug = allowedPermission[i].slug;
        allowedPermissionObjet[slug] = true;
      }
    }

    if (deniedPermission.length > 0) {
      for (let i = 0; i < deniedPermission.length; i++) {
        if (deniedPermission[i].slug in allowedPermission) {
          delete allowedPermissionObjet[deniedPermission[i].slug];
        }
      }
    }

    return allowedPermissionObjet;
  } catch (error) {
    console.log('Error Fetching Permission : ', error);
  } finally {
    await client.release();
  }
};

module.exports = {
  getPermissionsQuery,
  generatePermissionPolicy,
};
