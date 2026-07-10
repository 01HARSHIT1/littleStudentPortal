const express = require('express');
const controller = require('../controllers/designationController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES, ALL_ROLES } = require('../config/roles');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorize(...ALL_ROLES), controller.getDesignations)
  .post(
    authorize(ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.HR_MANAGER),
    controller.createDesignation
  );

router
  .route('/:id')
  .get(authorize(...ALL_ROLES), controller.getDesignation)
  .put(
    authorize(ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.HR_MANAGER),
    controller.updateDesignation
  )
  .delete(
    authorize(ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.HR_MANAGER),
    controller.deleteDesignation
  );

module.exports = router;
