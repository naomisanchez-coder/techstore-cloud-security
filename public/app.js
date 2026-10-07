// ESTADO GLOBAL DE LA APLICACIÓN
let state = {
  token: localStorage.getItem('techstore_token') || null,
  user: JSON.parse(localStorage.getItem('techstore_user') || 'null'),
  products: [],
  pendingUserId: null
};

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
  if (state.token && state.user) {
    showDashboard();
  } else {
    showAuth();
  }
});

// SISTEMA DE NOTIFICACIONES (TOAST)
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  
  const bgColor = type === 'success' ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200' : 'bg-rose-950/90 border-rose-500/40 text-rose-200';
  const icon = type === 'success' ? 'fa-circle-check text-emerald-400' : 'fa-circle-xmark text-rose-400';

  toast.className = `toast-anim pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl ${bgColor}`;
  toast.innerHTML = `
    <div class="flex items-center gap-3">
      <i class="fa-solid ${icon} text-lg"></i>
      <span class="text-xs font-medium">${message}</span>
    </div>
    <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark text-xs"></i></button>
  `;

  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// CONTROL DE PESTAÑAS (LOGIN / REGISTRO)
function switchAuthTab(tab) {
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');

  if (tab === 'login') {
    formLogin.classList.remove('hidden');
    formRegister.classList.add('hidden');
    tabLogin.className = 'flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 bg-indigo-600 text-white shadow-md';
    tabRegister.className = 'flex-1 py-2 text-sm font-semibold rounded-lg text-slate-400 hover:text-white transition-all duration-200';
  } else {
    formLogin.classList.add('hidden');
    formRegister.classList.remove('hidden');
    tabRegister.className = 'flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 bg-indigo-600 text-white shadow-md';
    tabLogin.className = 'flex-1 py-2 text-sm font-semibold rounded-lg text-slate-400 hover:text-white transition-all duration-200';
  }
}

// 1. LOGIN DE USUARIO
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.success && data.mfaRequired) {
      state.pendingUserId = data.userId;
      showToast('Credenciales correctas. Ingrese el código MFA enviado a su correo.');
      document.getElementById('mfa-modal').classList.remove('hidden');
    } else {
      showToast(data.message || 'Error de autenticación', 'error');
    }
  } catch (err) {
    showToast('Error de conexión con el servidor', 'error');
  }
}

// 2. VERIFICACIÓN MFA
async function handleVerifyMFA(e) {
  e.preventDefault();
  const code = document.getElementById('mfa-code').value.trim();

  try {
    const res = await fetch('/api/auth/verify-mfa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: state.pendingUserId, code })
    });

    const data = await res.json();

    if (data.success) {
      state.token = data.token;
      state.user = data.user;
      localStorage.setItem('techstore_token', data.token);
      localStorage.setItem('techstore_user', JSON.stringify(data.user));

      closeMFAModal();
      showToast(`¡Bienvenido/a ${data.user.full_name}!`);
      showDashboard();
    } else {
      showToast(data.message || 'Código MFA incorrecto', 'error');
    }
  } catch (err) {
    showToast('Error al verificar código MFA', 'error');
  }
}

function closeMFAModal() {
  document.getElementById('mfa-modal').classList.add('hidden');
  document.getElementById('mfa-code').value = '';
}

// 3. REGISTRO DE USUARIO
async function handleRegister(e) {
  e.preventDefault();
  const fullName = document.getElementById('reg-fullName').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const role = document.getElementById('reg-role').value;
  const storeId = parseInt(document.getElementById('reg-storeId').value);

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName, role, store_id: storeId })
    });

    const data = await res.json();

    if (data.success) {
      showToast('Usuario registrado con éxito. Ya puede iniciar sesión.');
      switchAuthTab('login');
      document.getElementById('login-email').value = email;
    } else {
      const msg = Array.isArray(data.errors) ? data.errors.join(' ') : data.message;
      showToast(msg || 'Error al registrar', 'error');
    }
  } catch (err) {
    showToast('Error de servidor al registrar usuario', 'error');
  }
}

// CERRAR SESIÓN
function handleLogout() {
  localStorage.removeItem('techstore_token');
  localStorage.removeItem('techstore_user');
  state.token = null;
  state.user = null;
  showToast('Sesión cerrada correctamente');
  showAuth();
}

// VISTAS
function showAuth() {
  document.getElementById('auth-section').classList.remove('hidden');
  document.getElementById('dashboard-section').classList.add('hidden');
}

function showDashboard() {
  document.getElementById('auth-section').classList.add('hidden');
  document.getElementById('dashboard-section').classList.remove('hidden');

  // Cargar Info del Usuario
  document.getElementById('user-display-name').textContent = state.user.full_name;
  document.getElementById('user-display-role').textContent = state.user.role;
  document.getElementById('user-display-store').textContent = `Tienda ID: ${state.user.store_id}`;
  document.getElementById('stat-access-level').textContent = state.user.role;

  // Habilitar botón según Rol
  const btnAdd = document.getElementById('btn-add-product');
  if (state.user.role === 'Administrador del Sistema' || state.user.role === 'Gerente de Tienda') {
    btnAdd.classList.remove('hidden');
  } else {
    btnAdd.classList.add('hidden');
  }

  fetchProducts();
}

// 4. OBTENER PRODUCTOS (GET)
async function fetchProducts() {
  try {
    const res = await fetch('/api/products', {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });

    const data = await res.json();

    if (data.success) {
      state.products = data.data;
      updateStats();
      renderProductsTable();
    } else {
      showToast(data.message || 'Error al cargar inventario', 'error');
    }
  } catch (err) {
    showToast('Error al conectar con la API de productos', 'error');
  }
}

