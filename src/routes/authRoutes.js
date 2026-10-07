const express = require('express');
const router = express.Router();
const { register } = require('../controllers/authController');
const { validateRegister } = require('../middleware/validators');

// Ruta de registro con middleware de validación
router.post('/register', validateRegister, register);

module.exports = router;