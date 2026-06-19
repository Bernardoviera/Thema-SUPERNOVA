/* SUPERNOVA Theme — base.js */

'use strict';

// ─── Header height CSS variable ────────────────────────────────────
const siteHeader = document.querySelector('.site-header');
const announcementBarSection = document.querySelector('.announcement-bar-section');

function syncHeaderHeight() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const bar = document.querySelector('.announcement-bar-section');
  const headerH = header.offsetHeight;
  document.documentElement.style.setProperty('--header-height', headerH + 'px');
  const barH = bar ? bar.offsetHeight : 0;
  document.documentElement.style.setProperty('--topbar-total-height', (headerH + barH) + 'px');
}

// Recalcula sempre que o cabeçalho/barra mudarem de tamanho
// (logo carregando, mudanças no editor de tema, fontes web, etc.)
let headerResizeObserver;
function observeHeaderSize() {
  if (!window.ResizeObserver) return;
  if (headerResizeObserver) headerResizeObserver.disconnect();
  headerResizeObserver = new ResizeObserver(syncHeaderHeight);
  document.querySelectorAll('.site-header, .announcement-bar-section')
    .forEach(el => headerResizeObserver.observe(el));
}

syncHeaderHeight();
observeHeaderSize();
window.addEventListener('resize', syncHeaderHeight, { passive: true });
window.addEventListener('load', syncHeaderHeight);
document.addEventListener('shopify:section:load', () => { syncHeaderHeight(); observeHeaderSize(); });

// ─── Header scroll effect ──────────────────────────────────────────
if (siteHeader) {
  const heroSection = document.querySelector('.hero-section');

  if (heroSection && document.body.classList.contains('template-index')) {
    // Na página inicial: cabeçalho fica transparente enquanto o hero estiver visível
    const observer = new IntersectionObserver(
      entries => siteHeader.classList.toggle('scrolled', !entries[0].isIntersecting),
      { threshold: 0.05 }
    );
    observer.observe(heroSection);
  } else {
    const updateScrolled = () => siteHeader.classList.toggle('scrolled', window.scrollY > 10);
    updateScrolled();
    window.addEventListener('scroll', updateScrolled, { passive: true });
  }
}

// ─── Mobile nav ────────────────────────────────────────────────────
const hamburger = document.querySelector('.header__hamburger');
const mobileNav = document.querySelector('.mobile-nav');
const mobileClose = document.querySelector('.mobile-nav__close');

if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    mobileNav.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  });
}

if (mobileClose && mobileNav) {
  mobileClose.addEventListener('click', () => {
    mobileNav.classList.remove('is-open');
    document.body.style.overflow = '';
  });
}

// ─── Cart Drawer ───────────────────────────────────────────────────
class CartDrawer {
  constructor() {
    this.drawer = document.querySelector('.cart-drawer');
    this.overlay = document.querySelector('.cart-drawer-overlay');
    this.closeBtn = document.querySelector('.cart-drawer__close');
    this.cartButtons = document.querySelectorAll('[data-open-cart]');

    if (!this.drawer) return;
    this.bindEvents();
  }

