const express = require('express');
const controller = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES, ALL_ROLES } = require('../config/roles');

const router = express.Router();

router.use(protect);

const manageRoles = [
  ROLES.SUPER_ADMIN,
  ROLES.ORG_ADMIN,
  ROLES.HR_MANAGER,
  ROLES.MANAGER,
  ROLES.TEAM_LEAD,
];

router.get('/', authorize(...ALL_ROLES), controller.getAttendance);
router.get('/today', authorize(...ALL_ROLES), controller.getToday);
router.post('/clock-in', authorize(...ALL_ROLES), controller.clockIn);
router.post('/clock-out', authorize(...ALL_ROLES), controller.clockOut);
router.post('/correction', authorize(...ALL_ROLES), controller.requestCorrection);
router.put('/correction/:id', authorize(...manageRoles), controller.reviewCorrection);
router.post('/', authorize(...manageRoles), controller.upsertAttendance);

module.exports = router;
