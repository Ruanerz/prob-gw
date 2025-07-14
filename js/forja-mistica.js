import { fetchItemPrices } from './fractales-gold-ui.js';

// Cache local de iconos para esta página
const iconCache = {};

// Obtiene iconos desde la API de GW2 y los guarda en iconCache
async function fetchIcons(ids = []) {
  if (!ids.length) return;
  try {
    const res = await fetch(`https://api.guildwars2.com/v2/items?ids=${ids.join(',')}&lang=es`);
    const data = await res.json();
    data.forEach(item => {
      if (item && item.id) iconCache[item.id] = item.icon;
    });
  } catch {
    // Silenciar errores de carga de iconos
  }
}

function addIconToCell(cell, icon) {
  if (!cell || !icon) return;
  const div = cell.querySelector('div');
  if (!div || div.querySelector('img')) return;
  const img = document.createElement('img');
  img.src = icon;
  img.className = 'item-icon';
  div.prepend(img);
}

export const MATERIAL_IDS = {
  t6: {
    sangre: 24295,
    hueso: 24358,
    garra: 24351,
    colmillo: 24357,
    escama: 24289,
    totem: 24300,
    veneno: 24283
  },
  t5: {
    sangre: 24294,
    hueso: 24341,
    garra: 24350,
    colmillo: 24356,
    escama: 24288,
    totem: 24299,
    veneno: 24282
  },
  polvo: 24277,
  piedra: 20796
};

export const LODESTONE_IDS = {
  cores: {
    glacial: 24319,
    cristal: 24329,
    destructor: 24324,
    cargado: 24304,
    corrupto: 24339,
    onice: 24309,
    fundido: 24314
  },
  stones: {
    glacial: 24326,
    cristal: 24315,
    destructor: 24320,
    cargado: 24306,
    corrupto: 24325,
    onice: 24310,
    fundido: 24318
  },
  polvo: 24277,
  botella: 19663,
  cristal: 20799
};

export async function renderTablaForja() {
  const keys = Object.keys(MATERIAL_IDS.t5);
  const ids = [
    ...keys.map(k => MATERIAL_IDS.t5[k]),
    ...keys.map(k => MATERIAL_IDS.t6[k]),
    MATERIAL_IDS.polvo,
    MATERIAL_IDS.piedra
  ];
  const priceMap = await fetchItemPrices(ids);
  await fetchIcons(ids);

  keys.forEach(key => {
    const row = document.querySelector(`#matt5t6 tr[data-key="${key}"]`);
    if (!row) return;
    const sumEl = row.querySelector('.sum-mats');
    const resEl = row.querySelector('.resultado');
    const profitEl = row.querySelector('.profit');

    const precioT5 = priceMap[MATERIAL_IDS.t5[key]]?.buy_price || 0;
    const precioT6Buy = priceMap[MATERIAL_IDS.t6[key]]?.buy_price || 0;
    const precioT6Sell = priceMap[MATERIAL_IDS.t6[key]]?.sell_price || 0;
    const precioPolvo = priceMap[MATERIAL_IDS.polvo]?.buy_price || 0;
    const precioPiedra = priceMap[MATERIAL_IDS.piedra]?.buy_price || 0;

    const sumMats = (50 * precioT5) + (5 * precioPolvo) + (5 * precioPiedra) + precioT6Buy;
    const resultado = 6.91 * precioT6Sell;
    const profit = resultado - sumMats;

    if (sumEl) sumEl.innerHTML = window.formatGoldColored(sumMats);
    if (resEl) resEl.innerHTML = window.formatGoldColored(resultado);
    if (profitEl) profitEl.innerHTML = window.formatGoldColored(profit);

    const cells = row.querySelectorAll('td');
    addIconToCell(cells[0], iconCache[MATERIAL_IDS.t5[key]]);
    addIconToCell(cells[1], iconCache[MATERIAL_IDS.t6[key]]);
    addIconToCell(cells[2], iconCache[MATERIAL_IDS.polvo]);
    addIconToCell(cells[3], iconCache[MATERIAL_IDS.piedra]);
  });
}

export async function renderTablaLodestones() {
  const keys = Object.keys(LODESTONE_IDS.cores);
  const ids = [
    ...keys.map(k => LODESTONE_IDS.cores[k]),
    ...keys.map(k => LODESTONE_IDS.stones[k]),
    LODESTONE_IDS.polvo,
    LODESTONE_IDS.botella,
    LODESTONE_IDS.cristal
  ];

  const priceMap = await fetchItemPrices(ids);
  await fetchIcons(ids);

  keys.forEach(key => {
    const row = document.querySelector(`#tabla-lodestones tr[data-key="${key}"]`);
    if (!row) return;
    const sumEl = row.querySelector('.sum-mats');
    const profitEl = row.querySelector('.profit');

    const precioCore = priceMap[LODESTONE_IDS.cores[key]]?.buy_price || 0;
    const precioLodestoneSell = priceMap[LODESTONE_IDS.stones[key]]?.sell_price || 0;
    const precioPolvo = priceMap[LODESTONE_IDS.polvo]?.buy_price || 0;
    const precioBotella = priceMap[LODESTONE_IDS.botella]?.buy_price || 0;
    const precioCristal = priceMap[LODESTONE_IDS.cristal]?.buy_price || 0;

    const sumMats = (2 * precioCore) + precioPolvo + precioBotella + precioCristal;
    const profit = precioLodestoneSell - sumMats;

    if (sumEl) sumEl.innerHTML = window.formatGoldColored(sumMats);
    if (profitEl) profitEl.innerHTML = window.formatGoldColored(profit);

    const cells = row.querySelectorAll('td');
    addIconToCell(cells[0], iconCache[LODESTONE_IDS.cores[key]]);
    addIconToCell(cells[1], iconCache[LODESTONE_IDS.polvo]);
    addIconToCell(cells[2], iconCache[LODESTONE_IDS.botella]);
    addIconToCell(cells[3], iconCache[LODESTONE_IDS.cristal]);
    addIconToCell(cells[4], iconCache[LODESTONE_IDS.stones[key]]);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderTablaForja();
  renderTablaLodestones();
});
