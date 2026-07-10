const express = require('express');
const controller = require('../controllers/ticketController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES, ALL_ROLES } = require('../config/roles');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorize(...ALL_ROLES), controller.getTickets)
  .post(authorize(...ALL_ROLES), controller.createTicket);

router.put(
  '/:id/assign',
  authorize(ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.IT_ADMIN),
  controller.assignTicket
);
router.post('/:id/comments', authorize(...ALL_ROLES), controller.addComment);

router
  .route('/:id')
  .get(authorize(...ALL_ROLES), controller.getTicket)
  .put(authorize(...ALL_ROLES), controller.updateTicket)
  .delete(authorize(ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.IT_ADMIN), controller.deleteTicket);

module.exports = router;
