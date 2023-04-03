const router = require('express').Router();
const upload = require('../config/configMulter');
const useController = require('../controllers/useController');
const auth = require('../utils/auth');

router.post('/registro', upload.single("pic"), useController.register);
router.post('/login', useController.login);
router.get('/logout', useController.logout);

router.get('/refresh_token', useController.refreshToken);
router.get('/infor',auth, useController.getUser)
router.put('/edit/:id',upload.single("pic"), useController.UpdateUser);


module.exports = router
