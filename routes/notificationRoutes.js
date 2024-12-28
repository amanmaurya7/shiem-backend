const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
} = require('../controllers/notificationController');

const router = express.Router();

router.route('/').get(protect, getNotifications);
router.route('/:id/read').put(protect, markNotificationAsRead);
router.route('/:id').delete(protect, deleteNotification);

module.exports = router;

