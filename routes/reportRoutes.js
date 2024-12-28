const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getTaskReports,
  getTeamMemberReports,
  exportReport,
} = require('../controllers/reportController');

const router = express.Router();

router.route('/tasks').get(protect, admin, getTaskReports);
router.route('/team-members').get(protect, admin, getTeamMemberReports);
router.route('/export').get(protect, admin, exportReport);

module.exports = router;

