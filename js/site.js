/* Renew Pools — shared page behaviour: language, cart drawer, menu, gallery, contact form, finish picker. */
(function () {
  var R = window.Renew; if (!R) return;
  var i18n = R.i18n, t = function (k) { return i18n.t(k, R.lang); };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---- storage (guarded) ---- */
  var storage = null;
  try { storage = window.localStorage; storage.getItem('renew-probe'); } catch (e) { storage = null; }
  function read(k) { try { return storage ? storage.getItem(k) : null; } catch (e) { return null; } }
  function write(k, v) { try { storage && storage.setItem(k, v); } catch (e) { /* ignore */ } }

  /* ---- language ---- */
  R.lang = i18n.pickLang(read('renew-lang'), navigator.language);
  function setLang(lang) {
    R.lang = lang; write('renew-lang', lang);
    $$('[data-lang]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang)); });
    i18n.applyLang(lang);
  }
  R.setLang = setLang;

  /* ---- cart ---- */
  R.cart = R.createCart({ storage: storage, getItem: R.getItem });

  /* ---- ui helpers ---- */
  var toastEl = $('[data-toast]'), toastTimer;
  function toast(msg) {
    if (!toastEl) return; toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2200);
  }
  var drawer = $('[data-drawer]'), backdrop = $('[data-backdrop]'), menu = $('[data-menu]'), lastFocus = null;
  function lockScroll(on) { document.documentElement.style.overflow = on ? 'hidden' : ''; }
  function openDrawer() {
    if (!drawer) return; lastFocus = document.activeElement; renderDrawer();
    drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); backdrop.classList.add('open'); lockScroll(true);
    var c = $('[data-close-cart]', drawer); c && c.focus();
  }
  function closeDrawer() {
    if (!drawer || !drawer.classList.contains('open')) return;
    drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); backdrop.classList.remove('open'); lockScroll(false);
    if (lastFocus && lastFocus.focus) lastFocus.focus(); lastFocus = null;
  }
  var menuFocus = null;
  function openMenu() { menuFocus = document.activeElement; menu.classList.add('open'); menu.setAttribute('aria-hidden', 'false'); lockScroll(true); var c = $('[data-close-menu]', menu); c && c.focus(); }
  function closeMenu() { if (!menu || !menu.classList.contains('open')) return; menu.classList.remove('open'); menu.setAttribute('aria-hidden', 'true'); lockScroll(false); if (menuFocus && menuFocus.focus) menuFocus.focus(); menuFocus = null; }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function renderBadge() {
    var n = R.cart.totals().count;
    $$('[data-cart-count]').forEach(function (b) {
      var prev = b.textContent; b.textContent = String(n);
      if (n > 0) { b.removeAttribute('data-zero'); if (prev !== String(n)) { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); } } else b.setAttribute('data-zero', '');
    });
  }
  function renderDrawer() {
    var body = $('[data-drawer-body]'); if (!body) return;
    var items = R.cart.items(), tot = R.cart.totals(), foot = $('[data-drawer-foot]');
    var act = document.activeElement, keep = null;
    if (act && body.contains(act)) { var ln = act.closest('[data-line-id]'); keep = { id: ln && ln.getAttribute('data-line-id'), kind: act.hasAttribute('data-inc') ? '[data-inc]' : act.hasAttribute('data-dec') ? '[data-dec]' : '[data-remove]' }; }
    if (!items.length) {
      body.innerHTML = '<p class="drawer-empty">' + esc(t('cart.empty')) + '<br><a class="link" href="shop.html">' + esc(t('cart.empty.cta')) + '</a></p>';
      foot && foot.setAttribute('hidden', '');
      return;
    }
    foot && foot.removeAttribute('hidden');
    body.innerHTML = items.map(function (e) {
      var it = R.getItem(e.id);
      var tag = it.type === 'service' ? (it.deposit ? t('shop.deposit') : t('shop.installed')) : t('shop.ships');
      return '<div class="cart-line" data-line-id="' + esc(e.id) + '">' +
        '<img src="' + esc(it.image) + '" width="64" height="64" alt="" loading="lazy">' +
        '<div><h3>' + esc(it.name[R.lang] || it.name.en) + '</h3><span class="tag">' + esc(tag) + '</span>' +
        '<div class="row"><div class="qty"><button type="button" data-dec aria-label="' + esc(t('cart.dec')) + '">−</button><output aria-label="' + esc(t('cart.qty')) + '">' + e.qty + '</output><button type="button" data-inc aria-label="' + esc(t('cart.inc')) + '">+</button></div>' +
        '<span class="price">' + i18n.formatMoney(it.price * e.qty) + '</span></div>' +
        '<button type="button" class="remove" data-remove>' + esc(t('cart.remove')) + '</button></div></div>';
    }).join('');
    var sub = $('[data-drawer-subtotal]'); if (sub) sub.textContent = i18n.formatMoney(tot.subtotal);
    if (keep) { var again = keep.id && $('[data-line-id="' + keep.id + '"] ' + keep.kind, body); (again || $('[data-close-cart]', drawer)).focus(); }
  }
  /* ---- shop list ---- */
  var shopFilter = 'service';
  function renderShop(filter) {
    var list = $('[data-shop-list]'); if (!list) return;
    if (filter) shopFilter = filter;
    $$('[data-tab]').forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-tab') === shopFilter)); });
    var note = $('[data-shop-note]'); if (note) note.hidden = shopFilter !== 'service';
    list.innerHTML = R.catalog.filter(function (it) { return it.type === shopFilter; }).map(function (it) {
      var tag = it.type === 'service' ? (it.deposit ? t('shop.deposit') : t('shop.installed')) : t('shop.ships');
      return '<article class="item" data-reveal>' +
        '<figure class="photo item-photo shutter" data-reveal><img src="' + esc(it.image) + '" alt="" loading="lazy" width="800" height="800"></figure>' +
        '<div class="item-text"><h2>' + esc(it.name[R.lang] || it.name.en) + '</h2><span class="tag">' + esc(tag) + '</span>' +
        '<p>' + esc(it.blurb[R.lang] || it.blurb.en) + '</p>' + (it.note ? '<p class="note">' + esc(it.note[R.lang] || it.note.en) + '</p>' : '') + '</div>' +
        '<div class="item-buy"><span class="price">' + i18n.formatMoney(it.price) + '</span><button class="button" type="button" data-add="' + esc(it.id) + '">' + esc(t('shop.add')) + '</button></div>' +
        '</article>';
    }).join('');
    R.ui && R.ui.reveal && R.ui.reveal(list);
  }
  R.ui = { openDrawer: openDrawer, closeDrawer: closeDrawer, renderDrawer: renderDrawer, toast: toast, renderShop: renderShop };

  /* ---- events ---- */
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-add],[data-open-cart],[data-close-cart],[data-backdrop],[data-open-menu],[data-close-menu],[data-lang],[data-inc],[data-dec],[data-remove],[data-lightbox],[data-close-lightbox],[data-finish],[data-tab]');
    if (!el) return;
    if (el.hasAttribute('data-add')) { R.cart.add(el.getAttribute('data-add')); toast(t('shop.added')); openDrawer(); return; }
    if (el.hasAttribute('data-open-cart')) return openDrawer();
    if (el.hasAttribute('data-close-cart') || el.hasAttribute('data-backdrop')) return closeDrawer();
    if (el.hasAttribute('data-open-menu')) return openMenu();
    if (el.hasAttribute('data-close-menu')) return closeMenu();
    if (el.hasAttribute('data-lang')) return setLang(el.getAttribute('data-lang'));
    var line = el.closest('[data-line-id]'), id = line && line.getAttribute('data-line-id');
    if (el.hasAttribute('data-inc')) { var q1 = R.cart.items().filter(function (e) { return e.id === id; })[0]; return R.cart.setQty(id, (q1 ? q1.qty : 0) + 1); }
    if (el.hasAttribute('data-dec')) { var q2 = R.cart.items().filter(function (e) { return e.id === id; })[0]; return R.cart.setQty(id, (q2 ? q2.qty : 0) - 1); }
    if (el.hasAttribute('data-remove')) return R.cart.remove(id);
    if (el.hasAttribute('data-lightbox')) return openLightbox(el.getAttribute('data-lightbox'), el.getAttribute('data-caption'), $('img', el));
    if (el.hasAttribute('data-close-lightbox')) return $('[data-lightbox-dialog]').close();
    if (el.hasAttribute('data-finish')) return setFinish(el);
    if (el.hasAttribute('data-tab')) { var f = el.getAttribute('data-tab'); history.replaceState(null, '', f === 'product' ? '#products' : '#services'); return renderShop(f); }
  });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { closeDrawer(); closeMenu(); } });
  $$('.menu-links a').forEach(function (a) { a.addEventListener('click', closeMenu); });

  R.cart.subscribe(function () { renderBadge(); renderDrawer(); });
  window.addEventListener('pageshow', function (ev) { if (ev.persisted) R.cart.reload(); });
  window.addEventListener('storage', function (ev) { if (ev.key === 'renew-cart' || ev.key === null) R.cart.reload(); });
  window.addEventListener('hashchange', function () { if ($('[data-shop-list]')) renderShop(location.hash === '#products' ? 'product' : 'service'); });
  document.addEventListener('renew:lang', function () { renderDrawer(); renderPrices(); renderShop(); });

  /* ---- prices from the catalog ---- */
  function renderPrices() { $$('[data-price-of]').forEach(function (el) { var it = R.getItem(el.getAttribute('data-price-of')); if (it) el.textContent = i18n.formatMoney(it.price); }); }

  /* ---- lightbox ---- */
  var lightboxKey = null;
  function openLightbox(src, captionKey, thumb) {
    var d = $('[data-lightbox-dialog]'); if (!d || !d.showModal) return;
    var img = $('img', d); img.src = src; img.alt = thumb ? thumb.alt : ''; lightboxKey = captionKey;
    $('figcaption', d).textContent = captionKey ? t(captionKey) : '';
    d.showModal();
  }
  var dlg = $('[data-lightbox-dialog]');
  dlg && dlg.addEventListener('click', function (ev) { if (ev.target === dlg) dlg.close(); });

  /* ---- finish picker (the hero's live thing) ---- */
  function setFinish(btn) {
    var target = $('[data-tint-target]'); if (!target) return;
    $$('[data-finish]').forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
    var c = btn.getAttribute('data-finish'), dark = btn.getAttribute('data-dark');
    if (!c) { target.removeAttribute('data-tinted'); return; }
    target.style.setProperty('--tint', c); target.style.setProperty('--tint-2', dark || 'transparent'); target.setAttribute('data-tinted', '');
  }

  /* ---- contact form → mailto ---- */
  var form = $('[data-contact-form]');
  if (form) $$('[data-err-for]', form).forEach(function (sp) { var n = sp.getAttribute('data-err-for'); sp.id = 'err-' + n; form.elements[n] && form.elements[n].setAttribute('aria-describedby', sp.id); });
  if (form) form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var f = form.elements, errors = {};
    var val = function (n) { return (f[n] && f[n].value || '').trim(); };
    ['first', 'last', 'email', 'details'].forEach(function (n) { if (!val(n)) errors[n] = 'form.err.required'; });
    if (val('email') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('email'))) errors.email = 'form.err.email';
    if (val('phone') && val('phone').replace(/\D/g, '').length < 10) errors.phone = 'form.err.phone';
    $$('[data-err-for]', form).forEach(function (s) {
      var n = s.getAttribute('data-err-for'), input = f[n];
      s.textContent = errors[n] ? t(errors[n]) : ''; input && input.setAttribute('aria-invalid', errors[n] ? 'true' : 'false');
    });
    var first = Object.keys(errors)[0];
    if (first) { f[first].focus(); return; }
    var body = 'Name: ' + val('first') + ' ' + val('last') + '\nEmail: ' + val('email') + '\nPhone: ' + val('phone') + '\nProject start date: ' + val('date') + '\n\n' + val('details');
    window.location.href = 'mailto:renewpoolresurfacing@gmail.com?subject=' + encodeURIComponent('Free estimate request') + '&body=' + encodeURIComponent(body);
    var st = $('[data-form-status]'); if (st) { st.textContent = t('form.sent'); st.removeAttribute('hidden'); }
  });

  /* ---- reveal on scroll (once) ---- */
  var io = null;
  function show(el) { el.classList.add('is-in'); io && io.unobserve(el); $$('[data-reveal]', el).forEach(function (c) { c.classList.add('is-in'); io && io.unobserve(c); }); }
  function reveal(root) {
    var targets = $$('[data-reveal]', root || document); if (!targets.length) return;
    if (!('IntersectionObserver' in window)) { targets.forEach(show); return; }
    if (!io) io = new IntersectionObserver(function (entries) { entries.forEach(function (en) { if (en.isIntersecting) show(en.target); }); }, { rootMargin: '0px 0px 5% 0px', threshold: 0 });
    targets.forEach(function (el) { if (!el.classList.contains('is-in')) io.observe(el); });
    setTimeout(function () { targets.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) show(el); }); }, 2500);
  }
  R.ui.reveal = reveal;

  /* ---- boot ---- */
  var y = $('[data-year]'); if (y) y.textContent = String(new Date().getFullYear());
  var page = document.body.getAttribute('data-page');
  $$('.nav-links a').forEach(function (a) { if ((page === 'shop' && /shop\.html/.test(a.getAttribute('href'))) ) a.setAttribute('aria-current', 'page'); });
  if ($('[data-shop-list]')) shopFilter = location.hash === '#products' ? 'product' : 'service';
  setLang(R.lang); renderBadge(); renderPrices(); reveal(document);
  document.dispatchEvent(new CustomEvent('renew:ready'));
})();
