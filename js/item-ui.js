// GW2 Item Tracker v2 - UI Y PRESENTACIÓN (item-ui.js)

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

// --- Helpers visuales ---

// La función calcPercent se importa desde item.js
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
function showLoader(show) {
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = show ? 'block' : 'none';
}
function showError(msg) {
  const errorMessage = document.getElementById('error-message');
  if (errorMessage) {
    errorMessage.textContent = msg;
    errorMessage.style.display = 'block';
  }
}
function hideError() {
  const errorMessage = document.getElementById('error-message');
  if (errorMessage) errorMessage.style.display = 'none';
}

// --- Renderizado recursivo de ingredientes ---
function renderRows(ings, nivel = 1, parentId = null, rowGroupIndex = 0, parentExpanded = true, path = []) {
  // DEPURACIÓN opcional de los radios renderizados
  // ings.forEach((ing, idx) => {
  //   if (nivel > 0) {
  //     console.log('[RENDER RADIO]', { id: ing.id, parentId, modeForParentCrafted: ing.modeForParentCrafted });
  //   }
  // });
  
  return ings.map((ing, idx) => {
    const groupIdx = nivel === 0 ? idx : rowGroupIndex;
    const rowBgClass = groupIdx % 2 === 0 ? 'row-bg-a' : 'row-bg-b';
    const indent = nivel > 0 ? `style="padding-left:${nivel * 30}px"` : '';
    const childClass = `child-of-${ing.id}`;
    const currentPath = [...path, ing._uid].join('-');
    const expandButton = (ing.is_craftable && ing.children && ing.children.length)
      ? `<button class="btn-expand-path" data-path="${currentPath}">${ing.expanded ? '-' : '+'}</button>` : '';
    const isChild = nivel > 0;
    const extraClass = isChild ? `child-of-${parentId}` : '';
    const extraStyle = isChild && !parentExpanded ? 'style="display:none"' : '';
    // --- Lógica para mostrar/ocultar total crafted ---
    const isRoot = nivel === 1 && parentId === null;
    const noMarketPrice = (!ing.buy_price && !ing.sell_price);
    const isLeaf = !(ing.children && ing.children.length);
    const hideTotals = isLeaf; // ocultar solo para nodos hoja

    // Precio de referencia seguro (0 si no es número válido)
    const craftedPriceSafe = (typeof ing.crafted_price === 'number' && !isNaN(ing.crafted_price) && ing.crafted_price > 0) ? ing.crafted_price : 0;
    
    return `
      <tr data-path="${currentPath}" class="${isChild ? `subrow subrow-${nivel} ${extraClass}` : ''} ${rowBgClass}" ${extraStyle}>
        <td class="th-border-left-items" ${indent}><img src="${ing.icon}" width="32"></td>
        <td><a href="item.html?id=${ing.id}" class="item-link" target="_blank">${ing.name}</a></td>
        <td>${ing.countTotal || ing.count}</td>
        <td class="item-solo-buy">
          <div>${formatGoldColored(ing.total_buy)}</div>
          <div class="item-solo-precio">${formatGoldColored(ing.buy_price)} <span style="color: #c99b5b">c/u</span></div>
          ${parentId !== null ? `<input type="radio" name="mode-${ing._uid}" class="chk-mode-buy" data-uid="${ing._uid}" ${ing.modeForParentCrafted === 'buy' ? 'checked' : ''} title="Usar precio de compra para el padre">` : ''}
        </td>
        <td class="item-solo-sell">
          <div>${formatGoldColored(ing.total_sell)}</div>
          <div class="item-solo-precio">${formatGoldColored(ing.sell_price)} <span style="color: #c99b5b">c/u</span></div>
          ${parentId !== null ? `<input type="radio" name="mode-${ing._uid}" class="chk-mode-sell" data-uid="${ing._uid}" ${ing.modeForParentCrafted === 'sell' ? 'checked' : ''} title="Usar precio de venta para el padre">` : ''}
        </td>
        <td class="item-solo-crafted">
          ${
            // Nodo raíz SIEMPRE muestra total crafted
            (isRoot && ing.is_craftable) ? `
              <div>${formatGoldColored(ing.total_crafted)}</div>
              <div class="item-solo-precio">${formatGoldColored(craftedPriceSafe)} <span style="color: #c99b5b">c/u</span></div>
            ` :
            // Ingredientes padre sin precio de mercado también lo muestran aunque sean el último hijo
            (parentId !== null && nivel > 0 && ing.is_craftable && noMarketPrice) ? `
              <div>${formatGoldColored(ing.total_crafted)}</div>
              <div class="item-solo-precio">${formatGoldColored(craftedPriceSafe)} <span style="color: #c99b5b">c/u</span></div>
              <input type="radio" name="mode-${ing._uid}" class="chk-mode-crafted" data-uid="${ing._uid}" ${ing.modeForParentCrafted === 'crafted' ? 'checked' : ''} title="Usar precio de crafteo para el padre">
            ` :
            // Nodos hoja (sin hijos) ocultan todo, salvo casos anteriores ya tratados
            (!hideTotals ? `
              <div>${formatGoldColored(ing.total_crafted || ing.total_buy)}</div>
              <div class="item-solo-precio">${ing.is_craftable ? formatGoldColored(craftedPriceSafe) : formatGoldColored(ing.buy_price)} <span style="color: #c99b5b">c/u</span></div>
              ${parentId !== null && nivel > 0 ? `<input type="radio" name="mode-${ing._uid}" class="chk-mode-crafted" data-uid="${ing._uid}" ${ing.modeForParentCrafted === 'crafted' ? 'checked' : ''} title="Usar precio de crafteo para el padre">` : ''}
            ` :
              ``
            )
          }
        </td>
        <td class="th-border-right-items">${expandButton}</td>
      </tr>
      ${(ing.is_craftable && ing.children && ing.children.length && parentExpanded && ing.expanded) ? renderRows(ing.children, nivel + 1, ing.id, groupIdx, ing.expanded, [...path, ing._uid]) : ''}
    `;
  }).join('');
}

