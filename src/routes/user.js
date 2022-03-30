const expres = require('express');
const { getUserHandler, createUserHandler, getAllUsersHandler } = require('../controllers/user');

const router = expres.Router();

router.get('/', getAllUsersHandler);
router.post('/', createUserHandler);
router.get('/:_id', getUserHandler);

module.exports = router;
