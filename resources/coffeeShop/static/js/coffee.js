const CART_KEY = 'coffee-kiosk-cart';

const PRODUCTS = [
  { id: 'cinnamonAndCocoa', price: 99, fileName: 'cinnamonAndCocoa.png' },
  { id: 'drizzledWithCaramel', price: 99, fileName: 'drizzledWithCaramel.png' },
  { id: 'burstingBlueberry', price: 99, fileName: 'burstingBlueberry.png' },
  { id: 'cocoAndVanillaCream', price: 99, fileName: 'cocoAndVanillaCream.png' },
  { id: 'dalgonaMacha', price: 99, fileName: 'dalgonaMacha.png' },
  { id: 'whippedChocolate', price: 99, fileName: 'whippedChocolate.png' }
];

const PRODUCT_MAP = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));

function camelCaseToTitle(str) {
  if (!str) return '';
  const withSpaces = str.replace(/([a-z])([A-Z])/g, '$1 $2');
  const lower = withSpaces.toLowerCase();
  const titled = lower.replace(/\b\w/g, ch => ch.toUpperCase());
  return titled.replace(/\bAnd\b/g, 'and');
}

function titleFromId(id) {
  return camelCaseToTitle(id);
}

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) {
      return [];
    }
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
    const title = product ? titleFromId(product.id) : titleFromId(item.id || '');

    const options = [];
    if (item.size) options.push(String(item.size).toUpperCase());
    if (item.extra) options.push(String(item.extra).toUpperCase());
    if (item.milk) options.push(`${String(item.milk).toUpperCase()} MILK`);

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
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  const product = PRODUCT_MAP[productId];
  const container = document.getElementById('coffee-details');

  if (!product || !container) {
    if (container) {
      container.innerHTML = '<p>Product not found</p>';
    }
    return;
  }

  const title = titleFromId(product.id);
  const basePrice = product.price;

  let currentSize = 'short';
  let currentExtra = 'sugar';
  let currentMilk = 'almond';
  let qty = 1;
  let currentUnitPrice = basePrice;

  container.innerHTML = `
    <section class="coffee-layout__image">
      <img src="../static/pictures/${product.fileName}" alt="${title}" class="coffee-layout__image-img">
    </section>

    <section class="coffee-layout__content">
      <h1 class="coffee-details__title">${title}</h1>
      <p class="coffee-details__desc">
        A single espresso shot poured into hot foamy milk, topped with mildly sweetened cocoa powder and caramel syrup.
      </p>

      <div class="coffee-details__group">
        <h2 class="coffee-details__label">SIZE</h2>
        <div class="chips chips--size" id="size-group">
          <button class="chip chip--active" data-size="short">SHORT</button>
          <button class="chip" data-size="tall">TALL</button>
          <button class="chip" data-size="grande">GRANDE</button>
          <button class="chip" data-size="venti">VENTI</button>
        </div>
      </div>

      <div class="coffee-details__group">
        <h2 class="coffee-details__label">EXTRA</h2>
        <div class="chips" id="extra-group">
          <button class="chip chip--active" data-extra="sugar">SUGAR</button>
          <button class="chip" data-extra="milk">MILK</button>
        </div>
      </div>

      <div class="coffee-details__group">
        <h2 class="coffee-details__label">MILK TYPE</h2>
        <div class="chips" id="milk-group">
          <button class="chip" data-milk="oat">OAT MILK</button>
          <button class="chip" data-milk="soy">SOY MILK</button>
          <button class="chip chip--active" data-milk="almond">ALMOND MILK</button>
        </div>
      </div>

      <div class="coffee-details__price-row">
        <span class="coffee-details__price" id="price-value">₹${basePrice}</span>
        <div class="counter">
          <button class="counter__btn" type="button" id="qty-minus">−</button>
          <span class="counter__value" id="qty-value">1</span>
          <button class="counter__btn" type="button" id="qty-plus">+</button>
        </div>
      </div>

      <button class="coffee-details__place" type="button" id="place-order">PLACE ORDER</button>
    </section>
  `;

  const priceEl = document.getElementById('price-value');
  const qtyValueEl = document.getElementById('qty-value');

  function recalcPrice() {
    let price = basePrice;

    if (currentSize === 'tall') {
      price += 10;
    }

    if (currentSize === 'grande') {
      price += 20;

    if (currentSize === 'venti') price += 30;
    }

    if (currentExtra === 'sugar') {
      price += 5;
    }

    if (currentExtra === 'milk') {
      price += 3;
    }

    currentUnitPrice = price;
    if (priceEl) {
      priceEl.textContent = `₹${price}`;
    }
  }

  function initChips(groupId, type, onChange) {
    const group = document.getElementById(groupId);
    if (!group) {
      return;
    }

    group.addEventListener('click', e => {
      const chip = e.target.closest('.chip');
      if (!chip) {
        return;
      }

      group.querySelectorAll('.chip').forEach(c => c.classList.remove('chip--active'));
      chip.classList.add('chip--active');

      if (type === 'size') {
        currentSize = chip.dataset.size;
      }

      if (type === 'extra') {
        currentExtra = chip.dataset.extra;
      }

      if (type === 'milk') {
        currentMilk = chip.dataset.milk;
      }

      if (typeof onChange === 'function') {
        onChange();
      }
    });
  }

  initChips('size-group', 'size', recalcPrice);
  initChips('extra-group', 'extra', recalcPrice);
  initChips('milk-group', 'milk', null);

  const plusBtn = document.getElementById('qty-plus');
  const minusBtn = document.getElementById('qty-minus');

  if (plusBtn) {
    plusBtn.addEventListener('click', () => {
      qty += 1;
      if (qtyValueEl) qtyValueEl.textContent = String(qty);
    });
  }

  if (minusBtn) {
    minusBtn.addEventListener('click', () => {
      if (qty > 1) {
        qty -= 1;
        if (qtyValueEl) qtyValueEl.textContent = String(qty);
      }
    });
  }

  const placeOrderBtn = document.getElementById('place-order');
  if (placeOrderBtn) {
    placeOrderBtn.addEventListener('click', () => {
      const cart = loadCart();
      const key = `${product.id}-${currentSize}-${currentExtra}-${currentMilk}`;
      const existing = cart.find(i => i.key === key);

      if (existing) {
        existing.qty += qty;
      } else {
        cart.push({
          key,
          id: product.id,
          qty,
          unitPrice: currentUnitPrice,
          size: currentSize,
          extra: currentExtra,
          milk: currentMilk
        });
      }

      saveCart(cart);
      updateCartCounter();
      openOrderPanel();
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
      if (!minusBtn) return;

      const li = minusBtn.closest('.order-panel__item');
      if (!li) return;

      const key = li.dataset.key;
      const cart = loadCart();
      const item = cart.find(i => (i.key || i.id) === key);
      if (!item) return;

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

  recalcPrice();
  updateCartCounter();
});
