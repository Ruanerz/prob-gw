// Importamos las utilidades necesarias
import { isBasic3GenMaterial } from '../data/legendaryItems3gen.js';

/**
 * Clase que representa un ingrediente en el árbol de crafteo
 */
export class Ingredient {
  constructor(id, name, type, count = 1, parent = null) {
    this.id = id;
    this.name = name;
    this.type = type || 'crafting_material';
    this.count = count;
    this.parent = parent;
    this.components = [];
    this.icon = null;
    this.source = null;
    this._buyPrice = 0;
    this._sellPrice = 0;
    this._priceLoaded = false;
    
      // Generamos la URL del icono basada en el ID si no hay un icono definido
    // Esto se hace en el getter en lugar del constructor para asegurar que siempre tengamos la última versión
    Object.defineProperty(this, 'icon', {
      get() {
        return this._icon || this._generateIconUrl();
      },
      set(value) {
        this._icon = value;
      },
      enumerable: true,
      configurable: true
    });
  }
  
  /**
   * Genera una URL de icono basada en el ID del ítem
   * @returns {Promise<string>} URL del icono o URL por defecto si hay error
   */
  async _generateIconUrl() {
    // Si ya tenemos un ícono en caché, lo retornamos
    if (this._icon) {
      if (this._icon.startsWith('http')) return this._icon;
      return `https://render.guildwars2.com/file/${this._icon}`;
    }

    // Si no hay ID, retornamos el ícono por defecto
    if (!this.id) {
      return this._getDefaultIconUrl();
    }

    try {
      const itemData = await gw2API.getItemDetails(this.id);

      if (itemData && itemData.icon) {
        this._icon = itemData.icon;
        return this._formatIconUrl(this._icon);
      }

      return this._getDefaultIconUrl();
    } catch (error) {
      console.warn('No se pudo cargar el icono para el ítem', this.id, error);
      return this._getDefaultIconUrl();
    }
  }
  
  /**
   * Obtiene la URL del icono por defecto
   * @returns {string} URL del icono por defecto
   */
  _getDefaultIconUrl() {
    return 'https://render.guildwars2.com/file/0120CB0368B7953F0D3BD2A0C9100BCF0839FF4D/219035.png';
  }
  
  /**
   * Formatea una URL de icono, asegurando que sea una URL completa
   * @param {string} iconPath - Ruta o URL del icono
   * @returns {string} URL completa del icono
   */
  _formatIconUrl(iconPath) {
    if (!iconPath) return null;
    
    // Si ya es una URL completa
    if (iconPath.startsWith('http')) {
      return iconPath;
    }
    
    // Si comienza con 'file/', lo eliminamos para evitar duplicados
    const cleanPath = iconPath.startsWith('file/') 
      ? iconPath.substring(5) 
      : iconPath;
    
    // Aseguramos que no tenga una barra al inicio
    const normalizedPath = cleanPath.startsWith('/') 
      ? cleanPath.substring(1) 
      : cleanPath;
    
    return `https://render.guildwars2.com/file/${normalizedPath}`;
  }

  /**
   * Agrega un componente hijo
   */
  addComponent(component) {
    if (component) {
      this.components.push(component);
      component.parent = this;
    }
  }



  /**
   * Obtiene el precio de compra del ítem
   * @returns {number} Precio de compra en cobre
   */
  get buyPrice() {
    return this._buyPrice || 0;
  }

  /**
   * Obtiene el precio de venta del ítem
   * @returns {number} Precio de venta en cobre
   */
  get sellPrice() {
    return this._sellPrice || 0;
  }

  /**
   * Establece los precios del ítem
   * @param {number} buyPrice - Precio de compra en cobre
   * @param {number} sellPrice - Precio de venta en cobre
   */
  setPrices(buyPrice, sellPrice) {
    this._buyPrice = buyPrice || 0;
    this._sellPrice = sellPrice || 0;
    // Solo marcamos como "cargado" si al menos uno es mayor a cero
    this._priceLoaded = (this._buyPrice > 0 || this._sellPrice > 0);
    
    // Depuración para Vial de sangre espesa
    if (this.id === 24293) {
      console.log(`[DEBUG] setPrices para Vial de sangre espesa:`, {
        buyPrice: this._buyPrice,
        sellPrice: this._sellPrice,
        _priceLoaded: this._priceLoaded
      });
    }
  }

  /**
   * Verifica si el precio ya fue cargado
   * @returns {boolean} true si el precio ya fue cargado
   */
  isPriceLoaded() {
    // Depuración para Vial de sangre espesa
    if (this.id === 24293) {
      console.log(`[DEBUG] isPriceLoaded para Vial de sangre espesa:`, {
        _priceLoaded: this._priceLoaded,
        _buyPrice: this._buyPrice,
        _sellPrice: this._sellPrice,
        hasComponents: this.components.length > 0,
        stackTrace: new Error().stack
      });
    }
    return this._priceLoaded;
  }

