const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['strength', 'endurance', 'agility'],
    required: [true, 'Workout type is required']
  },
  exercises: [{
    name: { type: String, required: true },
    setsReps: { type: String, required: true },
    description: { type: String, default: '' }
  }],
  date: {
    type: String,
    default: () => new Date().toISOString().split('T')[0]
  },
  completed: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Workout', workoutSchema);
