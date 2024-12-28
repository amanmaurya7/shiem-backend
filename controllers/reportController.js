const Task = require('../models/Task');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

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
  const { format } = req.query;
  const tasks = await Task.find().populate('assignedTo', 'name');

  if (format === 'excel') {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tasks Report');

    worksheet.columns = [
      { header: 'Task ID', key: 'id', width: 30 },
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Priority', key: 'priority', width: 15 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Assigned To', key: 'assignedTo', width: 30 },
      { header: 'Due Date', key: 'dueDate', width: 15 },
      { header: 'Progress', key: 'progress', width: 15 }
    ];

    tasks.forEach(task => {
      worksheet.addRow({
        id: task._id.toString(),
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        category: task.category,
        assignedTo: task.assignedTo ? task.assignedTo.name : 'Unassigned',
        dueDate: task.dueDate.toISOString().split('T')[0],
        progress: `${task.progress}%`
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=tasks_report.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } else if (format === 'pdf') {
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=tasks_report.pdf');

    doc.pipe(res);

    doc.fontSize(16).text('Tasks Report', { align: 'center' });
    doc.moveDown();

    tasks.forEach((task, index) => {
      doc.fontSize(12).text(`Task ${index + 1}:`);
      doc.fontSize(10).text(`ID: ${task._id}`);
      doc.text(`Title: ${task.title}`);
      doc.text(`Description: ${task.description}`);
      doc.text(`Status: ${task.status}`);
      doc.text(`Priority: ${task.priority}`);
      doc.text(`Category: ${task.category}`);
      doc.text(`Assigned To: ${task.assignedTo ? task.assignedTo.name : 'Unassigned'}`);
      doc.text(`Due Date: ${task.dueDate.toISOString().split('T')[0]}`);
      doc.text(`Progress: ${task.progress}%`);
      doc.moveDown();
    });

    doc.end();
  } else {
    res.status(400).json({ message: 'Invalid export format. Use "excel" or "pdf".' });
  }
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

