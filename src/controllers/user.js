const { get } = require('lodash');
const multiparty = require('multiparty');
const aws = require('aws-sdk');
const { uniqueId } = require('lodash');
const fs = require('fs');
const {
  getUser, createUser, getAllUsers, createUserSession, addMeal, getAllMeals, getMealsByType,
  getMealsByPainLevel, updateUser, changePassword, getUserPainLevelByTimePeriod,
  getAveragePainLevelFromMeals,
  getMealsLoggedByTimePeriod,
  getMealCausingMostPain, updateUserProfilePhoto,
} = require('../service/user');
const { MealTracker } = require('../models/MealTracker');
const { signJwt } = require('../utils/jwt');
const { checkIfDetailsChanged } = require('../utils/helpers');
const { validatePassword } = require('../service/user');
const { User } = require('../models/User');
const { decode } = require('../utils/jwt');
const { reIssueAccessToken } = require('../service/user');

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
    respBody.message = '[BadRequest] Error creating user';
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
    const { body: { mealType, meal, painLevel } } = req;

    const allowedMeals = ['breakfast', 'lunch', 'dinner', 'snack'];
    const mealFound = allowedMeals.includes(mealType.toLowerCase());
    if (!mealFound) {
      throw new Error('[BadRequest] Invalid meal type');
    }
    const timestamp = new Date().toISOString();
    const newMeal = await addMeal(_id, meal, mealType, painLevel, timestamp);

    if (!newMeal) {
      throw new Error('[BadRequest] Error creating meal');
    }
    respBody.success = true;
    respBody.message = '[Success] Meal added';
  } catch (error) {
    respBody.message = '[BadRequest] Error adding meal';
  }
  return res.status(200).json(respBody);
};

exports.getallMealsHandler = async (req, res) => {
  const respBody = {
    success: false,
    message: '',
    data: {},
  };
  try {
    const { _id } = req.user;
    const allMeals = await getAllMeals(_id);

    if (!allMeals) {
      throw new Error('[BadRequest] Error finding meals');
    }

    if (!allMeals.length) {
      respBody.success = true;
      respBody.message = '[Success] No meals added yet';
      return res.status(200).json(respBody);
    }

    const formattedMeals = allMeals.map((el) => el.meals)[0];

    respBody.success = true;
    respBody.data = formattedMeals;
  } catch (error) {
    respBody.message = '[BadRequest] Error finding meals';
  }
  return res.status(200).json(respBody);
};

exports.getMealsByTypeHandler = async (req, res) => {
  const respBody = {
    success: false,
    message: '',
    data: {},
  };
  try {
    const { _id } = req.user;
    const { type } = req.params;

    const allowedParams = ['breakfast', 'lunch', 'dinner', 'snack'];
    const isTypeAllowed = allowedParams.includes(type.toLowerCase());

    if (!isTypeAllowed) {
      respBody.message = '[BadRequest] Invalid meal type';
      return res.status(200).json(respBody);
    }

    const meals = await getMealsByType(_id, type);

    if (!meals.flat().length) {
      respBody.message = `[BadRequest] No meals found with type ${type}`;
      return res.status(200).json(respBody);
    }

    respBody.success = true;
    respBody.data = meals;
  } catch (error) {
    respBody.message = '[BadRequest] Error finding meals';
  }
  return res.status(200).json(respBody);
};

exports.getAllMealsByPainLevelHandler = async (req, res) => {
  const respBody = {
    success: false,
    message: '',
    data: {},
  };
  try {
    const { _id } = req.user;
    const { pain } = req.params;
    const allowedParams = ['low', 'medium', 'high'];
    const isPainTypeAllowed = allowedParams.includes(pain.toLowerCase());
    if (!isPainTypeAllowed) {
      respBody.message = '[BadRequest] Invalid pain level type';
      return res.status(200).json(respBody);
    }

    const meals = await getMealsByPainLevel(_id, pain);
    if (!meals) {
      respBody.message = '[BadRequest] Error getting meals';
      return res.status(200).json(respBody);
    }
    if (!meals.length) {
      respBody.message = `[BadRequest] No meals found with pain level ${pain}`;
      return res.status(200).json(respBody);
    }
    respBody.success = true;
    respBody.data = meals;
  } catch (error) {
    respBody.message = '[BadRequest] Error finding meals';
  }
  return res.status(200).json(respBody);
};

