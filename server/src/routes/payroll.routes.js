const express = require('express');
const controller = require('../controllers/payrollController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');

const router = express.Router();

router.use(protect);

const writeRoles = [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.FINANCE, ROLES.HR_MANAGER];
const readRoles = [
  ROLES.SUPER_ADMIN,
  ROLES.ORG_ADMIN,
  ROLES.HR_MANAGER,
  ROLES.FINANCE,
  ROLES.EMPLOYEE,
  ROLES.AUDITOR,
  ROLES.MANAGER,
  ROLES.TEAM_LEAD,
];

router.get('/preview', authorize(...writeRoles), controller.preview);
router.post('/generate', authorize(...writeRoles), controller.generate);
router.post('/generate-bulk', authorize(...writeRoles), controller.generateBulk);
router.get('/', authorize(...readRoles), controller.getPayrolls);
router.get('/:id', authorize(...readRoles), controller.getPayroll);
router.get('/:id/explain', authorize(...readRoles), controller.explain);
router.put('/:id/pay', authorize(...writeRoles), controller.markPaid);

module.exports = router;
