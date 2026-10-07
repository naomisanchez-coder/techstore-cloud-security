const getDbConnection = require('../config/db');

// 1. Consultar todos los productos (Todos los roles autenticados)
async function getProducts(req, res) {
  try {
    const db = await getDbConnection();
    const products = await db.all(`
      SELECT p.id, p.name, p.price, p.stock, p.store_id, s.name as store_name 
      FROM products p 
      JOIN stores s ON p.store_id = s.id
    `);
    return res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return res.status(500).json({ success: false, message: 'Error en el servidor.' });
  }
}

// 2. Crear producto (Administrador del Sistema y Gerente de Tienda)
async function createProduct(req, res) {
  try {
    const { name, price, stock, store_id } = req.body;
    const db = await getDbConnection();

    // Restricción: Un Gerente de Tienda solo crea productos para la tienda asignada a él
    if (req.user.role === 'Gerente de Tienda' && req.user.store_id !== parseInt(store_id)) {
      return res.status(403).json({
        success: false,
        message: 'Un Gerente de Tienda solo puede agregar productos a su tienda asignada.'
      });
    }

    const result = await db.run(
      'INSERT INTO products (name, price, stock, store_id) VALUES (?, ?, ?, ?)',
      [name, price, stock, store_id]
    );

    return res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente.',
      productId: result.lastID
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    return res.status(500).json({ success: false, message: 'Error al crear producto.' });
  }
}

// 3. Actualizar Stock en tiempo real (Administrador, Gerente y Empleado de Ventas)
async function updateStock(req, res) {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    const db = await getDbConnection();

    const product = await db.get('SELECT * FROM products WHERE id = ?', [id]);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
    }

    await db.run('UPDATE products SET stock = ? WHERE id = ?', [stock, id]);

    return res.status(200).json({
      success: true,
      message: `Stock del producto '${product.name}' actualizado a ${stock} unidades.`
    });
  } catch (error) {
    console.error('Error al actualizar stock:', error);
    return res.status(500).json({ success: false, message: 'Error al actualizar stock.' });
  }
}

// 4. Actualizar Precio (Administrador y Gerente. Empleado de Ventas NO puede)
async function updatePrice(req, res) {
  try {
    const { id } = req.params;
    const { price } = req.body;
    const db = await getDbConnection();

    const product = await db.get('SELECT * FROM products WHERE id = ?', [id]);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
    }

    await db.run('UPDATE products SET price = ? WHERE id = ?', [price, id]);

    return res.status(200).json({
      success: true,
      message: `Precio del producto '${product.name}' actualizado a S/. ${price}`
    });
  } catch (error) {
    console.error('Error al actualizar precio:', error);
    return res.status(500).json({ success: false, message: 'Error al actualizar precio.' });
  }
}

// 5. Eliminar Producto (Administrador y Gerente restringido a su propia tienda)
async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const db = await getDbConnection();

    const product = await db.get('SELECT * FROM products WHERE id = ?', [id]);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
    }

    // Regla de Negocio: El Gerente NO puede eliminar productos de otras tiendas
    if (req.user.role === 'Gerente de Tienda' && req.user.store_id !== product.store_id) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado: Un Gerente de Tienda no puede eliminar productos de otras tiendas.'
      });
    }

    await db.run('DELETE FROM products WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Producto eliminado correctamente.'
    });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    return res.status(500).json({ success: false, message: 'Error al eliminar producto.' });
  }
}

module.exports = {
  getProducts,
  createProduct,
  updateStock,
  updatePrice,
  deleteProduct
};