// ACTUALIZAR TARJETAS DE MÉTRICAS
function updateStats() {
  document.getElementById('stat-total-products').textContent = state.products.length;
  const lowStock = state.products.filter(p => p.stock < 5).length;
  document.getElementById('stat-low-stock').textContent = lowStock;
}

// RENDERIZAR TABLA CON PERMISOS RBAC
function renderProductsTable() {
  const tbody = document.getElementById('products-table-body');
  const search = document.getElementById('search-input').value.toLowerCase();
  
  const filtered = state.products.filter(p => p.name.toLowerCase().includes(search));

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="py-8 text-center text-slate-500 text-xs">
          <i class="fa-solid fa-box-open text-2xl mb-2 block"></i>
          No hay productos registrados en esta tienda.
        </td>
      </tr>
    `;
    return;
  }

  const role = state.user.role;

  tbody.innerHTML = filtered.map(p => {
    const isLow = p.stock < 5;
    const stockBadge = isLow 
      ? `<span class="px-2 py-1 text-[11px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">${p.stock} unidades (Bajo)</span>`
      : `<span class="px-2 py-1 text-[11px] font-medium rounded-full bg-slate-800 text-slate-300">${p.stock} unidades</span>`;

    // Botones dinámicos según permisos de Rol
    let actionsHtml = '';

    if (role === 'Auditor') {
      actionsHtml = `<span class="text-[11px] text-slate-500 font-medium"><i class="fa-solid fa-eye mr-1"></i>Solo Lectura</span>`;
    } else {
      // Modificar Stock (Admin, Gerente, Empleado)
      actionsHtml += `
        <button onclick="promptUpdateStock(${p.id}, ${p.stock})" class="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg text-xs font-semibold mr-1" title="Cambiar Stock">
          <i class="fa-solid fa-boxes-stacked mr-1"></i>Stock
        </button>
      `;

      // Modificar Precio (Admin, Gerente)
      if (role === 'Administrador del Sistema' || role === 'Gerente de Tienda') {
        actionsHtml += `
          <button onclick="promptUpdatePrice(${p.id}, ${p.price})" class="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg text-xs font-semibold mr-1" title="Cambiar Precio">
            <i class="fa-solid fa-tag mr-1"></i>Precio
          </button>
          <button onclick="handleDeleteProduct(${p.id})" class="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-semibold" title="Eliminar">
            <i class="fa-solid fa-trash"></i>
          </button>
        `;
      }
    }

    return `
      <tr class="hover:bg-slate-900/40 transition">
        <td class="py-4 px-6 font-semibold text-white flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/20">
            <i class="fa-solid fa-laptop"></i>
          </div>
          <span>${p.name}</span>
        </td>
        <td class="py-4 px-6 text-slate-400 text-xs">${p.store_name}</td>
        <td class="py-4 px-6 font-bold text-emerald-400">S/. ${Number(p.price).toFixed(2)}</td>
        <td class="py-4 px-6">${stockBadge}</td>
        <td class="py-4 px-6 text-right">${actionsHtml}</td>
      </tr>
    `;
  }).join('');
}

// 5. CREAR PRODUCTO (POST)
async function handleCreateProduct(e) {
  e.preventDefault();
  const name = document.getElementById('prod-name').value;
  const price = parseFloat(document.getElementById('prod-price').value);
  const stock = parseInt(document.getElementById('prod-stock').value);
  const store_id = parseInt(document.getElementById('prod-storeId').value);

  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({ name, price, stock, store_id })
    });

    const data = await res.json();

    if (data.success) {
      showToast('Producto agregado exitosamente');
      closeAddProductModal();
      fetchProducts();
    } else {
      showToast(data.message || 'Error al guardar producto', 'error');
    }
  } catch (err) {
    showToast('Error al conectar con la API', 'error');
  }
}

function openAddProductModal() {
  document.getElementById('add-product-modal').classList.remove('hidden');
}

function closeAddProductModal() {
  document.getElementById('add-product-modal').classList.add('hidden');
}

// 6. ACTUALIZAR STOCK (PATCH)
async function promptUpdateStock(id, currentStock) {
  const newStockStr = prompt('Ingrese la nueva cantidad de stock:', currentStock);
  if (newStockStr === null) return;
  const stock = parseInt(newStockStr);

  try {
    const res = await fetch(`/api/products/${id}/stock`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({ stock })
    });

    const data = await res.json();
    if (data.success) {
      showToast(data.message);
      fetchProducts();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Error al actualizar stock', 'error');
  }
}

// 7. ACTUALIZAR PRECIO (PATCH)
async function promptUpdatePrice(id, currentPrice) {
  const newPriceStr = prompt('Ingrese el nuevo precio en Soles (S/.):', currentPrice);
  if (newPriceStr === null) return;
  const price = parseFloat(newPriceStr);

  try {
    const res = await fetch(`/api/products/${id}/price`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({ price })
    });

    const data = await res.json();
    if (data.success) {
      showToast(data.message);
      fetchProducts();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Error al actualizar precio', 'error');
  }
}

// 8. ELIMINAR PRODUCTO (DELETE)
async function handleDeleteProduct(id) {
  if (!confirm('¿Está seguro de que desea eliminar este producto?')) return;

  try {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${state.token}` }
    });

    const data = await res.json();
    if (data.success) {
      showToast('Producto eliminado');
      fetchProducts();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Error al eliminar producto', 'error');
  }
}