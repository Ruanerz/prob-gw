// GW2 Item Tracker v2 - UI Y PRESENTACIÓN (item-ui.js)
import {
  CraftIngredient
} from './compare-logic.js';

// --- Setter local para el arreglo de ingredientes (igual que en item.js) ---
function setIngredientObjs(val) {
  window.ingredientObjs = val;
}

// --- Setter local para la cantidad global (igual que en item.js) ---
function setGlobalQty(val) {
  window.globalQty = val;
}

// --- Helpers para guardar/restaurar el estado expandido (locales, igual que en item.js) ---
function snapshotExpandState(ings) {
  if (!ings) return [];
  return ings.map(ing => ({
    id: ing.id,
    expanded: ing.expanded,
    children: snapshotExpandState(ing.children || [])
  }));
}
function restoreExpandState(ings, snapshot) {
  if (!ings || !snapshot) return;
  for (let i = 0; i < ings.length; i++) {
    if (snapshot[i]) {
      ings[i].expanded = snapshot[i].expanded;
      restoreExpandState(ings[i].children, snapshot[i].children);
    }
  }
}

// --- Helper para recalcular todos los ingredientes (local, igual que en item.js) ---
function recalcAll(ingredientObjs, globalQty) {
  if (!ingredientObjs) return;
  ingredientObjs.forEach(ing => ing.recalc(globalQty));
}

// --- Helper para totales (local, igual que en item.js) ---
function getTotals(ingredientObjs) {
  let totalBuy = 0, totalSell = 0, totalCrafted = 0;
  for (const ing of ingredientObjs) {
    totalBuy += ing.total_buy || 0;
    totalSell += ing.total_sell || 0;
    totalCrafted += ing.total_crafted || 0;
  }
  return { totalBuy, totalSell, totalCrafted };
}

// --- Helpers para el input de cantidad global (definidos localmente) ---
function setQtyInputValue(val) {
  const input = document.getElementById('qty-global');
  if (!input) return;
  // Prefiere el valor temporal si existe
  if (typeof window._qtyInputValue !== 'undefined') {
    input.value = window._qtyInputValue;
  } else {
    input.value = window.globalQty;
  }
}

function getQtyInputValue() {
  const input = document.getElementById('qty-global');
  return input ? parseInt(input.value, 10) : 1;
}

// --- Función local para buscar ingrediente por ID (recursiva, igual que en item.js) ---
// Busca ingrediente por id simple (para expand/collapse)
function findIngredientById(ings, id) {
  for (const ing of ings) {
    if (!ing || typeof ing !== 'object' || typeof ing.id === 'undefined') continue;
    if (typeof ing.then === 'function') continue;
    if (String(ing.id) === String(id)) return ing;
    if (Array.isArray(ing.children) && ing.children.length) {
      const found = findIngredientById(ing.children, id);
      if (found) return found;
    }
  }
  return null;
}

// Busca ingrediente por id y parentId
function isEquivalentParentId(a, b) {
  // Equivalentes si ambos son null, undefined, "null", o "" (vacío)
  const nullLikes = [null, undefined, "null", ""];
  return (nullLikes.includes(a) && nullLikes.includes(b)) || String(a) === String(b);
}

function findIngredientByIdAndParent(ings, id, parentId) {
  for (const ing of ings) {
    if (!ing || typeof ing !== 'object' || typeof ing.id === 'undefined') continue;
    if (typeof ing.then === 'function') continue; // Ignorar promesas

    // DEBUG: Imprime los valores que compara

    if (
      String(ing.id) === String(id) &&
      isEquivalentParentId(ing._parentId, parentId)
    ) {
      return ing;
    }
    if (Array.isArray(ing.children) && ing.children.length) {
      const found = findIngredientByIdAndParent(ing.children, id, parentId);
      if (found) return found;
    }
  }
}
window.findIngredientByIdAndParent = findIngredientByIdAndParent;

// --- Helpers visuales ---

// --- DEPURACIÓN: Verifica que todos los ingredientes y subingredientes tengan id válido ---
function checkTreeForInvalidIds(ings, path = "") {
  if (!Array.isArray(ings)) return;
  for (const ing of ings) {
    if (!ing || typeof ing.id === "undefined" || ing.id === null) {
      console.warn("Ingrediente sin id válido en ruta:", path, ing);
    }
    if (Array.isArray(ing.children)) {
      checkTreeForInvalidIds(ing.children, path + " > " + (ing.name || ing.id));
    }
  }
}
window.checkTreeForInvalidIds = checkTreeForInvalidIds;