  /**
   * Obtiene el precio total de compra (precio unitario * cantidad)
   * @returns {number} Precio total de compra en cobre
   */
  getTotalBuyPrice() {
    return this.buyPrice * this.count;
  }

  /**
   * Obtiene el precio total de venta (precio unitario * cantidad)
   * @returns {number} Precio total de venta en cobre
   */
  getTotalSellPrice() {
    return this.sellPrice * this.count;
  }

  /**
   * Calcula los totales de forma recursiva para este ingrediente y sus componentes
   * @returns {Object} Objeto con los totales de compra y venta
   */
  calculateTotals() {
    // Si no tiene componentes, devolvemos los precios directos
    if (!this.components || this.components.length === 0) {
      return {
        buy: this.getTotalBuyPrice(),
        sell: this.getTotalSellPrice(),
        isCraftable: this.isPriceLoaded()
      };
    }

    // Si tiene componentes, calculamos los totales recursivamente
    let totalBuy = 0;
    let totalSell = 0;
    let todosTienenPrecio = true;

    for (const componente of this.components) {
      const totalesComponente = componente.calculateTotals();
      
      // Sumar los precios de los componentes, considerando la cantidad
      totalBuy += totalesComponente.buy;
      totalSell += totalesComponente.sell;
      
      // Si algún componente no tiene precio, marcamos como no crafteable
      if (totalesComponente.buy <= 0 && totalesComponente.sell <= 0) {
        todosTienenPrecio = false;
      }
    }

    // Si todos los componentes tienen precio, actualizamos este ítem
    if (todosTienenPrecio && totalBuy > 0 && !this._priceLoaded) {
      this._buyPrice = totalBuy;
      this._sellPrice = totalSell;
      this._priceLoaded = true;
    }

    return {
      buy: this.getTotalBuyPrice(),
      sell: this.getTotalSellPrice(),
      isCraftable: todosTienenPrecio
    };
  }

