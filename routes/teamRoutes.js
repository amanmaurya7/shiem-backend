const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const {
  addTeamMember,
  getAllTeamMembers,
  getTeamMemberById,
  updateTeamMember,
  deleteTeamMember,
  getTeamMemberStatus,
  getTeamMemberUpdates,
} = require('../controllers/teamController');

const router = express.Router();

router.route('/')
  .post(protect, admin, addTeamMember)
  .get(protect, getAllTeamMembers);

router.route('/status').get(protect, admin, getTeamMemberStatus);

router.route('/updates')
  .get(protect, admin, getTeamMemberUpdates);

router.route('/:id')
  .get(protect, getTeamMemberById)
  .put(protect, admin, updateTeamMember)
  .delete(protect, admin, deleteTeamMember);

module.exports = router;

