const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTasksByUser,
  getTasksSummary,
  getRecentTasks,
} = require('../controllers/taskController');

const router = express.Router();

router.route('/')
  .post(protect, createTask)
  .get(protect, getAllTasks);

router.route('/user').get(protect, getTasksByUser);
router.route('/summary').get(protect, admin, getTasksSummary);
router.route('/recent').get(protect, getRecentTasks);

router.route('/:id')
  .get(protect, getTaskById)
  .put(protect, updateTask)
  .delete(protect, deleteTask);

module.exports = router;

