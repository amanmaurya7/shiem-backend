const Task = require('../models/Task');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');

exports.getTaskReports = asyncHandler(async (req, res) => {
  const totalTasks = await Task.countDocuments();
  const completedTasks = await Task.countDocuments({ status: 'Completed' });
  const ongoingTasks = await Task.countDocuments({ status: 'In Progress' });
  const overdueTasks = await Task.countDocuments({
    dueDate: { $lt: new Date() },
    status: { $ne: 'Completed' }
  });

  res.json({
    totalTasks,
    completedTasks,
    ongoingTasks,
    overdueTasks
  });
});

exports.getTeamMemberReports = asyncHandler(async (req, res) => {
  const teamMembers = await User.find({ role: 'team_member' });
  const teamPerformance = {};

  for (const member of teamMembers) {
    const totalTasks = await Task.countDocuments({ assignedTo: member._id });
    const completedTasks = await Task.countDocuments({ assignedTo: member._id, status: 'Completed' });
    const performance = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    teamPerformance[member.name] = Math.round(performance);
  }

  res.json({ teamPerformance });
});

exports.exportReport = asyncHandler(async (req, res) => {
  // Implement export functionality (e.g., generate CSV or PDF)
  res.json({ message: 'Export functionality to be implemented' });
});