  bindEvents() {
    this.cartButtons.forEach(btn => btn.addEventListener('click', () => this.open()));
    if (this.overlay) this.overlay.addEventListener('click', () => this.close());
    if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.close());
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.close(); });
  }

  open() {
    this.drawer.classList.add('is-open');
    this.overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    this.fetchCart();
  }

  close() {
    this.drawer.classList.remove('is-open');
    this.overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  async fetchCart() {
    try {
      const res = await fetch('/cart.js');
      const cart = await res.json();
      this.renderDrawer(cart);
    } catch (e) {
      console.error('Cart fetch error:', e);
    }
  }

  renderDrawer(cart) {
    const itemsContainer = this.drawer.querySelector('.cart-drawer__items');
    const subtotalEl = this.drawer.querySelector('.cart-drawer__subtotal-value');
    if (!itemsContainer) return;

    if (cart.item_count === 0) {
      itemsContainer.innerHTML = '<p style="padding:2rem 0;text-align:center;color:rgba(var(--color-base-text),0.6)">Nothing here yet. Go cause some damage.</p>';
    } else {
      itemsContainer.innerHTML = cart.items.map(item => `
        <div class="cart-item">
          <div class="cart-item__media">
            <img src="${item.image}" alt="${item.title}" loading="lazy">
          </div>
          <div class="cart-item__info">
            <div class="cart-item__title">${item.product_title}</div>
            ${item.variant_title !== 'Default Title' ? `<div class="cart-item__variant">${item.variant_title}</div>` : ''}
            <div class="cart-item__price">${this.formatMoney(item.final_line_price)}</div>
            <div style="display:flex;align-items:center;gap:1.2rem;margin-top:0.8rem;">
              <div class="quantity-selector" style="transform:scale(0.9);transform-origin:left">
                <button class="quantity-btn" data-action="decrease" data-key="${item.key}">−</button>
                <input class="quantity-input" type="number" value="${item.quantity}" min="1" data-key="${item.key}" style="width:4rem">
                <button class="quantity-btn" data-action="increase" data-key="${item.key}">+</button>
              </div>
              <button class="cart-item__remove" data-key="${item.key}">Remove</button>
            </div>
          </div>
        </div>
      `).join('');
    }

    if (subtotalEl) subtotalEl.textContent = this.formatMoney(cart.total_price);

    this.bindCartItemEvents();
  }

  bindCartItemEvents() {
    const itemsContainer = this.drawer.querySelector('.cart-drawer__items');
    if (!itemsContainer) return;

    itemsContainer.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-action]');
      const removeBtn = e.target.closest('.cart-item__remove');

      if (btn) {
        const key = btn.dataset.key;
        const input = itemsContainer.querySelector(`.quantity-input[data-key="${key}"]`);
        let qty = parseInt(input.value);
        qty = btn.dataset.action === 'increase' ? qty + 1 : Math.max(0, qty - 1);
        await this.updateItem(key, qty);
      }

      if (removeBtn) {
        await this.updateItem(removeBtn.dataset.key, 0);
      }
    });
  }

  async updateItem(key, quantity) {
    try {
      const res = await fetch(window.routes.cart_change_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: key, quantity })
      });
      const cart = await res.json();
      this.renderDrawer(cart);
      updateCartCount(cart.item_count);
    } catch (e) {
      console.error('Update cart error:', e);
    }
  }

  formatMoney(cents) {
    return (cents / 100).toFixed(2).replace('.', ',') + ' €';
  }
}

// ─── Cart count update ─────────────────────────────────────────────
function updateCartCount(count) {
  document.querySelectorAll('.cart-count-bubble').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

// ─── Add to cart ───────────────────────────────────────────────────
async function addToCart(variantId, quantity = 1) {
  try {
    const res = await fetch(window.routes.cart_add_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ id: variantId, quantity })
    });

    if (!res.ok) throw new Error('Could not add to cart');

    const item = await res.json();

    // Refresh cart count
    const cartRes = await fetch('/cart.js');
    const cart = await cartRes.json();
    updateCartCount(cart.item_count);

    // Open drawer or redirect
    const cartDrawer = document.querySelector('.cart-drawer');
    if (cartDrawer) {
      window.cartDrawer?.open();
    }

    showToast('In the bag.');
    return item;
  } catch (e) {
    showToast("Couldn't add that — try again.", 'error');
    throw e;
  }
}

// ─── Toast notification ────────────────────────────────────────────
function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('is-visible');
  setTimeout(() => toast.classList.remove('is-visible'), 3000);
}

// ─── Product page variant picker ──────────────────────────────────
class VariantPicker {
  constructor(form) {
    this.form = form;
    this.variants = JSON.parse(form.dataset.variants || '[]');
    this.currentVariant = this.variants[0] || null;
    this.bindEvents();
    this.updateUI();
  }

