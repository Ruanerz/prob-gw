import { fetchItemPrices } from './fractales-gold-ui.js';

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
  const priceMap = await fetchItemPrices(ids);

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
    const profit = sumMats - resultado;

    if (sumEl) sumEl.innerHTML = window.formatGoldColored(sumMats);
    if (resEl) resEl.innerHTML = window.formatGoldColored(resultado);
    if (profitEl) profitEl.innerHTML = window.formatGoldColored(profit);
  });
}

document.addEventListener('DOMContentLoaded', renderTablaForja);
