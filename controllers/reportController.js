const Task = require('../models/Task');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');

exports.getTaskReports = asyncHandler(async (req, res) => {
  const { startDate, endDate, status } = req.query;
  let query = {};

  if (startDate && endDate) {
    query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  if (status) {
    query.status = status;
  }

  const tasks = await Task.find(query).populate('assignedTo', 'name');
  res.json(tasks);
});

exports.getTeamMemberReports = asyncHandler(async (req, res) => {
  const teamMembers = await User.find({ role: 'team_member' });
  const reports = await Promise.all(
    teamMembers.map(async (member) => {
      const tasksAssigned = await Task.countDocuments({ assignedTo: member._id });
      const tasksCompleted = await Task.countDocuments({
        assignedTo: member._id,
        status: 'Completed',
      });

      return {
        id: member._id,
        name: member.name,
        tasksAssigned,
        tasksCompleted,
        completionRate: tasksAssigned > 0 ? (tasksCompleted / tasksAssigned) * 100 : 0,
      };
    })
  );

  res.json(reports);
});

exports.exportReport = asyncHandler(async (req, res) => {
  // Implement export functionality (e.g., generate CSV or PDF)
  // This is a placeholder implementation
  res.json({ message: 'Export functionality to be implemented' });
});

