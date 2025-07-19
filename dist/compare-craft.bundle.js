const rarityClasses = {
  Basic: 'rarity-basic',
  Fine: 'rarity-fine',
  Masterwork: 'rarity-masterwork',
  Rare: 'rarity-rare',
  Exotic: 'rarity-exotic',
  Ascended: 'rarity-ascended',
  Legendary: 'rarity-legendary'
};

window.getRarityClass = function(rarity) {
  return rarityClasses[rarity] || '';
};
(function() {
  function loadScript(url) {
    var script = document.createElement('script');
    script.src = url;
    document.body.appendChild(script);
  }

  window.openSearchModal = function(scriptUrl = 'js/search-modal.js') {
    var modal = document.getElementById('search-modal');
    if (!modal) return;
    modal.style.display = 'block';
    if (!window._searchLoaded && scriptUrl !== null) {
      var loadMain = function() {
        if (scriptUrl) loadScript(scriptUrl);
      };
      if (!window.formatGold) {
        var goldScript = document.createElement('script');
        goldScript.src = 'js/formatGold.js';
        document.body.appendChild(goldScript);
        goldScript.onload = loadMain;
      } else {
        loadMain();
      }
      window._searchLoaded = true;
    }
  };

  window.closeSearchModal = function() {
    var modal = document.getElementById('search-modal');
    if (!modal) return;
    modal.style.display = 'none';
  };

  window.initSearchModal = function() {
    var openBtn = document.getElementById('open-search-modal');
    var modal = document.getElementById('search-modal');
    if (!openBtn || !modal) return;

    var closeBtn = document.getElementById('close-search-modal');
    var backdrop = modal.querySelector('.search-modal-backdrop');
    var scriptUrl = openBtn.dataset.script || 'js/search-modal.js';

    openBtn.addEventListener('click', function(e) {
      e.preventDefault();
      openSearchModal(scriptUrl);
    });

    if (closeBtn) closeBtn.addEventListener('click', closeSearchModal);
    if (backdrop) backdrop.addEventListener('click', closeSearchModal);

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeSearchModal();
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initSearchModal);
  } else {
    window.initSearchModal();
  }
})();
// Tabs simples para item.html
// Muestra/oculta info-item, resumen-mercado y tab-mejores-horas-content

document.addEventListener('DOMContentLoaded', function() {
  const tabBtns = document.querySelectorAll('.item-tab-btn[data-tab]');
  const tabIds = ['info-item', 'resumen-mercado', 'tab-mejores-horas-content'];

  function showTab(tabId) {
    tabIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = (id === tabId) ? '' : 'none';
    });
    tabBtns.forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId));
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const tabId = btn.getAttribute('data-tab');
      showTab(tabId);
    });
  });

  // Mostrar por defecto la pestaña de crafteo
  showTab('info-item');
});
// Modal de feedback/contacto

