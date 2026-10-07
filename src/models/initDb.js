const getDbConnection = require('../config/db');

async function initDatabase() {
  const db = await getDbConnection();

  // 1. Tabla Tiendas
  await db.exec(`
    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      location TEXT NOT NULL
    );
  `);

  // 2. Tabla Usuarios (Con campos para bloqueo e intentos fallidos)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT CHECK(role IN ('Administrador del Sistema', 'Gerente de Tienda', 'Empleado de Ventas', 'Auditor')) NOT NULL,
      store_id INTEGER,
      failed_attempts INTEGER DEFAULT 0,
      is_locked INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id)
    );
  `);

  // 3. Tabla para Códigos MFA por Email
  await db.exec(`
    CREATE TABLE IF NOT EXISTS mfa_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      code TEXT NOT NULL,
      attempts INTEGER DEFAULT 0,
      expires_at DATETIME NOT NULL,
      is_used INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 4. Tabla Productos (para la gestión de inventario y roles)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      store_id INTEGER NOT NULL,
      FOREIGN KEY (store_id) REFERENCES stores(id)
    );
  `);

  // Insertar tiendas por defecto si no existen
  const storeCount = await db.get('SELECT COUNT(*) as count FROM stores');
  if (storeCount.count === 0) {
    await db.run(`INSERT INTO stores (name, location) VALUES ('TechStore Central', 'Lima Centro'), ('TechStore Miraflores', 'Miraflores')`);
    console.log('Tiendas iniciales creadas.');
  }

  console.log(' Base de datos e inicialización de tablas completada.');
}

module.exports = initDatabase;