// Llama a esto tras inicializar window.ingredientObjs, antes de renderizar:
// checkTreeForInvalidIds(window.ingredientObjs);

// --- Función para calcular porcentajes (copiada de item.js) ---
function calcPercent(sold, available) {
  if (!sold || !available || isNaN(sold) || isNaN(available) || available === 0) return '-';
  return ((sold / available) * 100).toFixed(1) + '%';
}


function renderWiki(name) {
  if (!name) return;
  const nombre = encodeURIComponent(name.replaceAll(' ', '_'));
  const wikiES = `https://wiki.guildwars2.com/wiki/es:${nombre}`;
  const wikiEN = `https://wiki.guildwars2.com/wiki/${nombre}`;
  const wikiLinksEl = document.getElementById('wiki-links');
  wikiLinksEl.innerHTML = `
    <div class="wiki-links">
      <a href="${wikiES}" target="_blank">Wiki en Español</a>
      <a href="${wikiEN}" target="_blank">Wiki en Inglés</a>
    </div>
  `;
}

// --- Helpers de UI ---
export function showLoader(show) {
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = show ? 'block' : 'none';
}
export function showError(msg) {
  const errorMessage = document.getElementById('error-message');
  if (errorMessage) {
    errorMessage.textContent = msg;
    errorMessage.style.display = 'block';
  }
}
export function hideError() {
  const errorMessage = document.getElementById('error-message');
  if (errorMessage) errorMessage.style.display = 'none';
}

// Inicializa el mapa de expansión principal por id
if (typeof window._mainItemExpandedMap === 'undefined') {
  window._mainItemExpandedMap = {};
}
// Handler para el botón de expandir/collapse principal
if (!window._mainExpandBtnHandlerInstalled) {
  window._mainExpandBtnHandlerInstalled = true;
  document.addEventListener('click', function(e) {
    // Handler para expandir/collapse principal
    if (e.target && e.target.classList.contains('btn-expand-main')) {
      const mainId = e.target.getAttribute('data-id');
      if (!mainId) return;
      window._mainItemExpandedMap[mainId] = !window._mainItemExpandedMap[mainId];
      if (typeof safeRenderTable === 'function') safeRenderTable();
      e.stopPropagation();
    }
  });
  // Handler global SEPARADO para eliminar ítem principal
  document.addEventListener('click', function(e) {
    if (e.target && (e.target.classList.contains('btn-delete-main') || (typeof e.target.closest === 'function' && e.target.closest('.btn-delete-main')))) {
      let deleteBtn = e.target;
      if (!deleteBtn.classList.contains('btn-delete-main') && typeof deleteBtn.closest === 'function') {
        deleteBtn = deleteBtn.closest('.btn-delete-main');
      }
      if (!deleteBtn) return;
      const mainId = deleteBtn.getAttribute('data-id');
      if (!mainId) return;
      if (window.ingredientObjs && Array.isArray(window.ingredientObjs)) {
        window.ingredientObjs = window.ingredientObjs.filter(ing => String(ing.id) !== String(mainId));
        if (window._mainItemExpandedMap) delete window._mainItemExpandedMap[mainId];
      }
      if (typeof safeRenderTable === 'function') safeRenderTable();
      e.stopPropagation();
    }
  });
}

// --- Handler para cambio de modo (buy/sell/crafted) ---
if (!window._modeChangeHandlerInstalled) {
  window._modeChangeHandlerInstalled = true;
  document.addEventListener('click', function(e) {
    const target = e.target;
    if (target.matches('.chk-mode-buy, .chk-mode-sell, .chk-mode-crafted')) {
      const path = target.getAttribute('data-path');
      if (!path) return;

      const pathArr = path.split('-');
      const rootId = pathArr[0];
      // Busca el objeto raíz correcto en el array principal
      const rootNode = window.ingredientObjs.find(ing => String(ing.id) === String(rootId));
      if (!rootNode) return;

      // Usa una función de búsqueda que opere dentro del árbol del nodo raíz
      const ingredient = findIngredientByPath([rootNode], pathArr);
      
      if (ingredient) {
        let newMode = 'buy';
        if (target.classList.contains('chk-mode-sell')) newMode = 'sell';
        if (target.classList.contains('chk-mode-crafted')) newMode = 'crafted';
        
        // Llamamos al nuevo método que se encarga de todo: recalcular y volver a renderizar
        ingredient.setMode(newMode);
      }
    }
  });
}

