// search-modal-compare-craft.js
// Modal de búsqueda exclusivo para compare-craft.html
// No interfiere con otros modales ni con search-modal.js global


const API_URL_JSON = 'https://api.datawars2.ie/gw2/v1/items/json?fields=id,name_es';
const API_URL_CSV = 'https://api.datawars2.ie/gw2/v1/items/csv?fields=buy_price,sell_price,buy_quantity,sell_quantity,last_updated,1d_buy_sold,1d_sell_sold,2d_buy_sold,2d_sell_sold,7d_buy_sold,7d_sell_sold,1m_buy_sold,1m_sell_sold';
const GW2_API_ITEMS = 'https://api.guildwars2.com/v2/items?ids=';

const searchInput = document.getElementById('modal-search-input');
const suggestionsEl = document.getElementById('modal-suggestions');
const resultsEl = document.getElementById('modal-results');
const loader = document.getElementById('modal-loader');
const errorMessage = document.getElementById('modal-error-message');

let allItems = [];
let iconCache = {};
let rarityCache = {};

function showLoader(show) {
  loader.style.display = show ? 'block' : 'none';
}
function showError(msg) {
  errorMessage.textContent = msg;
  errorMessage.style.display = 'block';
}
function hideError() {
  errorMessage.style.display = 'none';
}

async function fetchAllItems() {
  const cached = sessionStorage.getItem('itemList');
  if (cached) {
    allItems = JSON.parse(cached);
    return;
  }
  showLoader(true);
  hideError();
  try {
    const resJson = await fetch(API_URL_JSON);
    const itemsJson = await resJson.json();
    const resCsv = await fetch(API_URL_CSV);
    const csvText = await resCsv.text();
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    const itemsCsv = lines.slice(1).map(line => {
      const values = line.split(',');
      const obj = {};
      headers.forEach((h, i) => {
        if (h === 'last_updated') {
          obj[h] = values[i] || '-';
        } else if (h === 'buy_price' || h === 'sell_price') {
          obj[h] = values[i] !== '' ? parseInt(values[i], 10) : null;
        } else {
          obj[h] = values[i] !== '' ? parseInt(values[i], 10) : null;
        }
      });
      return obj;
    });
    const csvById = {};
    itemsCsv.forEach(item => { csvById[Number(item.id)] = item; });
    allItems = itemsJson.map(item => ({
      ...item,
      ...(csvById[Number(item.id)] || {})
    }));
    sessionStorage.setItem('itemList', JSON.stringify(allItems));
  } catch (e) {
    showError('No se pudieron cargar los ítems.');
  } finally {
    showLoader(false);
  }
}

function renderResults(items, showNoResults = false) {
  resultsEl.innerHTML = '';
  if (!items.length && showNoResults) {
    resultsEl.innerHTML = '<div class="error-message">No se encontraron ítems.</div>';
    return;
  }
  const fragment = document.createDocumentFragment();
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.onclick = (event) => window.selectItem(item.id, event);
    const rarityClass = typeof getRarityClass === 'function'
        ? getRarityClass(rarityCache[item.id])
        : '';
    card.innerHTML = `
      <img src="${iconCache[item.id] || ''}" alt=""/>
      <div class="item-name ${rarityClass}">${item.name_es}</div>
      <div class="item-price" style="display:none;">Compra: ${item.buy_price || 0} | Venta: ${item.sell_price || 0}</div>
    `;
    fragment.appendChild(card);
  });
  resultsEl.appendChild(fragment);
}

function debounce(fn, ms) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

async function fetchIconsFor(ids) {
  if (!ids.length) return;
  try {
    const res = await fetch(GW2_API_ITEMS + ids.join(','));
    const data = await res.json();
    data.forEach(item => {
      iconCache[item.id] = item.icon;
      rarityCache[item.id] = item.rarity;
    });
  } catch {}
}

// Helper para eliminar acentos y normalizar
function normalizeStr(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

searchInput.addEventListener('input', debounce(async function(e) {
  const value = this.value.trim().toLowerCase();
  const normalValue = normalizeStr(value);
  if (value.length < 3) {
    resultsEl.innerHTML = '';
    return;
  }
  let matches = allItems.filter(item => {
    if (!item.name_es) return false;
    const normalName = normalizeStr(item.name_es);
    const match = normalName.includes(normalValue);
    return match;
  });
  matches = matches.slice(0, 30);
  if (matches.length) {
    const ids = matches.map(i => i.id);
    await fetchIconsFor(ids);
  }
  renderResults(matches, true);
}, 250));

// Inicialización automática al abrir modal
if (!window._compareCraftSearchLoaded) {
  fetchAllItems();
  window._compareCraftSearchLoaded = true;
}
