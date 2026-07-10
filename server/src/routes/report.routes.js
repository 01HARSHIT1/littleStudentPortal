const express = require('express');
const controller = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');

const router = express.Router();

router.use(protect);

const reportRoles = [
  ROLES.SUPER_ADMIN,
  ROLES.ORG_ADMIN,
  ROLES.HR_MANAGER,
  ROLES.MANAGER,
  ROLES.FINANCE,
  ROLES.AUDITOR,
  ROLES.IT_ADMIN,
];

router.get('/dashboard', authorize(...reportRoles, ROLES.TEAM_LEAD, ROLES.EMPLOYEE), controller.dashboard);
router.get('/attendance', authorize(...reportRoles), controller.attendanceReport);
router.get('/leave', authorize(...reportRoles), controller.leaveReport);
router.get('/payroll', authorize(...reportRoles, ROLES.FINANCE), controller.payrollReport);
router.get(
  '/audit',
  authorize(ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.AUDITOR),
  controller.auditReport
);

module.exports = router;
