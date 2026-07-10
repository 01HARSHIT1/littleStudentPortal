const express = require('express');
const controller = require('../controllers/documentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES, ALL_ROLES } = require('../config/roles');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect);

const writeRoles = [
  ROLES.SUPER_ADMIN,
  ROLES.ORG_ADMIN,
  ROLES.HR_MANAGER,
  ROLES.MANAGER,
  ROLES.IT_ADMIN,
];

router
  .route('/')
  .get(authorize(...ALL_ROLES), controller.getDocuments)
  .post(authorize(...writeRoles), upload.single('file'), controller.createDocument);

router
  .route('/:id')
  .get(authorize(...ALL_ROLES), controller.getDocument)
  .put(authorize(...writeRoles), controller.updateDocument)
  .delete(authorize(...writeRoles), controller.deleteDocument);

module.exports = router;
