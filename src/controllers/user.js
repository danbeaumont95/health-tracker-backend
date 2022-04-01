const {
  getUser, createUser, getAllUsers, createUserSession,
} = require('../service/user');
const { signJwt } = require('../utils/jwt');
const { validatePassword } = require('../service/user');

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
