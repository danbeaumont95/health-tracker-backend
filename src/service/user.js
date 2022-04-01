const mongoose = require('mongoose');
const { omit } = require('lodash');
const { User } = require('../models/User');
const { UserSession } = require('../models/UserSession');

exports.getUser = async (_id) => {
  const user = await User.findById(new mongoose.Types.ObjectId(_id));
  return user;
};

exports.createUser = async (body) => {
  const user = await User.create(body);
  return user;
};

exports.getAllUsers = async () => {
  const users = await User.find({});
  return users;
};

exports.validatePassword = async ({
  email,
  password,
}) => {
  const user = await User.findOne({ email });

  if (!user) {
    return false;
  }
  const isValid = await user.comparePassword(password);

  if (!isValid) {
    return false;
  }
  return omit(user.toJSON(), 'password');
};

exports.createUserSession = async (userId, userAgent) => {
  const session = await UserSession.create({ user: userId, userAgent });

  return session.toJSON();
};
