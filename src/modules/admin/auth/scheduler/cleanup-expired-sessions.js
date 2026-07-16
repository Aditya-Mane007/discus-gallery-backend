const cron = require('node-cron');
const { cleanupExpiredUserSessions } = require('../repository.js');

// UPDATE EXPIRED USER SESSION CRON
export const registerAuthJobs = () => {
  cron.schedule(
    '0 0 0 * * *',
    async () => {
      try {
        console.log('Starting expired session cleanup...');

        await cleanupExpiredUserSessions();

        console.log('Expired session cleanup completed.');
      } catch (error) {
        console.error('Expired session cleanup failed:', error);
      }
    },
    {
      timezone: 'Asia/Kolkata',
    },
  );
};
