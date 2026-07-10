const express = require('express');
const controller = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ALL_ROLES } = require('../config/roles');

const router = express.Router();

router.use(protect);
router.use(authorize(...ALL_ROLES));

router.post('/chat', controller.chat);
router.post('/analyze-resume', controller.analyzeResume);
router.post('/summarize', controller.summarizeDocument);
router.post('/explain-payroll', controller.explainPayroll);
router.post('/attendance-insights', controller.attendanceInsights);

module.exports = router;
