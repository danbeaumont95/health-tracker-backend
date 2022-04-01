const expres = require('express');
const { getUserHandler, createUserHandler, getAllUsersHandler, createUserSessionHandler } = require('../controllers/user');
const { createUserSessionSchema } = require('../schema/user');
const { validateRequest } = require('../middleware/validateRequest');

const router = expres.Router();

router.get('/', getAllUsersHandler);
router.post('/', createUserHandler);
router.get('/:_id', getUserHandler);
router.post('/session', validateRequest(createUserSessionSchema), createUserSessionHandler);

module.exports = router;
