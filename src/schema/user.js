const { object, string } = require('yup');


exports.createUserSessionSchema = object({
  body: object({
    email: string()
      .email('Must be a valid email')
      .required('Email is required'),
    password: string()
      .required('Password is required')
      .min(4, 'Password is too short - Should be 6 characters minimum')
      .matches(/^[a-zA-Z0-9_.-]*$/, 'Password can only contain Latin letters'),
  }),
});
