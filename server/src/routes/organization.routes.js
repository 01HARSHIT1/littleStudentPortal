const express = require('express');
const controller = require('../controllers/organizationController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorize(ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.AUDITOR), controller.getOrganizations)
  .post(authorize(ROLES.SUPER_ADMIN), controller.createOrganization);

router
  .route('/:id')
  .get(authorize(ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.AUDITOR), controller.getOrganization)
  .put(authorize(ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN), controller.updateOrganization)
  .delete(authorize(ROLES.SUPER_ADMIN), controller.deleteOrganization);

module.exports = router;
