const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: 2
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  preferredSport: {
    type: String,
    default: 'Football'
  },
  profile: {
    height: { type: Number, default: null },
    weight: { type: Number, default: null },
    age: { type: Number, default: null },
    gender: { type: String, default: null },
    activityLevel: { type: String, default: null },
    bmr: { type: Number, default: null },
    tdee: { type: Number, default: null },
    bmi: { type: Number, default: null }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
