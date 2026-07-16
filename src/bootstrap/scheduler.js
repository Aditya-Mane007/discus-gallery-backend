const {
  registerAuthJobs,
} = require('../modules/admin/auth/scheduler/cleanup-expired-sessions.js');

//  # ┌────────────── second (optional)
//  # │ ┌──────────── minute
//  # │ │ ┌────────── hour
//  # │ │ │ ┌──────── day of month
//  # │ │ │ │ ┌────── month
//  # │ │ │ │ │ ┌──── day of week
//  # │ │ │ │ │ │
//  # * * * * * *

const startSchedulers = () => {
  registerAuthJobs();
};

module.exports = {
  startSchedulers,
};
