const express = require('express');
const auth = require('../middleware/auth');
const Event = require('../models/Event');

const router = express.Router();

// All routes require authentication
router.use(auth);

// GET /api/events — list all events for the authenticated user
router.get('/', async (req, res) => {
  try {
    const events = await Event.find({ user: req.user.id }).sort({ date: 1 });
    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Failed to fetch events.' });
  }
});

// POST /api/events — create a new event
router.post('/', async (req, res) => {
  try {
    const { date, opponent, location, notes } = req.body;

    if (!date || !opponent || !location) {
      return res.status(400).json({ message: 'Date, opponent, and location are required.' });
    }

    const event = await Event.create({
      user: req.user.id,
      date,
      opponent,
      location,
      notes: notes || ''
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Failed to create event.' });
  }
});

// PUT /api/events/:id — update an event
router.put('/:id', async (req, res) => {
  try {
    const { date, opponent, location, notes } = req.body;

    const event = await Event.findOne({ _id: req.params.id, user: req.user.id });
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    if (date) event.date = date;
    if (opponent) event.opponent = opponent;
    if (location) event.location = location;
    if (notes !== undefined) event.notes = notes;

    await event.save();
    res.json(event);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Failed to update event.' });
  }
});

// DELETE /api/events/:id — delete an event
router.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    res.json({ message: 'Event deleted.' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Failed to delete event.' });
  }
});

module.exports = router;
