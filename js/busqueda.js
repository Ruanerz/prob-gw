// ================================
// 🔍 Búsqueda y sugerencias de ítems (mejorada)
// ================================

const API_URL = 'https://api.datawars2.ie/gw2/v1/items/json?fields=id,name_es,buy_price,sell_price';
let allData = [];
const iconCache = {};
let debounceTimer;

// Carga inicial de todos los datos de ítems
fetch(API_URL)
  .then(response => response.json())
  .then(data => {
    allData = data;
    // Guardar precios reducidos para detalle
    const preciosReducidos = allData.map(({ id, buy_price, sell_price }) => ({
      id: parseInt(id, 10),
      buy_price: parseInt(buy_price, 10) || 0,
      sell_price: parseInt(sell_price, 10) || 0
    }));
    sessionStorage.setItem('itemList', JSON.stringify(preciosReducidos));
    // Ocultar loader si existe
    const loader = document.getElementById('loading');
    if (loader) loader.classList.add('hidden');
  });

// Función principal de búsqueda con debounce
const input = document.getElementById('search-input');
const suggestions = document.getElementById('search-suggestions');
if (input && suggestions) {
  input.addEventListener('input', function () {
    clearTimeout(debounceTimer);
    const valor = this.value.trim().toLowerCase();
    debounceTimer = setTimeout(() => mostrarSugerencias(valor), 300);
  });
}

// Helper para eliminar acentos y normalizar
function normalizeStr(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function mostrarSugerencias(valor) {
  suggestions.innerHTML = '';
  if (valor.length < 3) {
    suggestions.style.display = 'none';
    return;
  }
  suggestions.style.display = 'block';
  const normalValor = normalizeStr(valor);
const filtrados = allData
  .filter(row => row.name_es && normalizeStr(row.name_es).includes(normalValor))
  .slice(0, 10);

  const nuevosIds = filtrados.filter(r => !iconCache[r.id]).map(r => r.id);
  if (nuevosIds.length > 0) {
    fetch(`https://api.guildwars2.com/v2/items?ids=${nuevosIds.join(',')}&lang=es`)
      .then(res => res.json())
      .then(items => {
        items.forEach(i => iconCache[i.id] = i.icon);
        renderLista(filtrados);
      });
  } else {
    renderLista(filtrados);
  }
}

function renderLista(filtrados) {
  suggestions.innerHTML = '';
  if (filtrados.length === 0) {
    const li = document.createElement('div');
    li.className = 'no-results';
    li.textContent = 'No se encontraron resultados';
    suggestions.appendChild(li);
    return;
  }
  filtrados.forEach(row => {
    const div = document.createElement('div');
    div.className = 'suggestion-item';
    const icon = iconCache[row.id] || '';
    div.innerHTML = `<img src="${icon}" alt="" class="item-icon"> <span class="item-name">${row.name_es}</span>`;
    div.onclick = () => {
      sessionStorage.setItem('itemData', JSON.stringify(row));
      const preciosReducidos = allData.map(({ id, buy_price, sell_price }) => ({
        id: parseInt(id, 10),
        buy_price: parseInt(buy_price, 10) || 0,
        sell_price: parseInt(sell_price, 10) || 0
      }));
      sessionStorage.setItem('itemList', JSON.stringify(preciosReducidos));
      window.location.href = `item.html?id=${row.id}`;
    };
    suggestions.appendChild(div);
  });
}
