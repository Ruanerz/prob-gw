// main.js - Orquestador principal para el GW2 Item Tracker Modular
console.log('[main.js] Inicializando...');

// Importaciones
import { CraftIngredient } from './item-logic.js';
import { showLoader, showError, hideError, renderItemUI, initItemUI } from './item-ui.js';
import { getAndTransformRecipes, loadIngredientTree } from './utils/recipeUtils.js';

const params = new URLSearchParams(window.location.search);
const itemId = parseInt(params.get('id'), 10);

// Estado global inicial
window.globalQty = 1;
window.ingredientObjs = [];
window._mainRecipeOutputCount = 1;
window._mainBuyPrice = 0;
window._mainSellPrice = 0;

// --- Funciones de Fetch de Datos ---
async function fetchItemData(id) {
    const response = await fetch(`https://api.guildwars2.com/v2/items/${id}?lang=es`);
    if (!response.ok) throw new Error(`Error ${response.status} obteniendo datos del ítem ${id}`);
    return response.json();
}

async function fetchRecipeData(outputItemId) {
    const recipeSearch = await fetch(`https://api.guildwars2.com/v2/recipes/search?output=${outputItemId}`);
    if (!recipeSearch.ok) {
        console.warn(`Búsqueda de receta para ${outputItemId} falló con estado ${recipeSearch.status}`);
        return null; // No es error crítico si no hay receta
    }
    const recipeIds = await recipeSearch.json();
    if (!recipeIds || recipeIds.length === 0) return null; // No hay receta para este ítem

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
    
    try {
        const csvText = await fetch(csvUrl).then(r => {
            if (!r.ok) throw new Error(`Error ${r.status} fetching CSV market data for item ${id}`);
            return r.text();
        });

        const lines = csvText.trim().split('\n');
        if (lines.length < 2) { // Headers + at least one data row
            console.warn(`No market data found in CSV for item ${id}`);
            const defaultData = {};
            fields.split(',').forEach(field => {
                if (field === 'id') defaultData[field] = id;
                else if (field === 'last_updated') defaultData[field] = '-';
                else if (['buy_price', 'sell_price', 'buy_quantity', 'sell_quantity'].includes(field)) defaultData[field] = 0;
                else defaultData[field] = null;
            });
            window._mainBuyPrice = 0;
            window._mainSellPrice = 0;
            return defaultData;
        }

        const headers = lines[0].split(',');
        const values = lines[1].split(','); // Assuming only one item ID is requested

        const marketData = {};
        headers.forEach((h, i) => {
            const value = values[i];
            if (h === 'id') {
                marketData[h] = parseInt(value, 10);
            } else if (h === 'last_updated') {
                marketData[h] = value || '-';
            } else if (['buy_price', 'sell_price', 'buy_quantity', 'sell_quantity'].includes(h)) {
                marketData[h] = value !== '' && value !== undefined ? parseInt(value, 10) : 0;
            } else { // For 1d_buy_sold etc.
                marketData[h] = value !== '' && value !== undefined ? parseInt(value, 10) : null;
            }
        });
        
        window._mainBuyPrice = marketData.buy_price || 0;
        window._mainSellPrice = marketData.sell_price || 0;

        if (id == 70820) {
            console.log('[DEBUG] MarketData para Esquirla de gloria (70820):', marketData);
        }
        return marketData;

    } catch (e) {
        console.error(`Failed to fetch or parse market data for item ${id}:`, e);
        const defaultData = {};
        fields.split(',').forEach(field => {
            if (field === 'id') defaultData[field] = id;
            else if (field === 'last_updated') defaultData[field] = '-';
            else if (['buy_price', 'sell_price', 'buy_quantity', 'sell_quantity'].includes(field)) defaultData[field] = 0;
            else defaultData[field] = null;
        });
        window._mainBuyPrice = 0;
        window._mainSellPrice = 0;
        return defaultData;
    }
}


