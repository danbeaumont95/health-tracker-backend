const expres = require('express');
const {
  getUserHandler, createUserHandler, getAllUsersHandler, createUserSessionHandler,
  addAreaToWorkOnHandler, addMealHandler,
} = require('../controllers/user');
const { createUserSessionSchema } = require('../schema/user');
const { validateRequest } = require('../middleware/validateRequest');
const { requiresUser } = require('../middleware/requiresUser');

const router = expres.Router();

router.get('/', getAllUsersHandler);
router.post('/', createUserHandler);
router.get('/:_id', getUserHandler);
router.post('/session', validateRequest(createUserSessionSchema), createUserSessionHandler);
router.put('/details/area', [requiresUser], addAreaToWorkOnHandler);
router.post('/meal', [requiresUser], addMealHandler);

module.exports = router;
