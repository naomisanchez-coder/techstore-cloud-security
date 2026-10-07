const express = require('express');
const router = express.Router();
const {
  getProducts,
  createProduct,
  updateStock,
  updatePrice,
  deleteProduct
} = require('../controllers/productController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Todas las rutas requieren un Token JWT válido
router.use(authenticateToken);

// GET /api/products -> Accesible por todos los roles
router.get('/', authorizeRoles('Administrador del Sistema', 'Gerente de Tienda', 'Empleado de Ventas', 'Auditor'), getProducts);

// POST /api/products -> Solo Admin y Gerente de Tienda
router.post('/', authorizeRoles('Administrador del Sistema', 'Gerente de Tienda'), createProduct);

// PATCH /api/products/:id/stock -> Admin, Gerente y Empleado de Ventas
router.patch('/:id/stock', authorizeRoles('Administrador del Sistema', 'Gerente de Tienda', 'Empleado de Ventas'), updateStock);

// PATCH /api/products/:id/price -> Solo Admin y Gerente (Empleado de Ventas está EXCLUIDO)
router.patch('/:id/price', authorizeRoles('Administrador del Sistema', 'Gerente de Tienda'), updatePrice);

// DELETE /api/products/:id -> Admin y Gerente (restringido a su propia tienda)
router.delete('/:id', authorizeRoles('Administrador del Sistema', 'Gerente de Tienda'), deleteProduct);

module.exports = router;