  bindEvents() {
    this.form.querySelectorAll('.variant-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        const option = btn.dataset.option;
        const value = btn.dataset.value;
        this.form.querySelectorAll(`.variant-opt[data-option="${option}"]`).forEach(b => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        this.updateVariant();
      });
    });

    const addBtn = this.form.querySelector('[data-add-to-cart]');
    if (addBtn) {
      this.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!this.currentVariant || !this.currentVariant.available) return;
        const qty = parseInt(this.form.querySelector('.quantity-input')?.value || 1);
        addBtn.disabled = true;
        addBtn.textContent = 'Adding...';
        try {
          await addToCart(this.currentVariant.id, qty);
        } finally {
          addBtn.disabled = false;
          addBtn.textContent = 'Add to cart';
        }
      });
    }
  }

  updateVariant() {
    const selected = {};
    this.form.querySelectorAll('.variant-opt.is-selected').forEach(btn => {
      selected[btn.dataset.option] = btn.dataset.value;
    });

    this.currentVariant = this.variants.find(v =>
      v.options.every((val, i) => selected[`option${i + 1}`] === val)
    ) || null;

    this.updateUI();
  }

  updateUI() {
    const priceEl = this.form.closest('.product-info')?.querySelector('.product-info__price');
    const addBtn = this.form.querySelector('[data-add-to-cart]');
    const stockEl = this.form.closest('.product-info')?.querySelector('.product-info__stock');

    if (!this.currentVariant) {
      if (addBtn) { addBtn.disabled = true; addBtn.textContent = 'No disponible'; }
      return;
    }

    if (priceEl) {
      if (this.currentVariant.compare_at_price > this.currentVariant.price) {
        priceEl.innerHTML = `
          <span class="price__sale">R$&nbsp;${(this.currentVariant.price / 100).toFixed(2).replace('.', ',')}</span>
          <span class="price__compare">R$&nbsp;${(this.currentVariant.compare_at_price / 100).toFixed(2).replace('.', ',')}</span>
        `;
      } else {
        priceEl.innerHTML = `<span class="price__regular">R$&nbsp;${(this.currentVariant.price / 100).toFixed(2).replace('.', ',')}</span>`;
      }
    }

    if (addBtn) {
      addBtn.disabled = !this.currentVariant.available;
      addBtn.textContent = this.currentVariant.available ? 'Add to cart' : 'Sold out';
    }

    if (stockEl) {
      stockEl.textContent = this.currentVariant.available ? 'In stock' : 'Sold out';
    }

    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('variant', this.currentVariant.id);
    window.history.replaceState({}, '', url.toString());
  }
}

// ─── Product media gallery ─────────────────────────────────────────
class ProductGallery {
  constructor(gallery) {
    this.main = gallery.querySelector('.product-media__main img');
    this.thumbs = gallery.querySelectorAll('.product-media__thumb');
    this.bindEvents();
  }

  bindEvents() {
    this.thumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        const src = thumb.querySelector('img').src;
        if (this.main) this.main.src = src;
        this.thumbs.forEach(t => t.classList.remove('is-active'));
        thumb.classList.add('is-active');
      });
    });
  }
}

// ─── Quantity selectors ────────────────────────────────────────────
document.querySelectorAll('.quantity-selector').forEach(selector => {
  selector.addEventListener('click', e => {
    const btn = e.target.closest('.quantity-btn');
    if (!btn) return;
    const input = selector.querySelector('.quantity-input');
    let val = parseInt(input.value) || 1;
    if (btn.textContent.trim() === '+' || btn.dataset.action === 'increase') {
      val += 1;
    } else {
      val = Math.max(1, val - 1);
    }
    input.value = val;
  });
});

// ─── Init ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  window.cartDrawer = new CartDrawer();

  // Variant pickers
  document.querySelectorAll('.product-form[data-variants]').forEach(form => {
    new VariantPicker(form);
  });

  // Product galleries
  document.querySelectorAll('.product-media-gallery').forEach(gallery => {
    new ProductGallery(gallery);
  });

  // Quick add buttons
  document.querySelectorAll('[data-quick-add]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const variantId = btn.dataset.quickAdd;
      btn.textContent = '...';
      try {
        await addToCart(variantId);
        btn.textContent = 'Added!';
        setTimeout(() => { btn.textContent = 'Add to cart'; }, 2000);
      } catch {
        btn.textContent = 'Error';
      }
    });
  });
});

// ─── Scroll reveal ─────────────────────────────────────────────────
// Elements rise/fade in as they enter the viewport. Works on touch too,
// where hover doesn't exist. JS adds the hidden state, so no-JS users
// still see everything. Disabled when the user prefers reduced motion.
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const targets = document.querySelectorAll('.product-card, .category-card, [data-reveal]');
  if (!targets.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      // Stagger items that share a row (grid) for a cascading effect.
      const siblings = el.parentNode ? Array.prototype.indexOf.call(el.parentNode.children, el) : 0;
      el.style.transitionDelay = (siblings % 4) * 80 + 'ms';
      el.classList.add('is-revealed');
      obs.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  targets.forEach(el => {
    el.classList.add('sn-reveal');
    observer.observe(el);
  });
})();

