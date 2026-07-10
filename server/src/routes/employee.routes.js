const express = require('express');
const controller = require('../controllers/employeeController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES, ALL_ROLES } = require('../config/roles');

const router = express.Router();

router.use(protect);

router.get('/me', authorize(...ALL_ROLES), controller.getMyEmployee);

router
  .route('/')
  .get(authorize(...ALL_ROLES), controller.getEmployees)
  .post(
    authorize(ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.HR_MANAGER),
    controller.createEmployee
  );

router
  .route('/:id')
  .get(authorize(...ALL_ROLES), controller.getEmployee)
  .put(
    authorize(ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.HR_MANAGER),
    controller.updateEmployee
  )
  .delete(
    authorize(ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.HR_MANAGER),
    controller.deleteEmployee
  );

module.exports = router;
