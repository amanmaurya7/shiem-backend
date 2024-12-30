const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTasksByTeamMember,
  getTasksSummary,
  getRecentTasks,
} = require('../controllers/taskController');
const asyncHandler = require('../middleware/asyncHandler');
const mongoose = require('mongoose');

const router = express.Router();

router.route('/')
  .post(protect, createTask)  // Make sure createTask is defined and exported from taskController
  .get(protect, getAllTasks);

router.route('/team/:id').get(protect, getTasksByTeamMember);
router.route('/summary').get(protect, admin, getTasksSummary);
router.route('/recent').get(protect, getRecentTasks);

router.route('/:id')
  .get(protect, getTaskById)
  .put(protect, updateTask)
  .delete(protect, deleteTask);

module.exports = router;