// --- Renderizado de la fila principal del ítem (nodo raíz) ---
// --- Renderizado SOLO del nodo raíz. Prohibido usar mainNode.total_buy, siempre usar getTotals(mainNode.children) ---
function renderMainItemRow(mainNode, nivel = 0) {
    if (!mainNode) return '';
    // ✔️ Siempre calcular los totales del nodo raíz con la suma de los hijos
    const qtyValue = (typeof getQtyInputValue !== 'undefined' ? getQtyInputValue() : window.globalQty) || 1;
    const totals = mainNode && mainNode.children ? getTotals(mainNode.children) : { totalBuy: 0, totalSell: 0, totalCrafted: 0 };
    // 🚫 Prohibido: usar mainNode.total_buy, mainNode.total_sell, mainNode.total_crafted para la UI
    const buyPriceUnit = mainNode.buy_price || 0;
    const sellPriceUnit = mainNode.sell_price || 0;
    const indent = nivel > 0 ? 'style="margin-left: ' + (nivel * 20) + 'px;"' : '';
    const filaMainItem = `
    <tr class="ingred-row ${mainNode.expanded ? 'expanded' : ''}" data-item-id="${mainNode.id}">
        <td>
            <div class="flex gap-2 items-center" ${indent}>
                <button class="btn-expandir ${mainNode.expanded ? 'expanded' : ''}" data-item-id="${mainNode.id}">
                    ${mainNode.expanded ? '▼' : '▶'}
                </button>
                <img src="${mainNode.icon}" class="w-6 h-6">
                ${mainNode.name}
            </div>
        </td>
        <td>${qtyValue}</td>
        <td class="item-solo-buy">
            <div>${formatGoldColored(totals.totalBuy)}</div>
            <div class="item-solo-precio">${formatGoldColored(buyPriceUnit)} <span style="color: #c99b5b">c/u</span></div>
        </td>
        <td class="item-solo-sell">
            <div>${formatGoldColored(totals.totalSell)}</div>
            <div class="item-solo-precio">${formatGoldColored(sellPriceUnit)} <span style="color: #c99b5b">c/u</span></div>
        </td>
        <td class="item-solo-craft">
            <div>${formatGoldColored(totals.totalCrafted)}</div>
        </td>
        <td></td>
    </tr>
    `;
    return filaMainItem;
}

