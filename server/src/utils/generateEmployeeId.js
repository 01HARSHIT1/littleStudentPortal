const Employee = require('../models/Employee');

const generateEmployeeId = async (organizationId) => {
  const filter = organizationId ? { organization: organizationId } : {};
  const count = await Employee.countDocuments(filter);
  const next = count + 1;
  return `EMP${String(next).padStart(4, '0')}`;
};

module.exports = generateEmployeeId;
