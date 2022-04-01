const mongoose = require('mongoose');

const UserSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    valid: { type: Boolean, default: true },
    userAgent: { type: String },
  },
  { timestamps: true },
);

const UserSession = mongoose.model('UserSession', UserSessionSchema);

module.exports = { UserSession };
