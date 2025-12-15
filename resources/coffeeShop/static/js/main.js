const CART_KEY = 'coffee-kiosk-cart';

const CATEGORIES = [
  { id: 'cappuccino', label: 'Cappuccino' },
  { id: 'latte', label: 'Latte' },
  { id: 'americano', label: 'Americano' },
  { id: 'expresso', label: 'Expresso' },
  { id: 'flat-white', label: 'Flat White' }
];

const BASE_PRODUCTS = [
  { id: 'cinnamonAndCocoa', price: 99, fileName: 'cinnamonAndCocoa.png' },
  { id: 'drizzledWithCaramel', price: 99, fileName: 'drizzledWithCaramel.png' },
  { id: 'burstingBlueberry', price: 99, fileName: 'burstingBlueberry.png' },
  { id: 'cocoAndVanillaCream', price: 99, fileName: 'cocoAndVanillaCream.png' },
  { id: 'dalgonaMacha', price: 99, fileName: 'dalgonaMacha.png' },
  { id: 'whippedChocolate', price: 99, fileName: 'whippedChocolate.png' }
];

function camelCaseToTitle(str) {
  if (!str) {
    return '';
  }
  const withSpaces = str.replace(/([a-z])([A-Z])/g, '$1 $2');
  const lower = withSpaces.toLowerCase();
  const titled = lower.replace(/\b\w/g, ch => ch.toUpperCase());
  return titled.replace(/\bAnd\b/g, 'and');
}

function fileNameToTitle(fileName) {
  if (!fileName) {
    return '';
  }
  const base = fileName.replace(/\.[^.]+$/, '');
  return camelCaseToTitle(base);
}

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function assignRandomCategories(products, categories) {
  const categoryIds = categories.map(c => c.id);

  const assigned = products.map(p => {
    const set = new Set();
    set.add(randomPick(categoryIds));
    if (Math.random() < 0.55) {
      let c2 = randomPick(categoryIds);
      while (set.has(c2)) c2 = randomPick(categoryIds);
      set.add(c2);
    }
    if (Math.random() < 0.25) {
      let c3 = randomPick(categoryIds);
      while (set.has(c3)) c3 = randomPick(categoryIds);
      set.add(c3);
    }
    return { ...p, categoryIds: Array.from(set) };
  });

  categoryIds.forEach(cid => {
    if (!assigned.some(p => p.categoryIds.includes(cid))) {
      const p = randomPick(assigned);
      if (!p.categoryIds.includes(cid)) {
        p.categoryIds.push(cid);
      }
    }
  });

  return assigned;
}

const PRODUCTS = assignRandomCategories(BASE_PRODUCTS, CATEGORIES);
const PRODUCT_MAP = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function cartTotalCount(cart) {
  return cart.reduce((s, i) => s + (i.qty || 0), 0);
}

function getCartTotals(cart) {
  const count = cartTotalCount(cart);
  const subtotal = cart.reduce((s, i) => s + (i.qty || 0) * (i.unitPrice || i.price || 0), 0);
  const discount = Math.round(subtotal * 0.1);
  const total = subtotal - discount;
  return { count, subtotal, discount, total };
}

function updateCartCounter() {
  const cart = loadCart();
  const el = document.getElementById('order-count');
  if (el) {
    el.textContent = String(cartTotalCount(cart));
  }
}

function renderCategories(activeId) {
  const list = document.getElementById('categories-list');
  if (!list) {
    return;
  }

  list.innerHTML = '';

  CATEGORIES.forEach(cat => {
    const li = document.createElement('li');
    li.className = 'categories__item';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'categories__button';
    btn.dataset.categoryId = cat.id;
    btn.textContent = cat.label;

    if (cat.id === activeId) {
      btn.classList.add('categories__button--active');
    }

    li.appendChild(btn);
    list.appendChild(li);
  });
}

