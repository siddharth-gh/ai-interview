import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import Interview from '../models/Interview.js';
import User from '../models/User.js';

const router = express.Router();

// @route   GET /api/dashboard/my-interviews
// @desc    Get logged in user's interviews
// @access  Private
router.get('/my-interviews', protect, async (req, res) => {
  try {
    const interviews = await Interview.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(interviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/dashboard/admin/stats
// @desc    Get all users and interviews for admin dashboard
// @access  Private/Admin
router.get('/admin/stats', protect, admin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    const interviews = await Interview.find({}).populate('user', 'name email').sort({ createdAt: -1 });
    
    res.json({
      usersCount: users.length,
      interviewsCount: interviews.length,
      users,
      interviews
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
