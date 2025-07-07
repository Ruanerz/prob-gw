
  // GW2 Item Tracker v2 - Integración con DataWars2 API v2
  
  
  // --- Clase CraftIngredient ---
  let __uidCounter = 0;
  // Garantizar que globalQty exista siempre
  if (typeof window.globalQty === 'undefined' || isNaN(parseInt(window.globalQty,10))) {
    window.globalQty = 1;
  }
  export class CraftIngredient {
    constructor(id, name, icon, count, recipe, buy_price, sell_price, is_craftable, children = [], parentId = null, mode = 'buy') {
      this._uid = CraftIngredient.nextUid++;
      this.id = id;
      this.name = name;
      this.icon = icon;
      this.count = count;
      this.recipe = recipe;
      this.buy_price = buy_price;
      this.sell_price = sell_price;
      this.is_craftable = is_craftable;
      this.children = (children || []).map(c => new CraftIngredient(c.id, c.name, c.icon, c.count, c.recipe, c.buy_price, c.sell_price, c.is_craftable, c.children, this.id, c.modeForParentCrafted));
      this._parentId = parentId;
      this.modeForParentCrafted = mode;
  
      this.countTotal = 0;
      this.total_buy = 0;
      this.total_sell = 0;
      this.total_crafted = 0;
    }
  
    recalc(isRoot, parentCountTotal = null) {
      // Determina si es el nodo raíz si se le indica explícitamente O si no tiene padre.
      // Esto hace que la lógica sea robusta frente a llamadas incorrectas desde la UI.
      const amIRoot = (isRoot === true) || (!this._parentId);
      
      // El recuento total para el nodo raíz se basa en la cantidad global. Para los hijos, se basa en el recuento del padre.
      this.countTotal = (amIRoot ? (window.globalQty || 1) : (parentCountTotal || 1)) * this.count;
  
      // Primero, recalcula los hijos (cálculo ascendente).
      if (this.children && this.children.length > 0) {
          this.children.forEach(c => c.recalc(false, this.countTotal));
      }
  
      // Ahora, calcula los totales para el nodo actual basándose en los valores actualizados de sus hijos.
      if (amIRoot) {
          // El valor de un nodo raíz es SIEMPRE la suma de los valores de sus hijos.
          this.total_buy = this.children.reduce((sum, child) => sum + (child.total_buy || 0), 0);
          this.total_sell = this.children.reduce((sum, child) => sum + (child.total_sell || 0), 0);
          
          // El precio "crafteado" del raíz es la suma de los valores elegidos de sus hijos (comprar, vender o craftear).
          this.total_crafted = this.children.reduce((sum, ing) => {
              let valueToAdd = 0;
              switch (ing.modeForParentCrafted) {
                  case 'buy': valueToAdd = ing.total_buy; break;
                  case 'sell': valueToAdd = ing.total_sell; break;
                  case 'crafted': valueToAdd = ing.total_crafted; break;
                  default: valueToAdd = ing.total_buy; break; // Por defecto, usar el precio de compra.
              }
              return sum + (valueToAdd || 0);
          }, 0);
  
            } else { // Para todos los nodos que no son raíz.
          // Por defecto, el costo de compra/venta se basa en el precio de mercado.
          this.total_buy = (this.buy_price || 0) * this.countTotal;
          this.total_sell = (this.sell_price || 0) * this.countTotal;

          // Si el ítem es crafteable y tiene ingredientes, calculamos su costo de crafteo.
          if (this.is_craftable && this.children.length > 0) {
              this.total_crafted = this.children.reduce((sum, ing) => {
                  let valueToAdd = 0;
                  switch (ing.modeForParentCrafted) {
                      case 'buy': valueToAdd = ing.total_buy; break;
                      case 'sell': valueToAdd = ing.total_sell; break;
                      case 'crafted': valueToAdd = ing.total_crafted; break;
                      default: valueToAdd = ing.total_buy; break;
                  }
                  return sum + (valueToAdd || 0);
              }, 0);

              // Si un subcomponente no se puede comprar, su costo es el de sus materiales.
              if (!this.buy_price && !this.sell_price) {
                  this.total_buy = this.children.reduce((sum, child) => sum + (child.total_buy || 0), 0);
                  this.total_sell = this.children.reduce((sum, child) => sum + (child.total_sell || 0), 0);
              }
          } else {
              // Si no es crafteable o no tiene ingredientes, el costo de crafteo es nulo.
              this.total_crafted = null;
          }
      }
    }
  }
  // Propiedad estática para UIDs únicos.
  CraftIngredient.nextUid = 0;
  
  const params = new URLSearchParams(window.location.search);
  const itemId = parseInt(params.get('id'), 10);
  const loader = document.getElementById('loader');
  const errorMessage = document.getElementById('error-message');
  const infoItem = document.getElementById('info-item');
  const ingredientesEl = document.getElementById('ingredientes');
  const wikiLinksEl = document.getElementById('wiki-links');
  const itemHeader = document.getElementById('item-header');
  
  // Elementos del DOM
  
  function calcPercent(sold, available) {
    if (!sold || !available || isNaN(sold) || isNaN(available) || available === 0) return '-';
    return ((sold / available) * 100).toFixed(1) + '%';
  }
  
  
  // --- Fin de formatGold ---
  
  async function main() {
    if (!itemId) {
      window.showError('ID de ítem no válido.');
      return;
    }
    window.showLoader(true);
    window.hideError();
    try {
      // 1. Datos de mercado desde Datawars2 CSV (por ítem)
      const csvUrl = `https://api.datawars2.ie/gw2/v1/items/csv?fields=buy_price,sell_price,buy_quantity,sell_quantity,last_updated,1d_buy_sold,1d_sell_sold,2d_buy_sold,2d_sell_sold,7d_buy_sold,7d_sell_sold,1m_buy_sold,1m_sell_sold&ids=${itemId}`;
      const csvText = await fetch(csvUrl).then(r => r.text());
      const [headers, values] = csvText.trim().split('\n').map(line => line.split(','));
      const marketData = {};
      headers.forEach((h, i) => {
        if (h === 'last_updated') {
          marketData[h] = values[i] || '-';
        } else if (h === 'buy_price' || h === 'sell_price') {
          marketData[h] = values[i] !== '' ? parseInt(values[i], 10) : null;
        } else {
          marketData[h] = values[i] !== '' ? parseInt(values[i], 10) : null;
        }
      });
      if (!marketData.buy_price && !marketData.sell_price) throw new Error('No se encontró información de mercado para este ítem.');
      // Guardar precios principales globales para uso en comparativa
      window._mainBuyPrice = marketData.buy_price;
      window._mainSellPrice = marketData.sell_price;
  
      // 2. Datos básicos desde API oficial GW2
      const apiRes = await fetch(`https://api.guildwars2.com/v2/items/${itemId}`);
      const apiData = await apiRes.json();
  
      // Renderizar encabezado y datos básicos
      itemHeader.innerHTML = `
        <img src="${apiData.icon}" alt=""/>
        <div>
          <h2>${apiData.name}</h2>
          <div style="color:#a1a1aa;font-size:1.05rem;">ID: ${apiData.id} &nbsp;|&nbsp; ${apiData.type} ${apiData.rarity ? ' - ' + apiData.rarity : ''}</div>
        </div>
      `;
      // Sección 1: Tabla de precios + Sección 2 + Sección 3
      let html = `
        <table class="table-modern">
          <tr><th><div class="dato-item">Precio de compra</div></th><td><div class="dato-item-info">${formatGold(marketData.buy_price)}</div></td></tr>
          <tr><th><div class="dato-item">Precio de venta</div></th><td><div class="dato-item-info">${formatGold(marketData.sell_price)}</div></td></tr>
          <tr><th><div class="dato-item">Disponibles para comprar</div></th><td><div class="dato-item-info">${marketData.buy_quantity ?? '-'}</div></td></tr>
          <tr><th><div class="dato-item">Disponibles para vender</div></th><td><div class="dato-item-info">${marketData.sell_quantity ?? '-'}</div></td></tr>
          <!-- <tr><th><div class="dato-item">Última actualización</div></th><td><div class="dato-item-info">${marketData.last_updated || '-'}</div></td></tr> -->
        </table>
        
        <!-- Sección 2: Ventas y Compras Recientes -->
        <section id="ventas-compras" class="bloque-section">
          <h3>Ventas y Compras Recientes</h3>
          <table class="table-modern">
            <tr><th></th><th>1 día</th><th>2 días</th><th>7 días</th><th>1 mes</th></tr>
            <tr>
              <th><div class="dato-item tooltip-modern">Ventas
                  <span class="tooltiptext-modern">Cantidad de ítems vendidos en el periodo (actividad de salida del mercado).</span>
                  </div>
              </th>
              <td><div class="dato-item-info">${marketData['1d_sell_sold'] ?? '-'}</div></td>
              <td><div class="dato-item-info">${marketData['2d_sell_sold'] ?? '-'}</div></td>
              <td><div class="dato-item-info">${marketData['7d_sell_sold'] ?? '-'}</div></td>
              <td><div class="dato-item-info">${marketData['1m_sell_sold'] ?? '-'}</div></td>
            </tr>
            <tr>
              <th><div class="dato-item tooltip-modern">Compras
    <span class="tooltiptext-modern">Cantidad de ítems comprados en el periodo (actividad de entrada al mercado).</span>
  </div></th>
              <td><div class="dato-item-info">${marketData['1d_buy_sold'] ?? '-'}</div></td>
              <td><div class="dato-item-info">${marketData['2d_buy_sold'] ?? '-'}</div></td>
              <td><div class="dato-item-info">${marketData['7d_buy_sold'] ?? '-'}</div></td>
              <td><div class="dato-item-info">${marketData['1m_buy_sold'] ?? '-'}</div></td>
            </tr>
            <tr><p style="color:#888;font-size:0.95em;">* Basado en actividad reciente.</p></tr>
          </table>
        </section>
        
        <!-- Sección 3: Porcentajes de rotación -->
        <section id="porcentajes-rotacion" class="bloque-section">
          <h3>Porcentajes de Rotación</h3>
          <table class="table-modern">
            <tr><th></th><th>1 día</th><th>2 días</th><th>7 días</th><th>1 mes</th></tr>
            <tr>
              <th><div class="dato-item tooltip-modern">Ventas/Supply
    <span class="tooltiptext-modern">Porcentaje de ítems vendidos respecto al total disponible (rotación de inventario en el mercado).</span>
  </div></th>
              <td><div class="dato-item-info">${calcPercent(marketData['1d_sell_sold'], marketData.sell_quantity)}</div></td>
              <td><div class="dato-item-info">${calcPercent(marketData['2d_sell_sold'], marketData.sell_quantity)}</div></td>
              <td><div class="dato-item-info">${calcPercent(marketData['7d_sell_sold'], marketData.sell_quantity)}</div></td>
              <td><div class="dato-item-info">${calcPercent(marketData['1m_sell_sold'], marketData.sell_quantity)}</div></td>
            </tr>
            <tr>
              <th><div class="dato-item tooltip-modern">Compras/Demand
    <span class="tooltiptext-modern">Porcentaje de ítems comprados respecto a la demanda total (flujo de entrada al mercado).</span>
  </div></th>
              <td><div class="dato-item-info">${calcPercent(marketData['1d_buy_sold'], marketData.buy_quantity)}</div></td>
              <td><div class="dato-item-info">${calcPercent(marketData['2d_buy_sold'], marketData.buy_quantity)}</div></td>
              <td><div class="dato-item-info">${calcPercent(marketData['7d_buy_sold'], marketData.buy_quantity)}</div></td>
              <td><div class="dato-item-info">${calcPercent(marketData['1m_buy_sold'], marketData.buy_quantity)}</div></td>
            </tr>
            <tr><p style="color:#888;font-size:0.95em;">* Basado en actividad reciente comparada con la cantidad disponible.</p></tr>
          </table>
          
        </section>
      
  
      
      <!-- Sección 5: Placeholder para Totales de Costo -->
      <section id="seccion-totales"></section>
      
      <!-- Sección 6: Placeholder para Comparativa de Ganancia -->
      <section id="seccion-comparativa"></section>
      
      <!-- Sección 7: Ingredientes para craftear -->
      <section id="seccion-crafting"></section>
      `;
  
     
  
      // Renderizar la sección 7 (crafting)
      const craftingHtml = await renderCraftingSection(itemId);
      html = html.replace('<section id="seccion-crafting"></section>', `<section id="seccion-crafting">${craftingHtml}</section>`);
  
      window.renderItemUI(apiData, marketData);
  
      // Renderizar enlaces wiki
      renderWiki(apiData.name);
    } catch (e) {
      window.showError(e.message || 'Error al cargar el ítem.');
    } finally {
      window.showLoader(false);
    }
  }
  
  // Estructura de datos para ingredientes de crafteo y lógica de cálculo
  
  
  // --- Helpers de estado global ---

