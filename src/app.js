require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const initDatabase = require('./models/initDb');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Servir la interfaz web estática desde la carpeta public (servirá index.html en '/')
app.use(express.static(path.join(__dirname, '../public')));

// Endpoints de la API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// Endpoint de prueba de la API (se cambió a /api/health para no sobreescribir '/')
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API TechStore Cloud Security activa y funcionando 🚀' });
});

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