// --- Renderizado de la sección 7: Ingredientes para craftear ---
function renderCraftingSectionUI() {
  // Asegurar que los datos estén recalculados antes de leer los totales
  if (window.ingredientObjs && window.ingredientObjs.length > 0) {
    recalcAll(window.ingredientObjs, window.globalQty);
  }

  // Obtener output_item_count de la receta principal
  // Cálculo robusto del outputCount como en la comparativa:
  let outputCount = 1;
  const mainRoot = window.ingredientObjs && window.ingredientObjs.length > 0 ? window.ingredientObjs[0] : null;
  if (mainRoot && mainRoot.recipe && mainRoot.recipe.output_item_count && !isNaN(mainRoot.recipe.output_item_count)) {
    outputCount = mainRoot.recipe.output_item_count;
  } else if (window._mainRecipeOutputCount && !isNaN(window._mainRecipeOutputCount)) {
    outputCount = window._mainRecipeOutputCount;
  }

  // --- Totales robustos: buy/sell de hijos y crafted desde el nodo raíz ---
  let totals = { totalBuy: 0, totalSell: 0, totalCrafted: 0 };
  if (mainRoot && mainRoot.children && mainRoot.children.length > 0) {
    const childTotals = getTotals(mainRoot.children);
    totals.totalBuy = childTotals.totalBuy;
    totals.totalSell = childTotals.totalSell;
  }
  if (mainRoot && typeof mainRoot.total_crafted === 'number') {
    totals.totalCrafted = mainRoot.total_crafted;
  }

  // Los detalles de artesanía ya se muestran en el encabezado del ítem
  const mainNode = window.ingredientObjs && window.ingredientObjs.length > 0 ? window.ingredientObjs[0] : null;

  const qtyValue = (typeof getQtyInputValue() !== 'undefined' ? getQtyInputValue() : window.globalQty);
  // Mostrar el precio de mercado directo del ítem (buy_price * cantidad global)
const precioCompraTotal = mainNode && typeof mainNode.buy_price === 'number' ? mainNode.buy_price * qtyValue : 0;
  // Mostrar el precio de mercado directo del ítem (sell_price * cantidad global)
const precioVentaTotal = mainNode && typeof mainNode.sell_price === 'number' ? mainNode.sell_price * qtyValue : 0;
  const precioCraftTotal = totals.totalCrafted;
  const precioCraftingMinTotal = Math.min(totals.totalBuy, totals.totalSell, totals.totalCrafted);
  const precioCraftingMinUnidad = outputCount > 0 ? precioCraftingMinTotal / outputCount : precioCraftingMinTotal;
  const precioCompraUnidad = outputCount > 0 ? totals.totalBuy / outputCount : totals.totalBuy;
  const precioVentaUnidad = outputCount > 0 ? totals.totalSell / outputCount : totals.totalSell;
  const precioCraftUnidad = outputCount > 0 ? totals.totalCrafted / outputCount : totals.totalCrafted;
  const preciosFinales = [precioCompraTotal, precioVentaTotal, precioCraftingMinTotal];
  const precioMinimoFinal = Math.min(...preciosFinales.filter(x => x > 0));
  const preciosFinalesUnidad = [precioCompraUnidad, precioVentaUnidad, precioCraftingMinUnidad];
  const precioMinimoFinalUnidad = Math.min(...preciosFinalesUnidad.filter(x => x > 0));
  const minIdx = preciosFinales.indexOf(precioMinimoFinal);
  const minIdxUnidad = preciosFinalesUnidad.indexOf(precioMinimoFinalUnidad);
  let mensaje = '';
  if (minIdx === 0) mensaje = 'Mejor comprar (Buy)';
  else if (minIdx === 1) mensaje = 'Mejor vender (Sell)';
  else mensaje = 'Mejor craftear (Crafted)';

  // --- Renderizar tabla de ingredientes con separación de nodo raíz ---
  // 🔥 Checklist de buenas prácticas de renderizado:
  // 1. El nodo raíz SOLO se renderiza con renderMainItemRow(mainNode, 0)
  // 2. NUNCA debe pasar por renderRows()
  // 3. Los hijos se renderizan SIEMPRE con renderRows(mainNode.children, 1)
  // 4. Prohibido: renderRows([mainNode], 0)
  let htmlTabla = '';
  if (mainNode) {
    // ✔️ Renderizar la fila principal (nodo raíz) usando solo renderMainItemRow
    htmlTabla += renderMainItemRow(mainNode, 0);
    // ✔️ Renderizar ingredientes hijos (nivel 1) usando solo renderRows
    htmlTabla += renderRows(mainNode.children, 1);
  }
  // 🚫 Nunca hacer: htmlTabla += renderRows([mainNode], 0); // Esto mostraría mal los totales del nodo raíz

  // Profit
  let profitHtml = '';
  let profitHtmlUnidad = '';
  if (precioVentaTotal > 0) {
    const ventaTrasComisionTotal = precioVentaTotal - (precioVentaTotal * 0.15);
    const ventaTrasComisionUnidad = outputCount > 0 ? ventaTrasComisionTotal / outputCount : ventaTrasComisionTotal;
    const profitBuyUnidad = ventaTrasComisionUnidad - (totals.totalBuy / outputCount);
    const profitSellUnidad = ventaTrasComisionUnidad - (totals.totalSell / outputCount);
    const profitCraftedUnidad = ventaTrasComisionUnidad - (totals.totalCrafted / outputCount);
    const profitBuyTotal = ventaTrasComisionTotal - totals.totalBuy;
    const profitSellTotal = ventaTrasComisionTotal - totals.totalSell;
    const profitCraftedTotal = ventaTrasComisionTotal - totals.totalCrafted;
    if (outputCount === 1) {
      profitHtml = `<section id='profit-section'><br>
        <div class="table-modern-totales">
        <div class="titulo-con-ayuda">
          <div class="ayuda-tooltip">?
            <span class="tooltiptext-modern"> Esta sección muestra la ganancia estimada al vender el ítem después de craftearlo. Se calcula como: (Precio venta - 15% comisión) - costo total de crafteo. También muestra 3 posibles resultados dependiendo de la forma de craftear.</span>
          </div>
          <h3>Profit si se craftea y se vende (ganancia estimada)</h3>
        </div>
        <table class='table-totales totales-crafting-comparativa' style='margin-bottom: 8px;'>
          <tr style='text-align:center;'>
            <td><div class='base-comparativa'>${formatGoldColored(Math.round(profitBuyTotal))} <br><span style='font-size:0.93em;'>Profit comprando materiales</span></div></td>
            <td><div class='base-comparativa'>${formatGoldColored(Math.round(profitSellTotal))} <br><span style='font-size:0.93em;'>Profit vendiendo materiales</span></div></td>
            <td><div class='base-comparativa'>${formatGoldColored(Math.round(profitCraftedTotal))} <br><span style='font-size:0.93em;'>Profit crafteando materiales</span></div></td>
          </tr>
          <tr><td colspan='3' style='text-align:center;font-size:0.98em;color:#a1a1aa;'>La ganancia se calcula como: (Precio venta - 15% comisión) - costo total</td></tr>
        </table>
      </div>
      </section>`;
    }
    if (outputCount > 1) {
      const precioVentaUnidadMercado = (_mainSellPrice != null) ? _mainSellPrice : 0;
      const ventaTrasComisionUnidadMercado = precioVentaUnidadMercado - (precioVentaUnidadMercado * 0.15);
      const profitBuyUnidadMercado = ventaTrasComisionUnidadMercado - (totals.totalBuy / outputCount);
      const profitSellUnidadMercado = ventaTrasComisionUnidadMercado - (totals.totalSell / outputCount);
      const profitCraftedUnidadMercado = ventaTrasComisionUnidadMercado - (totals.totalCrafted / outputCount);
      profitHtmlUnidad = `<section id='profit-section-unidad'><br>
        <div class="table-modern-totales">          
        <h3>Profit si se craftea y se vende por UNIDAD (ganancia estimada)</h3>
        <div style='margin-bottom:8px;color:#a1a1aa;font-size:1em;'>Esta receta produce <b>${outputCount}</b> unidades por crafteo. Los siguientes cálculos son por unidad.</div>
        <table class='table-totales totales-crafting-comparativa' style='margin-bottom: 8px;'>
          <tr style='text-align:center;'>
            <td><div class='base-comparativa'>${formatGoldColored(Math.round(profitBuyUnidadMercado))} <br><span style='font-size:0.93em;'>Profit comprando materiales</span></div></td>
            <td><div class='base-comparativa'>${formatGoldColored(Math.round(profitSellUnidadMercado))} <br><span style='font-size:0.93em;'>Profit vendiendo materiales</span></div></td>
            <td><div class='base-comparativa'>${formatGoldColored(Math.round(profitCraftedUnidadMercado))} <br><span style='font-size:0.93em;'>Profit crafteando materiales</span></div></td>
          </tr>
          <tr><td colspan='3' style='text-align:center;font-size:0.98em;color:#a1a1aa;'>La ganancia por unidad se calcula como: (Precio venta unitario - 15% comisión) - costo unitario</td></tr>
        </table>
      </div>
      </section>`;
    }
  }

  // --- Insertar tabla de ingredientes en el HTML ---
  let tablaIngredientes = `<table class="table-crafting" id="tabla-crafting">
    <thead>
      <tr>
        <th>Ítem</th>
        <th>Cantidad</th>
        <th>Total Buy</th>
        <th>Total Sell</th>
        <th>Total Crafted</th>
        <th>Modo</th>
      </tr>
    </thead>
    <tbody>
      ${htmlTabla}
    </tbody>
  </table>`;

  // Tablas de totales
  // Input SIEMPRE antes de la tabla de ingredientes
  let inputQtyHtml = `<div id="qty-global-container" style="margin:18px 0 18px 0;display:flex;align-items:center;gap:12px;">
    <label for="qty-global" style="font-weight:500;">Cantidad global:</label>
    <input id="qty-global" type="number" min="1" value="${qtyValue}" style="width:60px;height:36px;" autocomplete="off">
  </div>`;
  let tablaTotales = `<div class="table-modern-totales">
    <div class="titulo-con-ayuda">
      <div class="ayuda-tooltip">?
        <span class="tooltiptext-modern">Esta sección muestra el costo total de los materiales necesarios para craftear el ítem. Con costo de materiales en venta directa, pedido y crafteo de sus propio materiales.</span>
      </div>
      <h3>Precio total materiales - Crafting</h3>
    </div>
    <div id="totales-crafting">      
      <table class="table-totales" style="margin-top:12px;">
        <tr>
          <th><div class="tooltip-modern">Total Buy
            <span class="tooltiptext-modern">Suma total si haces PEDIDO de materiales en el mercado.</span>
          </div></th>
          <td class="item-solo-buy">${formatGoldColored(totals.totalBuy)} </td>
          <th><div class="tooltip-modern">Total Sell
            <span class="tooltiptext-modern">Suma total si COMPRAS materiales en el mercado.</span>
          </div></th>
          <td class="item-solo-sell">${formatGoldColored(totals.totalSell)}</td>
          <th><div class="tooltip-modern">Total Crafted
            <span class="tooltiptext-modern">Suma total si CRAFTEAS todos los materiales posibles desde cero.</span>
          </div></th>
          <td class="item-solo-crafted">${formatGoldColored(totals.totalCrafted)}</td>
        </tr>
      </table>
    </div>
    </div>`;
  let tablaTotalesUnidad = '';
  if (outputCount > 1) {
    tablaTotalesUnidad = `<div class="table-modern-totales">
    <div class="titulo-con-ayuda">
      <div class="ayuda-tooltip">?
        <span class="tooltiptext-modern">Muestra el costo por unidad ya que esta receta produce múltiples ítems</span>
      </div>
      <h3>Costos por unidad (${outputCount} unidades por crafteo)</h3>
    </div>
    <div style='margin-bottom:8px;color:#a1a1aa;font-size:1em;'>Esta receta produce <b>${outputCount}</b> unidades por crafteo.</div>
      <div id="totales-crafting">
        <table class="table-totales" style="margin-top:12px;">
          <tr>
            <th><div class="tooltip-modern">Total Buy
              <span class="tooltiptext-modern">Suma total si haces PEDIDO de materiales en el mercado.</span>
            </div></th>
            <td class="item-solo-buy">${formatGoldColored(totals.totalBuy / outputCount)}</td>
            <th><div class="tooltip-modern">Total Sell
              <span class="tooltiptext-modern">Suma total si COMPRAS materiales en el mercado.</span>
            </div></th>
            <td class="item-solo-sell">${formatGoldColored(totals.totalSell / outputCount)}</td>
            <th><div class="tooltip-modern">Total Crafted
              <span class="tooltiptext-modern">Suma total si CRAFTEAS todos los materiales posibles desde cero.</span>
            </div></th>
            <td class="item-solo-crafted">${formatGoldColored(totals.totalCrafted / outputCount)}</td>
          </tr>
        </table>
      </div>
    </div>`;
  }

  let tablaComparativa = '';
  let tablaComparativaUnidad = '';
  // Generar tabla comparativa antes del return
  if (outputCount === 1) {
    tablaComparativa = `<section id='comparativa-section'>
      <div class="table-modern-totales">
        <div class="titulo-con-ayuda">
          <div class="ayuda-tooltip">?
            <span class="tooltiptext-modern"> Esta sección compara el precio de compra directa y pedido en el mercado con el costo de crafteo más bajo.</span>
          </div>
          <h3>Comparativa de precios de Bazar vs Crafting</h3>
        </div>
        <br>
        <table class='table-totales totales-crafting-comparativa'>
          <tr style='text-align:center;'>
            <td><div class='base-comparativa' style='${minIdx===0 ? 'background:#e84d4d33;' : ''}'>${formatGoldColored(precioCompraTotal)} <br><span style='font-size:0.93em;'>Precio compra</span></div></td>
            <td><div class='base-comparativa' style='${minIdx===1 ? 'background:#4db1e833;' : ''}'>${formatGoldColored(precioVentaTotal)} <br><span style='font-size:0.93em;'>Precio venta</span></div></td>
            <td><div class='base-comparativa' style='${minIdx===2 ? 'background:#4fc17833;' : ''}'>${formatGoldColored(precioCraftingMinTotal)} <br><span style='font-size:0.93em;'>Precio crafting más bajo</span></div></td>
          </tr>
          <tr><td colspan='3' style='text-align:center;font-size:1.07em;'>${mensaje}</td></tr>
        </table>
      </div>
      </section>`;
  }
  if (outputCount > 1) {
    const globalQty = window.globalQty || 1;
    const precioCompraUnidadMercado = (_mainBuyPrice != null) ? (_mainBuyPrice * globalQty) / outputCount : 0;
    const precioVentaUnidadMercado = (_mainSellPrice != null) ? (_mainSellPrice * globalQty) / outputCount : 0;
    const precioCraftingMinUnidadReal = outputCount > 0 ? precioCraftingMinTotal / outputCount : precioCraftingMinTotal;
    const preciosUnidadCorr = [precioCompraUnidadMercado, precioVentaUnidadMercado, precioCraftingMinUnidadReal];
    const precioMinimoUnidadReal = Math.min(...preciosUnidadCorr.filter(x => x > 0));
    const minIdxUnidad = preciosUnidadCorr.indexOf(precioMinimoUnidadReal);
    tablaComparativaUnidad = `<section id='comparativa-section-unidad'>
      <div class=\"table-modern-totales\"><br>
        <h3>Comparativa de precios de Bazar vs Crafting por UNIDAD</h3>
        <div style='margin-bottom:8px;color:#a1a1aa;font-size:1em;'>Esta receta produce <b>${outputCount}</b> unidades por crafteo. Los siguientes precios son por unidad.</div>
        <table class='table-totales totales-crafting-comparativa'>
          <tr style='text-align:center;'>
            <td><div style='${minIdxUnidad===0 ? 'background:#e84d4d33;font-weight:bold;border-radius:6px;padding:10px;' : ''}'>${formatGoldColored(precioCompraUnidadMercado)} <br><span style='font-size:0.93em;'>Precio compra</span></div></td>
            <td><div style='${minIdxUnidad===1 ? 'background:#4db1e833;font-weight:bold;border-radius:6px;padding:10px;' : ''}'>${formatGoldColored(precioVentaUnidadMercado)} <br><span style='font-size:0.93em;'>Precio venta</span></div></td>
            <td><div style='${minIdxUnidad===2 ? 'background:#4fc17833;font-weight:bold;border-radius:6px;padding:10px;' : ''}'>${formatGoldColored(precioCraftingMinUnidadReal)} <br><span style='font-size:0.93em;'>Precio crafting más bajo</span></div></td>
          </tr>
          <tr><td colspan='3' style='text-align:center;font-size:1.07em;'>${mensaje}</td></tr>
        </table>
      </div>
      </section>`;
  }

  // HTML FINAL: inputQtyHtml SIEMPRE antes de la tabla de ingredientes
  let htmlFinal = `
    ${inputQtyHtml}
    <table class="table-modern tabla-tarjetas">
      <thead class="header-items">
        <tr>
          <th class="th-border-left">Ícono</th>
          <th>Nombre</th>
          <th>Cantidad</th>
          <th>Total Buy</th>
          <th>Total Sell</th>
          <th>Total Crafted</th>
          <th class="th-border-right"></th>
        </tr>
      </thead>
      <tbody>${renderRows(window.ingredientObjs)}</tbody>
    </table>
    ${tablaTotales}
    ${outputCount > 1 ? tablaTotalesUnidad : ''}
    ${tablaComparativa}
    ${outputCount > 1 ? tablaComparativaUnidad : ''}
    ${profitHtml}
    ${outputCount > 1 ? profitHtmlUnidad : ''}
  `;
  // console.log('[LOG][renderCraftingSectionUI] Antes del return.', outputCount);
  return htmlFinal;

}

