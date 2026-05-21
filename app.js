/* =============================================
   StockFlow – Application Logic (app.js)
   ============================================= */

'use strict';

// ─── State ────────────────────────────────────────────────────────────────────

const STATE = {
  products: [],
  categories: [],
  editingProductId: null,
  selectedColor: '#6366f1',
  deletingProductId: null,
};

// ─── Persistence ──────────────────────────────────────────────────────────────

function save() {
  localStorage.setItem('sf_products',   JSON.stringify(STATE.products));
  localStorage.setItem('sf_categories', JSON.stringify(STATE.categories));
}

function load() {
  try {
    STATE.products   = JSON.parse(localStorage.getItem('sf_products'))   || [];
    STATE.categories = JSON.parse(localStorage.getItem('sf_categories')) || [];
  } catch {
    STATE.products = []; STATE.categories = [];
  }

  // Seed demo data on first run
  if (!STATE.products.length && !STATE.categories.length) {
    seedDemo();
  }
}

function seedDemo() {
  STATE.categories = [
    { id: uid(), name: 'Electronics',  color: '#6366f1' },
    { id: uid(), name: 'Accessories',  color: '#0ea5e9' },
    { id: uid(), name: 'Office',       color: '#10b981' },
    { id: uid(), name: 'Stationery',   color: '#f59e0b' },
  ];

  const cats = STATE.categories;
  STATE.products = [
    { id: uid(), name: 'Wireless Mouse',        sku: 'WM-001', categoryId: cats[0].id, price: 29.99,  stock: 45,  lowThreshold: 10, description: 'Ergonomic wireless mouse' },
    { id: uid(), name: 'Mechanical Keyboard',   sku: 'KB-002', categoryId: cats[0].id, price: 89.99,  stock: 8,   lowThreshold: 10, description: 'RGB mechanical keyboard' },
    { id: uid(), name: 'USB-C Hub',             sku: 'HC-003', categoryId: cats[1].id, price: 44.99,  stock: 0,   lowThreshold: 5,  description: '7-in-1 USB-C hub' },
    { id: uid(), name: 'Monitor Stand',         sku: 'MS-004', categoryId: cats[2].id, price: 35.00,  stock: 22,  lowThreshold: 5,  description: 'Adjustable monitor stand' },
    { id: uid(), name: 'Notebook A5',           sku: 'NB-005', categoryId: cats[3].id, price: 6.50,   stock: 5,   lowThreshold: 15, description: '100-page ruled notebook' },
    { id: uid(), name: 'Webcam HD 1080p',       sku: 'WC-006', categoryId: cats[0].id, price: 64.99,  stock: 31,  lowThreshold: 5,  description: 'Full HD webcam with mic' },
    { id: uid(), name: 'Desk Lamp LED',         sku: 'DL-007', categoryId: cats[2].id, price: 28.00,  stock: 14,  lowThreshold: 5,  description: 'Dimmable LED desk lamp' },
    { id: uid(), name: 'Sticky Notes Pack',     sku: 'SN-008', categoryId: cats[3].id, price: 3.99,   stock: 120, lowThreshold: 20, description: 'Pack of 5 sticky note pads' },
  ];
  save();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function formatPrice(n) {
  return '$' + Number(n).toFixed(2);
}

function getCategory(id) {
  return STATE.categories.find(c => c.id === id) || null;
}

function getStockStatus(product) {
  if (product.stock === 0) return 'out-of-stock';
  if (product.stock <= product.lowThreshold) return 'low-stock';
  return 'in-stock';
}

function statusLabel(s) {
  return { 'in-stock': 'In Stock', 'low-stock': 'Low Stock', 'out-of-stock': 'Out of Stock' }[s];
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function toast(message, type = 'success') {
  const icons = {
    success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
    error:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    warning: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>`,
  };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = icons[type] + `<span>${message}</span>`;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// ─── Navigation ───────────────────────────────────────────────────────────────

const pageConfig = {
  dashboard:  { title: 'Dashboard',  subtitle: 'Welcome back! Here\'s what\'s happening.' },
  inventory:  { title: 'Inventory',  subtitle: 'Manage and track all your products.' },
  alerts:     { title: 'Alerts',     subtitle: 'Products that need your attention.' },
  categories: { title: 'Categories', subtitle: 'Organize your products into categories.' },
};

function navigateTo(page) {
  // Update pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');

  // Update nav
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navItem = document.getElementById(`nav-${page}`);
  if (navItem) navItem.classList.add('active');

  // Update header
  const cfg = pageConfig[page];
  document.getElementById('pageTitle').textContent    = cfg.title;
  document.getElementById('pageSubtitle').textContent = cfg.subtitle;

  // Re-render if needed
  if (page === 'inventory')  renderInventory();
  if (page === 'alerts')     renderAlerts();
  if (page === 'categories') renderCategories();
  if (page === 'dashboard')  renderDashboard();
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function renderDashboard() {
  const total  = STATE.products.length;
  const value  = STATE.products.reduce((s, p) => s + p.price * p.stock, 0);
  const low    = STATE.products.filter(p => getStockStatus(p) !== 'in-stock').length;
  const cats   = STATE.categories.length;

  document.getElementById('totalProducts').textContent  = total;
  document.getElementById('totalValue').textContent     = formatPrice(value);
  document.getElementById('lowStockCount').textContent  = low;
  document.getElementById('totalCategories').textContent = cats;

  // Recent table — show last 5
  const recent = [...STATE.products].reverse().slice(0, 5);
  const tbody  = document.getElementById('recentTableBody');

  if (!recent.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="5">No products yet. Add your first product!</td></tr>`;
    return;
  }

  tbody.innerHTML = recent.map(p => {
    const cat    = getCategory(p.categoryId);
    const status = getStockStatus(p);
    return `
      <tr>
        <td><div class="product-name">${escHtml(p.name)}</div></td>
        <td>${cat ? `<span class="cat-chip" style="background:${cat.color}">${escHtml(cat.name)}</span>` : '—'}</td>
        <td>${p.stock}</td>
        <td>${formatPrice(p.price)}</td>
        <td><span class="status-chip status-${status}">${statusLabel(status)}</span></td>
      </tr>`;
  }).join('');
}

// ─── Inventory ────────────────────────────────────────────────────────────────

function renderInventory() {
  const search  = (document.getElementById('searchInput').value || '').toLowerCase();
  const catF    = document.getElementById('categoryFilter').value;
  const statusF = document.getElementById('statusFilter').value;

  let products = STATE.products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search) ||
                        (p.sku || '').toLowerCase().includes(search);
    const matchCat    = !catF    || p.categoryId === catF;
    const matchStatus = !statusF || getStockStatus(p) === statusF;
    return matchSearch && matchCat && matchStatus;
  });

  const tbody = document.getElementById('inventoryTableBody');

  if (!products.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="8">${STATE.products.length ? 'No products match your search.' : 'No products yet. Click "Add Product" to get started.'}</td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(p => {
    const cat    = getCategory(p.categoryId);
    const status = getStockStatus(p);
    const value  = p.price * p.stock;
    return `
      <tr data-id="${p.id}">
        <td>
          <div class="product-name">${escHtml(p.name)}</div>
          ${p.description ? `<div class="product-desc">${escHtml(p.description.slice(0, 48))}${p.description.length > 48 ? '…' : ''}</div>` : ''}
        </td>
        <td>${p.sku ? `<span class="sku-badge">${escHtml(p.sku)}</span>` : '—'}</td>
        <td>${cat ? `<span class="cat-chip" style="background:${cat.color}">${escHtml(cat.name)}</span>` : '—'}</td>
        <td><strong>${p.stock}</strong></td>
        <td>${formatPrice(p.price)}</td>
        <td>${formatPrice(value)}</td>
        <td><span class="status-chip status-${status}">${statusLabel(status)}</span></td>
        <td>
          <div class="action-btns">
            <button class="btn-icon" title="Edit" data-action="edit" data-id="${p.id}" aria-label="Edit ${escHtml(p.name)}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="btn-icon danger" title="Delete" data-action="delete" data-id="${p.id}" aria-label="Delete ${escHtml(p.name)}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

function renderAlerts() {
  const problems = STATE.products.filter(p => getStockStatus(p) !== 'in-stock')
    .sort((a, b) => a.stock - b.stock);

  const badge = document.getElementById('alertBadge');
  if (problems.length) {
    badge.textContent = problems.length;
    badge.classList.add('show');
  } else {
    badge.classList.remove('show');
  }

  document.getElementById('alertsCount').textContent = `${problems.length} alert${problems.length !== 1 ? 's' : ''}`;

  const list = document.getElementById('alertsList');
  if (!problems.length) {
    list.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <p>No alerts! All stock levels are healthy.</p>
      </div>`;
    return;
  }

  list.innerHTML = problems.map(p => {
    const isOut = p.stock === 0;
    const cat   = getCategory(p.categoryId);
    return `
      <div class="alert-item">
        <div class="alert-icon ${isOut ? 'out' : 'low'}">
          ${isOut
            ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`
            : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`}
        </div>
        <div class="alert-info">
          <div class="alert-product">${escHtml(p.name)} ${cat ? `<span class="cat-chip" style="background:${cat.color};font-size:10px;">${escHtml(cat.name)}</span>` : ''}</div>
          <div class="alert-detail">${isOut ? 'Out of stock' : `Only ${p.stock} left (threshold: ${p.lowThreshold})`} · ${p.sku ? `SKU: ${escHtml(p.sku)}` : 'No SKU'}</div>
        </div>
        <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${p.id}">Restock</button>
      </div>`;
  }).join('');
}

// ─── Categories ───────────────────────────────────────────────────────────────

function renderCategories() {
  const grid = document.getElementById('categoriesGrid');

  if (!STATE.categories.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/>
        </svg>
        <p>No categories yet. Add your first category!</p>
      </div>`;
    return;
  }

  grid.innerHTML = STATE.categories.map(cat => {
    const count = STATE.products.filter(p => p.categoryId === cat.id).length;
    return `
      <div class="category-card">
        <div class="category-card-header">
          <div class="cat-dot" style="background:${cat.color}"></div>
          <button class="cat-delete" data-cat-id="${cat.id}" title="Delete category" aria-label="Delete ${escHtml(cat.name)}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="cat-name">${escHtml(cat.name)}</div>
        <div class="cat-count">${count} product${count !== 1 ? 's' : ''}</div>
      </div>`;
  }).join('');
}

// ─── Category dropdown sync ───────────────────────────────────────────────────

function syncCategorySelects() {
  const opts = STATE.categories.map(c => `<option value="${c.id}">${escHtml(c.name)}</option>`).join('');
  ['productCategory', 'categoryFilter'].forEach(id => {
    const el = document.getElementById(id);
    const currentVal = el.value;
    if (id === 'categoryFilter') {
      el.innerHTML = `<option value="">All Categories</option>` + opts;
    } else {
      el.innerHTML = `<option value="">Select category…</option>` + opts;
    }
    el.value = currentVal;
  });
}

// ─── Product Modal ────────────────────────────────────────────────────────────

function openAddProductModal() {
  STATE.editingProductId = null;
  document.getElementById('modalTitle').textContent = 'Add Product';
  document.getElementById('saveProduct').textContent = 'Save Product';
  clearProductForm();
  syncCategorySelects();
  openModal('productModal');
}

function openEditProductModal(id) {
  const product = STATE.products.find(p => p.id === id);
  if (!product) return;
  STATE.editingProductId = id;
  document.getElementById('modalTitle').textContent = 'Edit Product';
  document.getElementById('saveProduct').textContent = 'Update Product';
  syncCategorySelects();

  document.getElementById('productId').value           = product.id;
  document.getElementById('productName').value         = product.name;
  document.getElementById('productSku').value          = product.sku || '';
  document.getElementById('productCategory').value     = product.categoryId || '';
  document.getElementById('productPrice').value        = product.price;
  document.getElementById('productStock').value        = product.stock;
  document.getElementById('productLowThreshold').value = product.lowThreshold || 10;
  document.getElementById('productDescription').value  = product.description || '';

  clearErrors();
  openModal('productModal');
}

function clearProductForm() {
  ['productId','productName','productSku','productDescription'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('productCategory').value     = '';
  document.getElementById('productPrice').value        = '';
  document.getElementById('productStock').value        = '';
  document.getElementById('productLowThreshold').value = '10';
  clearErrors();
}

function clearErrors() {
  ['nameError','categoryError','priceError','stockError'].forEach(id => {
    document.getElementById(id).textContent = '';
  });
  ['productName','productCategory','productPrice','productStock'].forEach(id => {
    document.getElementById(id).classList.remove('error');
  });
}

function validateProduct() {
  let valid = true;
  const name     = document.getElementById('productName').value.trim();
  const category = document.getElementById('productCategory').value;
  const price    = document.getElementById('productPrice').value;
  const stock    = document.getElementById('productStock').value;

  if (!name) {
    showError('productName', 'nameError', 'Product name is required.');
    valid = false;
  }
  if (!category) {
    showError('productCategory', 'categoryError', 'Please select a category.');
    valid = false;
  }
  if (!price || isNaN(price) || Number(price) < 0) {
    showError('productPrice', 'priceError', 'Enter a valid price.');
    valid = false;
  }
  if (stock === '' || isNaN(stock) || Number(stock) < 0) {
    showError('productStock', 'stockError', 'Enter a valid stock quantity.');
    valid = false;
  }
  return valid;
}

function showError(fieldId, errId, msg) {
  document.getElementById(fieldId).classList.add('error');
  document.getElementById(errId).textContent = msg;
}

function saveProduct() {
  if (!validateProduct()) return;

  const data = {
    name:         document.getElementById('productName').value.trim(),
    sku:          document.getElementById('productSku').value.trim(),
    categoryId:   document.getElementById('productCategory').value,
    price:        parseFloat(document.getElementById('productPrice').value),
    stock:        parseInt(document.getElementById('productStock').value, 10),
    lowThreshold: parseInt(document.getElementById('productLowThreshold').value, 10) || 10,
    description:  document.getElementById('productDescription').value.trim(),
  };

  if (STATE.editingProductId) {
    const idx = STATE.products.findIndex(p => p.id === STATE.editingProductId);
    if (idx > -1) STATE.products[idx] = { ...STATE.products[idx], ...data };
    toast('Product updated successfully!');
  } else {
    STATE.products.unshift({ id: uid(), ...data });
    toast('Product added successfully!');
  }

  save();
  closeModal('productModal');
  renderDashboard();
  renderInventory();
  renderAlerts();
}

// ─── Category Modal ───────────────────────────────────────────────────────────

function openCategoryModal() {
  document.getElementById('categoryName').value = '';
  document.getElementById('catNameError').textContent = '';
  STATE.selectedColor = '#6366f1';
  document.querySelectorAll('.swatch').forEach(s => {
    s.classList.toggle('active', s.dataset.color === STATE.selectedColor);
  });
  openModal('categoryModal');
}

function saveCategory() {
  const name = document.getElementById('categoryName').value.trim();
  if (!name) {
    document.getElementById('catNameError').textContent = 'Category name is required.';
    return;
  }
  if (STATE.categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
    document.getElementById('catNameError').textContent = 'Category already exists.';
    return;
  }
  STATE.categories.push({ id: uid(), name, color: STATE.selectedColor });
  save();
  syncCategorySelects();
  renderCategories();
  closeModal('categoryModal');
  toast('Category added!');
}

function deleteCategory(id) {
  const cat = STATE.categories.find(c => c.id === id);
  if (!cat) return;
  const hasProducts = STATE.products.some(p => p.categoryId === id);
  if (hasProducts) {
    toast(`Remove or reassign products in "${cat.name}" first.`, 'warning');
    return;
  }
  STATE.categories = STATE.categories.filter(c => c.id !== id);
  save();
  syncCategorySelects();
  renderCategories();
  renderDashboard();
  toast('Category deleted.');
}

// ─── Delete Product ───────────────────────────────────────────────────────────

function openDeleteModal(id) {
  STATE.deletingProductId = id;
  const product = STATE.products.find(p => p.id === id);
  if (!product) return;
  document.getElementById('deleteProductName').textContent = product.name;
  openModal('deleteModal');
}

function confirmDelete() {
  STATE.products = STATE.products.filter(p => p.id !== STATE.deletingProductId);
  STATE.deletingProductId = null;
  save();
  closeModal('deleteModal');
  renderDashboard();
  renderInventory();
  renderAlerts();
  toast('Product deleted.', 'warning');
}

// ─── Modal Helpers ────────────────────────────────────────────────────────────

function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// ─── XSS helper ───────────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── Event Wiring ─────────────────────────────────────────────────────────────

function init() {
  load();

  // Nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(item.dataset.page);
    });
  });

  // View all link on dashboard
  document.getElementById('viewAllBtn').addEventListener('click', e => {
    e.preventDefault();
    navigateTo('inventory');
  });

  // Add product button
  document.getElementById('addProductBtn').addEventListener('click', openAddProductModal);

  // Product modal
  document.getElementById('closeProductModal').addEventListener('click',  () => closeModal('productModal'));
  document.getElementById('cancelProductModal').addEventListener('click', () => closeModal('productModal'));
  document.getElementById('saveProduct').addEventListener('click', saveProduct);

  // Close modal on overlay click
  document.getElementById('productModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal('productModal');
  });

  // Category modal
  document.getElementById('addCategoryBtn').addEventListener('click', openCategoryModal);
  document.getElementById('closeCategoryModal').addEventListener('click',  () => closeModal('categoryModal'));
  document.getElementById('cancelCategoryModal').addEventListener('click', () => closeModal('categoryModal'));
  document.getElementById('saveCategory').addEventListener('click', saveCategory);
  document.getElementById('categoryModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal('categoryModal');
  });

  // Color swatches
  document.getElementById('colorSwatches').addEventListener('click', e => {
    const swatch = e.target.closest('.swatch');
    if (!swatch) return;
    document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
    swatch.classList.add('active');
    STATE.selectedColor = swatch.dataset.color;
  });

  // Delete modal
  document.getElementById('closeDeleteModal').addEventListener('click',  () => closeModal('deleteModal'));
  document.getElementById('cancelDelete').addEventListener('click',       () => closeModal('deleteModal'));
  document.getElementById('confirmDelete').addEventListener('click', confirmDelete);
  document.getElementById('deleteModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal('deleteModal');
  });

  // Inventory: delegated actions (edit/delete) for table rows and alert restock
  document.getElementById('inventoryTableBody').addEventListener('click', handleTableAction);
  document.getElementById('alertsList').addEventListener('click', handleTableAction);

  // Category delete
  document.getElementById('categoriesGrid').addEventListener('click', e => {
    const btn = e.target.closest('[data-cat-id]');
    if (btn) deleteCategory(btn.dataset.catId);
  });

  // Inventory filters
  document.getElementById('searchInput').addEventListener('input', renderInventory);
  document.getElementById('categoryFilter').addEventListener('change', renderInventory);
  document.getElementById('statusFilter').addEventListener('change', renderInventory);

  // Enter key in forms
  document.getElementById('productName').addEventListener('keydown', e => {
    if (e.key === 'Enter') saveProduct();
  });
  document.getElementById('categoryName').addEventListener('keydown', e => {
    if (e.key === 'Enter') saveCategory();
  });

  // Initial render
  syncCategorySelects();
  renderDashboard();
  renderAlerts();
}

function handleTableAction(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const { action, id } = btn.dataset;
  if (action === 'edit')   openEditProductModal(id);
  if (action === 'delete') openDeleteModal(id);
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
