const Task = require('../models/Task');
const User = require('../models/User'); // Import User model
const asyncHandler = require('../middleware/asyncHandler');
const mongoose = require('mongoose');

exports.createTask = asyncHandler(async (req, res) => {
  const { title, description, status, priority, dueDate, assignedTo } = req.body;

  try {
    const assignedToUser = await User.findById(assignedTo); // Find assigned user

    if (!assignedToUser) {
      return res.status(404).json({ message: 'Assigned user not found' });
    }

    const task = new Task({
      title,
      description,
      status,
      priority,
      dueDate,
      assignedTo: req.body.assignedTo, // Directly assign the _id
      createdBy: req.user._id,
    });

    const createdTask = await task.save();
    res.status(201).json(createdTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

exports.getAllTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find({}).populate('assignedTo', 'name email');
  res.json(tasks);
});

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

exports.updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid task ID');
  }

  const task = await Task.findById(id);

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  const {
    title,
    description,
    status,
    priority,
    dueDate,
    assignedTo,
    category,
    progress
  } = req.body;

  // Update all fields
  if (title) task.title = title;
  if (description) task.description = description;
  if (status) task.status = status;
  if (priority) task.priority = priority;
  if (dueDate) task.dueDate = new Date(dueDate);
  if (assignedTo) {
    const user = await User.findById(assignedTo);
    if (!user) {
      res.status(400);
      throw new Error('Invalid user ID for assignedTo');
    }
    task.assignedTo = assignedTo;
  }
  if (category) task.category = category;
  if (progress !== undefined) task.progress = progress;

  try {
    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    res.status(400);
    throw new Error('Error updating task: ' + error.message);
  }
});

exports.deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid task ID');
  }

  const task = await Task.findById(id);

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  await Task.deleteOne({ _id: id });
  res.json({ message: 'Task removed' });
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

exports.getRecentTasks = asyncHandler(async (req, res) => {
  const recentTasks = await Task.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('assignedTo', 'name');

  res.json(recentTasks);
});