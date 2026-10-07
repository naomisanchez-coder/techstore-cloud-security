const bcrypt = require('bcryptjs');
const getDbConnection = require('../config/db');

// Registro de usuario
async function register(req, res) {
  try {
    const { email, password, full_name, role, store_id } = req.body;
    const db = await getDbConnection();

    // 1. Verificar si el email ya está registrado
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico ya se encuentra registrado.'
      });
    }

    // 2. Verificar si la tienda existe
    const store = await db.get('SELECT id FROM stores WHERE id = ?', [store_id]);
    if (!store) {
      return res.status(400).json({
        success: false,
        message: 'La tienda asignada no existe.'
      });
    }

    // 3. Cifrar la contraseña con bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Insertar el nuevo usuario en la base de datos
    const result = await db.run(
      `INSERT INTO users (email, password, full_name, role, store_id) 
       VALUES (?, ?, ?, ?, ?)`,
      [email, hashedPassword, full_name, role, store_id]
    );

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente.',
      data: {
        userId: result.lastID,
        email,
        full_name,
        role,
        store_id
      }
    });

  } catch (error) {
    console.error('Error en el registro:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al registrar usuario.'
    });
  }
}

module.exports = {
  register
};