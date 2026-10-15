/* Renew Pools — checkout: pure validation helpers (tested in Node) + page wiring (browser only). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.Renew = root.Renew || {}; root.Renew.checkout = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  function digits(s) { return String(s || '').replace(/\D/g, ''); }
  function luhnValid(s) {
    var d = digits(s); if (d.length < 13 || d.length > 19) return false;
    var sum = 0, dbl = false;
    for (var i = d.length - 1; i >= 0; i--) { var n = +d[i]; if (dbl) { n *= 2; if (n > 9) n -= 9; } sum += n; dbl = !dbl; }
    return sum % 10 === 0;
  }
  function formatCardNumber(s) { return digits(s).slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 '); }
  function expiryValid(s, now) {
    var m = /^\s*(\d{1,2})\s*\/\s*(\d{2})\s*$/.exec(String(s || '')); if (!m) return false;
    var mm = +m[1], yy = 2000 + +m[2]; if (mm < 1 || mm > 12) return false;
    var d = now || new Date(); var cur = d.getFullYear() * 12 + d.getMonth();
    return yy * 12 + (mm - 1) >= cur;
  }
  function orderNumber(now, rand) {
    var d = now || new Date(), r = rand || Math.random, A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', code = '';
    for (var i = 0; i < 4; i++) code += A[Math.floor(r() * A.length) % A.length];
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return 'RP-' + String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate()) + '-' + code;
  }
  function todayISO(d) { var p = function (n) { return (n < 10 ? '0' : '') + n; }; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); }
  function validateOrder(f, hasService, now) {
    var e = {}, v = function (k) { return String(f[k] || '').trim(); };
    if (!v('name')) e.name = 'checkout.err.required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('email'))) e.email = 'checkout.err.email';
    if (digits(v('phone')).length < 10) e.phone = 'checkout.err.phone';
    if (!v('address')) e.address = 'checkout.err.required';
    if (!v('city')) e.city = 'checkout.err.required';
    if (!/^\d{5}$/.test(v('zip'))) e.zip = 'checkout.err.zip';
    if (hasService && (!v('date') || v('date') < todayISO(now || new Date()))) e.date = 'checkout.err.date';
    if (!v('cardName')) e.cardName = 'checkout.err.required';
    if (!luhnValid(v('cardNumber'))) e.cardNumber = 'checkout.err.card';
    if (!expiryValid(v('exp'))) e.exp = 'checkout.err.exp';
    if (!/^\d{3,4}$/.test(v('cvc'))) e.cvc = 'checkout.err.cvc';
    return { ok: Object.keys(e).length === 0, errors: e };
  }
  /* ============================================================
     placeOrder — THE ONE PLACE TO WIRE A REAL PAYMENT PROVIDER.
     Demo version: resolves with a generated order number and never
     sends card data anywhere. To go live with Stripe: create a
     PaymentIntent on your server from `order.items`, confirm it with
     Stripe.js here, then resolve with the returned id.
     ============================================================ */
  function placeOrder(order) {
    return new Promise(function (resolve) { setTimeout(function () { resolve({ number: orderNumber() }); }, 900); });
  }
  return { luhnValid: luhnValid, formatCardNumber: formatCardNumber, expiryValid: expiryValid, orderNumber: orderNumber, validateOrder: validateOrder, placeOrder: placeOrder, todayISO: todayISO };
});