// Handler global para expandir/collapse ingredientes hijos
// DEPURACIÓN: logs antes y después de buscar/cambiar expanded
if (!window._expandBtnHandlerInstalled) {
  // Búsqueda robusta por path completo (único en toda la tabla)
  function findIngredientByPath(ings, pathArr) {
    let current = ings;
    let ing = null;
    for (let i = 0; i < pathArr.length; i++) {
      const id = pathArr[i];
      ing = (current || []).find(n => String(n.id) === String(id));
      if (!ing) return null;
      current = ing.children;
    }
    return ing;
  }
  window.findIngredientByPath = findIngredientByPath;
  window._expandBtnHandlerInstalled = true;
  // Handler único para expand/collapse por data-path está en installUIEvents o más abajo.
}


// Renderiza la fila del item principal (crafteable)
function renderMainItemRow(mainItem, qty, totalBuy, totalSell, totalCrafted) {
  // Usa SIEMPRE los totales calculados en el nodo raíz tras recalc.
  // Esto mantiene la misma lógica que en item.js y evita desincronizaciones.
  const realTotals = {
    totalBuy: mainItem.total_buy,
    totalSell: mainItem.total_sell,
    totalCrafted: mainItem.total_crafted
  };

  if (!mainItem) return '';
  const expanded = !!window._mainItemExpandedMap[mainItem.id];
  const btnExpand = `<button class="btn-expand btn-expand-main" id="btn-expand-main-${mainItem.id}" data-id="${mainItem.id}">${expanded ? '▴' : '▾'}</button>`;
  const btnDelete = `<button class="btn-delete-main" data-id="${mainItem.id}" title="Eliminar">-</button>`;
  const btn = `${btnExpand} ${btnDelete}`;
  return `
    <tr class="row-bg-main">
      <td class="th-border-left-items"><img src="${mainItem.icon}" width="32"></td>
      <td><a href="item.html?id=${mainItem.id}" class="item-link" target="_blank">${(mainItem.recipe && mainItem.recipe.output_item_count && mainItem.recipe.output_item_count > 1) ? `<span style='color:#a1a1aa;font-size:0.95em;display:block;margin-bottom:2px;'>Receta produce <b>${mainItem.recipe.output_item_count}</b> unidades<br>Profit mostrado es por unidad</span>` : ''}${mainItem.name}</a></td>
      <td>${qty}</td>
      <td class="item-unit-sell">${formatGold(Number(mainItem.sell_price))} <span style="color: #c99b5b">c/u</span></td>
      <td class="item-solo-buy"><div>${formatGold(realTotals.totalBuy)}</div></td>
      <td class="item-solo-sell"><div>${formatGold(realTotals.totalSell)}</div></td>
      <td class="item-solo-crafted"><div>${formatGold(realTotals.totalCrafted)}</div></td>
      <td class="item-profit">${(() => {
        const ventaBruta = Number(mainItem.sell_price) * qty;
        const ventaNeta = ventaBruta - (ventaBruta * 0.15);
        const minTotal = Math.min(realTotals.totalBuy, realTotals.totalSell, realTotals.totalCrafted);
        const profit = ventaNeta - minTotal;
        const color = profit > 0 ? '#4fc178' : '#e84d4d';
        return `<span style='font-weight:bold;color:${color}'>${formatGold(profit)}</span>`;
      })()}</td>
      <td class="th-border-right-items"><div style="display:flex;gap:6px;align-items:center;">${btn}</div></td>
    </tr>
  `;

}

