/* Renew Pools — catalog data.
   This is the ONLY place to edit products, services and prices.
   price: USD. deposit: true = customer pays a project deposit, balance after on-site estimate. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.Renew = root.Renew || {}; Object.assign(root.Renew, factory()); }
})(typeof self !== 'undefined' ? self : this, function () {
  var NOTE = { en: 'Balance due after on-site estimate', es: 'Saldo a pagar después de la visita de estimación' };
  var catalog = [
    { id: 'resurfacing-deposit', type: 'service', price: 500, deposit: true, image: 'img/pool-sun.jpg',
      name: { en: 'Pool Resurfacing Deposit', es: 'Depósito de renovación de superficie' },
      blurb: { en: 'Reserve your resurfacing project. Choose from hundreds of quartz, pebble and plaster finishes.', es: 'Reserva tu proyecto de renovación. Elige entre cientos de acabados de cuarzo, piedra y yeso.' }, note: NOTE },
    { id: 'tile-waterline-deposit', type: 'service', price: 350, deposit: true, image: 'img/project-13.jpg',
      name: { en: 'Tile & Waterline Deposit', es: 'Depósito de azulejo y línea de agua' },
      blurb: { en: 'New waterline tile, coping repair and grout, from thousands of tile options.', es: 'Azulejo nuevo en la línea de agua, reparación de borde y lechada, con miles de opciones.' }, note: NOTE },
    { id: 'paver-clean-seal', type: 'service', price: 650, deposit: false, image: 'img/pool-deck.jpg',
      name: { en: 'Paver Clean & Seal (up to 600 sq ft)', es: 'Limpieza y sellado de adoquines (hasta 600 pies²)' },
      blurb: { en: 'Pressure wash, re-sand and seal your pool deck pavers so they look new again.', es: 'Lavado a presión, arena nueva y sellado para que los adoquines luzcan como nuevos.' }, note: NOTE },
    { id: 'deck-painting', type: 'service', price: 890, deposit: false, image: 'img/pool-spa.jpg',
      name: { en: 'Pool Deck Painting (up to 600 sq ft)', es: 'Pintura de deck de piscina (hasta 600 pies²)' },
      blurb: { en: 'Cool-deck coating in the color of your choice, prepped and sealed for Florida sun.', es: 'Recubrimiento cool-deck en el color que elijas, preparado y sellado para el sol de Florida.' }, note: NOTE },
    { id: 'led-light', type: 'service', price: 549, deposit: false, image: 'img/hero-cage.jpg',
      name: { en: 'LED Pool Light Upgrade (installed)', es: 'Luz LED para piscina (instalada)' },
      blurb: { en: 'Replace your old bulb with a color-changing LED light, installed and tested.', es: 'Cambia tu bombilla vieja por una luz LED multicolor, instalada y probada.' }, note: NOTE },
    { id: 'skimmer-replacement', type: 'service', price: 475, deposit: false, image: 'img/project-05.jpg',
      name: { en: 'Skimmer Replacement (installed)', es: 'Reemplazo de skimmer (instalado)' },
      blurb: { en: 'New skimmer body, lid and weir, plumbed and sealed into your existing shell.', es: 'Skimmer nuevo con tapa y compuerta, conectado y sellado en tu piscina actual.' }, note: NOTE },
    { id: 'structural-inspection', type: 'service', price: 149, deposit: false, image: 'img/project-04.jpg',
      name: { en: 'Structural Inspection Visit', es: 'Visita de inspección estructural' },
      blurb: { en: 'Cracks, leaks or settling? A licensed inspection with a written report. Credited toward your project.', es: 'Grietas, fugas o hundimiento? Inspección con licencia e informe escrito. Se descuenta de tu proyecto.' }, note: NOTE },

    { id: 'finish-sample-kit', type: 'product', price: 39, deposit: false, image: 'img/project-07.jpg',
      name: { en: 'Pool Finish Sample Kit (6 finishes)', es: 'Kit de muestras de acabado (6 acabados)' },
      blurb: { en: 'Six hand-poured samples of our most popular finishes to compare in your own sunlight.', es: 'Seis muestras de nuestros acabados más populares para comparar con tu propia luz.' } },
    { id: 'tile-sample-pack', type: 'product', price: 29, deposit: false, image: 'img/project-01.jpg',
      name: { en: 'Waterline Tile Sample Pack', es: 'Pack de muestras de azulejo' },
      blurb: { en: 'Eight glass and porcelain waterline tiles, shipped to your door.', es: 'Ocho azulejos de vidrio y porcelana para la línea de agua, enviados a tu puerta.' } },
    { id: 'led-color-light', type: 'product', price: 329, deposit: false, image: 'img/project-11.jpg',
      name: { en: 'Color LED Pool Light (unit)', es: 'Luz LED multicolor (unidad)' },
      blurb: { en: '12V color-changing LED light, fits most standard niches. Installation sold separately.', es: 'Luz LED 12V multicolor, compatible con la mayoría de nichos. Instalación aparte.' } },
    { id: 'vs-pump', type: 'product', price: 1149, deposit: false, image: 'img/project-08.jpg',
      name: { en: 'Variable Speed Pump 1.5 HP', es: 'Bomba de velocidad variable 1.5 HP' },
      blurb: { en: 'Energy-efficient pump that can cut your electric bill by up to 80%.', es: 'Bomba eficiente que puede reducir tu factura de luz hasta un 80%.' } },
    { id: 'salt-system', type: 'product', price: 899, deposit: false, image: 'img/project-09.jpg',
      name: { en: 'Salt Chlorine Generator', es: 'Generador de cloro salino' },
      blurb: { en: 'Softer water and no more chlorine runs. Rated for pools up to 40,000 gallons.', es: 'Agua más suave y sin comprar cloro. Para piscinas de hasta 40,000 galones.' } },
    { id: 'pool-heater', type: 'product', price: 3490, deposit: false, image: 'img/project-10.jpg',
      name: { en: 'Heat Pump Pool Heater 110k BTU', es: 'Calentador de piscina 110k BTU' },
      blurb: { en: 'Swim year-round. Quiet, efficient heat pump sized for most residential pools.', es: 'Nada todo el año. Bomba de calor silenciosa y eficiente para la mayoría de piscinas.' } }
  ];
  function getItem(id) { for (var i = 0; i < catalog.length; i++) if (catalog[i].id === id) return catalog[i]; return undefined; }
  return { catalog: catalog, getItem: getItem };
});
