const express = require('express');
const controller = require('../controllers/departmentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES, ALL_ROLES } = require('../config/roles');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorize(...ALL_ROLES), controller.getDepartments)
  .post(
    authorize(ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.HR_MANAGER),
    controller.createDepartment
  );

router
  .route('/:id')
  .get(authorize(...ALL_ROLES), controller.getDepartment)
  .put(
    authorize(ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.HR_MANAGER),
    controller.updateDepartment
  )
  .delete(
    authorize(ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.HR_MANAGER),
    controller.deleteDepartment
  );

module.exports = router;
