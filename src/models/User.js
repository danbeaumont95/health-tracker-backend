const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    password: { type: String, required: true },
    profilePicture: { type: String },
    areasToWorkOn: { type: Array, default: [] },
  },
  {
    timestamps: true,
  },
);

// eslint-disable-next-line func-names
userSchema.pre('save', async function (next) {
  const user = this;
  if (!user.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(+process.env.saltWorkFactor);

  const hash = await bcrypt.hashSync(user.password, salt);

  user.password = hash;
  return next();
});

// eslint-disable-next-line func-names
userSchema.methods.comparePassword = async function (candidatePassword) {
  const user = this;
  // eslint-disable-next-line no-unused-vars
  return bcrypt.compare(candidatePassword, user.password).catch((e) => false);
};

const User = mongoose.model('User', userSchema);

module.exports = {
  User,
};
