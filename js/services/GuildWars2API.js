/**
 * Servicio para interactuar con la API de Guild Wars 2
 */
class GuildWars2API {
  constructor() {
    this.BASE_URL = 'https://api.guildwars2.com/v2';
    this.ITEMS_ENDPOINT = `${this.BASE_URL}/items`;
    this.PRICES_ENDPOINT = `${this.BASE_URL}/commerce/prices`;
    this.RECIPES_ENDPOINT = `${this.BASE_URL}/recipes/search`;
    this.ITEMS_BULK_ENDPOINT = `${this.BASE_URL}/items?ids=`;
    
    // Configuración de caché
    this.CACHE_PREFIX = 'gw2_api_cache_';
    this.CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
  }

  /**
   * Realiza una petición a la API con manejo de caché
   */
  async _fetchWithCache(url, useCache = true) {
    const cacheKey = this.CACHE_PREFIX + btoa(url);
    
    // Intentar obtener de caché
    if (useCache) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < this.CACHE_DURATION) {
            return data;
          }
        }
      } catch (e) {
        console.warn('Error al leer de caché:', e);
      }
    }

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Guardar en caché
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn('No se pudo guardar en caché:', e);
      }
      
      return data;
    } catch (error) {
      console.error('Error en la petición a la API:', error);
      throw error;
    }
  }

  /**
   * Obtiene los precios de un ítem
   */
  async getItemPrices(itemId) {
    const url = `${this.PRICES_ENDPOINT}/${itemId}`;
    return this._fetchWithCache(url);
  }

  /**
   * Obtiene los detalles de un ítem
   */
  async getItemDetails(itemId) {
    try {
      const url = `${this.ITEMS_ENDPOINT}/${itemId}?lang=es`;
      const item = await this._fetchWithCache(url);
      
      if (!item) {
        console.warn(`[getItemDetails] No se encontró el ítem con ID: ${itemId}`);
        return null;
      }
      
      // Registrar información de depuración
      console.log(`[getItemDetails] Procesando ítem: ${item.name} (${itemId})`);
      
      // Si el ítem tiene un icono, lo normalizamos
      if (item.icon) {
        console.log(`[getItemDetails] Icono original para ${itemId}:`, item.icon);
        
        // Si el icono ya es una URL completa, lo dejamos igual
        if (item.icon.startsWith('http')) {
          console.log(`[getItemDetails] Usando URL de icono completa: ${item.icon}`);
        } 
        // Si es una ruta relativa, la convertimos a URL completa
        else {
          // Eliminar cualquier prefijo 'file/' o '/' duplicado
          const cleanPath = item.icon
            .replace(/^file\//, '')  // Eliminar 'file/' al inicio
            .replace(/^\//, '');     // Eliminar '/' al inicio
            
          item.icon = `https://render.guildwars2.com/file/${cleanPath}`;
          console.log(`[getItemDetails] URL de icono normalizada: ${item.icon}`);
        }
      } else {
        // Si no hay icono, intentamos usar el ID del ítem
        console.warn(`[getItemDetails] El ítem ${itemId} no tiene icono definido`);
        item.icon = `https://render.guildwars2.com/file/${itemId}.png`;
      }
      
      return item;
      
    } catch (error) {
      console.error(`[getItemDetails] Error al obtener detalles del ítem ${itemId}:`, error);
      
      // Si hay un error, devolvemos un objeto con la información básica
      return {
        id: itemId,
        name: `Item ${itemId}`,
        icon: 'https://render.guildwars2.com/file/0120CB0368B7953F0D3BD2A0C9100BCF0839FF4D/219035.png',
        error: error.message
      };
    }
  }

  /**
   * Obtiene múltiples ítems por sus IDs
   */
  async getItemsBulk(itemIds) {
    if (!itemIds || !itemIds.length) return [];
    const idsParam = itemIds.join(',');
    const url = `${this.ITEMS_BULK_ENDPOINT}${idsParam}`;
    return this._fetchWithCache(url);
  }

  /**
   * Busca recetas que usan un ítem específico
   */
  async findRecipesForItem(itemId) {
    const url = `${this.RECIPES_ENDPOINT}?output=${itemId}`;
    const recipeIds = await this._fetchWithCache(url);
    
    if (!recipeIds || !recipeIds.length) return [];
    
    // Obtener detalles de las recetas
    const recipesUrl = `${this.BASE_URL}/recipes?ids=${recipeIds.join(',')}`;
    return this._fetchWithCache(recipesUrl);
  }

  /**
   * Limpia la caché de la API
   */
  clearCache() {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (e) {
      console.error('Error al limpiar la caché:', e);
      return false;
    }
  }
}

export const gw2API = new GuildWars2API();
