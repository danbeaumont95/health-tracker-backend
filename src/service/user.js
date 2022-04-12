const mongoose = require('mongoose');
const { omit, get } = require('lodash');
const bcrypt = require('bcrypt');
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

exports.changePassword = async (email, password, newPassword) => {
  const user = await User.findOne({ email });

  const { password: dbPassword } = user;
  if (!user) {
    return false;
  }
  const isValid = await user.comparePassword(password);

  if (!isValid) {
    return false;
  }

  const isMatch = await bcrypt.compare(password, dbPassword);

  if (!isMatch) {
    throw new Error('[BadRequest] Password does not match');
  }
  const salt = await bcrypt.genSalt(+process.env.saltWorkFactor);

  const hash = await bcrypt.hashSync(newPassword, salt);

  const updatedUser = await User.findOneAndUpdate({ email }, {
    password: hash,
  });

  if (!updatedUser) {
    throw new Error('[BadRequest] Error updateing password');
  }
  return updatedUser;
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

exports.addMeal = async (id, meal, type, painLevel, timestamp) => {
  const alreadyHasMeals = await MealTracker.findOne({ user: id });
  const mealObj = {
    mealType: type, food: meal, date: timestamp, painLevel,
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

exports.getAllMeals = async (_id) => (MealTracker.find({ user: _id }).select('meals'));

exports.getMealsByType = async (_id, type) => {
  const meals = await MealTracker.find({ user: _id });
  return meals.map((el) => el.meals.filter((els) => els.mealType === type));
};

// eslint-disable-next-line no-nested-ternary
const getPainRange = (pain) => (pain === 'low' ? [0, 3] : pain === 'medium' ? [4, 6] : [7, 10]);

exports.getMealsByPainLevel = async (_id, pain) => {
  const painRange = getPainRange(pain);

  const meals = await MealTracker.find({ user: _id });

  const mealsInPainLevelRange = meals
    .map((el) => el.meals
      .filter((els) => els.painLevel >= painRange[0]
        && els.painLevel <= painRange[1]));

  return mealsInPainLevelRange;
};

exports.updateUser = async (_id, details) => {
  try {
    const updatedValueName = Object.keys(details);
    const formattedDetails = Object
      .assign(...updatedValueName.map((key) => ({ [key]: details[key].to })));

    const updatedUser = await User.findByIdAndUpdate({ _id }, formattedDetails, { new: true });

    return updatedUser;
  } catch (error) {
    throw new Error('[BadRequest] Error updating user');
  }
};