exports.getMeHandler = async (req, res) => {
  const respBody = {
    success: false,
    message: '',
    data: {},
  };
  try {
    const { _id } = req.user;

    const user = await getUser(_id);

    if (!user) {
      respBody.message = '[BadRequest] User not found';
      return res.status(200).json(respBody);
    }
    respBody.success = true;
    respBody.data = user;
  } catch (error) {
    respBody.message = '[BadRequest] Error finding profile';
  }
  return res.status(200).json(respBody);
};

exports.refreshTokenHandler = async (req, res) => {
  const respBody = {
    success: false,
    message: '',
    data: {},
  };
  try {
    const accessToken = get(req, 'headers.authorization', '').replace(
      /^Bearer\s/,
      '',
    );

    const refreshToken = get(req, 'headers.x-refresh');

    if (!accessToken) return res.status(401).json({ msg: 'no access token found' });
    const { decoded, expired } = decode(accessToken);

    if (decoded) {
      req.user = decoded;
    }
    if (expired && refreshToken) {
      const newAccessToken = await reIssueAccessToken({ refreshToken });

      if (newAccessToken) {
        res.setHeader('x-access-token', newAccessToken);
        // eslint-disable-next-line no-shadow
        const { decoded } = decode(accessToken);

        req.user = decoded;
        return res.status(200).json({ newAccessToken });
      }
    } else {
      return res.status(200).json([]);
    }
  } catch (error) {
    respBody.message = '[BadRequest] Error refreshing token';
  }
  return res.status(200).json(respBody);
};

exports.updateDetailsHandler = async (req, res) => {
  const respBody = {
    success: false,
    message: '',
    data: {},
  };
  try {
    const { _id } = req.user;
    const newUserDetails = req.body;

    const user = await getUser(_id);

    const originalUserDetails = {};

    ({
      firstName: originalUserDetails.firstName,
      lastName: originalUserDetails.lastName,
      email: originalUserDetails.email,
      phoneNumber: originalUserDetails.phoneNumber,
    } = user);

    const detailsUpdated = checkIfDetailsChanged(originalUserDetails, newUserDetails);

    if (!Object.keys(detailsUpdated).length) {
      respBody.success = true;
      respBody.message = '[Success] No details were changed';
      return res.status(200).json(respBody);
    }

    const updatedUser = await updateUser(_id, detailsUpdated);
    respBody.success = true;
    respBody.data = updatedUser;
  } catch (error) {
    respBody.message = '[BadRequest] Error refreshing token';
  }
  return res.status(200).json(respBody);
};

exports.updatePasswordHandler = async (req, res) => {
  const respBody = {
    success: false,
    message: '',
    data: {},
  };
  try {
    const { email } = req.user;

    const { originalPassword, newPassword } = req.body;
    const updatedUser = await changePassword(email, originalPassword, newPassword);

    if (!updatedUser) {
      respBody.message = '[BadRequest] Password does not match';
      return res.status(200).json(respBody);
    }
    respBody.success = true;
    respBody.message = '[Success] Successfully changed password';
  } catch (error) {
    respBody.message = '[BadRequest] Error updateing password';
  }
  return res.status(200).json(respBody);
};

exports.getUserPainLevelByTimePeriodHandler = async (req, res) => {
  const respBody = {
    success: false,
    message: '',
    data: {},
  };
  try {
    const { _id } = req.user;
    const { time } = req.params;

    if (time !== 'week' && time !== 'month' && time !== 'year') {
      respBody.message = '[BadRequest] Invalid time period';
      return res.status(200).json(respBody);
    }

    const allMeals = await MealTracker.findOne({ user: _id });

    if (!allMeals) {
      respBody.message = '[BadRequest] Error finding meals';
      return res.status(200).json(respBody);
    }

    const painLevel = getUserPainLevelByTimePeriod(allMeals, time);

    if (!painLevel) {
      respBody.message = '[BadRequest] Error getting pain levels';
      return res.status(200).json(respBody);
    }
    respBody.success = true;
    const labels = Object.keys(painLevel);
    const painData = Object.values(painLevel).map((el) => Math.round(el * 100) / 100);

    respBody.data = {
      labels,
      painData,
    };
  } catch (error) {
    respBody.message = '[BadRequest] Error getting pain level for user';
  }
  return res.status(200).json(respBody);
};

