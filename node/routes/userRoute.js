const router = require('express').Router();
const upload = require('../config/configMulter');
const { updatePasswordValidation, updatePassword } = require('../controllers/useController');
const useController = require('../controllers/useController');
const auth = require('../utils/auth');

router.post('/login', useController.login);
router.get('/logout', useController.logout);
router.get('/refresh_token', useController.refreshToken);

router.post('/registro', upload.single("pic"), useController.register);
router.get('/infor',auth, useController.getUser)
router.put('/edit/:id',upload.single("pic"), auth, useController.UpdateUser);
router.put('/editPass/:id', updatePasswordValidation, updatePassword)



module.exports = router
