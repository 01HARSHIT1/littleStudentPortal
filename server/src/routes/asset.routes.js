const express = require('express');
const controller = require('../controllers/assetController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES, ALL_ROLES } = require('../config/roles');

const router = express.Router();

router.use(protect);

const writeRoles = [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.IT_ADMIN, ROLES.HR_MANAGER];

router
  .route('/')
  .get(authorize(...ALL_ROLES), controller.getAssets)
  .post(authorize(...writeRoles), controller.createAsset);

router.put('/:id/assign', authorize(...writeRoles), controller.assignAsset);

router
  .route('/:id')
  .get(authorize(...ALL_ROLES), controller.getAsset)
  .put(authorize(...writeRoles), controller.updateAsset)
  .delete(authorize(...writeRoles), controller.deleteAsset);

module.exports = router;
