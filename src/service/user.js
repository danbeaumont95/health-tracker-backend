/* eslint-disable no-nested-ternary */
/* eslint-disable no-sequences */
/* eslint-disable no-return-assign */
const mongoose = require('mongoose');
const { omit, get } = require('lodash');
const bcrypt = require('bcryptjs');
const moment = require('moment');
const { User } = require('../models/User');
const { UserSession } = require('../models/UserSession');
const { decode, signJwt } = require('../utils/jwt');
const { MealTracker } = require('../models/MealTracker');
const { returnDateIfBetween2Dates, getAllDatesBetweenTimePeriod } = require('../utils/helpers');

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

exports.getUserPainLevelByTimePeriod = (allMeals, time) => {
  try {
    const { meals } = allMeals;
    // eslint-disable-next-line no-nested-ternary
    const timePeriod = time === 'week' ? moment().subtract(1, 'w').add(1, 'd')
      : time === 'month' ? moment().subtract(1, 'month').add(1, 'd')
        : moment().subtract(1, 'y').add(1, 'd');
    const now = moment();

    const mealsInTimePeriod = meals
      .filter((el) => (returnDateIfBetween2Dates(timePeriod, now, el.date)));

    const datesBetweenTimePeriodAndDate = getAllDatesBetweenTimePeriod(timePeriod, now);

    const painLevelPerDayObject = datesBetweenTimePeriodAndDate
      .reduce((acc, curr) => (acc[curr] = 0, acc), {});

    mealsInTimePeriod.map((el) => (painLevelPerDayObject[moment(el.date).startOf('day').format()] += el.painLevel));

    const dates = mealsInTimePeriod.map((el) => {
      const input = moment(el.date);
      return input.startOf('day').format();
    });

    const occurrences = dates
      // eslint-disable-next-line no-plusplus
      .reduce((acc, curr) => (acc[curr] ? ++acc[curr] : acc[curr] = 1, acc), {});

    Object.entries(occurrences).map((el) => (painLevelPerDayObject[el[0]] /= el[1]));

    return painLevelPerDayObject;
  } catch (error) {
    console.error(error, 'error');
  }
};

exports.getAveragePainLevelFromMeals = (meals) => (Math.round((meals
  .map((el) => el.painLevel).reduce((a, b) => a + b, 0) / meals.length) * 100) / 100
);

exports.getMealsLoggedByTimePeriod = (time, meals) => {
  const timePeriod = time === 'week' ? moment().subtract(1, 'w').add(1, 'd')
    : time === 'month' ? moment().subtract(1, 'month').add(1, 'd')
      : moment().subtract(1, 'y').add(1, 'd');

  const now = moment();
  const mealsInTimePeriod = meals
    .filter((el) => (returnDateIfBetween2Dates(timePeriod, now, el.date)));
  return mealsInTimePeriod;
};

exports.getMealCausingMostPain = (meals) => {
  const foodsWithHighPainLevel = meals.filter((el) => el.painLevel > 7).map((el) => el.food).flat();

  return foodsWithHighPainLevel.reduce(
    (a, b, i, arr) => (arr
      .filter((v) => v === a).length >= arr.filter((v) => v === b).length ? a : b),
    null,
  );
};

exports.updateUserProfilePhoto = async (user, data) => {
  const { _id } = user;
  const { Location } = data;
  const newUser = await User.findByIdAndUpdate({ _id }, {
    $set: {
      profilePicture: Location,
    },
  }, {
    new: true,
  }).lean();

  return newUser;
};
