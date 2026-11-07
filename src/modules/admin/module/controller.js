const asyncHandler = require('express-async-handler');
const { getModuleList } = require('./repository.js');

// Get Module List
const getAllModuleList = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      message: 'Unauthorized access',
    });
  }

  console.log('REQ PARAMS : ', req);

  const limit = Number(req?.query?.limit ?? 10);
  const offset = Number(req?.query?.offset ?? 0);
  const orderBy = req?.query?.order_by ?? null;
  const q = req.query?.q ?? '';

  const moduleList = await getModuleList(limit, offset, orderBy, q);

  return res.status(200).json({
    ...moduleList,
    message: 'Get Module List',
  });
});

module.exports = {
  getAllModuleList,
};
