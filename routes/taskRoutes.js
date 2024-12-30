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
const asyncHandler = require('express-async-handler');

const router = express.Router();

router.route('/')
  .post(protect, createTask)
  .get(protect, getAllTasks);

router.route('/team/:id').get(protect, getTasksByTeamMember);
router.route('/summary').get(protect, admin, getTasksSummary);
router.route('/recent').get(protect, getRecentTasks);

router.route('/:id')
  .get(protect, asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id).populate('assignedTo', 'name email');
    if (task) {
      res.json(task);
    } else {
      res.status(404);
      throw new Error('Task not found');
    }
  }))
  .put(protect, updateTask)
  .delete(protect, deleteTask);

module.exports = router;

