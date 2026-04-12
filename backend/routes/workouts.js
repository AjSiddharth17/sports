const express = require('express');
const auth = require('../middleware/auth');
const Workout = require('../models/Workout');

const router = express.Router();

// All routes require authentication
router.use(auth);

// GET /api/workouts — list workout logs for the authenticated user
router.get('/', async (req, res) => {
  try {
    const workouts = await Workout.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(workouts);
  } catch (error) {
    console.error('Get workouts error:', error);
    res.status(500).json({ message: 'Failed to fetch workouts.' });
  }
});

// POST /api/workouts — log a completed workout
router.post('/', async (req, res) => {
  try {
    const { type, exercises, date } = req.body;

    if (!type || !exercises || !exercises.length) {
      return res.status(400).json({ message: 'Workout type and exercises are required.' });
    }

    const workout = await Workout.create({
      user: req.user.id,
      type,
      exercises,
      date: date || new Date().toISOString().split('T')[0]
    });

    res.status(201).json(workout);
  } catch (error) {
    console.error('Create workout error:', error);
    res.status(500).json({ message: 'Failed to log workout.' });
  }
});

// DELETE /api/workouts/:id — delete a workout log
router.delete('/:id', async (req, res) => {
  try {
    const workout = await Workout.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!workout) {
      return res.status(404).json({ message: 'Workout not found.' });
    }
    res.json({ message: 'Workout deleted.' });
  } catch (error) {
    console.error('Delete workout error:', error);
    res.status(500).json({ message: 'Failed to delete workout.' });
  }
});

module.exports = router;
