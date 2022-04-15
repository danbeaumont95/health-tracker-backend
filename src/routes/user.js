const expres = require('express');
const {
  getUserHandler, createUserHandler, getAllUsersHandler, createUserSessionHandler,
  addAreaToWorkOnHandler, addMealHandler, getallMealsHandler, getMealsByTypeHandler,
  getAllMealsByPainLevelHandler, getMeHandler, refreshTokenHandler, updateDetailsHandler,
  updatePasswordHandler, getUserPainLevelByTimePeriodHandler
} = require('../controllers/user');
const { createUserSessionSchema } = require('../schema/user');
const { validateRequest } = require('../middleware/validateRequest');
const { requiresUser } = require('../middleware/requiresUser');

const router = expres.Router();

router.get('/', getAllUsersHandler);
router.post('/', createUserHandler);
router.get('/:_id', getUserHandler);
router.get('/profile/me', [requiresUser], getMeHandler);
router.post('/session', validateRequest(createUserSessionSchema), createUserSessionHandler);
router.get('/session/refresh', refreshTokenHandler);
router.put('/details/area', [requiresUser], addAreaToWorkOnHandler);
router.post('/meal', [requiresUser], addMealHandler);
router.get('/meals/all', [requiresUser], getallMealsHandler);
router.get('/meal/:type', [requiresUser], getMealsByTypeHandler);
router.get('/meal/pain/:pain', [requiresUser], getAllMealsByPainLevelHandler);
router.put('/details/update', [requiresUser], updateDetailsHandler);
router.put('/details/password', [requiresUser], updatePasswordHandler);
router.get('/meals/pain/:time', [requiresUser], getUserPainLevelByTimePeriodHandler);

module.exports = router;
