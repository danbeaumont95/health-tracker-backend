const {
  getUser, createUser, getAllUsers, createUserSession, addMeal,
} = require('../service/user');
const { signJwt } = require('../utils/jwt');
const { validatePassword } = require('../service/user');
const { User } = require('../models/User');

exports.getAllUsersHandler = async (req, res) => {
  const respBody = {
    success: false,
    message: '',
    data: {},
  };
  try {
    const users = await getAllUsers();
    if (!users || !users.length) {
      respBody.message = '[BadRequest] No users found';
      return res.status(200).json(respBody);
    }
    respBody.success = true;
    respBody.data = users;
  } catch (error) {
    respBody.message = '[BadRequest] User not found';
  }
  return res.status(200).json(respBody);
};

exports.getUserHandler = async (req, res) => {
  const respBody = {
    success: false,
    message: '',
    data: {},
  };
  try {
    const { _id } = req.params;

    const user = await getUser(_id);

    if (!user) {
      respBody.message = '[BadRequest] User not found';
      return res.status(200).json(respBody);
    }
    respBody.success = true;
    respBody.data = user;
  } catch (error) {
    respBody.message = '[BadRequest] User not found';
  }
  return res.status(200).json(respBody);
};

exports.createUserHandler = async (req, res) => {
  const respBody = {
    success: false,
    message: '',
    data: {},
  };
  try {
    const { body } = req;
    if (!body.firstName || !body.lastName || !body.email || !body.password) {
      respBody.message = '[BadRequest] Missing input';
      return res.status(200).json(respBody);
    }

    const user = await createUser(body);
    if (!user) {
      respBody.message = '[BadRequest] Error creating user';
      return res.status(200).json(respBody);
    }

    respBody.success = true;
    respBody.data = user;
  } catch (error) {
    respBody.message = '[BadRequest] User not found';
  }
  return res.status(200).json(respBody);
};

exports.createUserSessionHandler = async (req, res) => {
  const respBody = {
    success: false,
    message: '',
    data: {},
  };
  try {
    const user = await validatePassword(req.body);

    if (!user) {
      respBody.message = '[BadRequest] Invalid email or password';
      return res.status(200).json(respBody);
    }

    // eslint-disable-next-line no-underscore-dangle
    const session = await createUserSession(user._id, req.get('user-agent') || '');

    const accessToken = signJwt(
      // eslint-disable-next-line no-underscore-dangle
      { ...user, session: session._id },
      { expiresIn: process.env.accessTokenTtl },
    );

    const refreshToken = signJwt(
      // eslint-disable-next-line no-underscore-dangle
      { ...user, session: session._id },
      { expiresIn: process.env.refreshTokenTtl },
    );

    const { _id } = user;

    respBody.success = true;
    respBody.data = { accessToken, refreshToken, _id };
  } catch (error) {
    respBody.message = '[BadRequest] User not found';
  }
  return res.status(200).json(respBody);
};

exports.addAreaToWorkOnHandler = async (req, res) => {
  const respBody = {
    success: false,
    message: '',
    data: {},
  };
  try {
    const { _id } = req.user;
    const allowedAreas = { physical: 'physical', mental: 'mental' };
    const { area } = req.body;
    if (!allowedAreas[area.toLowerCase()]) {
      respBody.message = '[BadRequest] Invalid area';
      return res.status(200).json(respBody);
    }

    await User.findByIdAndUpdate({ _id }, {
      $push: {
        areasToWorkOn: area,
      },
    });
    respBody.success = true;
    respBody.message = `[Success] ${area} added to your profile`;
  } catch (error) {
    respBody.message = '[BadRequest] Error adding area to work on';
  }
  return res.status(200).json(respBody);
};

exports.addMealHandler = async (req, res) => {
  const respBody = {
    success: false,
    message: '',
    data: {},
  };
  try {
    const { _id } = req.user;
    const { body: { mealType, meal } } = req;

    const allowedMeals = ['breakfast', 'lunch', 'dinner', 'snack'];
    const mealFound = allowedMeals.includes(mealType.toLowerCase());
    if (!mealFound) {
      throw new Error('[BadRequest] Invalid meal type');
    }
    const timestamp = new Date().toISOString();
    const newMeal = await addMeal(_id, meal, mealType, timestamp);

    if (!newMeal) {
      throw new Error('[BadRequest] Error creating meal');
    }
    respBody.success = true;
    respBody.message = '[Success] Meal added';
  } catch (error) {
    respBody.message = '[BadRequest] Error adding area to work on';
  }
  return res.status(200).json(respBody);
};
