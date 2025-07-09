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
      // Obtener los detalles del ítem utilizando el servicio con caché
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
    this._priceLoaded = true;
  }

  /**
   * Verifica si el precio ya fue cargado
   * @returns {boolean} true si el precio ya fue cargado
   */
  isPriceLoaded() {
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
        isCraftable: false
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
  }
  
  if (itemData.source) ingredient.source = itemData.source;

  // Lista de IDs que no deben buscar precios en el mercado
  // Se excluyen materiales de cuenta, no comerciables o con precios especiales
  const EXCLUDED_ITEM_IDS = [
    // Materiales de cuenta o con precios especiales
    20799,  // Esquirla de hematites (vinculado a la cuenta)
    20797,  // Otra variante de Esquirla de hematites
    19675,  // Trébol místico (vinculado a la cuenta)
    19925,  // Esquirla de obsidiana (precio especial)
    20796,  // Piedra filosofal (precio especial)
    
    // Materiales de tercera generación que no son comerciables
    97829,  // Bendición de la Emperatriz de Jade
    96137,  // Tributo dracónico
    45178,  // Esencia de la suerte exótica
    73137,  // Cubo de energía oscura estabilizada
    71994,  // Bola de energía oscura
    95813,  // Reactivo hidrocatalítico
    79418   // Piedra rúnica mística
  ];

  // Función para verificar si un ítem debe ser excluido de la búsqueda de precios
  const shouldSkipMarketCheck = (id, name) => {
    // Verificar por ID
    if (EXCLUDED_ITEM_IDS.includes(id)) {
      return true;
    }
    
    // Verificar por nombre (solo para ítems que no son comerciables)
    if (name) {
      const lowerName = name.toLowerCase();
      return lowerName.includes('bendición') ||
             lowerName.includes('tributo') ||
             lowerName.includes('esencia de la suerte') ||
             lowerName.includes('reactivo') ||
             lowerName.startsWith('don de') || 
             lowerName.endsWith('gift');
    }
    
    return false;
  };

  // Cargar precios para materiales básicos que no estén en la lista de exclusión
  if (ingredient.id === 19676) {
    // Precio fijo para 'Piedra rúnica helada': 1g (10000 cobre)
    ingredient.setPrices(10000, 10000);
  } else if (isBasicMaterial(ingredient.id) && !shouldSkipMarketCheck(ingredient.id, ingredient.name)) {
    try {
      const prices = await gw2API.getItemPrices(ingredient.id);
      if (prices && prices.sells && prices.buys) {
        ingredient.setPrices(prices.sells.unit_price, prices.buys.unit_price);
      } else {
        console.warn(`Precios no disponibles para ${ingredient.name} (${ingredient.id})`);
        ingredient.setPrices(0, 0);
      }
    } catch (error) {
      // Si la API devuelve un error (por ejemplo, 404), asumimos que no hay precios
      console.warn(`Error al cargar precios para ${ingredient.name} (${ingredient.id}):`, error.message);
      ingredient.setPrices(0, 0);
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
import { isBasicMaterial } from '../data/legendaryItems1gen.js';