async function prepareIngredientTreeData(mainItemId, mainRecipeData) {
    if (!mainRecipeData || !mainRecipeData.ingredients || mainRecipeData.ingredients.length === 0) {
        console.log("El ítem principal no tiene ingredientes o faltan datos de receta.");
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
            } else {
                 console.warn("CSV market data is empty or malformed for IDs:", Array.from(allItemIdsInTree).join(','));
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
                    subRecipeFullData.ingredients.map(subIng => buildTreeRecursive(subIng, subRecipeFullData.output_item_count || 1, ingredientRecipeInfo.item_id))
                );
                children = children.filter(c => c !== null); 
            }
        }
        
        return new CraftIngredient({
            id: itemDetail.id,
            name: itemDetail.name,
            icon: itemDetail.icon,
            count: ingredientRecipeInfo.count, // Cantidad necesaria para la receta padre
            parentMultiplier: currentParentMultiplier, // Output_count de la receta que produce este item
            buy_price: marketInfo.buy_price !== undefined ? marketInfo.buy_price : null,
            sell_price: marketInfo.sell_price !== undefined ? marketInfo.sell_price : null,
            crafted_price: null, 
            is_craftable: isCraftable,
            recipe: subRecipeFullData, 
            children: children,
            _parentId: parentId // Esencial para inputs únicos y sincronización
        });
    }

    let finalIngredientObjs = [];
    if (mainRecipeData && mainRecipeData.ingredients) {
        finalIngredientObjs = await Promise.all(
            mainRecipeData.ingredients.map(ing => buildTreeRecursive(ing, window._mainRecipeOutputCount, null)) // El parentMultiplier inicial es el output del item principal y parentId null
        ); // Primer nivel parentId = null
        finalIngredientObjs = finalIngredientObjs.filter(c => c !== null); 
    }
    
    finalIngredientObjs.forEach(ing => ing.recalc(window.globalQty)); // Usar globalQty para el recalculo inicial
    
    return finalIngredientObjs;
}


async function main() {
    if (isNaN(itemId)) {
        showError('ID de ítem no válido.');
        showLoader(false);
        return;
    }
    showLoader(true);
    hideError();

    try {
        const itemData = await fetchItemData(itemId);
        const marketInfo = await fetchMarketDataForItem(itemId);
        
        // Obtener datos de la receta si existe
        const recipeData = await fetchRecipeData(itemId);
        
        // Si hay datos de receta, agregar detalles de artesanía a itemData
        if (recipeData) {
            itemData.details = {
                disciplines: recipeData.disciplines || [],
                min_rating: recipeData.min_rating || 0,
                type: recipeData.type
            };
            console.log('Datos de artesanía agregados a itemData:', itemData.details);
            
            window.ingredientObjs = await prepareIngredientTreeData(itemId, recipeData);
        } else {
            console.log('No se encontraron datos de receta para el ítem');
            window.ingredientObjs = [];
            window._mainRecipeOutputCount = 1;
            itemData.details = { disciplines: [], min_rating: 0, type: null };
        }
        // Fuerza la asignación de _parentId en toda la estructura
        function assignParentIds(ings, parentId = null) {
            for (const ing of ings) {
                ing._parentId = parentId;
                if (Array.isArray(ing.children) && ing.children.length) {
                    assignParentIds(ing.children, ing.id);
                }
            }
        }
        assignParentIds(window.ingredientObjs);
        
        initItemUI(itemData, marketInfo); // Pasamos itemData y su marketInfo

    } catch (e) {
        console.error('Error en main:', e);
        showError(e.message || 'Ocurrió un error inesperado.');
    } finally {
        showLoader(false);
    }
}

// Iniciar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('[main.js] DOM cargado, iniciando aplicación...');
    main().catch(error => {
        console.error('Error en main():', error);
        showError('Error al cargar los datos del ítem');
    });
});

// Hook para cargar la sección de mejores horas y mercado automáticamente
if (typeof window.cargarMejoresHorasYMercado === 'function' && typeof itemId !== 'undefined' && itemId > 0) {
  window.cargarMejoresHorasYMercado(itemId);
}