// ─── Hero carousel ─────────────────────────────────────────────────
// Slideshow with autoplay, arrows, dots and touch swipe. Pauses on hover
// and when the tab is hidden; integrates with the Shopify theme editor.
function setupHeroCarousel(root) {
  if (root.dataset.heroReady === 'true') return;
  root.dataset.heroReady = 'true';

  const track = root.querySelector('[data-hero-track]');
  const slides = track ? Array.from(track.children) : [];
  if (!track || slides.length <= 1) return;

  const dots = Array.from(root.querySelectorAll('[data-hero-dot]'));
  const prevBtn = root.querySelector('[data-hero-prev]');
  const nextBtn = root.querySelector('[data-hero-next]');
  const total = slides.length;
  const autoplay = root.dataset.autoplay === 'true';
  const speed = parseInt(root.dataset.speed, 10) || 5000;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let index = 0;
  let timer = null;

  function update() {
    track.style.transform = 'translateX(' + (-index * 100) + '%)';
    slides.forEach((s, i) => s.setAttribute('aria-hidden', i === index ? 'false' : 'true'));
    dots.forEach((d, i) => d.setAttribute('aria-current', i === index ? 'true' : 'false'));
  }
  function goTo(i) { index = (i + total) % total; update(); }
  function next() { goTo(index + 1); }
  function prev() { goTo(index - 1); }

  function start() {
    if (!autoplay || reduceMotion) return;
    stop();
    timer = setInterval(next, speed);
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  if (prevBtn) prevBtn.addEventListener('click', () => { prev(); start(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { next(); start(); });
  dots.forEach((d, i) => d.addEventListener('click', () => { goTo(i); start(); }));

  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else start();
  });

  // Touch swipe
  let startX = null;
  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; stop(); }, { passive: true });
  track.addEventListener('touchend', e => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) { if (dx < 0) next(); else prev(); }
    startX = null;
    start();
  }, { passive: true });

  // Theme editor: jump to the slide being edited
  root.addEventListener('shopify:block:select', e => {
    const slide = e.target.closest('.hero__slide');
    const i = slides.indexOf(slide);
    if (i >= 0) { stop(); goTo(i); }
  });
  root.addEventListener('shopify:block:deselect', start);

  update();
  start();
}

function initHeroCarousels() {
  document.querySelectorAll('[data-hero-carousel]').forEach(setupHeroCarousel);
}
initHeroCarousels();
document.addEventListener('shopify:section:load', initHeroCarousels);

// ─── Size guide modal ──────────────────────────────────────────────
(function () {
  function getModal() { return document.querySelector('[data-size-guide-modal]'); }
  function openModal() {
    const m = getModal();
    if (m) { m.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; }
  }
  function closeModal() {
    const m = getModal();
    if (m) { m.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-size-guide-open]')) { e.preventDefault(); openModal(); }
    else if (e.target.closest('[data-size-guide-close]')) { closeModal(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });
})();

// ─── Condensed header on the home page (mobile) ────────────────────
// Scroll down: logo glides to center & extra icons fade out (bag stays).
// Scroll up: everything returns. Home + mobile only.
(function () {
  const header = document.querySelector('.site-header');
  if (!header || !document.body.classList.contains('template-index')) return;
  const logo = header.querySelector('.header__logo');
  if (!logo) return;
  const mq = window.matchMedia('(max-width: 990px)');
  let lastY = window.scrollY;

  function setShift() {
    const r = logo.getBoundingClientRect();
    const shift = Math.round((window.innerWidth / 2) - (r.left + r.width / 2));
    header.style.setProperty('--logo-shift', shift + 'px');
  }

  function onScroll() {
    if (!mq.matches) {
      header.classList.remove('is-condensed');
      lastY = window.scrollY;
      return;
    }
    const y = window.scrollY;
    // Only condense AFTER the hero has fully scrolled past (.scrolled is set by
    // the IntersectionObserver). While over the hero, keep the normal header.
    const pastHero = header.classList.contains('scrolled');
    if (pastHero && y > lastY + 4) {
      if (!header.classList.contains('is-condensed')) {
        setShift();
        header.classList.add('is-condensed');
      }
    } else if (!pastHero || y < lastY - 4) {
      header.classList.remove('is-condensed');
    }
    lastY = y;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  const onMqChange = function () { header.classList.remove('is-condensed'); };
  if (mq.addEventListener) mq.addEventListener('change', onMqChange);
  else if (mq.addListener) mq.addListener(onMqChange);
})();
