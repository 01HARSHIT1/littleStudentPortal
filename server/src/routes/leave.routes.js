const express = require('express');
const controller = require('../controllers/leaveController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES, ALL_ROLES } = require('../config/roles');

const router = express.Router();

router.use(protect);

const approveRoles = [
  ROLES.SUPER_ADMIN,
  ROLES.ORG_ADMIN,
  ROLES.HR_MANAGER,
  ROLES.MANAGER,
  ROLES.TEAM_LEAD,
];

router.get('/balance', authorize(...ALL_ROLES), controller.getLeaveBalance);
router.get('/holidays', authorize(...ALL_ROLES), controller.getHolidays);
router.post(
  '/holidays',
  authorize(ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.HR_MANAGER),
  controller.createHoliday
);

router
  .route('/')
  .get(authorize(...ALL_ROLES), controller.getLeaves)
  .post(authorize(...ALL_ROLES), controller.applyLeave);

router.get('/:id', authorize(...ALL_ROLES), controller.getLeave);
router.put('/:id/review', authorize(...approveRoles), controller.reviewLeave);
router.put('/:id/cancel', authorize(...ALL_ROLES), controller.cancelLeave);

module.exports = router;
