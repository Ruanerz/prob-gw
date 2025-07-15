// GW2 Item Tracker v2 - LÓGICA Y DATOS (item-logic.js)

// --- Variables Globales ---
window.globalQty = 1;
const DEBUG = false; // Cambiar a false en producción

// --- Funciones de UI ---
window.showLoader = function(show) {
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = show ? 'block' : 'none';
};


// --- Clase CraftIngredient ---
export class CraftIngredient {
  /**
   * Estructura de datos para ingredientes de crafteo y lógica de cálculo
   * @param {_parentId} string|null - Identificador del padre inmediato en el árbol, esencial para distinguir instancias compartidas.
   */
  constructor({id, name, icon, rarity, count, parentMultiplier = 1, buy_price, sell_price, crafted_price, is_craftable, recipe, children, _parentId = null}) {
    this.modeForParentCrafted = "buy";
    this.id = id;
    this.name = name;
    this.icon = icon;
    this.rarity = rarity;
    this.count = count;
    this.parentMultiplier = parentMultiplier || 1;
    this.buy_price = buy_price;
    this.sell_price = sell_price;
    this.crafted_price = crafted_price; // Calculado
    this.is_craftable = is_craftable;
    this.recipe = recipe || null; // Receta si es crafteable
    this.children = children || [];
    this._parentId = _parentId; // Necesario para inputs únicos y sincronización de instancias compartidas
    this.mode = 'buy'; // buy, sell, crafted
    this.expanded = false;
    this.total_buy = 0;
    this.total_sell = 0;
    this.total_crafted = 0;
    this.recalc();
  }
  recalc(globalQty, parentCountTotal, parentOutputCount, isRoot = false) {
    if (!globalQty) {
        console.warn('[WARN] recalc() llamado sin globalQty definido');
        globalQty = 1;
    }

    // ✅ Protección contra ejecución doble sobre el nodo raíz
    if (isRoot) {
        if (this._recalcRootExecuted) {
            console.warn('[WARN] recalc() ejecutado dos veces sobre el mismo ROOT');
        }
        this._recalcRootExecuted = true;
    }

    // ✅ Calcular cantidad total
    this.countTotal = globalQty * (
        (parentCountTotal !== null && parentOutputCount !== null)
            ? (this.count * parentCountTotal) / (parentOutputCount || 1)
            : this.count
    );

    // ✅ Calcular crafted_price si es crafteable
    if (this.is_craftable && this.recipe) {
        const thisRecipeOutputCount = this.recipe.output_item_count || 1;
        let costToCraftOneBatch = 0;

        (this.children || []).forEach(child => {
            let childUnitCost = 0;
            switch (child.modeForParentCrafted) {
                case 'buy':
                    childUnitCost = child.buy_price || 0;
                    break;
                case 'sell':
                    childUnitCost = child.sell_price || 0;
                    break;
                case 'crafted':
                    childUnitCost = (child.crafted_price !== null && child.crafted_price !== Infinity) ? child.crafted_price : 0;
                    break;
                default:
                    childUnitCost = child.buy_price || 0;
            }
            costToCraftOneBatch += (child.count * childUnitCost);
        });

        this.crafted_price = (thisRecipeOutputCount > 0)
            ? costToCraftOneBatch / thisRecipeOutputCount
            : costToCraftOneBatch;
    } else {
        this.crafted_price = null;
    }

    // ✅ 🔥 Si es nodo raíz, calcular como suma de hijos y cortar aquí
    if (isRoot && this.children && this.children.length > 0) {
        this.total_buy = 0;
        this.total_sell = 0;
        this.total_crafted = 0;

        // Recalcular recursivamente todos los hijos antes de sumar
        this.children.forEach(child => {
            child.recalc(globalQty, this.countTotal, this.recipe ? this.recipe.output_item_count : 1);
        });

        this.children.forEach(child => {
            switch (child.modeForParentCrafted) {
                case 'buy':
                    this.total_buy += child.total_buy;
                    this.total_sell += child.total_buy;
                    this.total_crafted += child.total_buy;
                    break;
                case 'sell':
                    this.total_buy += child.total_sell;
                    this.total_sell += child.total_sell;
                    this.total_crafted += child.total_sell;
                    break;
                case 'crafted':
                    this.total_buy += child.total_crafted;
                    this.total_sell += child.total_crafted;
                    this.total_crafted += child.total_crafted;
                    break;
                default:
                    this.total_buy += child.total_buy;
                    this.total_sell += child.total_buy;
                    this.total_crafted += child.total_buy;
            }
        });

        return; // 🔥 IMPORTANTE: salir aquí, no ejecutar el bloque de fallback
    }

    // ✅ Si no es raíz o si no tiene hijos → cálculo estándar
    this.total_buy = (this.buy_price || 0) * this.countTotal;
    this.total_sell = (this.sell_price || 0) * this.countTotal;
    this.total_crafted = (this.crafted_price || 0) * this.countTotal;
}

