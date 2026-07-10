const express = require('express');
const controller = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES, ALL_ROLES } = require('../config/roles');

const router = express.Router();

router.use(protect);

router.get('/', authorize(...ALL_ROLES), controller.getNotifications);
router.put('/read-all', authorize(...ALL_ROLES), controller.markAllRead);
router.put('/:id/read', authorize(...ALL_ROLES), controller.markRead);
router.delete('/:id', authorize(...ALL_ROLES), controller.deleteNotification);
router.post(
  '/send',
  authorize(ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.HR_MANAGER, ROLES.IT_ADMIN),
  controller.sendNotification
);

module.exports = router;
