const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

let dbInstance = null;

async function getDbConnection() {
  if (!dbInstance) {
    dbInstance = await open({
      filename: path.join(__dirname, '../../techstore.db'),
      driver: sqlite3.Database
    });
    // Activar soporte para llaves foráneas en SQLite
    await dbInstance.run('PRAGMA foreign_keys = ON;');
  }
  return dbInstance;
}

module.exports = getDbConnection;