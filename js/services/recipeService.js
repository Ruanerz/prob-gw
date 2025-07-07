// Servicio para manejar las llamadas a la API de recetas v2

const API_BASE_URL = 'https://api.guildwars2.com/v2';

// Cache para almacenar respuestas y evitar peticiones duplicadas
const cache = {
    recipes: new Map(),
    items: new Map()
};

/**
 * Obtiene las recetas para un ítem específico
 * @param {number} itemId - ID del ítem
 * @returns {Promise<Array>} - Lista de recetas
 */
window.getRecipesForItem = async function(itemId) {
    if (!itemId) {
        console.error('[ERROR] ID de ítem no proporcionado');
        return [];
    }

    const cacheKey = `item_${itemId}`;
    if (cache.recipes.has(cacheKey)) {
        return cache.recipes.get(cacheKey) || [];
    }

    try {
        const response = await fetch(`${API_BASE_URL}/recipes/search?output=${itemId}`);
        
        if (!response.ok) {
            return [];
        }
        
        const recipeIds = await response.json();
        if (!recipeIds || !Array.isArray(recipeIds) || recipeIds.length === 0) {
            return [];
        }
        const recipes = (await Promise.all(
            recipeIds.map(id => getRecipeDetails(id))
        )).filter(recipe => recipe !== null); // Filtrar recetas nulas
        
        if (recipes.length > 0) {
            cache.recipes.set(cacheKey, recipes);
        }
        return recipes;
    } catch (error) {
        console.error(`[ERROR] Error en getRecipesForItem para ítem ${itemId}:`, error);
        return [];
    }
}

/**
 * Obtiene los detalles de una receta específica
 * @param {number} recipeId - ID de la receta
 * @returns {Promise<Object>} - Detalles de la receta
 */
window.getRecipeDetails = async function(recipeId) {
    if (cache.recipes.has(recipeId)) {
        return cache.recipes.get(recipeId);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}`);
        if (!response.ok) {
            return null;
        }
        
        const recipe = await response.json();
        if (!recipe) {
            return null;
        }
        cache.recipes.set(recipeId, recipe);
        return recipe;
    } catch (error) {
        console.error('Error en getRecipeDetails:', error);
        return null;
    }
}

/**
 * Obtiene información detallada de un ítem
 * @param {number} itemId - ID del ítem
 * @returns {Promise<Object>} - Información del ítem
 */
window.getItemDetails = async function(itemId) {
    if (cache.items.has(itemId)) {
        return cache.items.get(itemId);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/items/${itemId}`);
        if (!response.ok) throw new Error('Ítem no encontrado');
        
        const item = await response.json();
        cache.items.set(itemId, item);
        return item;
    } catch (error) {
        console.error('Error en getItemDetails:', error);
        return null;
    }
}

/**
 * Obtiene los precios de un ítem usando la API CSV
 * @param {number} itemId - ID del ítem
 * @returns {Promise<Object>} - Precios de compra y venta
 */
window.getItemPrices = async function(itemId) {
    const csvUrl = `https://api.datawars2.ie/gw2/v1/items/csv?fields=id,buy_price,sell_price&ids=${itemId}`;
    try {
        const csvText = await fetch(csvUrl).then(r => {
            if (!r.ok) throw new Error(`Error ${r.status} obteniendo precios para item ${itemId}`);
            return r.text();
        });

        const [headers, values] = csvText.trim().split('\n').map(line => line.split(','));
        const data = {};
        headers.forEach((h, i) => {
            const value = values[i];
            if (h === 'id') {
                data[h] = parseInt(value, 10);
            } else if (['buy_price', 'sell_price'].includes(h)) {
                data[h] = value !== '' && value !== undefined ? parseInt(value, 10) : 0;
            } else {
                data[h] = value;
            }
        });

        return {
            buys: { unit_price: data.buy_price || 0 },
            sells: { unit_price: data.sell_price || 0 }
        };
    } catch (e) {
        console.error(`Error obteniendo datos de mercado para item ${itemId}`, e);
        return { buys: { unit_price: 0 }, sells: { unit_price: 0 } };
    }
};