  /**
   * Convierte el ingrediente a un objeto plano para serialización
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      count: this.count,
      buyPrice: this._buyPrice,
      sellPrice: this._sellPrice,
      icon: this.icon,
      source: this.source,
      components: this.components.map(c => c.toJSON())
    };
  }
}

/**
 * Crea un árbol de ingredientes a partir de los datos de un ítem
 */
export async function createIngredientTree(itemData, parent = null) {
  if (!itemData) return null;
  
  // Crear el ingrediente con los datos básicos
  const ingredient = new Ingredient(
    itemData.id,
    itemData.name,
    itemData.type,
    itemData.count || 1,
    parent
  );

  // Copiar propiedades adicionales
  if (itemData.icon) {
    // Si el icono ya es una URL completa, lo usamos directamente
    if (itemData.icon.startsWith('http') || itemData.icon.startsWith('//')) {
      ingredient.icon = itemData.icon;
    } 
    // Si es una ruta relativa, la convertimos a URL completa
    else {
      // Aseguramos que no tenga el prefijo 'file/' duplicado
      const cleanIconPath = itemData.icon.startsWith('file/') 
        ? itemData.icon.substring(5) 
        : itemData.icon;
      
      ingredient.icon = `https://render.guildwars2.com/file/${cleanIconPath}`;
    }
    console.log(`[DEBUG] Icono para ${ingredient.name}:`, ingredient.icon);
  }
  
  if (itemData.source) ingredient.source = itemData.source;

  // Lista de IDs que no deben buscar precios en el mercado
  const EXCLUDED_ITEM_IDS = [
    // Tercera generación
    97829,  // Bendición de la Emperatriz de Jade
    96137,  // Tributo dracónico
    20799,  // Esquirla de hematites
    19925,  // Esquirla de obsidiana
    20796,  // Cristal místico
    45178,  // Esencia de la suerte exótica
    73137,  // Cubo de energía oscura estabilizada
    71994,  // Bola de energía oscura
    95813,  // Reactivo hidrocatalítico
    79418,  // Piedra rúnica mística
    19675,  // Trébol místico
    
    // Materiales de Deldrimor
    45845,  // Filo para hacha de acero de Deldrimor
    45846,  // Filo para daga de acero de Deldrimor
    45852,  // Cabeza para maza de acero de Deldrimor
    45833,  // Cañón para pistola de acero de Deldrimor
    45885,  // Núcleo para cetro de madera espiritual
    45848,  // Filo para espada de acero de Deldrimor
    45884,  // Núcleo para foco de madera espiritual
    45858,  // Umbo para escudo de acero de Deldrimor
    45838,  // Cabezal para antorcha de acero de Deldrimor
    45839,  // Cuerno de acero de Deldrimor
    45847,  // Filo para mandoble de acero de Deldrimor
    45851,  // Cabeza para martillo de acero de Deldrimor
    45841,  // Duela para arco largo de madera espiritual
    45834,  // Cañón para rifle de acero de Deldrimor
    45842,  // Duela para arco corto de madera espiritual
    45887,  // Cabezal para báculo de madera espiritual
    
    // Poemas
    97160,  // Poema sobre hachas
    96187,  // Poema sobre dagas
    96035,  // Poema sobre mazas
    95809,  // Poema sobre pistolas
    96173,  // Poema sobre cetros
    97335,  // Poema sobre espadas
    96951,  // Poema sobre focos
    95740,  // Poema sobre escudos
    97257,  // Poema sobre antorchas
    96341,  // Poema sobre cuernos de guerra
    96036,  // Poema sobre mandobles
    97082,  // Poema sobre martillos
    97800,  // Poema sobre arcos largos
    97201,  // Poema sobre rifles
    96849,  // Poema sobre arcos cortos
    95962   // Poema sobre bastones
  ];

  // Función para verificar si un ítem debe ser excluido de la búsqueda de precios
  const shouldSkipMarketCheck = (id, name) => {
    // Verificar por ID
    if (EXCLUDED_ITEM_IDS.includes(id)) {
      console.log(`[DEBUG] Excluyendo ${name} (${id}) por ID`);
      return true;
    }
    
    // Verificar por nombre (para items que podrían no estar en la lista)
    if (name) {
      const lowerName = name.toLowerCase();
      // Excluir 'esquirla' excepto 'Esquirla de gloria' (ID 70820)
      if (lowerName.includes('esquirla') && id !== 70820) return true;
      if (lowerName.includes('trébol')) return true;
      if (lowerName.includes('trebol')) return true;
      if (lowerName.includes('piedra')) return true;
      if (lowerName.includes('bendición')) return true;
      if (lowerName.includes('tributo')) return true;
      if (lowerName.includes('esencia')) return true;
      if (lowerName.includes('energía')) return true;
      if (lowerName.includes('energia')) return true;
      if (lowerName.includes('reactivo')) return true;
      if (lowerName.startsWith('don de')) return true;
      if (lowerName.includes(' gift')) return true;
      if (lowerName.endsWith('gift')) return true;
      return false;
    }
    
    return false;
  };

  // Precios fijos para ciertos ítems
  if (ingredient.id === 79418) {  // Piedra rúnica mística
    // Precio fijo: 1g (10000 cobre)
    ingredient.setPrices(10000, 10000);
    console.log(`Precio fijo establecido para ${ingredient.name}: 1g`);
  }
  // Manejo específico para Piedra imán dracónica amalgamada
  else if (ingredient.id === 92687 || ingredient.id === 96978) {
    const itemId = ingredient.id;
    const itemName = ingredient.name;
    
    console.log(`[DEBUG] Procesando ${itemName} (${itemId})`);
    
    // Forzar la carga de precios para este ítem
    try {
      const prices = await gw2API.getItemPrices(itemId);

      if (prices && prices.sells && prices.buys) {
        console.log(`[DEBUG] Precios para ${itemName}:`, prices);
        ingredient.setPrices(prices.sells.unit_price, prices.buys.unit_price);
      } else {
        console.log(`[INFO] ${itemName} no tiene precios en el mercado`);
        ingredient.setPrices(0, 0);
      }
    } catch (error) {
      console.warn(`[ERROR] Error al cargar precios para ${itemName}:`, error.message);
      ingredient.setPrices(0, 0);
    }
    return ingredient; // Retornar después del manejo personalizado
  }
  // Cargar precios para materiales básicos que no estén en la lista de exclusión
  else if (isBasic3GenMaterial(ingredient.id) && !shouldSkipMarketCheck(ingredient.id, ingredient.name)) {
    // Verificar si es un "Don de" o similar que no tiene precios en el mercado
    if (ingredient.name.toLowerCase().startsWith('don de') || 
        ingredient.name.toLowerCase().includes('gift')) {
      console.log(`[INFO] Ignorando búsqueda de precios para ${ingredient.name} (${ingredient.id}) - No comerciable`);
      ingredient.setPrices(0, 0);
    } else {
      console.log(`[DEBUG] Buscando precios para: ${ingredient.name} (${ingredient.id})`);
      
      try {
        const prices = await gw2API.getItemPrices(ingredient.id);

        if (prices && prices.sells && prices.buys) {
          console.log(`[DEBUG] Precios encontrados para ${ingredient.name}:`, prices);
          ingredient.setPrices(prices.sells.unit_price, prices.buys.unit_price);
        } else {
          console.log(`[INFO] El ítem ${ingredient.name} (${ingredient.id}) no está en el mercado`);
          ingredient.setPrices(0, 0);
        }
      } catch (error) {
        console.warn(`[ERROR] Error al cargar precios para ${ingredient.name} (${ingredient.id}):`, error.message);
        ingredient.setPrices(0, 0);
      }
    }
  }

  // Procesar componentes hijos si existen
  if (itemData.components && Array.isArray(itemData.components)) {
    for (const componentData of itemData.components) {
      const child = await createIngredientTree(componentData, ingredient);
      if (child) {
        ingredient.addComponent(child);
      }
    }
  }

  return ingredient;
}

// Importamos la API para usarla en esta función
import { gw2API } from '../services/GuildWars2API.js';
