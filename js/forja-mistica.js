import { fetchItemPrices } from './fractales-gold-ui.js';

const GW2_API_ITEMS = 'https://api.guildwars2.com/v2/items?ids=';
const iconCache = {};

async function fetchIconsFor(ids = []) {
  if (!ids.length) return;
  try {
    const res = await fetch(`${GW2_API_ITEMS}${ids.join(',')}&lang=es`);
    const data = await res.json();
    data.forEach(item => {
      if (item && item.id) iconCache[item.id] = item.icon;
    });
  } catch {}
}

function getIcon(id) {
  return iconCache[id] || '';
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

export async function renderTablaForja() {
  const keys = Object.keys(MATERIAL_IDS.t5);
  const ids = [
    ...keys.map(k => MATERIAL_IDS.t5[k]),
    ...keys.map(k => MATERIAL_IDS.t6[k]),
    MATERIAL_IDS.polvo,
    MATERIAL_IDS.piedra
  ];
  const pricePromise = fetchItemPrices(ids);
  await fetchIconsFor(ids);
  const priceMap = await pricePromise;

  keys.forEach(key => {
    const row = document.querySelector(`#matt5t6 tr[data-key="${key}"]`);
    if (!row) return;
    const sumEl = row.querySelector('.sum-mats');
    const resEl = row.querySelector('.resultado');
    const profitEl = row.querySelector('.profit');
    const t5Cell = row.children[0]?.querySelector('.dato-item');
    const t6Cell = row.children[1]?.querySelector('.dato-item');
    const polvoCell = row.children[2]?.querySelector('.dato-item');
    const piedraCell = row.children[3]?.querySelector('.dato-item');

    const insertIcon = (cell, icon) => {
      if (!cell) return;
      const text = cell.textContent.trim();
      cell.innerHTML = (icon ? `<img src="${icon}" class="item-icon"> ` : '') + text;
    };

    insertIcon(t5Cell, getIcon(MATERIAL_IDS.t5[key]));
    insertIcon(t6Cell, getIcon(MATERIAL_IDS.t6[key]));
    insertIcon(polvoCell, getIcon(MATERIAL_IDS.polvo));
    insertIcon(piedraCell, getIcon(MATERIAL_IDS.piedra));

    const precioT5 = priceMap[MATERIAL_IDS.t5[key]]?.buy_price || 0;
    const precioT6Buy = priceMap[MATERIAL_IDS.t6[key]]?.buy_price || 0;
    const precioT6Sell = priceMap[MATERIAL_IDS.t6[key]]?.sell_price || 0;
    const precioPolvo = priceMap[MATERIAL_IDS.polvo]?.buy_price || 0;
    const precioPiedra = priceMap[MATERIAL_IDS.piedra]?.buy_price || 0;

    const sumMats = (50 * precioT5) + (5 * precioPolvo) + (5 * precioPiedra) + precioT6Buy;
    const resultado = 6.91 * precioT6Sell;
    const profit = sumMats - resultado;

    if (sumEl) sumEl.innerHTML = window.formatGoldColored(sumMats);
    if (resEl) resEl.innerHTML = window.formatGoldColored(resultado);
    if (profitEl) profitEl.innerHTML = window.formatGoldColored(profit);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderTablaForja().catch(console.error);
});

