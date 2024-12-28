const Task = require('../models/Task');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');

exports.getTaskReports = asyncHandler(async (req, res) => {
  const totalTasks = await Task.countDocuments();
  const completedTasks = await Task.countDocuments({ status: 'Completed' });
  const ongoingTasks = await Task.countDocuments({ status: 'In Progress' });
  const pendingTasks = await Task.countDocuments({ status: 'Pending' });
  const onHoldTasks = await Task.countDocuments({ status: 'On Hold' });
  const overdueTasks = await Task.countDocuments({
    dueDate: { $lt: new Date() },
    status: { $ne: 'Completed' }
  });

  const tasksByPriority = await Task.aggregate([
    { $group: { _id: '$priority', count: { $sum: 1 } } }
  ]);

  const tasksByCategory = await Task.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);

  res.json({
    totalTasks,
    completedTasks,
    ongoingTasks,
    pendingTasks,
    onHoldTasks,
    overdueTasks,
    tasksByPriority: tasksByPriority.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {}),
    tasksByCategory: tasksByCategory.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {})
  });
});

exports.getTeamMemberReports = asyncHandler(async (req, res) => {
  const teamMembers = await User.find({ role: 'team_member' });
  const teamPerformance = await Promise.all(teamMembers.map(async (member) => {
    const totalTasks = await Task.countDocuments({ assignedTo: member._id });
    const completedTasks = await Task.countDocuments({ assignedTo: member._id, status: 'Completed' });
    const ongoingTasks = await Task.countDocuments({ assignedTo: member._id, status: 'In Progress' });
    const overdueTasks = await Task.countDocuments({
      assignedTo: member._id,
      dueDate: { $lt: new Date() },
      status: { $ne: 'Completed' }
    });
    const performance = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    return {
      id: member._id,
      name: member.name,
      totalTasks,
      completedTasks,
      ongoingTasks,
      overdueTasks,
      performance: Math.round(performance)
    };
  }));

  res.json({ teamPerformance });
});

exports.exportReport = asyncHandler(async (req, res) => {
  const tasks = await Task.find().populate('assignedTo', 'name');
  const csvRows = [
    ['Task ID', 'Title', 'Description', 'Status', 'Priority', 'Category', 'Assigned To', 'Due Date', 'Progress']
  ];

  tasks.forEach(task => {
    csvRows.push([
      task._id,
      task.title,
      task.description,
      task.status,
      task.priority,
      task.category,
      task.assignedTo ? task.assignedTo.name : 'Unassigned',
      task.dueDate.toISOString().split('T')[0], // Format date as YYYY-MM-DD
      `${task.progress}%`
    ]);
  });

  const csvContent = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=tasks_report.csv');
  res.send(csvContent);
});

exports.getProductivityReport = asyncHandler(async (req, res) => {
  const startDate = new Date(req.query.startDate);
  const endDate = new Date(req.query.endDate);

  const productivityData = await Task.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        tasksCreated: { $sum: 1 },
        tasksCompleted: {
          $sum: {
            $cond: [{ $eq: ["$status", "Completed"] }, 1, 0]
          }
        }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  res.json(productivityData);
});

