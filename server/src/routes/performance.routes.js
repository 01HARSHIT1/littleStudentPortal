const express = require('express');
const controller = require('../controllers/performanceController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES, ALL_ROLES } = require('../config/roles');

const router = express.Router();

router.use(protect);

const writeRoles = [
  ROLES.SUPER_ADMIN,
  ROLES.ORG_ADMIN,
  ROLES.HR_MANAGER,
  ROLES.MANAGER,
  ROLES.TEAM_LEAD,
  ROLES.EMPLOYEE,
];

router
  .route('/')
  .get(authorize(...ALL_ROLES), controller.getPerformances)
  .post(authorize(...writeRoles), controller.createPerformance);

router
  .route('/:id')
  .get(authorize(...ALL_ROLES), controller.getPerformance)
  .put(authorize(...writeRoles), controller.updatePerformance)
  .delete(
    authorize(ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.HR_MANAGER),
    controller.deletePerformance
  );

module.exports = router;