// --- Renderizado principal refactorizado ---
async function renderItemUI(itemData, marketData) {
  // console.log('%cLEGACY renderItemUI ejecutado', 'color: #f44336; font-weight: bold;', itemData);

  const itemHeader = document.getElementById('item-header');
  // Verificar si hay información de artesanía
  let craftingInfo = '';
  if (itemData.details?.disciplines?.length > 0 || itemData.details?.min_rating > 0) {
    const disciplineNames = {
      'Artificer': 'Artesano',
      'Armorsmith': 'Armero',
      'Chef': 'Cocinero',
      'Huntsman': 'Cazador',
      'Jeweler': 'Joyero',
      'Leatherworker': 'Peletero',
      'Tailor': 'Sastre',
      'Weaponsmith': 'Armero de armas',
      'Scribe': 'Escriba'
    };

    const translatedDisciplines = (itemData.details.disciplines || [])
      .map(d => disciplineNames[d] || d);

    craftingInfo = `
      <div style="margin-top: 4px; color: #a1a1aa; font-size: 0.95rem;">
        ${itemData.details.min_rating ? `<span style="color: #16c198; font-weight: 500;">Nivel:</span> ${itemData.details.min_rating} ` : ''}
        ${translatedDisciplines.length > 0 ? 
          `<span style="color: #16c198; font-weight: 500;">${itemData.details.min_rating ? '• ' : ''}Disciplinas:</span> ${translatedDisciplines.join(', ')}` : ''}
      </div>
    `;
  }

  itemHeader.innerHTML = `
    <img src="${itemData.icon}" alt=""/>
    <div>
      <h2>${itemData.name}</h2>
      <div style="color:#a1a1aa;font-size:1.05rem;">
        ID: ${itemData.id} &nbsp;|&nbsp; ${itemData.type} ${itemData.rarity ? ' - ' + itemData.rarity : ''}
      </div>
      ${craftingInfo}
    </div>
  `;

  // Precios
  const precios = `
    <table class="table-modern">
      <tr>
        <th><div class="dato-item tooltip-modern">Precio de compra
          <span class="tooltiptext-modern">Precio al que los compradores están dispuestos a adquirir el ítem (mejor oferta de compra).</span>
        </div></th>
        <td><div class="dato-item-info">${formatGoldColored(marketData.buy_price)}</div></td>
      </tr>
      <tr>
        <th><div class="dato-item tooltip-modern">Precio de venta
          <span class="tooltiptext-modern">Precio al que los vendedores ofrecen el ítem (mejor oferta de venta).</span>
        </div></th>
        <td><div class="dato-item-info">${formatGoldColored(marketData.sell_price)}</div></td>
      </tr>
      <tr>
        <th><div class="dato-item tooltip-modern">Disponibles para vender
          <span class="tooltiptext-modern">Cantidad total de ítems listados actualmente para vender en el mercado.</span>
        </div></th>
        <td><div class="dato-item-info">${marketData.sell_quantity ?? '-'}</div></td>
      </tr>
      <tr>
        <th><div class="dato-item tooltip-modern">Disponibles para comprar
          <span class="tooltiptext-modern">Cantidad total de ítems que los compradores buscan adquirir en el mercado.</span>
        </div></th>
        <td><div class="dato-item-info">${marketData.buy_quantity ?? '-'}</div></td>
      </tr>
    </table>
  `;
  // --- Renderizar resumen de mercado SOLO en #resumen-mercado ---
  const resumenMercadoDiv = document.getElementById('resumen-mercado');

  if (resumenMercadoDiv) {

    resumenMercadoDiv.innerHTML = `
      <table class=\"table-modern\">
        <tr>
          <th><div class="dato-item tooltip-modern">Precio de compra
            <span class="tooltiptext-modern">Precio al que los compradores están dispuestos a adquirir el ítem (mejor oferta de compra).</span>
          </div></th>
          <td><div class="dato-item-info">${formatGoldColored(marketData.buy_price)}</div></td>
        </tr>
        <tr>
          <th><div class="dato-item tooltip-modern">Precio de venta
            <span class="tooltiptext-modern">Precio al que los vendedores ofrecen el ítem (mejor oferta de venta).</span>
          </div></th>
          <td><div class="dato-item-info">${formatGoldColored(marketData.sell_price)}</div></td>
        </tr>
        <tr>
          <th><div class="dato-item tooltip-modern">Disponibles para vender
            <span class="tooltiptext-modern">Cantidad total de ítems listados actualmente para vender en el mercado.</span>
          </div></th>
          <td><div class="dato-item-info">${marketData.sell_quantity ?? '-'}</div></td>
        </tr>
        <tr>
          <th><div class="dato-item tooltip-modern">Disponibles para comprar
            <span class="tooltiptext-modern">Cantidad total de ítems que los compradores buscan adquirir en el mercado.</span>
          </div></th>
          <td><div class="dato-item-info">${marketData.buy_quantity ?? '-'}</div></td>
        </tr>
      </table>
      <section id="ventas-compras" class="bloque-section">
        <h3>Ventas y Compras Recientes</h3>
        <table class="table-modern">
          <tr><th></th><th style="text-align:center;">1 día</th><th style="text-align:center;">2 días</th><th style="text-align:center;">7 días</th><th style="text-align:center;">1 mes</th></tr>
          <tr>
            <th><div class="dato-item tooltip-modern">Ventas
                <span class="tooltiptext-modern">Cantidad de ítems comprados directamente en el periodo (actividad de salida del mercado).</span>
                </div>
            </th>
            <td><div class="dato-item-info">${marketData['1d_sell_sold'] ?? '-'}</div></td>
            <td><div class="dato-item-info">${marketData['2d_sell_sold'] ?? '-'}</div></td>
            <td><div class="dato-item-info">${marketData['7d_sell_sold'] ?? '-'}</div></td>
            <td><div class="dato-item-info">${marketData['1m_sell_sold'] ?? '-'}</div></td>
          </tr>
          <tr>
            <th><div class="dato-item tooltip-modern">Compras
                <span class="tooltiptext-modern">Cantidad de ítems vendidos directamente en el periodo (actividad de entrada al mercado).</span>
                </div></th>
            <td><div class="dato-item-info">${marketData['1d_buy_sold'] ?? '-'}</div></td>
            <td><div class="dato-item-info">${marketData['2d_buy_sold'] ?? '-'}</div></td>
            <td><div class="dato-item-info">${marketData['7d_buy_sold'] ?? '-'}</div></td>
            <td><div class="dato-item-info">${marketData['1m_buy_sold'] ?? '-'}</div></td>
          </tr>
          <tr><td colspan="5" style="color:#888;font-size:0.95em;">* Basado en actividad reciente.</td></tr>
        </table>
      </section>
      <section id="porcentajes-rotacion" class="bloque-section">
        <h3>Porcentajes de Rotación</h3>
        <table class="table-modern">
          <tr><th></th><th style="text-align:center;">1 día</th><th style="text-align:center;">2 días</th><th style="text-align:center;">7 días</th><th style="text-align:center;">1 mes</th></tr>
          <tr>
            <th><div class="dato-item tooltip-modern">Ventas/Supply
                <span class="tooltiptext-modern">Porcentaje de ítems comprados directamente respecto al total disponible (rotación de inventario en el mercado).</span>
                </div></th>
            <td><div class="dato-item-info">${calcPercent(marketData['1d_sell_sold'], marketData.sell_quantity)}</div></td>
            <td><div class="dato-item-info">${calcPercent(marketData['2d_sell_sold'], marketData.sell_quantity)}</div></td>
            <td><div class="dato-item-info">${calcPercent(marketData['7d_sell_sold'], marketData.sell_quantity)}</div></td>
            <td><div class="dato-item-info">${calcPercent(marketData['1m_sell_sold'], marketData.sell_quantity)}</div></td>
          </tr>
          <tr>
            <th><div class="dato-item tooltip-modern">Compras/Demand
                <span class="tooltiptext-modern">Porcentaje de ítems vendidos directamente respecto a la demanda total (flujo de entrada al mercado).</span>
                </div></th>
            <td><div class="dato-item-info">${calcPercent(marketData['1d_buy_sold'], marketData.buy_quantity)}</div></td>
            <td><div class="dato-item-info">${calcPercent(marketData['2d_buy_sold'], marketData.buy_quantity)}</div></td>
            <td><div class="dato-item-info">${calcPercent(marketData['7d_buy_sold'], marketData.buy_quantity)}</div></td>
            <td><div class="dato-item-info">${calcPercent(marketData['1m_buy_sold'], marketData.buy_quantity)}</div></td>
          </tr>
          <tr><td colspan="5" style="color:#888;font-size:0.95em;">* Basado en actividad reciente comparada con la cantidad disponible.</td></tr>
        </table>
      </section>
    `;
  }

  // --- Renderizar SOLO crafting en #info-item ---
  const infoItemDiv = document.getElementById('info-item');

  if (infoItemDiv) {
    // 🔥 Recalcular todos los ingredientes ANTES de renderizar la UI
    if (window.ingredientObjs && window.ingredientObjs.length > 0) {
      recalcAll(window.ingredientObjs, window.globalQty);
    }
    infoItemDiv.innerHTML = `
      <div id=\"seccion-totales\"></div>
      <div id=\"seccion-comparativa\"></div>
      <div id=\"seccion-crafting\"></div>
    `;
    document.getElementById('seccion-totales').innerHTML = '';
    document.getElementById('seccion-comparativa').innerHTML = '';
    document.getElementById('seccion-crafting').innerHTML = renderCraftingSectionUI();
  }



  renderWiki(itemData.name);
  installUIEvents();
}

