const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getTaskReports,
  getTeamMemberReports,
  exportReport,
  getProductivityReport
} = require('../controllers/reportController');

const router = express.Router();

router.get('/tasks', protect, admin, getTaskReports);
router.get('/team-members', protect, admin, getTeamMemberReports);
router.get('/export', protect, admin, exportReport);
router.get('/productivity', protect, admin, getProductivityReport);

module.exports = router;