// --- Paso 2: Asigna _parentId de forma robusta a todo el árbol ---
/**
 * Asigna el campo _parentId a cada nodo del árbol de ingredientes.
 * Debe ejecutarse SIEMPRE después de construir el árbol y antes de cualquier renderizado o manipulación.
 * @param {Array} nodos - Array de nodos raíz del árbol de ingredientes
 * @param {string|null} parentId - ID del padre (usar "" o null en la raíz)
 */
function asignarParentIds(nodos, parentId = "") {
  nodos.forEach(ing => {
    ing._parentId = parentId !== null ? String(parentId) : "";
    if (Array.isArray(ing.children)) {
      asignarParentIds(ing.children, ing.id);
    }
  });
}



  window.ingredientObjs = []; // SIEMPRE global
  async function renderCraftingSection(itemId) {
    // --- SNAPSHOT DE EXPANSIÓN ---
  
  
    // Guardar snapshot antes de reconstruir
    const _expandSnapshot = window.ingredientObjs ? snapshotExpandState(window.ingredientObjs) : {};
  
    // Siempre asegurar que sea array
    if (!window.ingredientObjs || !Array.isArray(window.ingredientObjs)) window.ingredientObjs = [];
  
    // --- ÁRBOL DE INGREDIENTES Y LOGICA ---
    function createCraftIngredientFromRecipe(recipe, parentMultiplier = 1, parentId = null) {
      const ingredient = new CraftIngredient(
        recipe.id,
        recipe.name,
        recipe.icon,
        recipe.count || 1,
        recipe.recipe || null,
        recipe.buy_price || 0,
        recipe.sell_price || 0,
        recipe.is_craftable || false,
        [], // Los hijos se añaden después
        parentId
      );
    
      if (recipe.children && recipe.children.length > 0) {
        ingredient.children = recipe.children.map(child => {
          const childClone = typeof structuredClone === 'function'
            ? structuredClone(child)
            : JSON.parse(JSON.stringify(child));
          return createCraftIngredientFromRecipe(childClone, child.count * parentMultiplier, ingredient.id); // 🔥 Aquí pasa el id del padre
        });
      }
    
      return ingredient;
    }
    
  
    try {
      // 1. Obtener y transformar recetas usando el nuevo servicio
      const recipes = await getAndTransformRecipes(itemId);
      if (!recipes || recipes.length === 0) {
        return '<div style="color:#a1a1aa;">Este ítem no tiene receta de crafteo.</div>';
      }
  
      // 2. Cargar el árbol completo de ingredientes para la primera receta
      const mainRecipe = await loadIngredientTree(recipes[0]);
      if (!mainRecipe) {
        throw new Error('No se pudo cargar la receta principal');
      }
  
      // 4. Crear la estructura de CraftIngredient
      const mainIngredient = createCraftIngredientFromRecipe(mainRecipe);
  
      // 5. Preparar datos del ítem principal para renderizar
  
      const itemData = {
        id: mainIngredient.id,
        name: mainIngredient.name,
        icon: mainIngredient.icon,
        rarity: mainIngredient.rarity || 'Basic',
        type: mainIngredient.type || 'Consumable',
        level: mainIngredient.level || 0,
        vendor_value: mainIngredient.vendor_value || 0,
        flags: mainIngredient.flags || [],
        restrictions: mainIngredient.restrictions || [],
        details: {
          type: mainIngredient.recipe?.type || mainIngredient.type || 'Consumable',
          min_rating: mainIngredient.recipe?.min_rating || 0,
          disciplines: mainIngredient.recipe?.disciplines || []
        }
      };
  
      // 6. Obtener precios de mercado
      const marketData = {
        buys: { unit_price: mainIngredient.buy_price || 0 },
        sells: { unit_price: mainIngredient.sell_price || 0 }
      };
  
  // GW2 Item Tracker v2 - Integración con DataWars2 API v2
  
  
  
      // 8. Restaurar estado expandido y recalcular
      restoreExpandState([mainIngredient], _expandSnapshot);
      [mainIngredient].forEach(ing => ing.recalc(window.globalQty));
      window.ingredientObjs = [mainIngredient];
      
    } catch (error) {
      console.error('Error en renderCraftingSection:', error);
      window.showError('Error al cargar la receta: ' + error.message);
      return '<div style="color:#ff6b6b;">Error al cargar la receta: ' + error.message + '</div>';
    }
  
    function renderTable() {
      // Obtener el output_item_count de la receta principal
      const outputCount = (window._mainRecipeOutputCount && !isNaN(window._mainRecipeOutputCount)) ? window._mainRecipeOutputCount : 1;
      const mainRoot = window.ingredientObjs && window.ingredientObjs.length > 0 ? window.ingredientObjs[0] : null;
      const totals = mainRoot ? {
        tBuy: mainRoot.total_buy || 0,
        tSell: mainRoot.total_sell || 0,
        tCrafted: mainRoot.total_crafted || 0
      } : { tBuy: 0, tSell: 0, tCrafted: 0 };
      // Renderiza el input respetando el valor temporal si existe
      const qtyValue = (typeof window.globalQty !== 'undefined' ? window.globalQty : 1);
      // Sección 9: comparativa
      // Usar precio de compra y venta del item principal (marketData)
      const mainNode = window.ingredientObjs && window.ingredientObjs.length > 0 ? window.ingredientObjs[0] : null;
const precioCompraTotal = (mainNode && typeof mainNode.buy_price === 'number') ? mainNode.buy_price * qtyValue : 0;
const precioVentaTotal = (mainNode && typeof mainNode.sell_price === 'number') ? mainNode.sell_price * qtyValue : 0;
      // El crafting más barato posible: el menor entre buy, sell y crafted
      const precioCraftingMinTotal = Math.min(totals.tBuy, totals.tSell, totals.tCrafted);
      const precioCraftingMinUnidad = outputCount > 0 ? precioCraftingMinTotal / outputCount : precioCraftingMinTotal;
  
      // Por unidad
      const precioCompraUnidad = outputCount > 0 ? precioCompraTotal / outputCount : precioCompraTotal;
      const precioVentaUnidad = outputCount > 0 ? precioVentaTotal / outputCount : precioVentaTotal;
  
      // Usar el crafting mínimo en la comparativa
      const preciosFinales = [precioCompraTotal, precioVentaTotal, precioCraftingMinTotal];
      const precioMinimoFinal = Math.min(...preciosFinales.filter(x => x > 0));
      const preciosFinalesUnidad = [precioCompraUnidad, precioVentaUnidad, precioCraftingMinUnidad];
      const precioMinimoFinalUnidad = Math.min(...preciosFinalesUnidad.filter(x => x > 0));
      // Índices para resaltar la columna correspondiente
      const minIdx = preciosFinales.indexOf(precioMinimoFinal);
      const minIdxUnidad = preciosFinalesUnidad.indexOf(precioMinimoFinalUnidad);
      let mensaje = '';
      if (minIdx === 0) mensaje = 'Mejor comprar (Buy)';
      else if (minIdx === 1) mensaje = 'Mejor vender (Sell)';
      else mensaje = 'Mejor craftear (Crafted)';
  
      // Sección 10: profit mejorada - 3 profits distintos
      let profitHtml = '';
      let profitHtmlUnidad = '';
      if (precioVentaTotal > 0) {
        // Lógica: (precio de venta - comisión 15%) - costo, multiplicar por cantidad solo al final
        const ventaTrasComisionTotal = precioVentaTotal - (precioVentaTotal * 0.15);
        const ventaTrasComisionUnidad = outputCount > 0 ? ventaTrasComisionTotal / outputCount : ventaTrasComisionTotal;
        const profitBuyUnidad = ventaTrasComisionUnidad - (totals.tBuy / outputCount);
        const profitSellUnidad = ventaTrasComisionUnidad - (totals.tSell / outputCount);
        const profitCraftedUnidad = ventaTrasComisionUnidad - (totals.tCrafted / outputCount);
        const profitBuyTotal = ventaTrasComisionTotal - totals.tBuy;
        const profitSellTotal = ventaTrasComisionTotal - totals.tSell;
        const profitCraftedTotal = ventaTrasComisionTotal - totals.tCrafted;
        // Mostrar solo la tabla global si produce 1 unidad
        if (outputCount === 1) {
          profitHtml = `<section id='profit-section'><br>
            <div class="table-modern-totales">
            <h3>Profit si se craftea y se vende (ganancia estimada)</h3>
            <table class='table-totales totales-crafting-comparativa' style='margin-bottom: 8px;'>
              <tr style='text-align:center;'>
                <td>${formatGold(Math.round(profitBuyTotal))} <br><span style='font-size:0.93em;'>Profit comprando materiales</span></td>
                <td>${formatGold(Math.round(profitSellTotal))} <br><span style='font-size:0.93em;'>Profit vendiendo materiales</span></td>
                <td>${formatGold(Math.round(profitCraftedTotal))} <br><span style='font-size:0.93em;'>Profit crafteando materiales</span></td>
              </tr>
              <tr><td colspan='3' style='text-align:center;font-size:0.98em;color:#a1a1aa;'>La ganancia se calcula como: (Precio venta - 15% comisión) - costo total</td></tr>
            </table>
          </div>
          </section>`;
        }
        // Mostrar solo la tabla por unidad si produce más de 1 unidad
        if (outputCount > 1) {
          // El precio de venta por unidad es el precio de mercado unitario menos 15%
          const precioVentaUnidadMercado = (mainNode && typeof mainNode.sell_price === 'number') ? (mainNode.sell_price * qtyValue) / outputCount : 0;
const ventaTrasComisionUnidadMercado = precioVentaUnidadMercado - (precioVentaUnidadMercado * 0.15);
          const profitBuyUnidadMercado = ventaTrasComisionUnidadMercado - (totals.tBuy / outputCount);
          const profitSellUnidadMercado = ventaTrasComisionUnidadMercado - (totals.tSell / outputCount);
          const profitCraftedUnidadMercado = ventaTrasComisionUnidadMercado - (totals.tCrafted / outputCount);
          profitHtmlUnidad = `<section id='profit-section-unidad'><br>
            <div class="table-modern-totales">          
            <h3>Profit si se craftea y se vende por UNIDAD (ganancia estimada)</h3>
            <div style='margin-bottom:8px;color:#a1a1aa;font-size:1em;'>Esta receta produce <b>${outputCount}</b> unidades por crafteo. Los siguientes cálculos son por unidad.</div>
            <table class='table-totales totales-crafting-comparativa' style='margin-bottom: 8px;'>
              <tr style='text-align:center;'>
                <td>${formatGold(Math.round(profitBuyUnidadMercado))} <br><span style='font-size:0.93em;'>Profit comprando materiales</span></td>
                <td>${formatGold(Math.round(profitSellUnidadMercado))} <br><span style='font-size:0.93em;'>Profit vendiendo materiales</span></td>
                <td>${formatGold(Math.round(profitCraftedUnidadMercado))} <br><span style='font-size:0.93em;'>Profit crafteando materiales</span></td>
              </tr>
              <tr><td colspan='3' style='text-align:center;font-size:0.98em;color:#a1a1aa;'>La ganancia por unidad se calcula como: (Precio venta unitario - 15% comisión) - costo unitario</td></tr>
            </table>
          </div>
          </section>`;
        }
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
              <td class="item-solo-buy">${formatGold(totals.tBuy)}</td>
              <th><div class="tooltip-modern">Total Sell
    <span class="tooltiptext-modern">Suma total si COMPRAS materiales en el mercado.</span>
  </div></th>
              <td class="item-solo-sell">${formatGold(totals.tSell)}</td>
              <th><div class="tooltip-modern">Total Crafted
    <span class="tooltiptext-modern">Suma total si CRAFTEAS todos los materiales posibles desde cero.</span>
  </div></th>
              <td class="item-solo-crafted">${formatGold(totals.tCrafted)}</td>
            </tr>
          </table>
        </div>
        </div>`;
      // Tabla extra por unidad SOLO si outputCount > 1
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
                <td class="item-solo-buy">${formatGold(totals.tBuy / outputCount)}</td>
                <th><div class="tooltip-modern">Total Sell
    <span class="tooltiptext-modern">Suma total si COMPRAS materiales en el mercado.</span>
  </div></th>
                <td class="item-solo-sell">${formatGold(totals.tSell / outputCount)}</td>
                <th><div class="tooltip-modern">Total Crafted
    <span class="tooltiptext-modern">Suma total si CRAFTEAS todos los materiales posibles desde cero.</span>
  </div></th>
                <td class="item-solo-crafted">${formatGold(totals.tCrafted / outputCount)}</td>
              </tr>
            </table>
          </div>
        </div>`;
      }
  
      // Tablas comparativas
      let tablaComparativa = '';
      let tablaComparativaUnidad = '';
      if (outputCount === 1) {
        tablaComparativa = `<section id='comparativa-section'>
          <div class=\"table-modern-totales\"><br>
            <h3>Comparativa de precios de Bazar vs Crafting</h3>
            <table class='table-totales totales-crafting-comparativa'>
              <tr style='text-align:center;'>
                <td><div style='${minIdx===0 ? 'background:#e84d4d33;font-weight:bold;border-radius:6px;padding:10px;' : ''}'>${formatGold(precioCompraTotal)} <br><span style='font-size:0.93em;'>Precio compra</span></div></td>
                <td><div style='${minIdx===1 ? 'background:#4db1e833;font-weight:bold;border-radius:6px;padding:10px;' : ''}'>${formatGold(precioVentaTotal)} <br><span style='font-size:0.93em;'>Precio venta</span></div></td>
                <td><div style='${minIdx===2 ? 'background:#4fc17833;font-weight:bold;border-radius:6px;padding:10px;' : ''}'>${formatGold(precioCraftingMinTotal)} <br><span style='font-size:0.93em;'>Precio crafting más bajo</span></div></td>
              </tr>
              <tr><td colspan='3' style='text-align:center;font-size:1.07em;'>${mensaje}</td></tr>
            </table>
          </div>
          </section>`;
      }
      if (outputCount > 1) {
        // El precio de compra y venta por unidad son SIEMPRE el precio de mercado unitario (no dividir)
        const precioCompraUnidadMercado = (mainNode && typeof mainNode.buy_price === 'number') ? (mainNode.buy_price * qtyValue) / outputCount : 0;
const precioVentaUnidadMercado = (mainNode && typeof mainNode.sell_price === 'number') ? (mainNode.sell_price * qtyValue) / outputCount : 0;    // El precio crafting mínimo por unidad
        const precioCraftingMinUnidadReal = outputCount > 0 ? precioCraftingMinTotal / outputCount : precioCraftingMinTotal;
        // Para el highlight, solo comparar precios positivos
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
        <h3>Ingredientes para craftear</h3>
        <div style=\"margin:18px 0 18px 0;display:flex;align-items:center;gap:12px;\">\n        <label for=\"qty-global\" style=\"font-weight:500;\">Cantidad global:</label>\n        <input id=\"qty-global\" type=\"number\" min=\"1\" value=\"${qtyValue}\" style=\"width:60px;height:36px;\" autocomplete=\"off\">\n      </div>\n      
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
          <tbody>${renderRows(ingredientObjs)}</tbody>
        </table>
        ${tablaTotales}
        ${outputCount > 1 ? tablaTotalesUnidad : ''}
        ${tablaComparativa}
        ${outputCount > 1 ? tablaComparativaUnidad : ''}
        ${profitHtml}
        ${outputCount > 1 ? profitHtmlUnidad : ''}
      `;
      return html;
    }
    window.renderTable = renderTable;
  
    function renderRows(ings, nivel = 0, parentId = null, rowGroupIndex = 0, parentExpanded = true) {
      // (Eliminado: listener de expandir/cerrar hijos, ahora será global tras renderizado)
      return ings.map((ing, idx) => {
        const groupIdx = nivel === 0 ? idx : rowGroupIndex;
        const rowBgClass = groupIdx % 2 === 0 ? 'row-bg-a' : 'row-bg-b';
        const indent = nivel > 0 ? `style=\"padding-left:${nivel * 30}px\"` : '';
        // Identificador único para asociar hijos
        const childClass = `child-of-${ing.id}`;
        // Botón solo si hay hijos
        const expandButton = (ing.is_craftable && ing.children && ing.children.length)
          ? `<button class=\"btn-expand\" data-uid=\"${ing._uid}\">${ing.expanded ? '-' : '+'}</button>` : '';
        // Clases extra para hijos
        const isChild = nivel > 0;
        // Si es hijo, inicia oculto con display:none si el padre no está expandido
        const extraClass = isChild ? `child-of-${parentId}` : '';
        const extraStyle = isChild && !parentExpanded ? 'style="display:none"' : '';
        return `
          <tr data-uid=\"${ing._uid}\"${isChild ? ` data-parent=\"${String(parentId)}\"` : ''} class=\"${isChild ? `subrow subrow-${nivel} ${extraClass}` : ''} ${rowBgClass}\" ${extraStyle}>
            <td class=\"th-border-left-items\" ${indent}><img src=\"${ing.icon}\" width=\"32\"></td>
            <td><a href=\"item.html?id=${ing.id}\" class=\"item-link\" target=\"_blank\">${ing.name}</a></td>
            <td>${ing.countTotal}</td>
            <td class=\"item-solo-buy\">
              <div>${formatGold(ing.total_buy)}</div>
              <div class=\"item-solo-precio\">${formatGold(ing.buy_price)} c/u</div>
              ${parentId !== null ? `<input type=\"radio\" name=\"mode-buy-sell-${ing._uid}\" class=\"chk-mode-buy\" data-uid=\"${ing._uid}\" ${ing.modeForParentCrafted === 'buy' ? 'checked' : ''} title=\"Usar precio de compra para el padre\">` : ''}
            </td>
            <td class=\"item-solo-sell\">
              <div>${formatGold(ing.total_sell)}</div>
              <div class=\"item-solo-precio\">${formatGold(ing.sell_price)} c/u</div>
              ${parentId !== null ? `<input type=\"radio\" name=\"mode-buy-sell-${ing._uid}\" class=\"chk-mode-sell\" data-uid=\"${ing._uid}\" ${ing.modeForParentCrafted === 'sell' ? 'checked' : ''} title=\"Usar precio de venta para el padre\">` : ''}
            </td>
            <td class=\"item-solo-crafted\">
              ${(ing.is_craftable && ing.total_crafted !== null) ? `
                <div>${formatGold(ing.total_crafted)}</div>
                <div class=\"item-solo-precio\">${formatGold(ing.crafted_price)} c/u</div>
                ${(nivel > 0 && parentId !== null) ? `<input type=\"radio\" name=\"mode-crafted-${ing._uid}\" class=\"chk-mode-crafted\" data-uid=\"${ing._uid}\" ${ing.modeForParentCrafted === 'crafted' ? 'checked' : ''} title=\"Usar precio de crafteo para el padre\">` : ''}
              ` : 'N/A'}
            </td>
            <td class=\"th-border-right-items\">${expandButton}</td>
          </tr>
          ${ing.is_craftable && ing.children && ing.children.length ? renderRows(ing.children, nivel + 1, ing.id, groupIdx, parentExpanded && ing.expanded) : ''}
        `;
      }).join('');
    }
  
    // Handler global para expandir/cerrar subingredientes (solo una vez)
    if (!window._expandBtnHandlerInstalled) {
      window._expandBtnHandlerInstalled = true;
      document.addEventListener('click', function(e) {
        if (e.target.matches('.btn-expand')) {
          const uid = e.target.getAttribute('data-uid');
          if (!uid) return;
          const ing = findIngredientByUid(window.ingredientObjs, uid);
          if (ing) {
            ing.expanded = !ing.expanded;
          }
          // Forzar render para reflejar el estado
          if (typeof safeRenderTable === 'function') safeRenderTable();
          e.stopPropagation();
        }
      });
    }
  
    // Handler para los checkboxes de subingredientes (solo una vez)
    function setCheckboxState(ings) {
      for (const ing of ings) {
        if (typeof ing.useCrafted !== 'undefined') {
          ing.useCrafted = !ing.useCrafted;
        }
        if (ing.children && ing.children.length) {
          setCheckboxState(ing.children);
        }
      }
    }
  
    document.addEventListener('change', function(e) {
      if (e.target && e.target.classList.contains('chk-crafted')) {
        const uid = e.target.getAttribute('data-uid');
        if (!uid) return;
        const ing = findIngredientByUid(ingredientObjs, uid);
        if (!ing) return;
        setCheckboxState([ing]);
        recalcAll(ingredientObjs);
        const node = document.querySelector('#seccion-crafting, div#seccion-crafting');
        if (node) node.innerHTML = renderTable();
      }
    });
  
    // Handler unificado para el input global qty-global (solo se instala una vez)
    if (!window._qtyGlobalHandlerInstalled) { // Usamos una bandera única para evitar duplicados
      window._qtyGlobalHandlerInstalled = true;

      // INPUT: No hace nada, solo permite al usuario escribir.
      document.addEventListener('input', function(e) {
        if (e.target && e.target.id === 'qty-global') {
          // El recálculo se aplazará hasta el evento 'blur' o 'keydown (Enter)'.
        }
      });

      // Función que aplica el cambio de cantidad
      const applyQtyChange = (inputEl) => {
        let val = parseInt(inputEl.value, 10);

        // Valida el número, si es inválido, lo establece en 1
        if (isNaN(val) || val < 1) {
          val = 1;
          inputEl.value = '1'; // Corrige el valor en la UI
        }
        
        // Solo recalcula si el valor ha cambiado
        if (window.globalQty !== val) {
            setGlobalQty(val); // Actualiza la variable global

            // Recalcula los ingredientes desde la raíz
            window.ingredientObjs.forEach(ing => ing.recalc(true));

            // Renderiza únicamente la sección de crafteo para no perder el foco del input
            const node = document.querySelector('#seccion-crafting, div#seccion-crafting');
            if (node) {
              node.innerHTML = renderTable();
            }
        }
      };

      // BLUR: aplica el cambio cuando el input pierde el foco
      document.addEventListener('blur', function(e) {
        if (e.target && e.target.id === 'qty-global') {
          applyQtyChange(e.target);
        }
      }, true);

      // KEYDOWN: aplica el cambio al presionar Enter
      document.addEventListener('keydown', function(e) {
        if (e.target && e.target.id === 'qty-global' && e.key === 'Enter') {
          e.preventDefault(); // Evita el envío del formulario
          applyQtyChange(e.target);
        }
      });
    }
    // Función para marcar botones de expandir como activos
    function marcarBotonesExpand(ings) {
      for (const ing of ings) {
        if (ing.expanded) {
          const btn = document.querySelector(`.btn-expand[data-uid='${ing._uid}']`);
          if (btn) btn.textContent = '-';
          if (ing.children && ing.children.length) marcarBotonesExpand(ing.children);
        }
      }
    }
  
    // Aplicar cambios después de un pequeño retraso para asegurar que el DOM esté listo
    setTimeout(() => {
      // Mostrar todas las filas ocultas
      document.querySelectorAll('tr.subrow').forEach(row => row.classList.remove('hidden-row'));
      
      // Inicializar botones de expandir
      document.querySelectorAll('.btn-expand').forEach(btn => btn.textContent = '+');
      
      // Aplicar estado de expansión guardado si existe
      if (window.ingredientObjs) {
        marcarBotonesExpand(window.ingredientObjs);
      }
    }, 0);
  }
   
   // Handler global para radios buy/sell en subingredientes: asegura que el modo se actualiza antes de recalcular
  if (!window._modeRadioHandlerInstalled) {
    window._modeRadioHandlerInstalled = true;
    // Handler para cambios en los radios de compra/venta
    document.addEventListener('change', function(e) {
      // Handler para radios buy/sell/crafted en cualquier nivel
      if (
        e.target &&
        (
          e.target.classList.contains('chk-mode-buy') ||
          e.target.classList.contains('chk-mode-sell') ||
          e.target.classList.contains('chk-mode-crafted')
        )
      ) {
        const uid = e.target.getAttribute('data-uid');
        if (!uid) return;
        if (!window.ingredientObjs || !Array.isArray(window.ingredientObjs) || !window.ingredientObjs.length) {
          return;
        }
        const ing = findIngredientByUid(window.ingredientObjs, uid);
        if (ing) {
          // Detectar el modo seleccionado
          if (e.target.classList.contains('chk-mode-buy')) ing.modeForParentCrafted = 'buy'; // no change
          else if (e.target.classList.contains('chk-mode-sell')) ing.modeForParentCrafted = 'sell';
          else if (e.target.classList.contains('chk-mode-crafted')) ing.modeForParentCrafted = 'crafted';
          console.log('RADIO change', ing.name, 'uid', uid, 'nuevo modo', ing.modeForParentCrafted);
        }
        // Recalcular y renderizar TODO el árbol
        const _expandSnapshot = snapshotExpandState(window.ingredientObjs);
        window.ingredientObjs.forEach(ing => ing.recalc(window.globalQty));
        restoreExpandState(window.ingredientObjs, _expandSnapshot);
        safeRenderTable();
      }
    });
  }

  
  
  
  function findIngredientByUid(ings, uid) {
    for (const ing of ings) {
      if (String(ing._uid) === String(uid)) return ing;
      if (ing.children && ing.children.length) {
        const found = findIngredientByUid(ing.children, uid);
        if (found) return found;
      }
    }
    return null;
  }
  // Mantener función anterior por compatibilidad (usada en secciones viejas)
  function findIngredientById(ings, id) {
    for (const ing of ings) {
      if (String(ing.id) === String(id)) return ing;
      if (ing.children && ing.children.length) {
        const found = findIngredientById(ing.children, id);
        if (found) return found;
      }
    }
    return null;
  }
  
  
  
  
  // Función para renderizar enlaces a la wiki
  function renderWiki(name) {
    if (!name) return '';
    const wikiName = name.replace(/\s+/g, '_');
    const wikiES = `https://wiki.guildwars2.com/wiki/es:${encodeURIComponent(wikiName)}`;
    const wikiEN = `https://wiki.guildwars2.com/wiki/${encodeURIComponent(wikiName)}`;
    
    return `
      <div class="wiki-links">
        <a href="${wikiES}" target="_blank" title="Ver en Wiki (Español)">
          <i class="fas fa-book"></i> Wiki ES
        </a>
        <a href="${wikiEN}" target="_blank" title="View on Wiki (English)" style="margin-left: 10px;">
          <i class="fas fa-book"></i> Wiki EN
        </a>
      </div>
    `;
  }
  
  // Inicializar la aplicación
  main();