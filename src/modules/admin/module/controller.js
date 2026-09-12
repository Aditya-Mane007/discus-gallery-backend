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

  //   console.log('REQ BODY : ', req);

  const limit = req?.body?.limit ?? 10;
  const offset = req?.body?.offset ?? 0;
  const orderBy = req?.body?.order_by ?? null;

  const moduleList = await getModuleList(limit, offset, orderBy);

  return res.status(200).json({
    ...moduleList,
    message: 'Get Module List',
  });
});

module.exports = {
  getAllModuleList,
};
