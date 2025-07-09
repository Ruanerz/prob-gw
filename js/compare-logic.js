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
  constructor({id, name, icon, count, parentMultiplier = 1, buy_price, sell_price, is_craftable, recipe, children, _parentId = null}) {
    this.id = id;
    this.name = name;
    this.icon = icon;
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
