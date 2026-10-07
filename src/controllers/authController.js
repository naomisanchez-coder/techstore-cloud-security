const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const getDbConnection = require('../config/db');
const { sendMfaCodeEmail } = require('../utils/mailer');
const { generateMfaCode } = require('../utils/mfa');

// 1. Registro de usuario
async function register(req, res) {
  try {
    const { email, password, full_name, role, store_id } = req.body;
    const db = await getDbConnection();

    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'El correo electrónico ya se encuentra registrado.' });
    }

    const store = await db.get('SELECT id FROM stores WHERE id = ?', [store_id]);
    if (!store) {
      return res.status(400).json({ success: false, message: 'La tienda asignada no existe.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await db.run(
      `INSERT INTO users (email, password, full_name, role, store_id) VALUES (?, ?, ?, ?, ?)`,
      [email, hashedPassword, full_name, role, store_id]
    );

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente.',
      data: { userId: result.lastID, email, full_name, role, store_id }
    });
  } catch (error) {
    console.error('Error en el registro:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor al registrar usuario.' });
  }
}

// 2. Login Básico (Paso 1 de la autenticación + Bloqueo al 5.º intento)
async function login(req, res) {
  try {
    const { email, password } = req.body;
    const db = await getDbConnection();

    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
    }

    // Verificar si la cuenta está bloqueada por intentos fallidos
    if (user.is_locked === 1) {
      return res.status(403).json({
        success: false,
        message: 'Cuenta bloqueada por superar 5 intentos fallidos. Contacte al Administrador.'
      });
    }

    // Comparar la contraseña ingresada
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      const failedAttempts = user.failed_attempts + 1;

      if (failedAttempts >= 5) {
        await db.run('UPDATE users SET failed_attempts = ?, is_locked = 1 WHERE id = ?', [failedAttempts, user.id]);
        return res.status(403).json({
          success: false,
          message: 'Ha superado el límite de 5 intentos fallidos. Su cuenta ha sido bloqueada.'
        });
      } else {
        await db.run('UPDATE users SET failed_attempts = ? WHERE id = ?', [failedAttempts, user.id]);
        return res.status(401).json({
          success: false,
          message: `Credenciales inválidas. Intentos restantes: ${5 - failedAttempts}`
        });
      }
    }

    // Si las credenciales son correctas, reiniciar el contador de intentos fallidos
    await db.run('UPDATE users SET failed_attempts = 0 WHERE id = ?', [user.id]);

    // Generar código MFA de 6 dígitos
    const mfaCode = generateMfaCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // Válido por 5 minutos

    // Invalidar códigos MFA anteriores sin usar de este usuario
    await db.run('UPDATE mfa_codes SET is_used = 1 WHERE user_id = ? AND is_used = 0', [user.id]);

    // Registrar nuevo código MFA
    await db.run(
      'INSERT INTO mfa_codes (user_id, code, expires_at) VALUES (?, ?, ?)',
      [user.id, mfaCode, expiresAt]
    );

    // Enviar código por correo
    await sendMfaCodeEmail(user.email, mfaCode);

    return res.status(200).json({
      success: true,
      message: 'Credenciales correctas. Se ha enviado un código MFA a su correo electrónico.',
      mfaRequired: true,
      userId: user.id
    });

  } catch (error) {
    console.error('Error en el login:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor en login.' });
  }
}

// 3. Verificación de Código MFA (Paso 2 de la autenticación)
async function verifyMFA(req, res) {
  try {
    const { userId, code } = req.body;
    const db = await getDbConnection();

    const mfaRecord = await db.get(
      `SELECT * FROM mfa_codes WHERE user_id = ? AND is_used = 0 ORDER BY id DESC LIMIT 1`,
      [userId]
    );

    if (!mfaRecord) {
      return res.status(400).json({ success: false, message: 'No se encontró una solicitud MFA activa.' });
    }

    // Verificar si el código ya expiró
    if (new Date() > new Date(mfaRecord.expires_at)) {
      return res.status(400).json({ success: false, message: 'El código MFA ha expirado. Inicie sesión nuevamente.' });
    }

    // Verificar si se superó el límite de 3 intentos
    if (mfaRecord.attempts >= 3) {
      await db.run('UPDATE mfa_codes SET is_used = 1 WHERE id = ?', [mfaRecord.id]);
      return res.status(403).json({ success: false, message: 'Límite de 3 intentos de MFA superado. Inicie sesión nuevamente.' });
    }

    // Validar el código ingresado
    if (mfaRecord.code !== code.toString().trim()) {
      const newAttempts = mfaRecord.attempts + 1;
      await db.run('UPDATE mfa_codes SET attempts = ? WHERE id = ?', [newAttempts, mfaRecord.id]);

      if (newAttempts >= 3) {
        await db.run('UPDATE mfa_codes SET is_used = 1 WHERE id = ?', [mfaRecord.id]);
        return res.status(403).json({ success: false, message: 'Máximo de 3 intentos alcanzado. Inicie sesión nuevamente.' });
      }

      return res.status(400).json({
        success: false,
        message: `Código MFA incorrecto. Intentos restantes: ${3 - newAttempts}`
      });
    }

    // Marcar el código MFA como utilizado
    await db.run('UPDATE mfa_codes SET is_used = 1 WHERE id = ?', [mfaRecord.id]);

    // Obtener datos completos del usuario para generar el Token JWT
    const user = await db.get('SELECT id, email, full_name, role, store_id FROM users WHERE id = ?', [userId]);

    // Emitir Token JWT completo
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        store_id: user.store_id
      },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Autenticación exitosa.',
      token,
      user
    });

  } catch (error) {
    console.error('Error en verificación MFA:', error);
    return res.status(500).json({ success: false, message: 'Error interno en verificación MFA.' });
  }
}

module.exports = {
  register,
  login,
  verifyMFA
};