  getBestPrice() {
    if (typeof this.buy_price === 'number' && this.buy_price > 0) return this.buy_price;
    if (typeof this.crafted_price === 'number' && this.crafted_price > 0) return this.crafted_price;
    return 0;
  }
}
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

async function buildTreeRecursive(ingredientRecipeInfo, currentParentMultiplier, parentId, allItemsDetailsMap, marketDataMap) {
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
              subRecipeFullData.ingredients.map(subIng => 
                  buildTreeRecursive(subIng, subRecipeFullData.output_item_count || 1, itemDetail.id, allItemsDetailsMap, marketDataMap)
              )
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

async function prepareIngredientTreeData(mainItemId, mainRecipeData) {
  if (!mainRecipeData || !mainRecipeData.ingredients || mainRecipeData.ingredients.length === 0) {
    window.ingredientObjs = [];
    window._mainRecipeOutputCount = mainRecipeData ? (mainRecipeData.output_item_count || 1) : 1;
    return [];
  }

  window._mainRecipeOutputCount = mainRecipeData.output_item_count || 1;

  // 1. Obtener todos los IDs de ítems en el árbol
  const allItemIdsInTree = new Set();
  async function collectAllNestedItemIds(recipeIngredients, currentSet) {
      if (!recipeIngredients || recipeIngredients.length === 0) return;
      
      for (const ing of recipeIngredients) {
          currentSet.add(ing.item_id);
          
          // Si tiene receta, obtener sus ingredientes también
          const recipe = await findRecipeByOutput(ing.item_id);
          if (recipe && recipe.ingredients) {
              await collectAllNestedItemIds(recipe.ingredients, currentSet);
          }
      }
  }
  
  await collectAllNestedItemIds(mainRecipeData.ingredients, allItemIdsInTree);
  // Incluir el ítem principal
  allItemIdsInTree.add(mainItemId);

  // 2. Obtener detalles de ítems y precios de mercado
  const allItemsDetailsMap = new Map();
  const marketDataMap = new Map();
  
  // Obtener detalles de los ítems
  const allIdsArray = Array.from(allItemIdsInTree);
  for (let i = 0; i < allIdsArray.length; i += 200) {
      const chunk = allIdsArray.slice(i, i + 200);
      const itemsChunkData = await fetch(`https://api.guildwars2.com/v2/items?ids=${chunk.join(',')}&lang=es`).then(r => r.json());
      itemsChunkData.forEach(item => allItemsDetailsMap.set(item.id, item));
  }
  
  // Obtener precios de mercado
  try {
      const csvUrl = `https://api.datawars2.ie/gw2/v1/items/csv?fields=id,buy_price,sell_price&ids=${allIdsArray.join(',')}`;
      const csvText = await fetch(csvUrl).then(r => r.text());
      const [headers, ...rows] = csvText.trim().split('\n').map(line => line.split(','));
      
      if (headers && headers.length > 0 && rows.length > 0 && rows[0].length === headers.length) { 
          for (const row of rows) {
              const obj = {};
              headers.forEach((h, idx) => {
                  const value = row[idx];
                  if (h === 'id') obj[h] = parseInt(value, 10);
                  else if (h === 'buy_price' || h === 'sell_price') {
                      obj[h] = value !== '' && value !== undefined ? parseInt(value, 10) : null;
                  } else {
                      obj[h] = value;
                  }
              });
              if (obj.id) marketDataMap.set(obj.id, obj);
          }
      }
  } catch (e) {
      console.error('Error obteniendo precios de mercado:', e);
  }

  // 3. Construir el árbol de ingredientes
  const hijos = [];
  for (const ing of mainRecipeData.ingredients) {
      const ingredient = await buildTreeRecursive(
          ing, 
          mainRecipeData.output_item_count || 1, 
          mainItemId, 
          allItemsDetailsMap, 
          marketDataMap
      );
      if (ingredient) {
          // No es necesario recalcular aquí, se hará en la llamada recursiva desde el nodo raíz
          hijos.push(ingredient);
      }
  }

  // 4. Crear el nodo raíz (el ítem principal)
  const mainItemDetail = allItemsDetailsMap.get(parseInt(mainItemId)) || { id: mainItemId, name: `Item ${mainItemId}`, icon: '' };
  const mainMarketInfo = marketDataMap.get(parseInt(mainItemId)) || { buy_price: 0, sell_price: 0 };

  const mainNode = new CraftIngredient({
    id: mainItemDetail.id,
    name: mainItemDetail.name,
    icon: mainItemDetail.icon,
    rarity: mainItemDetail.rarity,
    count: 1,
    parentMultiplier: 1,
    buy_price: mainMarketInfo.buy_price,
    sell_price: mainMarketInfo.sell_price,
    crafted_price: null,
    is_craftable: true,
    recipe: mainRecipeData,
    children: hijos,
  });
  
  // 5. Recalcular el árbol completo (isRoot = true)
  mainNode.recalc(window.globalQty || 1, null, null, null, true);
  
  // 6. Guardar el nodo raíz
  window.ingredientObjs = [mainNode];
  return [mainNode];
}