const jwt = require('jsonwebtoken');

const { privateKey } = process.env;
const { publicKey } = process.env;

const signJwt = (object, options) => jwt.sign(object, privateKey, options);

const decode = (token) => {
  try {
    const decoded = jwt.verify(token, privateKey);
    return { valid: true, expired: false, decoded };
  } catch (error) {
    // eslint-disable-next-line no-return-assign
    return {
      valid: false,
      expired: error.message = 'JWT expired',
      decoded: null,
    };
  }
};

const verifyJwt = (token) => {
  try {
    const decoded = jwt.verify(token, publicKey);
    return {
      valid: true,
      expired: false,
      decoded,
    };
  } catch (e) {
    console.error(e);
    return {
      valid: false,
      expired: e.message === 'jwt expired',
      decoded: null,
    };
  }
};

module.exports = {
  signJwt,
  decode,
  verifyJwt,
};