function createFeedbackModal() {
  if (!document.getElementById('open-feedback-modal')) {
    const btn = document.createElement('a');
    btn.href = '#';
    btn.id = 'open-feedback-modal';
    btn.className = 'feedback-float';
    btn.textContent = 'Feedback';
    document.body.appendChild(btn);
  }

  if (!document.getElementById('feedback-modal')) {
    const modal = document.createElement('div');
    modal.id = 'feedback-modal';
    modal.className = 'search-modal hidden';
    modal.innerHTML = `
      <div class="search-modal-backdrop"></div>
      <div class="search-modal-content">
        <button class="close-modal" id="close-feedback-modal">×</button>
        <div class="text-center"><h2>¿Mejoras?¿Bugs?</h2></div>
        <div class="mb-18-0-8-0">
          <p>¿Tienes dudas, sugerencias o comentarios?</p><br>
          <p>Escríbeme por discord <a href="https://discord.gg/rtAEcMys" target="_blank" class="item-link">SERVER RUANERZ</a>
          <br>en el canal general.</p><br>
          <p>Por privado puedes escribirme a Ruanerz#0220 en discord.</p><br>
          <p>También puedes escribirme en mi canal de <a href="https://www.youtube.com/@Ruanerz?sub_confirmation=1" target="_blank" class="item-link">Youtube</a>.</p>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }
}

function initFeedbackModal() {
  createFeedbackModal();
  const openBtn = document.getElementById('open-feedback-modal');
  const modal = document.getElementById('feedback-modal');
  const closeBtn = document.getElementById('close-feedback-modal');
  if (!openBtn || !modal || !closeBtn) return;

  const open = function(e) {
    e.preventDefault();
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  };

  const close = function() {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  };

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  modal.querySelector('.search-modal-backdrop').addEventListener('click', close);
  document.addEventListener('keydown', function(e) {
    if (!modal.classList.contains('hidden') && e.key === 'Escape') {
      close();
    }
  });
}

document.addEventListener('DOMContentLoaded', initFeedbackModal);
// GW2 Item Tracker v2 - LÓGICA Y DATOS (item-logic.js)

// --- Inicialización global de comparativa para el modal ---
if (typeof window.comparativa === 'undefined') {
  window.comparativa = {
    agregarItemPorId: async function(id) {
      // Evita duplicados en la lista de ingredientes
      if (window.ingredientObjs.some(obj => obj.id == id)) return;
      try {
        if (typeof window.showLoader === 'function') window.showLoader(true);
        // Cargar datos completos del ítem
        const itemData = await fetchItemData(id);
        const recipeData = await fetchRecipeData(id);
        let ingredientesArbol;
        if (recipeData) {
          // Construye el árbol completo de hijos
          let hijos = await prepareIngredientTreeData(id, recipeData);
          if (!Array.isArray(hijos)) hijos = [];
          // Carga los datos del ítem principal y del mercado
          const itemData = await fetchItemData(id);
          const marketData = await fetchMarketDataForItem(id);
          // Crea el nodo raíz para el ítem principal
          ingredientesArbol = new CraftIngredient({
            id: itemData.id,
            name: itemData.name,
            icon: itemData.icon,
            rarity: itemData.rarity,
            count: 1,
            buy_price: marketData.buy_price,
            sell_price: marketData.sell_price,
            is_craftable: true,
            recipe: recipeData,
            children: hijos, // <--- Aquí van todos los hijos
          });
          // Llama recalc con isRoot=true SOLO para el principal
          ingredientesArbol.recalc(window.globalQty || 1, null, null, true);
        } else {
          // Si no hay receta, agrega solo el objeto raíz
          const itemData = await fetchItemData(id);
          const marketData = await fetchMarketDataForItem(id);
          ingredientesArbol = new CraftIngredient({
            id: itemData.id,
            name: itemData.name,
            icon: itemData.icon,
            rarity: itemData.rarity,
            count: 1,
            buy_price: marketData.buy_price,
            sell_price: marketData.sell_price,
            is_craftable: false,
            recipe: null,
            children: [],
          });
        }
        window.ingredientObjs.push(ingredientesArbol);
        // Llama a la función de UI segura para refrescar la tabla
        if (typeof safeRenderTable === 'function') {
          safeRenderTable();
        } else {
          alert('No se encontró safeRenderTable(). La tabla no se actualizará.');
        }
        if (typeof window.showLoader === 'function') window.showLoader(false);
      } catch (e) {
        if (typeof window.showLoader === 'function') window.showLoader(false);
        alert('Error al agregar el ítem: ' + e.message);
      }
    }
  };
}
// --- Fin inicialización global de comparativa ---

// --- Clase CraftIngredient ---

// --- Inicialización automática para la vista comparativa ---
import { renderItemUI, safeRenderTable } from './compare-ui.js';

const params = new URLSearchParams(window.location.search);
const itemId = parseInt(params.get('id'), 10);
window.globalQty = 1;
window.ingredientObjs = [];
window._mainRecipeOutputCount = 1;
window._mainBuyPrice = 0;
window._mainSellPrice = 0;

async function fetchItemData(id) {
    const response = await fetch(`https://api.guildwars2.com/v2/items/${id}?lang=es`);
    if (!response.ok) throw new Error(`Error ${response.status} obteniendo datos del ítem ${id}`);
    return response.json();
}

async function fetchRecipeData(outputItemId) {
    const recipeSearch = await fetch(`https://api.guildwars2.com/v2/recipes/search?output=${outputItemId}`);
    if (!recipeSearch.ok) {
        console.warn(`Búsqueda de receta para ${outputItemId} falló con estado ${recipeSearch.status}`);
        return null;
    }
    const recipeIds = await recipeSearch.json();
    if (!recipeIds || recipeIds.length === 0) return null;
    const recipeId = recipeIds[0];
    const recipeResponse = await fetch(`https://api.guildwars2.com/v2/recipes/${recipeId}?lang=es`);
    if (!recipeResponse.ok) throw new Error(`Error ${recipeResponse.status} obteniendo datos de la receta ${recipeId}`);
    return recipeResponse.json();
}

async function fetchMarketDataForItem(id) {
    const fields = [
        'id', 'buy_price', 'sell_price', 'buy_quantity', 'sell_quantity',
        'last_updated', '1d_buy_sold', '1d_sell_sold', '2d_buy_sold', '2d_sell_sold',
        '7d_buy_sold', '7d_sell_sold', '1m_buy_sold', '1m_sell_sold'
    ].join(',');
    const csvUrl = `https://api.datawars2.ie/gw2/v1/items/csv?fields=${fields}&ids=${id}`;
    const csvText = await fetch(csvUrl).then(r => {
        if (!r.ok) throw new Error(`Error ${r.status} obteniendo datos de mercado para el ítem ${id}`);
        return r.text();
    });
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return {};
    const headers = lines[0].split(',');
    const values = lines[1].split(',');
    const result = {};
    headers.forEach((h, i) => result[h] = values[i] !== undefined ? (isNaN(values[i]) ? values[i] : Number(values[i])) : null);
    return result;
}

async function prepareIngredientTreeData(mainItemId, mainRecipeData) {
    if (!mainRecipeData || !mainRecipeData.ingredients || mainRecipeData.ingredients.length === 0) {
        window.ingredientObjs = [];
        window._mainRecipeOutputCount = mainRecipeData ? (mainRecipeData.output_item_count || 1) : 1;
        return [];
    }

    window._mainRecipeOutputCount = mainRecipeData.output_item_count || 1;

    const allItemIdsInTree = new Set();
    async function collectAllNestedItemIds(recipeIngredients, currentSet) {
        if (!recipeIngredients || recipeIngredients.length === 0) return;
        const itemIdsFromCurrentLevel = recipeIngredients.map(ing => ing.item_id);
        const itemsDataForCurrentLevel = itemIdsFromCurrentLevel.length > 0 
            ? await fetch(`https://api.guildwars2.com/v2/items?ids=${itemIdsFromCurrentLevel.join(',')}&lang=es`).then(r => r.json())
            : [];
        for (const itemDetail of itemsDataForCurrentLevel) {
            if (currentSet.has(itemDetail.id)) continue; 
            currentSet.add(itemDetail.id);
            const subRecipeSearch = await fetch(`https://api.guildwars2.com/v2/recipes/search?output=${itemDetail.id}`).then(r => r.json());
            if (subRecipeSearch && subRecipeSearch.length > 0) {
                const subRecipeId = subRecipeSearch[0];
                const subRecipeFullData = await fetch(`https://api.guildwars2.com/v2/recipes/${subRecipeId}?lang=es`).then(r => r.json());
                if (subRecipeFullData && subRecipeFullData.ingredients) {
                    await collectAllNestedItemIds(subRecipeFullData.ingredients, currentSet);
                }
            }
        }
    }
    await collectAllNestedItemIds(mainRecipeData.ingredients, allItemIdsInTree);
    mainRecipeData.ingredients.forEach(ing => allItemIdsInTree.add(ing.item_id));

    const allItemsDetailsMap = new Map();
    if (allItemIdsInTree.size > 0) {
        const allIdsArray = Array.from(allItemIdsInTree);
        for (let i = 0; i < allIdsArray.length; i += 200) {
            const chunk = allIdsArray.slice(i, i + 200);
            const itemsChunkData = await fetch(`https://api.guildwars2.com/v2/items?ids=${chunk.join(',')}&lang=es`).then(r => r.json());
            itemsChunkData.forEach(item => allItemsDetailsMap.set(item.id, item));
        }
    }
    const marketDataMap = new Map();
    if (allItemIdsInTree.size > 0) {
        try {
            const csvUrl = `https://api.datawars2.ie/gw2/v1/items/csv?fields=id,buy_price,sell_price&ids=${Array.from(allItemIdsInTree).join(',')}`;
            const csvText = await fetch(csvUrl).then(r => r.text());
            const [headers, ...rows] = csvText.trim().split('\n').map(line => line.split(','));
            if (headers && headers.length > 0 && rows.length > 0 && rows[0].length === headers.length) { 
                for (const row of rows) {
                    const obj = {};
                    headers.forEach((h, idx) => {
                        const value = row[idx];
                        if (h === 'id') obj[h] = parseInt(value, 10);
                        else if (h === 'buy_price' || h === 'sell_price') obj[h] = value !== '' && value !== undefined ? parseInt(value, 10) : null;
                        else obj[h] = value;
                    });
                    if (obj.id) marketDataMap.set(obj.id, obj);
                }
            }
        } catch (e) {
            console.error('Error fetching or parsing CSV market data:', e);
        }
    }
    async function buildTreeRecursive(ingredientRecipeInfo, currentParentMultiplier, parentId = null) {
        const itemDetail = allItemsDetailsMap.get(ingredientRecipeInfo.item_id);
        if (!itemDetail) {
            console.error(`Missing item detail for ID: ${ingredientRecipeInfo.item_id}`);
            return null; 
        }
        const marketInfo = marketDataMap.get(ingredientRecipeInfo.item_id) || {};
        let children = [];
        let subRecipeFullData = null;
        let isCraftable = false;
        const subRecipeSearch = await fetch(`https://api.guildwars2.com/v2/recipes/search?output=${ingredientRecipeInfo.item_id}`).then(r => r.json());
        if (subRecipeSearch && subRecipeSearch.length > 0) {
            const subRecipeId = subRecipeSearch[0];
            subRecipeFullData = await fetch(`https://api.guildwars2.com/v2/recipes/${subRecipeId}?lang=es`).then(r => r.json());
            if (subRecipeFullData && subRecipeFullData.ingredients) {
                isCraftable = true;
                children = await Promise.all(
                    subRecipeFullData.ingredients.map(subIng => buildTreeRecursive(subIng, subRecipeFullData.output_item_count || 1, itemDetail.id))
                );
                children = children.filter(c => c !== null); 
            }
        }
        return new CraftIngredient({
            id: itemDetail.id,
            name: itemDetail.name,
            icon: itemDetail.icon,
            rarity: itemDetail.rarity,
            count: ingredientRecipeInfo.count,
            parentMultiplier: currentParentMultiplier,
            buy_price: marketInfo.buy_price !== undefined ? marketInfo.buy_price : null,
            sell_price: marketInfo.sell_price !== undefined ? marketInfo.sell_price : null,
            crafted_price: null, 
            is_craftable: isCraftable,
            recipe: subRecipeFullData, 
            children: children,
            _parentId: parentId
        });
    }
    let finalIngredientObjs = [];
    if (mainRecipeData && mainRecipeData.ingredients) {
        finalIngredientObjs = await Promise.all(
            mainRecipeData.ingredients.map(ing => buildTreeRecursive(ing, window._mainRecipeOutputCount, mainItemId))
        );
        finalIngredientObjs = finalIngredientObjs.filter(c => c !== null); 
    }
    // Enlazar padres e hijos y luego recalcular desde la raíz
    function linkParents(node, parent) {
        node._parent = parent;
        if (node.children) {
            node.children.forEach(child => linkParents(child, node));
        }
    }
    finalIngredientObjs.forEach(rootNode => {
        linkParents(rootNode, null); // El nodo raíz no tiene padre
                rootNode.recalc(window.globalQty, null);
    });

    return finalIngredientObjs;
}

async function mainCompareUI() {
    if (isNaN(itemId)) return;
    try {
        const itemData = await fetchItemData(itemId);
        window._mainItemData = itemData;
        const marketData = await fetchMarketDataForItem(itemId);
        window._mainBuyPrice = marketData.buy_price || 0;
        window._mainSellPrice = marketData.sell_price || 0;
        const recipeData = await fetchRecipeData(itemId);
        if (recipeData) {
            window.ingredientObjs = await prepareIngredientTreeData(itemId, recipeData);
        } else {
            window.ingredientObjs = [];
            window._mainRecipeOutputCount = 1;
        }
        renderItemUI(itemData, marketData);
    } catch (e) {
        const err = document.getElementById('error-message');
        if (err) {
            err.style.display = 'block';
            err.textContent = e.message || 'Error cargando datos del ítem.';
        } else {
            alert(e.message || 'Error cargando datos del ítem.');
        }
    }
}

mainCompareUI();

export class CraftIngredient {
  constructor({id, name, icon, rarity, count, parentMultiplier = 1, buy_price, sell_price, is_craftable, recipe, children, _parentId = null}) {
    this.id = id;
    this.name = name;
    this.icon = icon;
    this.rarity = rarity;
    this.count = count; // Cantidad requerida por la receta padre
    this.parentMultiplier = parentMultiplier || 1;
    this.buy_price = buy_price;
    this.sell_price = sell_price;
    this.is_craftable = is_craftable;
    this.recipe = recipe || null;
    this.children = children || [];
    this.mode = 'buy'; // 'buy', 'sell', 'crafted' -> Para el nodo actual
    this.modeForParentCrafted = 'buy'; // 'buy', 'sell', 'crafted' -> Para el cálculo del padre
    this.expanded = false;
    this._parentId = _parentId;
    this._parent = null; // Referencia al objeto padre

    // Propiedades calculadas
    this.countTotal = 0; // Cantidad total necesaria
    this.crafted_price = null; // Costo de craftear una unidad
    this.total_buy = 0; // Costo total si todos los materiales se compran
    this.total_sell = 0; // Valor total si todos los materiales se venden
    this.total_crafted = 0; // Costo total usando el modo seleccionado (buy/sell/crafted)
  }

  findRoot() {
    let current = this;
    while (current._parent) {
      current = current._parent;
    }
    return current;
  }

  setMode(newMode) {
    if (['buy', 'sell', 'crafted'].includes(newMode)) {
      this.modeForParentCrafted = newMode;
      // Tras cambiar, recalcular todo el árbol desde la raíz para que los cambios se propaguen
      const root = this.findRoot();
      root.recalc(window.globalQty || 1, null);
      // Actualizar la UI
      if (typeof safeRenderTable === 'function') {
        safeRenderTable();
      }
    }
  }

  recalc(globalQty = 1, parent = null) {
        const isRoot = parent == null; // Usar '==' para comprobar tanto null como undefined.

    // 1. Calcular la cantidad total requerida para este ingrediente.
    if (isRoot) {
      this.countTotal = this.count * globalQty;
    } else {
      // El nodo hijo necesita "cantidad del padre" multiplicado por las unidades requeridas por receta.
      // Se elimina la división por output_item_count para igualar la lógica de item.js.
      this.countTotal = parent.countTotal * this.count;
    }

    // 2. Recursión: calcular primero los totales de los hijos.
    if (this.children && this.children.length > 0) {
      this.children.forEach(child => child.recalc(globalQty, this));
    }

    // 3. Calcular totales para el nodo actual.
    if (isRoot) {
      // --- Lógica para el NODO RAÍZ ---
      // Los totales son siempre la suma de los hijos directos.
      this.total_buy = this.children.reduce((sum, child) => sum + (child.total_buy || 0), 0);
      this.total_sell = this.children.reduce((sum, child) => sum + (child.total_sell || 0), 0);
    } else {
      // --- Lógica para NODOS INTERMEDIOS y HOJAS ---
      // Por defecto, usar el precio de mercado del propio ítem.
      this.total_buy = (this.buy_price || 0) * this.countTotal;
      this.total_sell = (this.sell_price || 0) * this.countTotal;
    }

    // 4. Calcular el costo de crafteo (si es aplicable).
    if (this.is_craftable && this.children.length > 0) {
      // El costo de crafteo se basa en el modo seleccionado de los hijos.
      this.total_crafted = this.children.reduce((sum, ing) => {
        switch (ing.modeForParentCrafted) {
          case 'buy':     return sum + (ing.total_buy || 0);
          case 'sell':    return sum + (ing.total_sell || 0);
          case 'crafted': return sum + (ing.total_crafted || 0);
          default:        return sum + (ing.total_buy || 0);
        }
      }, 0);
      this.crafted_price = this.total_crafted / (this.recipe?.output_item_count || 1);

      // Fallback para nodos intermedios sin precio de mercado.
      if (!isRoot && (!this.buy_price && !this.sell_price)) {
        this.total_buy = this.children.reduce((sum, child) => sum + (child.total_buy || 0), 0);
        this.total_sell = this.children.reduce((sum, child) => sum + (child.total_sell || 0), 0);
      }
    } else {
      // --- Lógica para NODOS HOJA ---
      // No se pueden craftear.
      this.total_crafted = null;
      this.crafted_price = null;
    }
  }

  getBestPrice() {
    if (typeof this.buy_price === 'number' && this.buy_price > 0) return this.buy_price;
    if (typeof this.crafted_price === 'number' && this.crafted_price > 0) return this.crafted_price;
    return 0;
  }
}
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
  const rarityClass = typeof getRarityClass === 'function' ? getRarityClass(mainItem.rarity) : '';
  return `
    <tr class="row-bg-main">
      <td class="th-border-left-items"><img src="${mainItem.icon}" width="32"></td>
      <td><a href="item.html?id=${mainItem.id}" class="item-link ${rarityClass}" target="_blank">${(mainItem.recipe && mainItem.recipe.output_item_count && mainItem.recipe.output_item_count > 1) ? `<span style='color:#a1a1aa;font-size:0.95em;display:block;margin-bottom:2px;'>Receta produce <b>${mainItem.recipe.output_item_count}</b> unidades<br>Profit mostrado es por unidad</span>` : ''}${mainItem.name}</a></td>
      <td>${qty}</td>
      <td class="item-unit-sell">${formatGoldColored(Number(mainItem.sell_price))} <span style="color: #c99b5b">c/u</span></td>
      <td class="item-solo-buy"><div>${formatGoldColored(realTotals.totalBuy)}</div></td>
      <td class="item-solo-sell"><div>${formatGoldColored(realTotals.totalSell)}</div></td>
      <td class="item-solo-crafted"><div>${formatGoldColored(realTotals.totalCrafted)}</div></td>
      <td class="item-profit">${(() => {
        const ventaBruta = Number(mainItem.sell_price) * qty;
        const ventaNeta = ventaBruta - (ventaBruta * 0.15);
        const minTotal = Math.min(realTotals.totalBuy, realTotals.totalSell, realTotals.totalCrafted);
        const profit = ventaNeta - minTotal;
        const color = profit > 0 ? '#4fc178' : '#e84d4d';
        return `<span style='font-weight:bold;color:${color}'>${formatGoldColored(profit)}</span>`;
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
    const rarityClass = typeof getRarityClass === 'function' ? getRarityClass(ing.rarity) : '';
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
        return `<span style='font-weight:bold;color:${color}'>${formatGoldColored(profit)}</span>`;
    })();

    return `
      <tr data-path="${currentPath}" class="${isChild ? `subrow subrow-${nivel} child-of-${parentId}` : ''} ${rowBgClass}" ${extraStyle}>
        <td class="th-border-left-items" ${indent}><img src="${ing.icon}" width="32"></td>
        <td><a href="item.html?id=${ing.id}" class="item-link ${rarityClass}" target="_blank">${ing.name}</a></td>
        <td>${ing.countTotal ? (Number.isInteger(ing.countTotal) ? ing.countTotal : ing.countTotal.toFixed(2)) : ing.count}</td>
        <td class="item-unit-sell">${formatGoldColored(ing.sell_price)} <span style="color: #c99b5b">c/u</span></td>
        
        <td class="item-solo-buy">
          <div>${formatGoldColored(ing.total_buy)}</div>
          <div class="item-solo-precio">${formatGoldColored(ing.buy_price)} <span style="color: #c99b5b">c/u</span></div>
          ${radios}
        </td>
        
        <td class="item-solo-sell">
          <div>${formatGoldColored(ing.total_sell)}</div>
          <div class="item-solo-precio">${formatGoldColored(ing.sell_price)} <span style="color: #c99b5b">c/u</span></div>
          ${radiosSell}
        </td>
        
        <td class="item-solo-crafted">
          ${(ing.is_craftable && ing.children && ing.children.length > 0 && ing.total_crafted !== null) ? `
            <div>${formatGoldColored(ing.total_crafted)}</div>
            <div class="item-solo-precio">${formatGoldColored(0)} <span style="color: #c99b5b">c/u</span></div>
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
          <th><div class="tooltip-modern">Total Compra
            <span class="tooltiptext-modern">Suma total si haces PEDIDO de materiales en el mercado.</span>
          </div></th>
          <td class="item-solo-buy">${formatGoldColored(totals.totalBuy)}</td>
          <th><div class="tooltip-modern">Total Venta
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
    <div style='margin-bottom:8px;color:#a1a1aa;font-size:1em;'>Esta receta produce <b>${outputCount}</b> unidades por crafteo. Los siguientes costos son por unidad.</div>
      <div id="totales-crafting">
        <table class="table-totales" style="margin-top:12px;">
          <tr>
            <th><div class="tooltip-modern">Total Compra
              <span class="tooltiptext-modern">Suma total si haces PEDIDO de materiales en el mercado.</span>
            </div></th>
            <td class="item-solo-buy">${formatGoldColored(totals.totalBuy / outputCount)}</td>
            <th><div class="tooltip-modern">Total Venta
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
  if (outputCount === 1) {
    tablaComparativa = `<section id='comparativa-section'>
      <div class="table-modern-totales"><br>
        <h3>Comparativa de precios de Bazar vs Crafting</h3>
        <table class='table-totales totales-crafting-comparativa'>
          <tr style='text-align:center;'>
            <td><div style='${precioMinimoFinal===precioCompraTotal ? 'background:#e84d4d33;font-weight:bold;border-radius:6px;padding:10px;' : ''}'>${formatGoldColored(precioCompraTotal)} <br><span style='font-size:0.93em;'>Precio compra</span></div></td>
            <td><div style='${precioMinimoFinal===precioVentaTotal ? 'background:#4db1e833;font-weight:bold;border-radius:6px;padding:10px;' : ''}'>${formatGoldColored(precioVentaTotal)} <br><span style='font-size:0.93em;'>Precio venta</span></div></td>
            <td><div style='${precioMinimoFinal===precioCraftingMinTotal ? 'background:#4fc17833;font-weight:bold;border-radius:6px;padding:10px;' : ''}'>${formatGoldColored(precioCraftingMinTotal)} <br><span style='font-size:0.93em;'>Precio crafting más bajo</span></div></td>
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
            <td><div style='${minIdxUnidad===0 ? 'background:#e84d4d33;font-weight:bold;border-radius:6px;padding:10px;' : ''}'>${formatGoldColored(precioCompraUnidadMercado)} <br><span style='font-size:0.93em;'>Precio compra</span></div></td>
            <td><div style='${minIdxUnidad===1 ? 'background:#4db1e833;font-weight:bold;border-radius:6px;padding:10px;' : ''}'>${formatGoldColored(precioVentaUnidadMercado)} <br><span style='font-size:0.93em;'>Precio venta</span></div></td>
            <td><div style='${minIdxUnidad===2 ? 'background:#4fc17833;font-weight:bold;border-radius:6px;padding:10px;' : ''}'>${formatGoldColored(precioCraftingMinUnidadReal)} <br><span style='font-size:0.93em;'>Precio crafting más bajo</span></div></td>
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
          <th>Total Compra</th>
          <th>Total Venta</th>
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
      <tr><th><div class="dato-item">Precio de compra</div></th><td><div class="dato-item-info">${formatGoldColored(safeMarketData.buy_price != null ? safeMarketData.buy_price : 0)}</div></td></tr>
      <tr><th><div class="dato-item">Precio de venta</div></th><td><div class="dato-item-info">${formatGoldColored(safeMarketData.sell_price != null ? safeMarketData.sell_price : 0)}</div></td></tr>
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
// storageUtils.js
// Utilidades para manejar favoritos en localStorage

/**
 * Guarda un ítem como favorito
 * @param {string} key - Clave de almacenamiento (ej: 'gw2_favoritos_items')
 * @param {Object} item - Objeto con id y nombre del ítem
 * @param {number} maxItems - Máximo de ítems a guardar (opcional, por defecto 20)
 * @returns {Array} - Lista actualizada de favoritos
 */
function saveFavorito(key, item, maxItems = 20) {
    if (!item || !item.id) return [];
    
    // Obtener favoritos actuales
    const favoritos = getFavoritos(key);
    
    // Evitar duplicados
    const sinDuplicados = favoritos.filter(fav => fav.id !== item.id);
    
    // Agregar el nuevo ítem al principio
    const nuevosFavoritos = [item, ...sinDuplicados];
    
    // Limitar la cantidad de ítems
    const listaRecortada = nuevosFavoritos.slice(0, maxItems);
    
    // Guardar en localStorage
    localStorage.setItem(key, JSON.stringify(listaRecortada));
    
    return listaRecortada;
}

/**
 * Obtiene la lista de favoritos
 * @param {string} key - Clave de almacenamiento
 * @returns {Array} - Lista de favoritos
 */
function getFavoritos(key) {
    try {
        return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (e) {
        console.error('Error al leer favoritos:', e);
        return [];
    }
}

/**
 * Elimina un ítem de favoritos
 * @param {string} key - Clave de almacenamiento
 * @param {number} itemId - ID del ítem a eliminar
 * @returns {Array} - Lista actualizada de favoritos
 */
function removeFavorito(key, itemId) {
    const favoritos = getFavoritos(key);
    const nuevosFavoritos = favoritos.filter(item => item.id !== itemId);
    localStorage.setItem(key, JSON.stringify(nuevosFavoritos));
    return nuevosFavoritos;
}

/**
 * Muestra una notificación toast
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación (success, error, info)
 */
function showToast(message, type = 'success') {
    // Crear contenedor si no existe
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Crear toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.opacity = '0';
    toast.textContent = message;
    
    // Agregar al DOM
    container.appendChild(toast);
    
    // Mostrar con animación
    setTimeout(() => {
        toast.style.opacity = '1';
    }, 10);
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        toast.style.opacity = '0';
        // Eliminar después de la animación
        setTimeout(() => {
            toast.remove();
            // Eliminar contenedor si no hay más toasts
            if (container.children.length === 0) {
                container.remove();
            }
        }, 300);
    }, 3000);
}

// --- Nuevas utilidades para guardar comparativas ---
/**
 * Guarda una comparativa
 * @param {string} key - Clave de almacenamiento (ej: 'gw2_comparativas')
 * @param {Object} comparativa - Objeto con arreglo ids[] y metadatos (nombres, timestamp)
 * @param {number} maxItems - Máximo de comparativas a guardar
 * @returns {Array} - Lista actualizada de comparativas
 */
function saveComparativa(key, comparativa, maxItems = 20) {
    if (!comparativa || !Array.isArray(comparativa.ids) || comparativa.ids.length === 0) return [];

    const existentes = getComparativas(key);

    // Generar una firma única basada en los IDs ordenados
    const firma = [...comparativa.ids].sort((a,b)=>a-b).join('-');

    const sinDuplicados = existentes.filter(c => {
        const f = Array.isArray(c.ids) ? [...c.ids].sort((a,b)=>a-b).join('-') : '';
        return f !== firma;
    });

    const nuevas = [comparativa, ...sinDuplicados].slice(0, maxItems);
    localStorage.setItem(key, JSON.stringify(nuevas));
    return nuevas;
}

function getComparativas(key) {
    try {
        return JSON.parse(localStorage.getItem(key) || '[]');
    } catch(e) {
        console.error('Error al leer comparativas:', e);
        return [];
    }
}

function removeComparativa(key, firmaComparativa) {
    const existentes = getComparativas(key);
    const filtradas = existentes.filter(c => {
        const f = Array.isArray(c.ids) ? [...c.ids].sort((a,b)=>a-b).join('-') : '';
        return f !== firmaComparativa;
    });
    localStorage.setItem(key, JSON.stringify(filtradas));
    return filtradas;
}

// Exportar funciones para uso global
window.StorageUtils = {
    // Favoritos de ítems
    saveFavorito,
    getFavoritos,
    removeFavorito,
    // Comparativas
    saveComparativa,
    getComparativas,
    removeComparativa,
    // Misceláneas
    showToast
};
// compareHandlers.js
// Manejadores para acciones relacionadas a la comparativa (guardar, etc.)

document.addEventListener('DOMContentLoaded', function () {
    initSaveComparativaHandler();
    loadComparativaFromURL();
});

/**
 * Inicializa el manejador del botón "Guardar comparativa"
 */
function initSaveComparativaHandler() {
    const saveBtn = document.getElementById('btn-guardar-comparativa');
    if (!saveBtn) return;

    // Mostrar u ocultar de acuerdo a autenticación
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) {
        saveBtn.style.display = 'none';
        return;
    }

    saveBtn.addEventListener('click', handleSaveComparativa);
}

