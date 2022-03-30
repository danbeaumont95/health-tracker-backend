const { User } = require("../models/User");
const mongoose = require('mongoose');

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
