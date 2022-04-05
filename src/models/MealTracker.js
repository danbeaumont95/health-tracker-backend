const mongoose = require('mongoose');

const mealTrackerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    meals: { type: Array, default: [] },
  },
  { timestamps: true },
);

const MealTracker = mongoose.model('MealTracker', mealTrackerSchema);

module.exports = {
  MealTracker,
};
