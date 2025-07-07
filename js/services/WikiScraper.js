/**
 * Servicio para hacer scraping de la wiki de Guild Wars 2
 * y extraer información detallada de ítems legendarios y sus componentes
 */

export class WikiScraper {
  constructor() {
    this.baseUrl = 'https://wiki-es.guildwars2.com';
    this.cache = new Map();
  }

  /**
   * Obtiene el ID de un ítem desde su URL de la wiki
   * @param {string} url - URL de la página del ítem en la wiki
   * @returns {Promise<number|null>} ID del ítem o null si no se pudo obtener
   */
  async getItemIdFromWikiUrl(url) {
    try {
      // Si la URL ya tiene un ID de API, lo extraemos directamente
      const apiIdMatch = url.match(/api=item&id=(\d+)/);
      if (apiIdMatch && apiIdMatch[1]) {
        return parseInt(apiIdMatch[1], 10);
      }

      // Si no, hacemos scraping de la página para encontrar el ID
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Error al cargar la página: ${url}`, response.status);
        return null;
      }

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Buscamos el enlace de la API que contiene el ID del ítem
      const apiLink = doc.querySelector('a[href*="api=item"]');
      if (apiLink) {
        const href = apiLink.getAttribute('href');
        const match = href.match(/id=(\d+)/);
        if (match && match[1]) {
          return parseInt(match[1], 10);
        }
      }

      // Si no encontramos el enlace de la API, intentamos extraer el ID de los datos de la página
      const scriptTags = doc.querySelectorAll('script');
      for (const script of scriptTags) {
        const content = script.textContent || '';
        const idMatch = content.match(/"item_id"\s*:\s*(\d+)/);
        if (idMatch && idMatch[1]) {
          return parseInt(idMatch[1], 10);
        }
      }

      console.warn('No se pudo encontrar el ID del ítem en la página:', url);
      return null;
    } catch (error) {
      console.error('Error al obtener el ID del ítem:', error);
      return null;
    }
  }

  /**
   * Obtiene los componentes de un ítem legendario desde la wiki
   * @param {string} itemName - Nombre del ítem legendario
   * @returns {Promise<Object|null>} Datos del ítem con sus componentes o null si hay error
   */
  async getLegendaryItemComponents(itemName) {
    const url = `${this.baseUrl}/wiki/${encodeURIComponent(itemName)}`;
    
    try {
      // Verificar caché primero
      if (this.cache.has(url)) {
        return this.cache.get(url);
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error al cargar la página: ${response.status}`);
      }

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Extraer el ID del ítem
      const itemId = await this.getItemIdFromWikiUrl(url);
      if (!itemId) {
        throw new Error('No se pudo obtener el ID del ítem');
      }

      // Extraer la sección de componentes
      const componentsSection = doc.querySelector('span#Componentes')?.parentElement?.nextElementSibling;
      if (!componentsSection) {
        throw new Error('No se encontró la sección de componentes');
      }

      // Procesar los componentes
      const components = [];
      const componentLinks = componentsSection.querySelectorAll('a');
      
      for (const link of componentLinks) {
        const componentUrl = new URL(link.href, this.baseUrl).toString();
        const componentId = await this.getItemIdFromWikiUrl(componentUrl);
        
        if (componentId) {
          components.push({
            id: componentId,
            name: link.textContent.trim(),
            url: componentUrl,
            count: 1 // Por defecto, asumimos 1, pero podríamos extraer la cantidad si está disponible
          });
        }
      }

      // Crear el objeto del ítem con sus componentes
      const itemData = {
        id: itemId,
        name: itemName,
        type: 'legendary',
        url: url,
        components: components
      };

      // Guardar en caché
      this.cache.set(url, itemData);
      
      return itemData;
      
    } catch (error) {
      console.error(`Error al obtener componentes de ${itemName}:`, error);
      return null;
    }
  }

  /**
   * Obtiene información detallada de un ítem desde la wiki
   * @param {string} itemName - Nombre del ítem
   * @returns {Promise<Object|null>} Datos del ítem o null si hay error
   */
  async getItemInfo(itemName) {
    const url = `${this.baseUrl}/wiki/${encodeURIComponent(itemName)}`;
    
    try {
      // Verificar caché primero
      if (this.cache.has(url)) {
        return this.cache.get(url);
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error al cargar la página: ${response.status}`);
      }

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Extraer el ID del ítem
      const itemId = await this.getItemIdFromWikiUrl(url);
      if (!itemId) {
        throw new Error('No se pudo obtener el ID del ítem');
      }

      // Extraer información básica
      const itemData = {
        id: itemId,
        name: itemName,
        url: url,
        icon: this.extractIconUrl(doc),
        type: this.extractItemType(doc),
        rarity: this.extractRarity(doc),
        level: this.extractLevel(doc),
        description: this.extractDescription(doc),
        details: this.extractDetails(doc)
      };

      // Guardar en caché
      this.cache.set(url, itemData);
      
      return itemData;
      
    } catch (error) {
      console.error(`Error al obtener información de ${itemName}:`, error);
      return null;
    }
  }

  // Métodos auxiliares para extraer información específica de la página
  
  extractIconUrl(doc) {
    const iconImg = doc.querySelector('.infobox-image img');
    return iconImg ? iconImg.src : null;
  }
  
  extractItemType(doc) {
    const typeElement = doc.querySelector('th:contains("Tipo")')?.nextElementSibling;
    return typeElement ? typeElement.textContent.trim() : 'unknown';
  }
  
  extractRarity(doc) {
    const rarityElement = doc.querySelector('th:contains("Rareza")')?.nextElementSibling;
    return rarityElement ? rarityElement.textContent.trim().toLowerCase() : 'basic';
  }
  
  extractLevel(doc) {
    const levelElement = doc.querySelector('th:contains("Nivel")')?.nextElementSibling;
    return levelElement ? parseInt(levelElement.textContent.trim(), 10) : 0;
  }
  
  extractDescription(doc) {
    const descElement = doc.querySelector('.infobox-description');
    return descElement ? descElement.textContent.trim() : '';
  }
  
  extractDetails(doc) {
    const details = {};
    const rows = doc.querySelectorAll('.infobox tr');
    
    rows.forEach(row => {
      const th = row.querySelector('th');
      const td = row.querySelector('td');
      
      if (th && td) {
        const key = th.textContent.trim().toLowerCase().replace(/\s+/g, '_');
        details[key] = td.textContent.trim();
      }
    });
    
    return details;
  }
}

// Exportar una instancia global del scraper
export const wikiScraper = new WikiScraper();