// --- Instalación de eventos y render seguro ---
function installUIEvents() {
  // Evitar doble instalación
  if (window._uiEventsInstalled) return;
  window._uiEventsInstalled = true;
  
  // console.log('[INIT] installUIEvents llamada');
  
  // Handler input cantidad global - LÓGICA IDÉNTICA A compare-ui.js
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
        window.ingredientObjs.forEach(ing => ing.recalc(window.globalQty));
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
        window.ingredientObjs.forEach(ing => ing.recalc(window.globalQty));
        const node = document.querySelector('#seccion-crafting, div#seccion-crafting');
        if (node) node.innerHTML = renderCraftingSectionUI();
      }
    });
  }

  // Manejador centralizado para los radios de modo
  document.addEventListener('change', function(e) {
    const input = e.target;
    if (!input.matches('.chk-mode-buy, .chk-mode-sell, .chk-mode-crafted')) return;
  
    const uid = input.dataset.uid;
    if (!uid) return;
    const ing = findIngredientByUid(window.ingredientObjs, uid);
    if (!ing) return;
  
    if (input.classList.contains('chk-mode-buy')) {
      ing.modeForParentCrafted = 'buy';
    } else if (input.classList.contains('chk-mode-sell')) {
      ing.modeForParentCrafted = 'sell';
    } else if (input.classList.contains('chk-mode-crafted')) {
      ing.modeForParentCrafted = 'crafted';
    }
  
    recalcAll(window.ingredientObjs, window.globalQty);
    safeRenderTable();
  });

  // Handler global para expandir/colapsar ingredientes hijos por data-path
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn-expand-path');
    if (!btn) return;
    const pathStr = btn.getAttribute('data-path');
    if (!pathStr) return;
    const path = pathStr.split('-').map(x => x.trim());
    const ing = findIngredientByPath(window.ingredientObjs, path);
    if (ing) {
      ing.expanded = !ing.expanded;
      if (typeof safeRenderTable === 'function') safeRenderTable();
    }
  });
}




