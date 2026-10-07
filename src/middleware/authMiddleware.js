const jwt = require('jsonwebtoken');

// Middleware para verificar que la petición incluya un Token JWT válido
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato: Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Acceso denegado. Se requiere un token de autenticación.' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_techstore_2026', (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Token inválido o expirado. Inicie sesión nuevamente.' 
      });
    }
    req.user = user; // Almacena la información decodificada del usuario
    next();
  });
}

// Middleware para restringir acceso según el rol del usuario (RBAC)
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. El rol '${req.user?.role}' no tiene permisos para esta acción.`
      });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles
};