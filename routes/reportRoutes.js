const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getTaskReports,
  getTeamMemberReports,
  exportReport,
} = require('../controllers/reportController');

const router = express.Router();

router.route('/').get(protect, admin, getTaskReports);
router.route('/team-performance').get(protect, admin, getTeamMemberReports);
router.route('/export').get(protect, admin, exportReport);

module.exports = router;

