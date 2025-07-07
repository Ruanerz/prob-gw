class GW2API {
    static async getItems() {
        try {
            // Primero, obtener la lista de IDs de ítems
            const idsResponse = await fetch('https://api.guildwars2.com/v2/items?page=0&page_size=100');
            
            if (!idsResponse.ok) {
                throw new Error(`Error al cargar IDs de ítems: ${idsResponse.status} ${idsResponse.statusText}`);
            }

            const itemIds = await idsResponse.json();
            
            if (!Array.isArray(itemIds) || itemIds.length === 0) {
                throw new Error('No se encontraron IDs de ítems');
            }

            // Tomar solo los primeros 50 ítems para la búsqueda inicial
            const searchItemIds = itemIds.slice(0, 50);
            
            // Obtener detalles de los ítems
            const itemsResponse = await fetch(
                `https://api.guildwars2.com/v2/items?ids=${searchItemIds.join(',')}&lang=es`
            );
            
            if (!itemsResponse.ok) {
                throw new Error(`Error al cargar detalles de ítems: ${itemsResponse.status} ${itemsResponse.statusText}`);
            }

            let items = await itemsResponse.json();
            
            // Formatear los ítems para que coincidan con la estructura esperada
            items = items.map(item => ({
                id: item.id,
                name_es: item.name || 'Sin nombre',
                buy_price: 0, // Estos valores se actualizarán con datos del mercado
                sell_price: 0,
                icon: item.icon || ''
            }));

            // Guardar en caché
            sessionStorage.setItem('gw2_items', JSON.stringify({
                data: items,
                timestamp: Date.now()
            }));

            return items;
        } catch (error) {
            console.error('Error en getItems:', error);
            // Intentar cargar de caché si existe
            const cachedData = sessionStorage.getItem('gw2_items');
            if (cachedData) {
                const { data } = JSON.parse(cachedData);
                return data;
            }
            throw error;
        }
    }

    static async getItemDetails(itemId) {
        try {
            const response = await fetch(
                `https://api.guildwars2.com/v2/items/${itemId}`
            );
            
            if (!response.ok) {
                throw new Error(`Error al cargar detalles del ítem: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            // Verificar que los datos son válidos
            if (!data || typeof data !== 'object') {
                throw new Error('Los datos del ítem no son válidos');
            }

            // Guardar en caché
            sessionStorage.setItem(`gw2_item_${itemId}`, JSON.stringify({
                data,
                timestamp: Date.now()
            }));

            return data;
        } catch (error) {
            console.error('Error en getItemDetails:', error);
            // Intentar cargar de caché si existe
            const cachedData = sessionStorage.getItem(`gw2_item_${itemId}`);
            if (cachedData) {
                const { data } = JSON.parse(cachedData);
                return data;
            }
            throw error;
        }
    }

    static async getMarketData(itemId) {
        try {
            const response = await fetch(
                `https://api.guildwars2.com/v2/commerce/listings/${itemId}`
            );
            
            if (!response.ok) {
                throw new Error(`Error al cargar datos del mercado: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            // Verificar que los datos son válidos
            if (!data || typeof data !== 'object') {
                throw new Error('Los datos del mercado no son válidos');
            }

            // Guardar en caché
            sessionStorage.setItem(`gw2_market_${itemId}`, JSON.stringify({
                data,
                timestamp: Date.now()
            }));

            return data;
        } catch (error) {
            console.error('Error en getMarketData:', error);
            // Intentar cargar de caché si existe
            const cachedData = sessionStorage.getItem(`gw2_market_${itemId}`);
            if (cachedData) {
                const { data } = JSON.parse(cachedData);
                return data;
            }
            throw error;
        }
    }

    static async getRecipes() {
        try {
            const response = await fetch(
                'https://api.guildwars2.com/v2/recipes'
            );
            
            if (!response.ok) {
                throw new Error(`Error al cargar recetas: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            // Verificar que los datos son válidos
            if (!Array.isArray(data)) {
                throw new Error('Los datos de recetas no son válidos');
            }

            // Guardar en caché
            sessionStorage.setItem('gw2_recipes', JSON.stringify({
                data,
                timestamp: Date.now()
            }));

            return data;
        } catch (error) {
            console.error('Error en getRecipes:', error);
            // Intentar cargar de caché si existe
            const cachedData = sessionStorage.getItem('gw2_recipes');
            if (cachedData) {
                const { data } = JSON.parse(cachedData);
                return data;
            }
            throw error;
        }
    }

    static async getRecipeDetails(recipeId) {
        try {
            const response = await fetch(
                `https://api.guildwars2.com/v2/recipes/${recipeId}`
            );
            
            if (!response.ok) {
                throw new Error(`Error al cargar detalles de la receta: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            // Verificar que los datos son válidos
            if (!data || typeof data !== 'object') {
                throw new Error('Los datos de la receta no son válidos');
            }

            // Guardar en caché
            sessionStorage.setItem(`gw2_recipe_${recipeId}`, JSON.stringify({
                data,
                timestamp: Date.now()
            }));

            return data;
        } catch (error) {
            console.error('Error en getRecipeDetails:', error);
            // Intentar cargar de caché si existe
            const cachedData = sessionStorage.getItem(`gw2_recipe_${recipeId}`);
            if (cachedData) {
                const { data } = JSON.parse(cachedData);
                return data;
            }
            throw error;
        }
    }

    static async getItemIcon(itemId) {
        try {
            const response = await fetch(
                `https://render.guildwars2.com/file/${itemId}.png`
            );
            
            if (!response.ok) {
                throw new Error(`Error al cargar ícono: ${response.status} ${response.statusText}`);
            }

            const blob = await response.blob();
            const base64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });

            // Guardar en caché
            sessionStorage.setItem(`image:${itemId}`, base64);

            return base64;
        } catch (error) {
            console.error('Error en getItemIcon:', error);
            // Intentar cargar de caché si existe
            return sessionStorage.getItem(`image:${itemId}`) || null;
        }
    }

    static async getWikiLinks(itemName) {
        try {
            const name = encodeURIComponent(itemName);
            return {
                es: `https://wiki.guildwars2.com/wiki/${name}`,
                en: `https://wiki-en.guildwars2.com/wiki/${name}`
            };
        } catch (error) {
            console.error('Error en getWikiLinks:', error);
            return null;
        }
    }
}
