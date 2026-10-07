const { body, validationResult } = require('express-validator');

// Reglas para el registro de usuarios
const validateRegister = [
  body('email')
    .isEmail().withMessage('Debe ser un email válido.')
    .normalizeEmail(),
  
  body('full_name')
    .notEmpty().withMessage('El nombre completo es obligatorio.')
    .trim(),
  
  body('password')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.')
    .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una letra mayúscula.')
    .matches(/[0-9]/).withMessage('La contraseña debe contener al menos un número.')
    .matches(/[@$!%*?&#]/).withMessage('La contraseña debe contener al menos un carácter especial (@$!%*?&#).'),
  
  body('role')
    .isIn(['Administrador del Sistema', 'Gerente de Tienda', 'Empleado de Ventas', 'Auditor'])
    .withMessage('Rol de usuario no válido.'),

  body('store_id')
    .isInt().withMessage('El ID de la tienda debe ser un número entero.'),

  // Middleware para verificar errores de validación
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array().map(err => err.msg) 
      });
    }
    next();
  }
];

module.exports = {
  validateRegister
};