/**
 * Maneja la lógica de guardado de una comparativa.
 * La comparativa se define como la lista actual de IDs cargados en window.ingredientObjs (raíces).
 */
function handleSaveComparativa() {
    if (!window.ingredientObjs || window.ingredientObjs.length === 0) {
        window.StorageUtils?.showToast('Agrega al menos un ítem a la comparativa', 'error');
        return;
    }

    // Obtener IDs y nombres de los ítems raíz en la comparativa
    const ids = window.ingredientObjs.map(obj => obj.id);
    const nombres = window.ingredientObjs.map(obj => obj.name);

    const comparativa = {
        ids,
        nombres,
        timestamp: Date.now()
    };

    if (window.StorageUtils) {
        if (typeof window.StorageUtils.saveComparativa === 'function') {
            window.StorageUtils.saveComparativa('gw2_comparativas', comparativa);
            window.StorageUtils.showToast('Comparativa guardada');
        } else {
            console.error('saveComparativa no está definida en StorageUtils');
            window.StorageUtils.showToast('Error guardando comparativa', 'error');
        }
    } else {
        alert('StorageUtils no está disponible.');
    }
}

// Inicialización automática si el DOM ya está listo
afterDomReady();

/**
 * Si la URL contiene ?ids=id1,id2,... carga automáticamente esos ítems
 */
function loadComparativaFromURL() {
    const params = new URLSearchParams(window.location.search);
    const idsParam = params.get('ids');
    if (!idsParam) return;

    const ids = idsParam.split(',').map(id => parseInt(id, 10)).filter(n => !isNaN(n));
    if (ids.length === 0) return;

    // Asegurar estructuras globales básicas
    window.ingredientObjs = window.ingredientObjs || [];
    window.globalQty = window.globalQty || 1;

    const tryLoad = () => {
        if (window.comparativa && typeof window.comparativa.agregarItemPorId === 'function') {
            (async () => {
                for (const id of ids) {
                    try {
                        await window.comparativa.agregarItemPorId(id);
                    } catch (e) {
                        console.error('Error cargando ítem de la URL', id, e);
                    }
                }
            })();
        } else {
            // Aún no disponible, reintentar
            setTimeout(tryLoad, 50);
        }
    };
    tryLoad();
}


function afterDomReady() {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(() => {
            initSaveComparativaHandler();
            loadComparativaFromURL();
        }, 1);
    }
}
