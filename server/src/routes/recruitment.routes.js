const express = require('express');
const controller = require('../controllers/recruitmentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');

const router = express.Router();

router.use(protect);

const readRoles = [
  ROLES.SUPER_ADMIN,
  ROLES.ORG_ADMIN,
  ROLES.HR_MANAGER,
  ROLES.MANAGER,
  ROLES.AUDITOR,
];
const writeRoles = [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.HR_MANAGER];

router
  .route('/')
  .get(authorize(...readRoles), controller.getCandidates)
  .post(authorize(...writeRoles), controller.createCandidate);

router.post('/:id/interviews', authorize(...writeRoles), controller.addInterview);
router.post('/:id/analyze', authorize(...writeRoles), controller.analyzeCandidate);

router
  .route('/:id')
  .get(authorize(...readRoles), controller.getCandidate)
  .put(authorize(...writeRoles), controller.updateCandidate)
  .delete(authorize(...writeRoles), controller.deleteCandidate);

module.exports = router;
