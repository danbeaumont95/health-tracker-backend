const mongoose = require('mongoose');
const { omit, get } = require('lodash');
const { User } = require('../models/User');
const { UserSession } = require('../models/UserSession');
const { decode, signJwt } = require('../utils/jwt');
const { MealTracker } = require('../models/MealTracker');

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

const createAccessToken = ({
  user,
  session,
}) => {
  // Build and return the new access token
  const accessToken = signJwt(
    // eslint-disable-next-line no-underscore-dangle
    { ...user, session: session._id },
    { expiresIn: process.env.accessTokenTtl }, // 10 minutes
  );

  return accessToken;
};

const findUser = (query) => User.findOne(query).lean();

exports.reIssueAccessToken = async ({
  refreshToken,
}) => {
  // Decode the refresh token
  const { decoded } = decode(refreshToken);

  if (!decoded || !get(decoded, '_id')) return false;

  // Get the session
  const { session: sessiondId } = decoded;

  const session = await UserSession.findById({ _id: sessiondId });

  // Make sure the session is still valid
  if (!session || !session?.valid) return false;

  const user = await findUser({ _id: session.user });
  if (!user) return false;

  const accessToken = createAccessToken({ user, session });
  return accessToken;
};

exports.addMeal = async (id, meal, type, timestamp) => {
  const alreadyHasMeals = await MealTracker.findOne({ user: id });
  const mealObj = {
    mealType: type, food: meal, date: timestamp,
  };

  if (!alreadyHasMeals) {
    const newMeal = await MealTracker.create({
      user: id,
      meals: mealObj,
    });
    return newMeal;
  }
  const { _id } = alreadyHasMeals;

  const updatedUserMeals = await MealTracker.findByIdAndUpdate({ _id }, {
    $push: {
      meals: mealObj,
    },
  });
  return updatedUserMeals;
};