/* ---- page wiring (browser only) ---- */
(function () {
  if (typeof document === 'undefined') return;
  function init() {
    var R = window.Renew, C = R.checkout, i18n = R.i18n, t = function (k) { return i18n.t(k, R.lang); };
    var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
    var form = $('[data-checkout-form]'); if (!form) return;
    var empty = $('[data-checkout-empty]'), confirm = $('[data-checkout-confirm]'), layout = $('[data-checkout-layout]');
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var lastOrder = null;

    function renderSummary(target, items, tot) {
      target.innerHTML = items.map(function (e) {
        var it = R.getItem(e.id);
        return '<div class="sum-line"><img src="' + esc(it.image) + '" alt="" width="56" height="56" loading="lazy"><div><strong>' + esc(it.name[R.lang] || it.name.en) + '</strong><span>' + e.qty + ' × ' + i18n.formatMoney(it.price) + '</span></div><span class="nums">' + i18n.formatMoney(it.price * e.qty) + '</span></div>';
      }).join('') +
      '<div class="sum-tot"><span>' + esc(t('checkout.subtotal')) + '</span><span class="nums">' + i18n.formatMoney(tot.subtotal) + '</span></div>' +
      '<div class="sum-tot"><span>' + esc(t('checkout.tax')) + '</span><span class="nums">' + i18n.formatMoney(tot.tax) + '</span></div>' +
      '<div class="sum-tot total"><span>' + esc(t('checkout.total')) + '</span><span class="nums">' + i18n.formatMoney(tot.total) + '</span></div>';
    }
    function render() {
      if (lastOrder) {
        layout.hidden = true; empty.hidden = true; confirm.hidden = false;
        $('[data-order-number]').textContent = lastOrder.number;
        renderSummary($('[data-confirm-summary]'), lastOrder.items, lastOrder.totals);
        return;
      }
      var items = R.cart.items(), tot = R.cart.totals();
      if (!items.length) { layout.hidden = true; confirm.hidden = true; empty.hidden = false; return; }
      empty.hidden = true; confirm.hidden = true; layout.hidden = false;
      $('[data-schedule]').hidden = !tot.hasService;
      renderSummary($('[data-summary]'), items, tot);
      var btn = $('[data-place]'); btn.textContent = t('checkout.place') + ' · ' + i18n.formatMoney(tot.total);
    }
    R.cart.subscribe(render);
    document.addEventListener('renew:lang', render);

    $$('[data-err-for]', form).forEach(function (sp) { var n = sp.getAttribute('data-err-for'); sp.id = 'err-' + n; form.elements[n] && form.elements[n].setAttribute('aria-describedby', sp.id); });
    if (form.elements.date) form.elements.date.min = C.todayISO(new Date());
    var card = form.elements.cardNumber;
    card.addEventListener('input', function () { var p = card.selectionStart, before = card.value.length; card.value = C.formatCardNumber(card.value); var after = card.value.length; try { card.setSelectionRange(p + (after - before), p + (after - before)); } catch (e) {} });
    form.elements.exp.addEventListener('input', function (ev) { var d = ev.target.value.replace(/\D/g, '').slice(0, 4); ev.target.value = d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d; });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var f = {}, names = ['name', 'email', 'phone', 'address', 'city', 'zip', 'date', 'window', 'cardName', 'cardNumber', 'exp', 'cvc'];
      names.forEach(function (n) { f[n] = form.elements[n] ? form.elements[n].value : ''; });
      var tot = R.cart.totals(), res = C.validateOrder(f, tot.hasService);
      $$('[data-err-for]', form).forEach(function (s) {
        var n = s.getAttribute('data-err-for'), key = res.errors[n]; s.textContent = key ? t(key) : '';
        form.elements[n] && form.elements[n].setAttribute('aria-invalid', key ? 'true' : 'false');
      });
      var status = $('[data-checkout-status]');
      if (!res.ok) { status.textContent = t('checkout.err.summary'); status.hidden = false; form.elements[Object.keys(res.errors)[0]].focus(); return; }
      status.hidden = true;
      var btn = $('[data-place]'); btn.disabled = true; btn.setAttribute('aria-busy', 'true');
      var items = R.cart.items();
      C.placeOrder({ items: items, totals: tot, customer: { name: f.name, email: f.email, phone: f.phone, address: f.address, city: f.city, zip: f.zip }, schedule: tot.hasService ? { date: f.date, window: f.window } : null })
        .then(function (r) {
          lastOrder = { number: r.number, items: items, totals: tot };
          R.cart.clear(); btn.disabled = false; btn.removeAttribute('aria-busy'); form.reset();
          history.replaceState(null, '', '#confirmed'); render(); window.scrollTo({ top: 0, behavior: 'smooth' });
        })
        .catch(function () {
          btn.disabled = false; btn.removeAttribute('aria-busy');
          status.textContent = t('checkout.err.payment'); status.hidden = false;
        });
    });
    render();
  }
  if (window.Renew && window.Renew.ui) init(); else document.addEventListener('renew:ready', init);
})();