// --- Renderizado recursivo de ingredientes ---
function renderRows(ings, nivel = 0, parentId = null, rowGroupIndex = 0, parentExpanded = true, path = []) {
  if (!ings || !Array.isArray(ings)) return '';

  return ings.map((ing, idx) => {
    if (!ing || typeof ing.id === 'undefined') {
      console.warn('Ingrediente inválido en renderRows:', ing);
      return '';
    }
    
    const groupIdx = nivel === 0 ? idx : rowGroupIndex;
    const rowBgClass = groupIdx % 2 === 0 ? 'row-bg-a' : 'row-bg-b';
    const indent = nivel > 0 ? `style="padding-left:${nivel * 30}px"` : '';
    const currentPath = [...path, ing.id].join('-');
    const expandButton = (ing.children && ing.children.length)
      ? `<button class="btn-expand" data-path="${currentPath}">${ing.expanded ? '▴' : '▾'}</button>` : '';
    
    const isChild = nivel > 0;
    const extraStyle = isChild && !parentExpanded ? 'style="display:none"' : '';
    
    const radioName = `mode-${currentPath}`;
    const radios = isChild ? `
      <input type="radio" name="${radioName}" class="chk-mode-buy" data-path="${currentPath}" ${ing.modeForParentCrafted === 'buy' ? 'checked' : ''} title="Usar precio de compra para el padre">
    ` : '';
    const radiosSell = isChild ? `
      <input type="radio" name="${radioName}" class="chk-mode-sell" data-path="${currentPath}" ${ing.modeForParentCrafted === 'sell' ? 'checked' : ''} title="Usar precio de venta para el padre">
    ` : '';
    const radiosCrafted = (isChild && ing.is_craftable && ing.children && ing.children.length > 0) ? `
      <input type="radio" name="${radioName}" class="chk-mode-crafted" data-path="${currentPath}" ${ing.modeForParentCrafted === 'crafted' ? 'checked' : ''} title="Usar precio de crafteo para el padre">
    ` : '';

    // El total de profit solo tiene sentido para el nodo raíz
    const profitHtml = (() => {
        // Mostrar profit SOLO si el ingrediente es padre (tiene hijos) y tiene precio de mercado
        if (!(ing.children && ing.children.length > 0 && Number(ing.sell_price) > 0)) {
          return '';
        }
        const ventaBruta = Number(ing.sell_price) * ing.countTotal;
        const ventaNeta = ventaBruta - (ventaBruta * 0.15);
        const minTotal = Math.min(ing.total_buy, ing.total_sell, ing.total_crafted);
        const profit = ventaNeta - minTotal;
        const color = profit > 0 ? '#4fc178' : '#e84d4d';
        return `<span style='font-weight:bold;color:${color}'>${formatGold(profit)}</span>`;
    })();

    return `
      <tr data-path="${currentPath}" class="${isChild ? `subrow subrow-${nivel} child-of-${parentId}` : ''} ${rowBgClass}" ${extraStyle}>
        <td class="th-border-left-items" ${indent}><img src="${ing.icon}" width="32"></td>
        <td><a href="item.html?id=${ing.id}" class="item-link" target="_blank">${ing.name}</a></td>
        <td>${ing.countTotal ? (Number.isInteger(ing.countTotal) ? ing.countTotal : ing.countTotal.toFixed(2)) : ing.count}</td>
        <td class="item-unit-sell">${formatGold(ing.sell_price)} <span style="color: #c99b5b">c/u</span></td>
        
        <td class="item-solo-buy">
          <div>${formatGold(ing.total_buy)}</div>
          <div class="item-solo-precio">${formatGold(ing.buy_price)} <span style="color: #c99b5b">c/u</span></div>
          ${radios}
        </td>
        
        <td class="item-solo-sell">
          <div>${formatGold(ing.total_sell)}</div>
          <div class="item-solo-precio">${formatGold(ing.sell_price)} <span style="color: #c99b5b">c/u</span></div>
          ${radiosSell}
        </td>
        
        <td class="item-solo-crafted">
          ${(ing.is_craftable && ing.children && ing.children.length > 0 && ing.total_crafted !== null) ? `
            <div>${formatGold(ing.total_crafted)}</div>
            <div class="item-solo-precio">${formatGold(0)} <span style="color: #c99b5b">c/u</span></div>
            ${radiosCrafted}` : ''
          }
        </td>
        
        <td class="item-profit">${profitHtml}</td>
        
        <td class="th-border-right-items">${expandButton}</td>
      </tr>
      ${(ing.children && ing.children.length && parentExpanded && ing.expanded) ? renderRows(ing.children, nivel + 1, ing.id, groupIdx, ing.expanded, [...path, ing.id]) : ''}
    `;
  }).join('');
}

// --- Asegura que todos los ingredientes inicien colapsados ---
function setAllExpandedFalse(ings) {
  for (const ing of ings) {
    ing.expanded = false;
    if (Array.isArray(ing.children)) setAllExpandedFalse(ing.children);
  }
}

// --- Asigna _parentId de forma robusta a todo el árbol ---
function asignarParentIds(nodos, parentId = "") {
  nodos.forEach(ing => {
    ing._parentId = parentId !== null ? String(parentId) : "";
    if (Array.isArray(ing.children)) {
      asignarParentIds(ing.children, ing.id);
    }
  });
}
if (window.ingredientObjs) asignarParentIds(window.ingredientObjs);

// --- Comparación robusta de parentId ---

// --- Función para mostrar/ocultar el input de cantidad global ---
function updateQtyInputVisibility(show) {
  const qtyContainer = document.querySelector('.qty-global-container');
  if (qtyContainer) {
    if (show) {
      qtyContainer.classList.add('visible');
    } else {
      qtyContainer.classList.remove('visible');
    }
  }
}

