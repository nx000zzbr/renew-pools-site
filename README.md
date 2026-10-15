# Renew Pool Resurfacing — website

Static site: no build step. Upload everything in this folder to the root of the repository and enable GitHub Pages (Settings → Pages → Deploy from branch → main / root).

- `index.html` home · `shop.html` services and products · `checkout.html` demo checkout
- `js/catalog.js` the only place to edit services, products and prices
- `js/checkout.js` → `placeOrder()` is the single point to connect a real payment provider (Stripe)
- English and Spanish texts live in `js/i18n.js`
