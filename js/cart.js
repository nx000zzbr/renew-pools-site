/* Renew Pools — cart logic (no DOM). Persists to storage key "renew-cart". */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.Renew = root.Renew || {}; Object.assign(root.Renew, factory()); }
})(typeof self !== 'undefined' ? self : this, function () {
  var KEY = 'renew-cart';
  function cents(n) { return Math.round(n * 100) / 100; }
  function createCart(opts) {
    var storage = opts.storage, getItem = opts.getItem, taxRate = opts.taxRate == null ? 0.07 : opts.taxRate;
    var items = [], subs = [];
    function load() {
      try {
        var raw = storage && storage.getItem(KEY);
        var parsed = raw ? JSON.parse(raw) : null;
        var list = parsed && Array.isArray(parsed.items) ? parsed.items : [];
        items = [];
        list.forEach(function (e) {
          var q = Math.floor(Number(e && e.qty));
          if (e && getItem(e.id) && q > 0) items.push({ id: e.id, qty: q });
        });
      } catch (e) { items = []; }
    }
    function save() {
      try { storage && storage.setItem(KEY, JSON.stringify({ items: items })); } catch (e) { /* storage unavailable */ }
      subs.forEach(function (fn) { fn(); });
    }
    function find(id) { for (var i = 0; i < items.length; i++) if (items[i].id === id) return i; return -1; }
    function add(id, qty) {
      if (!getItem(id)) return;
      var q = Math.floor(Number(qty == null ? 1 : qty)); if (!(q > 0)) return;
      var i = find(id);
      if (i < 0) items.push({ id: id, qty: q }); else items[i].qty += q;
      save();
    }
    function remove(id) { var i = find(id); if (i >= 0) items.splice(i, 1); save(); }
    function setQty(id, qty) {
      var q = Math.floor(Number(qty));
      if (!(q > 0)) return remove(id);
      var i = find(id); if (i < 0) return; items[i].qty = q; save();
    }
    function clear() { items = []; save(); }
    function totals() {
      var subtotal = 0, taxable = 0, count = 0, hasService = false;
      items.forEach(function (e) {
        var it = getItem(e.id); if (!it) return;
        var line = it.price * e.qty; subtotal += line; count += e.qty;
        if (it.type === 'product') taxable += line; else hasService = true;
      });
      var tax = cents(taxable * taxRate);
      return { subtotal: cents(subtotal), tax: tax, total: cents(subtotal + tax), count: count, hasService: hasService };
    }
    load();
    return {
      items: function () { return items.map(function (e) { return { id: e.id, qty: e.qty }; }); },
      reload: function () { load(); subs.forEach(function (fn) { fn(); }); },
      add: add, remove: remove, setQty: setQty, clear: clear, totals: totals,
      subscribe: function (fn) { subs.push(fn); return function () { subs = subs.filter(function (f) { return f !== fn; }); }; }
    };
  }
  return { createCart: createCart };
});
