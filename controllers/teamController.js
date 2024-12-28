const User = require('../models/User');
const Task = require('../models/Task');
const asyncHandler = require('../middleware/asyncHandler');

exports.addTeamMember = asyncHandler(async (req, res) => {
  const { name, email, password, mobile_number } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    mobile_number,
    role: 'team_member',
    employeeId: `EMP${Math.floor(1000 + Math.random() * 9000)}`,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
      mobile_number: user.mobile_number,
      status: user.status,
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

exports.getAllTeamMembers = asyncHandler(async (req, res) => {
  const teamMembers = await User.find({ role: 'team_member' }).select('-password');
  if (!teamMembers) {
    res.status(404);
    throw new Error('No team members found');
  }
  res.json(teamMembers);
});

exports.getTeamMemberById = asyncHandler(async (req, res) => {
  const teamMember = await User.findById(req.params.id).select('-password');

  if (teamMember) {
    res.json(teamMember);
  } else {
    res.status(404);
    throw new Error('Team member not found');
  }
});

exports.updateTeamMember = asyncHandler(async (req, res) => {
  const teamMember = await User.findById(req.params.id);

  if (teamMember) {
    teamMember.name = req.body.name || teamMember.name;
    teamMember.email = req.body.email || teamMember.email;
    teamMember.mobile_number = req.body.mobile_number || teamMember.mobile_number;
    teamMember.status = req.body.status || teamMember.status;

    const updatedTeamMember = await teamMember.save();

    res.json({
      _id: updatedTeamMember._id,
      name: updatedTeamMember.name,
      email: updatedTeamMember.email,
      role: updatedTeamMember.role,
      employeeId: updatedTeamMember.employeeId,
      mobile_number: updatedTeamMember.mobile_number,
      status: updatedTeamMember.status,
    });
  } else {
    res.status(404);
    throw new Error('Team member not found');
  }
});

exports.deleteTeamMember = asyncHandler(async (req, res) => {
  const teamMember = await User.findById(req.params.id);

  if (teamMember) {
    await teamMember.remove();
    res.json({ message: 'Team member removed' });
  } else {
    res.status(404);
    throw new Error('Team member not found');
  }
});

exports.getTeamMemberStatus = asyncHandler(async (req, res) => {
  const teamMembers = await User.find({ role: 'team_member' });
  const statuses = await Promise.all(
    teamMembers.map(async (member) => {
      const tasksAssigned = await Task.countDocuments({ assignedTo: member._id });
      const tasksCompleted = await Task.countDocuments({
        assignedTo: member._id,
        status: 'Completed',
      });

      return {
        id: member._id,
        name: member.name,
        status: member.status,
        tasksAssigned,
        tasksCompleted,
      };
    })
  );

  res.json(statuses);
});

