const Task = require('../models/Task');
const asyncHandler = require('../middleware/asyncHandler');
const mongoose = require('mongoose');

exports.getTaskById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid task ID');
  }

  const task = await Task.findById(id).populate('assignedTo', 'name email');

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  res.json(task);
});

exports.getTasksByTeamMember = asyncHandler(async (req, res) => {
  const teamMemberId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(teamMemberId)) {
    res.status(400);
    throw new Error('Invalid team member ID');
  }

  const tasks = await Task.find({ assignedTo: teamMemberId }).populate('assignedTo', 'name email');

  if (!tasks) {
    res.status(404);
    throw new Error('No tasks found for this team member');
  }

  res.json(tasks);
});

// Get task summary
exports.getTasksSummary = asyncHandler(async (req, res) => {
  const summary = await Task.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const overdueTasks = await Task.countDocuments({
    dueDate: { $lt: new Date() },
    status: { $ne: 'Completed' },
  });

  res.json({
    summary: summary.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {}),
    overdueTasks,
  });
});

// Get recent tasks
exports.getRecentTasks = asyncHandler(async (req, res) => {
  const recentTasks = await Task.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('assignedTo', 'name');

  res.json(recentTasks);
});

module.exports = exports;

