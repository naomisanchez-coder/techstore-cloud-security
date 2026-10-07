require('dotenv').config();
const express = require('express');
const cors = require('cors');
const initDatabase = require('./models/initDb');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json());

// Rutas de la API
app.use('/api/auth', authRoutes);

// Ruta de prueba (Health Check)
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API TechStore Cloud Security activa y funcionando 🚀' 
  });
});

// Inicialización de la Base de Datos y Servidor
async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`\n==================================================`);
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`==================================================\n`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();