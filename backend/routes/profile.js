const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// All routes require authentication
router.use(auth);

// GET /api/profile — get the current user's profile
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({
      name: user.name,
      email: user.email,
      preferredSport: user.preferredSport,
      profile: user.profile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to fetch profile.' });
  }
});

// PUT /api/profile — update profile metrics
router.put('/', async (req, res) => {
  try {
    const { height, weight, age, gender, activityLevel, bmr, tdee, bmi, preferredSport } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Update profile fields if provided
    if (height !== undefined) user.profile.height = height;
    if (weight !== undefined) user.profile.weight = weight;
    if (age !== undefined) user.profile.age = age;
    if (gender !== undefined) user.profile.gender = gender;
    if (activityLevel !== undefined) user.profile.activityLevel = activityLevel;
    if (bmr !== undefined) user.profile.bmr = bmr;
    if (tdee !== undefined) user.profile.tdee = tdee;
    if (bmi !== undefined) user.profile.bmi = bmi;
    if (preferredSport !== undefined) user.preferredSport = preferredSport;

    await user.save();

    res.json({
      name: user.name,
      email: user.email,
      preferredSport: user.preferredSport,
      profile: user.profile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile.' });
  }
});

module.exports = router;
