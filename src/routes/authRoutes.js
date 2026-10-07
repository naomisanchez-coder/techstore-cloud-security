const express = require('express');
const router = express.Router();
const { register, login, verifyMFA } = require('../controllers/authController');
const { validateRegister } = require('../middleware/validators');

router.post('/register', validateRegister, register);
router.post('/login', login);
router.post('/verify-mfa', verifyMFA);

module.exports = router;