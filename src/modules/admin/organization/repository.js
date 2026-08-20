import { pool } from '../../../config/db';
import { TABLE_SCHEMA } from '../../../utils/constant';

const getUserOrganziations = async (userId) => {
  const client = await pool.connect();
  try {
    client.query('BEGIN');

    const query = {
      name: 'get-user-info',
      text: `
        SELECT * ${TABLE_SCHEMA?.AUTH}
           u.email,
           u.name,
           u.profile_photo_url,
           u.is_active,

           om.organization_id,
           om.organization_membership_id,
           om.is_owner,
           om.status,
           om.organization_id,

           




        `,
    };

    client.query('COMMIT');
  } catch (error) {
    console.log('Error : ', error);
  } finally {
    await client.release();
  }
};