// --- Renderizado de la sección 7: Ingredientes para craftear ---
function renderCraftingSectionUI() {
  if (typeof window._mainItemExpanded === 'undefined') window._mainItemExpanded = false;
  
  // Mostrar/ocultar el input de cantidad global según si hay ingredientes
  const hasIngredients = window.ingredientObjs && window.ingredientObjs.length > 0;
  updateQtyInputVisibility(hasIngredients);
  // --- DEBUG: Mostrar todos los valores clave ---

  // Obtener output_item_count de la receta principal
  const outputCount = (_mainRecipeOutputCount && !isNaN(_mainRecipeOutputCount)) ? _mainRecipeOutputCount : 1;
  const totals = getTotals(window.ingredientObjs);
  const qtyValue = (typeof getQtyInputValue() !== 'undefined' ? getQtyInputValue() : window.globalQty);
  const precioCompraTotal = (_mainBuyPrice != null) ? _mainBuyPrice * window.globalQty : 0;
  // Suma el sell_price de todos los ítems raíz
  const totalSellPrice = window.ingredientObjs.reduce((sum, ing) => sum + (Number(ing.sell_price) || 0), 0);
  const precioVentaTotal = totalSellPrice * window.globalQty;
  const precioCraftingMinTotal = Math.min(totals.totalBuy, totals.totalSell, totals.totalCrafted);
  const precioCraftingMinUnidad = outputCount > 0 ? precioCraftingMinTotal / outputCount : precioCraftingMinTotal;
  const precioCompraUnidad = outputCount > 0 ? precioCompraTotal / outputCount : precioCompraTotal;
  const precioVentaUnidad = outputCount > 0 ? (totalSellPrice / outputCount) : totalSellPrice;
  const preciosFinales = [precioCompraTotal, precioVentaTotal, precioCraftingMinTotal];
  const precioMinimoFinal = Math.min(...preciosFinales.filter(x => x > 0));
  const preciosFinalesUnidad = [precioCompraUnidad, precioVentaUnidad, precioCraftingMinUnidad];
  const precioMinimoFinalUnidad = Math.min(...preciosFinalesUnidad.filter(x => x > 0));
  let mensaje = '';
  if (precioMinimoFinal === precioCompraTotal) mensaje = 'Mejor comprar (Buy)';
  else if (precioMinimoFinal === precioVentaTotal) mensaje = 'Mejor vender (Sell)';
  else mensaje = 'Mejor craftear (Crafted)';

  // Profit
  let profitHtml = '';
  let profitHtmlUnidad = '';
  // --- Lógica y estructura idéntica a item-ui.js ---
  // Variables para profit total (outputCount === 1)
  const ventaTrasComisionTotal = precioVentaTotal - (precioVentaTotal * 0.15);
  const profitBuyTotal = ventaTrasComisionTotal - totals.totalBuy;
  const profitSellTotal = ventaTrasComisionTotal - totals.totalSell;
  const profitCraftedTotal = ventaTrasComisionTotal - totals.totalCrafted;
  // Variables para profit por unidad (outputCount > 1)
  const precioVentaUnidadMercado = (_mainSellPrice != null) ? _mainSellPrice : 0;
  const ventaTrasComisionUnidadMercado = precioVentaUnidadMercado - (precioVentaUnidadMercado * 0.15);
  const profitBuyUnidadMercado = ventaTrasComisionUnidadMercado - (totals.totalBuy / outputCount);
  const profitSellUnidadMercado = ventaTrasComisionUnidadMercado - (totals.totalSell / outputCount);
  const profitCraftedUnidadMercado = ventaTrasComisionUnidadMercado - (totals.totalCrafted / outputCount);

  if (outputCount === 1) {
    profitHtml = '';
  }
  if (outputCount > 1) {
    profitHtmlUnidad = '';
  }

  // Tablas de totales
  let tablaTotales = `<div class="table-modern-totales">
    <h3>Precio total materiales - Crafting</h3>
    <div id="totales-crafting">      
      <table class="table-totales" style="margin-top:12px;">
        <tr>
          <th><div class="tooltip-modern">Total Buy
            <span class="tooltiptext-modern">Suma total si haces PEDIDO de materiales en el mercado.</span>
          </div></th>
          <td class="item-solo-buy">${formatGold(totals.totalBuy)}</td>
          <th><div class="tooltip-modern">Total Sell
            <span class="tooltiptext-modern">Suma total si COMPRAS materiales en el mercado.</span>
          </div></th>
          <td class="item-solo-sell">${formatGold(totals.totalSell)}</td>
          <th><div class="tooltip-modern">Total Crafted
            <span class="tooltiptext-modern">Suma total si CRAFTEAS todos los materiales posibles desde cero.</span>
          </div></th>
          <td class="item-solo-crafted">${formatGold(totals.totalCrafted)}</td>
        </tr>
      </table>
    </div>
    </div>`;
  let tablaTotalesUnidad = '';
  if (outputCount > 1) {
    tablaTotalesUnidad = `<div class="table-modern-totales">
    <div style='margin-bottom:8px;color:#a1a1aa;font-size:1em;'>Esta receta produce <b>${outputCount}</b> unidades por crafteo. Los siguientes costos son por unidad.</div>
      <div id="totales-crafting">
        <table class="table-totales" style="margin-top:12px;">
          <tr>
            <th><div class="tooltip-modern">Total Buy
              <span class="tooltiptext-modern">Suma total si haces PEDIDO de materiales en el mercado.</span>
            </div></th>
            <td class="item-solo-buy">${formatGold(totals.totalBuy / outputCount)}</td>
            <th><div class="tooltip-modern">Total Sell
              <span class="tooltiptext-modern">Suma total si COMPRAS materiales en el mercado.</span>
            </div></th>
            <td class="item-solo-sell">${formatGold(totals.totalSell / outputCount)}</td>
            <th><div class="tooltip-modern">Total Crafted
              <span class="tooltiptext-modern">Suma total si CRAFTEAS todos los materiales posibles desde cero.</span>
            </div></th>
            <td class="item-solo-crafted">${formatGold(totals.totalCrafted / outputCount)}</td>
          </tr>
        </table>
      </div>
    </div>`;
  }

  let tablaComparativa = '';
  let tablaComparativaUnidad = '';
  if (outputCount === 1) {
    tablaComparativa = `<section id='comparativa-section'>
      <div class="table-modern-totales"><br>
        <h3>Comparativa de precios de Bazar vs Crafting</h3>
        <table class='table-totales totales-crafting-comparativa'>
          <tr style='text-align:center;'>
            <td><div style='${precioMinimoFinal===precioCompraTotal ? 'background:#e84d4d33;font-weight:bold;border-radius:6px;padding:10px;' : ''}'>${formatGold(precioCompraTotal)} <br><span style='font-size:0.93em;'>Precio compra</span></div></td>
            <td><div style='${precioMinimoFinal===precioVentaTotal ? 'background:#4db1e833;font-weight:bold;border-radius:6px;padding:10px;' : ''}'>${formatGold(precioVentaTotal)} <br><span style='font-size:0.93em;'>Precio venta</span></div></td>
            <td><div style='${precioMinimoFinal===precioCraftingMinTotal ? 'background:#4fc17833;font-weight:bold;border-radius:6px;padding:10px;' : ''}'>${formatGold(precioCraftingMinTotal)} <br><span style='font-size:0.93em;'>Precio crafting más bajo</span></div></td>
          </tr>
          <tr><td colspan='3' style='text-align:center;font-size:1.07em;'>${mensaje}</td></tr>
        </table>
      </div>
      </section>`;
  }
  if (outputCount > 1) {
    const precioCompraUnidadMercado = (_mainBuyPrice != null) ? _mainBuyPrice : 0;
    const precioVentaUnidadMercado = (_mainSellPrice != null) ? _mainSellPrice : 0;
    const precioCraftingMinUnidadReal = outputCount > 0 ? precioCraftingMinTotal / outputCount : precioCraftingMinTotal;
    const preciosUnidadCorr = [precioCompraUnidadMercado, precioVentaUnidadMercado, precioCraftingMinUnidadReal];
    const precioMinimoUnidadReal = Math.min(...preciosUnidadCorr.filter(x => x > 0));
    const minIdxUnidad = preciosUnidadCorr.indexOf(precioMinimoUnidadReal);
    tablaComparativaUnidad = `<section id='comparativa-section-unidad'>
      <div class="table-modern-totales"><br>
        <h3>Comparativa de precios de Bazar vs Crafting por UNIDAD</h3>
        <div style='margin-bottom:8px;color:#a1a1aa;font-size:1em;'>Esta receta produce <b>${outputCount}</b> unidades por crafteo. Los siguientes precios son por unidad.</div>
        <table class='table-totales totales-crafting-comparativa'>
          <tr style='text-align:center;'>
            <td><div style='${minIdxUnidad===0 ? 'background:#e84d4d33;font-weight:bold;border-radius:6px;padding:10px;' : ''}'>${formatGold(precioCompraUnidadMercado)} <br><span style='font-size:0.93em;'>Precio compra</span></div></td>
            <td><div style='${minIdxUnidad===1 ? 'background:#4db1e833;font-weight:bold;border-radius:6px;padding:10px;' : ''}'>${formatGold(precioVentaUnidadMercado)} <br><span style='font-size:0.93em;'>Precio venta</span></div></td>
            <td><div style='${minIdxUnidad===2 ? 'background:#4fc17833;font-weight:bold;border-radius:6px;padding:10px;' : ''}'>${formatGold(precioCraftingMinUnidadReal)} <br><span style='font-size:0.93em;'>Precio crafting más bajo</span></div></td>
          </tr>
          <tr><td colspan='3' style='text-align:center;font-size:1.07em;'>${mensaje}</td></tr>
        </table>
      </div>
      </section>`;
  }

  const html = `
    <h3>Comparativa de items</h3>

    <table class="table-modern tabla-tarjetas">
      <thead class="header-items table-comparison-row">
        <tr>
          <th class="th-border-left">Ícono</th>
          <th>Nombre</th>
          <th>Cantidad</th>
          <th>Precio de venta</th>
          <th>Total Buy</th>
          <th>Total Sell</th>
          <th>Total Crafted</th>
          <th>Mejor Profit</th>
          <th class="th-border-right"></th>
        </tr>
      </thead>
      <tbody>
        ${window.ingredientObjs.map(ing => `
          ${renderMainItemRow(ing, window.globalQty, ing.total_buy, ing.total_sell, ing.total_crafted)}
          ${window._mainItemExpandedMap[ing.id] ? renderRows(ing.children, 1, ing.id, 0, true, [ing.id]) : ''}
`).join('')}
      </tbody>
    </table>
    <!-- ${outputCount > 1 ? tablaTotalesUnidad : tablaTotales} -->
    <!-- Comparativa de precios oculta -->
    ${profitHtml}
  `;

  return html;
}

