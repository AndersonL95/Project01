const router = require('express').Router();
const useController = require('../controllers/useController');
const auth = require('../utils/auth');

router.post('/registro', useController.register);
router.post('/login', useController.login);
router.get('/logout', useController.logout);

router.get('/refresh_token', useController.refreshToken);
router.get('/infor',auth, useController.getUser)

module.exports = router