function renderProducts(categoryId, search = '') {
  const grid = document.getElementById('products-grid');
  if (!grid) {
    return;
  }

  const q = search.trim().toLowerCase();

  const filtered = PRODUCTS.filter(p => {
    const byCat = !categoryId || (Array.isArray(p.categoryIds) && p.categoryIds.includes(categoryId));
    const title = fileNameToTitle(p.fileName).toLowerCase();
    const bySearch = !q || title.includes(q);
    return byCat && bySearch;
  });

  grid.innerHTML = '';

  filtered.forEach(product => {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.dataset.productId = product.id;

    const title = fileNameToTitle(product.fileName);
    const imgSrc = `../static/pictures/${product.fileName}`;

    card.innerHTML = `
      <div class="product-card__image-wrap">
        <img src="${imgSrc}" alt="${title}" class="product-card__image" loading="lazy">
      </div>
      <div class="product-card__body">
        <h2 class="product-card__title">${title}</h2>
        <div class="product-card__footer">
          <div class="product-card__price">₹${product.price}</div>
          <button class="product-card__add" type="button" aria-label="Add to order">+</button>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

function renderOrderPanel() {
  const cart = loadCart();
  const list = document.getElementById('order-items');
  const totalCountEl = document.getElementById('order-total-count');
  const subtotalEl = document.getElementById('order-subtotal-value');
  const discountEl = document.getElementById('order-discount-value');
  const totalPriceEl = document.getElementById('order-total-price');

  if (!list || !totalCountEl || !subtotalEl || !discountEl || !totalPriceEl) {
    return;
  }

  list.innerHTML = '';

  cart.forEach(item => {
    const li = document.createElement('li');
    li.className = 'order-panel__item';
    li.dataset.key = item.key || item.id;

    const product = PRODUCT_MAP[item.id];
    const title = product ? fileNameToTitle(product.fileName) : camelCaseToTitle(item.id || '');

    const options = [];
    if (item.size) {
      options.push(String(item.size).toUpperCase());
    }

    if (item.extra) {
      options.push(String(item.extra).toUpperCase());
    }

    if (item.milk) {
      options.push(`${String(item.milk).toUpperCase()} MILK`);
    }

    li.innerHTML = `
      <span class="order-panel__item-name">${title}</span>
      <span class="order-panel__item-qty">
        ${item.qty} × ₹${item.unitPrice || item.price || 0}
        ${options.length ? `<small>${options.join(', ')}</small>` : ''}
        <button class="order-panel__item-minus" type="button">−</button>
      </span>
    `;

    list.appendChild(li);
  });

  const totals = getCartTotals(cart);
  totalCountEl.textContent = String(totals.count);
  subtotalEl.textContent = `₹${totals.subtotal}`;
  discountEl.textContent = `₹${totals.discount}`;
  totalPriceEl.textContent = `₹${totals.total}`;
}

function openOrderPanel() {
  const panel = document.getElementById('order-panel');
  if (!panel) {
    return;
  }
  panel.classList.add('order-panel--open');
  panel.setAttribute('aria-hidden', 'false');
  renderOrderPanel();
}

function closeOrderPanel() {
  const panel = document.getElementById('order-panel');
  if (!panel) {
    return;
  }
  panel.classList.remove('order-panel--open');
  panel.setAttribute('aria-hidden', 'true');
}

document.addEventListener('DOMContentLoaded', () => {
  let currentCategory = PRODUCTS.find(p => p.categoryIds?.length)?.categoryIds[0] || CATEGORIES[0].id;
  let currentSearch = '';

  renderCategories(currentCategory);
  renderProducts(currentCategory, currentSearch);
  updateCartCounter();

  const categoriesList = document.getElementById('categories-list');
  if (categoriesList) {
    categoriesList.addEventListener('click', event => {
      const btn = event.target.closest('.categories__button');
      if (!btn) {
        return;
      }

      currentCategory = btn.dataset.categoryId;

      categoriesList.querySelectorAll('.categories__button').forEach(b => {
        b.classList.toggle('categories__button--active', b === btn);
      });

      renderProducts(currentCategory, currentSearch);
    });
  }

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      currentSearch = searchInput.value;
      renderProducts(currentCategory, currentSearch);
    });
  }

  const productsGrid = document.getElementById('products-grid');
  if (productsGrid) {
    productsGrid.addEventListener('click', event => {
      const addBtn = event.target.closest('.product-card__add');
      if (!addBtn) {
        return;
      }

      const card = addBtn.closest('.product-card');
      if (!card) {
        return;
      }

      const productId = card.dataset.productId;
      if (!productId) {
        return;
      }

      window.location.href = `coffee.html?id=${encodeURIComponent(productId)}`;
    });
  }

  const orderToggle = document.getElementById('order-toggle');
  const orderClose = document.getElementById('order-close');
  if (orderToggle) {
    orderToggle.addEventListener('click', openOrderPanel);
  }

  if (orderClose) {
    orderClose.addEventListener('click', closeOrderPanel);
  }

  const orderList = document.getElementById('order-items');
  if (orderList) {
    orderList.addEventListener('click', event => {
      const minusBtn = event.target.closest('.order-panel__item-minus');
      if (!minusBtn) {
        return;
      }

      const li = minusBtn.closest('.order-panel__item');
      if (!li) {
        return;
      }

      const key = li.dataset.key;
      const cart = loadCart();
      const item = cart.find(i => (i.key || i.id) === key);
      if (!item) {
        return;
      }

      item.qty -= 1;
      if (item.qty <= 0) {
        const idx = cart.indexOf(item);
        cart.splice(idx, 1);
      }

      saveCart(cart);
      updateCartCounter();
      renderOrderPanel();
    });
  }
});