// --- Renderizado principal refactorizado ---
async function renderItemUI(itemData, marketData) {
  // --- SNAPSHOT DEL ESTADO EXPANDIDO ---
  const expandSnapshot = snapshotExpandState(window.ingredientObjs);
  const itemHeader = document.getElementById('item-header');
  if (itemHeader) {
    itemHeader.style.display = 'none';
    // Si necesitas limpiar el contenido, puedes usar:
    // itemHeader.innerHTML = '';
  }
  // El resto del renderizado continúa normalmente, pero no redeclares la variable.

  // Si necesitas renderizar este header dinámico, usa una variable y asígnalo a innerHTML donde corresponda:
  /*
  const headerHtml = `
    <table class="table-modern tabla-tarjetas" style="margin-bottom:0;"><p>TABLA DINAMICA</p>
      <tbody>
        <tr class="row-bg-a">
          <td class="th-border-left-items" style="width:48px"><img src="${itemData.icon}" width="40" height="40" style="vertical-align:middle;object-fit:contain;border-radius:6px;background:#181c24;box-shadow:0 1px 4px #0008;"></td>
          <td>
            <div style="font-size:1.18em;font-weight:600;">${itemData.name}</div>
            <div style="color:#a1a1aa;font-size:1.05rem;">ID: ${itemData.id} &nbsp;|&nbsp; ${itemData.type}${itemData.rarity ? ' - ' + itemData.rarity : ''}</div>
          </td>
          <td colspan="5" class="th-border-right-items"></td>
        </tr>
      </tbody>
    </table>
  `;
  // document.getElementById('item-header').innerHTML = headerHtml;
  */


  // Precios
  const safeMarketData = marketData || {};
const precios = `
    <!--<table class="table-modern">
      <tr><th><div class="dato-item">Precio de compra</div></th><td><div class="dato-item-info">${formatGold(safeMarketData.buy_price != null ? safeMarketData.buy_price : 0)}</div></td></tr>
      <tr><th><div class="dato-item">Precio de venta</div></th><td><div class="dato-item-info">${formatGold(safeMarketData.sell_price != null ? safeMarketData.sell_price : 0)}</div></td></tr>
       <tr><th><div class="dato-item">Disponibles para comprar</div></th><td><div class="dato-item-info">${safeMarketData.buy_quantity != null ? safeMarketData.buy_quantity : '-'}</div></td></tr> 
       <tr><th><div class="dato-item">Disponibles para vender</div></th><td><div class="dato-item-info">${safeMarketData.sell_quantity != null ? safeMarketData.sell_quantity : '-'}</div></td></tr> 
    </table>-->
  `;
  // Eliminado: seccion-precios, seccion-totales y seccion-comparativa (ya no existen en el HTML)

  // --- RESTAURAR ESTADO EXPANDIDO ANTES DE RENDERIZAR ---
  restoreExpandState(window.ingredientObjs, expandSnapshot);

  // Crafting
  document.getElementById('seccion-crafting').innerHTML = renderCraftingSectionUI();

  installUIEvents();
}