exports.getUserPainLevelAllMealTypesHandler = async (req, res) => {
  const respBody = {
    success: false,
    message: '',
    data: {},
  };
  try {
    const { _id } = req.user;
    const mealsByType = await Promise.all([getMealsByType(_id, 'breakfast'), getMealsByType(_id, 'lunch'), getMealsByType(_id, 'dinner')]);

    const breakfast = mealsByType.flat()[0];
    const lunch = mealsByType.flat()[1];
    const dinner = mealsByType.flat()[2];

    const breakfastLevel = getAveragePainLevelFromMeals(breakfast);

    if (!breakfastLevel) {
      respBody.message = '[BadRequest] Error getting pain levels for breakfast';
      return res.status(200).json(respBody);
    }
    const lunchLevel = getAveragePainLevelFromMeals(lunch);

    if (!lunchLevel) {
      respBody.message = '[BadRequest] Error getting pain levels for lunch';
      return res.status(200).json(respBody);
    }
    const dinnerLevel = getAveragePainLevelFromMeals(dinner);

    if (!dinnerLevel) {
      respBody.message = '[BadRequest] Error getting pain levels for dinner';
      return res.status(200).json(respBody);
    }

    respBody.success = true;
    respBody.data = {
      labels: ['breakfast', 'lunch', 'dinner'],
      painData: [breakfastLevel, lunchLevel, dinnerLevel],
    };
  } catch (error) {
    respBody.message = '[BadRequest] Error getting pain level for user';
  }
  return res.status(200).json(respBody);
};

exports.getMealsLoggedByTimePeriodHandler = async (req, res) => {
  const respBody = {
    success: false,
    message: '',
    data: {},
  };
  try {
    const { _id } = req.user;
    const { time } = req.params;

    if (time !== 'week' && time !== 'month' && time !== 'year') {
      respBody.message = '[BadRequest] Invalid time period';
      return res.status(200).json(respBody);
    }

    const allMeals = await MealTracker.findOne({ user: _id });

    if (!allMeals) {
      respBody.message = '[BadRequest] Error finding meals';
      return res.status(200).json(respBody);
    }
    const { meals } = allMeals;
    const mealsInTimePeriod = getMealsLoggedByTimePeriod(time, meals);
    respBody.success = true;
    respBody.data = mealsInTimePeriod.length;
  } catch (error) {
    respBody.message = '[BadRequest] Error getting amount of meals for time period';
  }
  return res.status(200).json(respBody);
};

exports.getMealCausingMostPainHandler = async (req, res) => {
  const respBody = {
    success: false,
    message: '',
    data: {},
  };
  try {
    const { _id } = req.user;
    const allMeals = await MealTracker.findOne({ user: _id });

    if (!allMeals) {
      respBody.message = '[BadRequest] Error finding meals';
      return res.status(200).json(respBody);
    }
    const { meals } = allMeals;
    const mostCommonFoodWithHighPainLevel = await getMealCausingMostPain(meals);

    if (!mostCommonFoodWithHighPainLevel) {
      respBody.message = '[BadRequest] Error finding food with high pain level';
      return res.status(200).json(respBody);
    }
    respBody.success = true;
    respBody.data = { mostCommonFoodWithHighPainLevel };
  } catch (error) {
    respBody.message = '[BadRequest] Error getting meal showing most pain';
  }
  return res.status(200).json(respBody);
};

const s3 = new aws.S3({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_ACCESS_SECRET,
  region: process.env.S3_REGION,
});

const upload = (buffer, name) => {
  const params = {
    ACL: 'public-read',
    Body: buffer,
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `${name}`,
  };

  return s3.upload(params).promise();
};

const generateSuffix = (type) => {
  switch (type) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    default:
      return '';
  }
};

exports.addProfilePhotoHandler = async (req, res) => {
  const form = new multiparty.Form();
  const respBody = {
    success: false,
    message: '',
    data: {},
  };
  const user = get(req, 'user');
  try {
    form.parse(req, async (error, fields, files) => {
      if (error) {
        return res.status(500).send(error);
      }
      try {
        const { path } = files.file[0];

        const buffer = fs.readFileSync(path);

        const uuid = uniqueId();

        const suffix = generateSuffix(files.file[0].headers['content-type']);

        // eslint-disable-next-line no-underscore-dangle
        const fileName = `users/${user._id}/profilePhoto_${uuid}.${suffix}`;

        const data = await upload(buffer, fileName);

        const updatedUser = await updateUserProfilePhoto(user, data);

        respBody.success = true;
        respBody.data = updatedUser;

        return res.status(200).json(respBody);
      } catch (e) {
        respBody.message = '[BadRequest] Error adding profile photo';
        return res.status(500).send(respBody);
      }
    });
  } catch (error) {
    respBody.message = '[BadRequest] Error adding profile photo';
  }
};
