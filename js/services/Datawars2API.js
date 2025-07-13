/**
 * Servicio para obtener precios de items desde Datawars2
 */
class Datawars2API {
  constructor() {
    this.BASE_URL = 'https://api.datawars2.ie/gw2/v1';
    this.ITEMS_ENDPOINT = `${this.BASE_URL}/items/csv?fields=id,buy_price,sell_price&ids=`;
    this.CACHE_PREFIX = 'dw2_api_cache_';
    this.CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 horas
  }

  /**
   * Realiza una petición con soporte de caché
   * @param {string} url
   * @param {boolean} useCache
   * @returns {Promise<string>} Respuesta de la petición
   */
  async _fetchWithCache(url, useCache = true) {
    const cacheKey = this.CACHE_PREFIX + btoa(url);
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
        console.warn('[Datawars2API] Error leyendo caché', e);
      }
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    try {
      localStorage.setItem(cacheKey, JSON.stringify({ data: text, timestamp: Date.now() }));
    } catch (e) {
      console.warn('[Datawars2API] No se pudo guardar en caché', e);
    }
    return text;
  }

  /**
   * Parsea CSV simple a objeto con buy_price y sell_price
   * @param {string} csvText
   */
  _parseCsv(csvText) {
    const [headersLine, valuesLine] = csvText.trim().split('\n');
    const headers = headersLine.split(',');
    const values = valuesLine.split(',');
    const obj = {};
    headers.forEach((h, i) => {
      const val = values[i];
      obj[h] = val !== '' && val !== undefined ? val : '';
    });
    return obj;
  }

  /**
   * Obtiene los precios de un item
   * @param {number} itemId
   */
  async getItemPrices(itemId) {
    if (!itemId) return { buys: { unit_price: 0 }, sells: { unit_price: 0 } };
    const url = `${this.ITEMS_ENDPOINT}${itemId}`;
    try {
      const csvText = await this._fetchWithCache(url);
      const data = this._parseCsv(csvText);
      const buy = parseInt(data.buy_price || '0', 10);
      const sell = parseInt(data.sell_price || '0', 10);
      return { buys: { unit_price: buy || 0 }, sells: { unit_price: sell || 0 } };
    } catch (e) {
      console.error(`[Datawars2API] Error obteniendo precios para ${itemId}`, e);
      return { buys: { unit_price: 0 }, sells: { unit_price: 0 } };
    }
  }

  /**
   * Limpia la caché de este servicio
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
      console.error('[Datawars2API] Error limpiando caché', e);
      return false;
    }
  }
}

export const dw2API = new Datawars2API();
