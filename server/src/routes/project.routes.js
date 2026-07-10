const express = require('express');
const controller = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES, ALL_ROLES } = require('../config/roles');

const router = express.Router();

router.use(protect);

const projectWrite = [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.MANAGER, ROLES.TEAM_LEAD];
const taskWrite = [
  ROLES.SUPER_ADMIN,
  ROLES.ORG_ADMIN,
  ROLES.MANAGER,
  ROLES.TEAM_LEAD,
  ROLES.EMPLOYEE,
];

router
  .route('/')
  .get(authorize(...ALL_ROLES), controller.getProjects)
  .post(authorize(...projectWrite), controller.createProject);

router
  .route('/tasks')
  .get(authorize(...ALL_ROLES), controller.getTasks)
  .post(authorize(...taskWrite), controller.createTask);

router
  .route('/tasks/:id')
  .get(authorize(...ALL_ROLES), controller.getTask)
  .put(authorize(...taskWrite), controller.updateTask)
  .delete(authorize(...projectWrite), controller.deleteTask);

router.post('/tasks/:id/comments', authorize(...taskWrite), controller.addTaskComment);

router
  .route('/:id')
  .get(authorize(...ALL_ROLES), controller.getProject)
  .put(authorize(...projectWrite), controller.updateProject)
  .delete(authorize(...projectWrite), controller.deleteProject);

module.exports = router;