// --- Inicialización de eventos y render seguro ---
function safeRenderTable() {
  // Siempre recalcula y renderiza la sección de ingredientes y totales.
  recalcAll(window.ingredientObjs, window.globalQty);

  const seccion = document.getElementById('seccion-crafting');
  if (seccion) {
    // Guardar el valor actual del input y el estado de los expandibles
    const qtyInput = document.getElementById('qty-global');
    const currentQty = qtyInput ? qtyInput.value : window.globalQty;
    const expandedStates = snapshotExpandState(window.ingredientObjs);

    // Renderizar de nuevo toda la sección
    seccion.innerHTML = renderCraftingSectionUI();

    // Restaurar el valor del input y el estado de los expandibles
    const newQtyInput = document.getElementById('qty-global');
    if (newQtyInput) {
      newQtyInput.value = currentQty;
    }
    restoreExpandState(window.ingredientObjs, expandedStates);
  }
}
  // Re-sincronizar el input de cantidad global
  setTimeout(() => {
    setQtyInputValue(window.globalQty);
    const input = document.getElementById('qty-global');

    if (input) {
      // Debug opcional sobre cambios en el input
      // input.addEventListener('input', (e) => {
      //   console.log('[DEBUG] input qty-global changed:', e.target.value);
      // });
      // input.addEventListener('change', (e) => {
      //   console.log('[DEBUG] change qty-global:', e.target.value);
      // });
    }
  }, 0);

  // --- FIX: Instalar listeners de expand/collapse tras renderizar ---
  setTimeout(() => {
    if (typeof installUIEvents === 'function') {
      installUIEvents();

    } else {
      console.warn('[ADVERTENCIA] installUIEvents no está definido');
    }
  }, 0);

// --- Inicialización principal ---
// --- Exportaciones ---
async function initItemUI(itemData, marketData) {
  window._lastItemData = itemData;
  window._lastMarketData = marketData;
  showLoader(false);
  hideError();
  await renderItemUI(itemData, marketData);
}

window.showLoader = showLoader;
window.showError = showError;
window.hideError = hideError;
window.renderItemUI = renderItemUI;
window.installUIEvents = installUIEvents;