// --- Instalación de eventos y render seguro ---
function installUIEvents() {
  // Listener para cantidad global
  document.addEventListener('input', function(e) {
    if (e.target && e.target.id === 'qty-global') {
      let val = parseInt(e.target.value, 10);
      if (isNaN(val) || val < 1) val = 1;
      setGlobalQty(val);
      recalcAll(window.ingredientObjs, window.globalQty);
      safeRenderTable();
    }
  });

  // Listener para radios de modo en subingredientes
  // (Ya implementado abajo en el handler global de radios)
}

// Handler global para expandir/collapse ingredientes hijos por data-path
document.addEventListener('click', function(e) {
  if (e.target && e.target.classList.contains('btn-expand')) {
    const pathStr = e.target.getAttribute('data-path');
    if (!pathStr) return;
    const path = pathStr.split('-').map(x => x.trim());
    const ing = findIngredientByPath(window.ingredientObjs, path);
    if (ing) {
      ing.expanded = !ing.expanded;
      if (typeof safeRenderTable === 'function') safeRenderTable();
    }
  }
});

// Handler radios buy/sell/crafted

  // Handler input cantidad global
  if (!window._qtyGlobalHandlerInstalled) {
    window._qtyGlobalHandlerInstalled = true;
    // INPUT: permite escribir varios dígitos, no fuerza recalculo salvo que sea válido
    document.addEventListener('input', function(e) {
      if (e.target && e.target.id === 'qty-global') {
        window._qtyInputValue = e.target.value;
        // NO recalcula, NO renderiza, NO actualiza globalQty aquí
      }
    });
    // BLUR: si el valor es inválido, lo pone en 1
    document.addEventListener('blur', function(e) {
      if (e.target && e.target.id === 'qty-global') {
        const input = e.target;
        let val = parseInt(input.value, 10);
        if (isNaN(val) || val < 1) {
          setGlobalQty(1);
          window._qtyInputValue = '1';
        } else {
          setGlobalQty(val);
          window._qtyInputValue = input.value;
        }
        if (typeof window._qtyInputValue !== 'undefined' && String(window._qtyInputValue) === String(window.globalQty)) {
          delete window._qtyInputValue;
        }
        ingredientObjs.forEach(ing => ing.recalc(window.globalQty));
        const node = document.querySelector('#seccion-crafting, div#seccion-crafting');
        if (node) node.innerHTML = renderCraftingSectionUI();
      }
    }, true);
    // ENTER: igual que blur
    document.addEventListener('keydown', function(e) {
      if (e.target && e.target.id === 'qty-global' && (e.key === 'Enter')) {
        e.preventDefault(); // Evita salto de línea o submit
        const input = e.target;
        let val = parseInt(input.value, 10);
        if (isNaN(val) || val < 1) {
          setGlobalQty(1);
          window._qtyInputValue = '1';
        } else {
          setGlobalQty(val);
          window._qtyInputValue = input.value;
        }
        if (typeof window._qtyInputValue !== 'undefined' && String(window._qtyInputValue) === String(window.globalQty)) {
          delete window._qtyInputValue;
        }
        ingredientObjs.forEach(ing => ing.recalc(window.globalQty));
        const node = document.querySelector('#seccion-crafting, div#seccion-crafting');
        if (node) node.innerHTML = renderCraftingSectionUI();
      }
    });
  }

// --- Inicialización principal ---
export async function initItemUI(itemData, marketData) {
  window._lastItemData = itemData;
  window._lastMarketData = marketData;
  showLoader(false);
  hideError();
  await renderItemUI(itemData, marketData);
}

  

// --- Inicialización de eventos y render seguro ---

export { renderItemUI, safeRenderTable };

function safeRenderTable() {
  // Siempre recalcula y renderiza la sección de ingredientes y totales
  recalcAll(window.ingredientObjs, window.globalQty);
  const seccion = document.getElementById('seccion-crafting');
  if (seccion) {
    seccion.innerHTML = renderCraftingSectionUI();
  }
  // Re-sincronizar el input de cantidad global
  setQtyInputValue(window.globalQty);
}
  // Aquí debe ir la lógica para re-renderizar la tabla de ingredientes y restaurar estados visuales
  // (Implementar usando los helpers y renderRows, etc. según se necesite)


// --- Inicialización principal ---
