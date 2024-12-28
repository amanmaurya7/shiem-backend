const Task = require('../models/Task');
const asyncHandler = require('../middleware/asyncHandler');

exports.createTask = asyncHandler(async (req, res) => {
  const { title, description, status, priority, dueDate, assignedTo, category } = req.body;

  const task = await Task.create({
    title,
    description,
    status,
    priority,
    dueDate,
    assignedTo,
    category,
    createdBy: req.user._id,
  });

  res.status(201).json(task);
});

exports.getAllTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find({}).populate('assignedTo', 'name email');
  res.json(tasks);
});

exports.getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id).populate('assignedTo', 'name email');

  if (task) {
    res.json(task);
  } else {
    res.status(404);
    throw new Error('Task not found');
  }
});

exports.updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (task) {
    task.title = req.body.title || task.title;
    task.description = req.body.description || task.description;
    task.status = req.body.status || task.status;
    task.priority = req.body.priority || task.priority;
    task.dueDate = req.body.dueDate || task.dueDate;
    task.assignedTo = req.body.assignedTo || task.assignedTo;
    task.category = req.body.category || task.category;
    task.progress = req.body.progress || task.progress;

    const updatedTask = await task.save();
    res.json(updatedTask);
  } else {
    res.status(404);
    throw new Error('Task not found');
  }
});

exports.deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (task) {
    await task.remove();
    res.json({ message: 'Task removed' });
  } else {
    res.status(404);
    throw new Error('Task not found');
  }
});

exports.getTasksByUser = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ assignedTo: req.user._id }).populate('assignedTo', 'name email');
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

