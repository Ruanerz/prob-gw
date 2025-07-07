import { getLegendary3GenItem, isLegendary3GenItem, isBasic3GenMaterial, LEGENDARY_ITEMS_3GEN } from './data/legendaryItems3gen.js';
import { createIngredientTree } from './utils/Ingredient3gen.js';
import { gw2API } from './services/GuildWars2API.js';
// formatGold está disponible globalmente

class LegendaryCraftingApp {
  constructor() {
    // Elementos del DOM
    this.craftingTreeEl = document.getElementById('craftingTreeThird');
    this.summaryEl = document.getElementById('summaryThird');
    this.summaryContentEl = document.getElementById('summaryContentThird');
    this.loadTreeBtn = document.getElementById('loadTreeThird');
    this.clearCacheBtn = document.getElementById('clearCacheThird');
    this.itemIdInput = document.getElementById('itemIdThird');
    this.maxDepthInput = document.getElementById('maxDepth');
    this.itemNameInput = document.getElementById('itemNameThird');
    
    // Botones de carga rápida
    this.quickLoadButtons = {
      'btnDesgarro': { id: 'btnDesgarro', itemId: '96937', itemName: 'Desgarro de Aurene' },
      'btnGarra': { id: 'btnGarra', itemId: '96203', itemName: 'Garra de Aurene' },
      'btnCola': { id: 'btnCola', itemId: '95612', itemName: 'Cola de Aurene' },
      'btnRazonamiento': { id: 'btnRazonamiento', itemId: '95808', itemName: 'Razonamiento de Aurene' },
      'btnSabiduria': { id: 'btnSabiduria', itemId: '96221', itemName: 'Sabiduría de Aurene' },
      'btnColmillo': { id: 'btnColmillo', itemId: '95675', itemName: 'Colmillo de Aurene' },
      'btnMirada': { id: 'btnMirada', itemId: '97165', itemName: 'Mirada de Aurene' },
      'btnEscama': { id: 'btnEscama', itemId: '96028', itemName: 'Escama de Aurene' },
      'btnAliento': { id: 'btnAliento', itemId: '97099', itemName: 'Aliento de Aurene' },
      'btnVoz': { id: 'btnVoz', itemId: '97783', itemName: 'Voz de Aurene' },
      'btnMordisco': { id: 'btnMordisco', itemId: '96356', itemName: 'Mordisco de Aurene' },
      'btnPeso': { id: 'btnPeso', itemId: '95684', itemName: 'Peso de Aurene' },
      'btnVuelo': { id: 'btnVuelo', itemId: '97590', itemName: 'Vuelo de Aurene' },
      'btnPersuasion': { id: 'btnPersuasion', itemId: '97377', itemName: 'Persuasión de Aurene' },
      'btnAla': { id: 'btnAla', itemId: '97077', itemName: 'Ala de Aurene' },
      'btnReflexion': { id: 'btnReflexion', itemId: '96652', itemName: 'Reflexión de Aurene' }
    };
    
    // Estado de la aplicación
    this.currentTree = null;
    this.isLoading = false;
    this.activeButton = null; // Track the currently active button
    
    // Vincular métodos
    this.calculateComponentsPrice = this.calculateComponentsPrice.bind(this);
    
    // Inicializar manejadores de eventos
    this.initializeEventListeners();
    
    // Mostrar mensaje de bienvenida
    this.craftingTreeEl.innerHTML = `
      <div style="text-align: center; padding: 40px 0; color: #ccc;">
       
        <p>Selecciona una legendaria de la lista superior para ver su árbol de crafteo</p>
      </div>
    `;
  }
  
  /**
   * Establece el botón activo
   * @param {HTMLElement} button - El botón que se activará
   * @private
   */
  _setActiveButton(button) {
    // Remover la clase 'active' de todos los botones
    document.querySelectorAll('.item-tab-btn-treeleg').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Si se proporciona un botón, añadir la clase 'active'
    if (button) {
      button.classList.add('active');
      this.activeButton = button;
    } else {
      this.activeButton = null;
    }
  }

  /**
   * Encuentra el ID del botón para un ID de ítem dado
   * @param {number|string} itemId - ID del ítem a buscar
   * @returns {string|null} ID del botón o null si no se encuentra
   * @private
   */
  _findButtonIdByItemId(itemId) {
    const itemIdStr = String(itemId);
    const buttonEntry = Object.entries(this.quickLoadButtons).find(
      ([_, data]) => data.itemId === itemIdStr
    );
    return buttonEntry ? buttonEntry[0] : null;
  }

  /**
   * Maneja el clic en un botón de carga rápida
   * @param {string} buttonId - ID del botón clickeado
   * @private
   */
  _handleQuickLoad(buttonId) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    
    const buttonData = this.quickLoadButtons[buttonId];
    if (!buttonData) return;
    
    // Actualizar los campos de entrada
    this.itemIdInput.value = buttonData.itemId;
    this.itemNameInput.value = buttonData.itemName;
    
    // Establecer el botón como activo
    this._setActiveButton(button);
    
    // Cargar el árbol
    this.loadTree();
  }

  /**
   * Inicializa los manejadores de eventos
   */
  initializeEventListeners() {
    // Cargar árbol al hacer clic en el botón
    this.loadTreeBtn.addEventListener('click', () => {
      this._setActiveButton(null); // Limpiar selección al cargar manualmente
      this.loadTree();
    });
    
    // Limpiar caché
    this.clearCacheBtn.addEventListener('click', () => {
      this.clearCache();
      this._setActiveButton(null);
    });
    
    // Cargar al presionar Enter en los campos de entrada
    const handleEnterKey = (e) => {
      if (e.key === 'Enter') {
        this._setActiveButton(null); // Limpiar selección al buscar manualmente
        this.loadTree();
      }
    };
    
    this.itemNameInput.addEventListener('keypress', handleEnterKey);
    this.itemIdInput.addEventListener('keypress', handleEnterKey);
    
    // Inicializar los botones de carga rápida
    Object.keys(this.quickLoadButtons).forEach(buttonId => {
      const button = document.getElementById(buttonId);
      if (button) {
        button.addEventListener('click', () => this._handleQuickLoad(buttonId));
      }
    });
  }
  
  /**
   * Carga el árbol de crafteo para un ítem
   */
  async loadTree() {
    const itemId = parseInt(this.itemIdInput.value);
    const itemName = this.itemNameInput?.value || '';
    
    if (!itemId && !itemName) {
      this.showError('Por favor ingresa un ID o nombre de ítem válido');
      return;
    }
    
    // Configurar el estado de carga inicial
    this.setLoading(true);
    this.craftingTreeEl.innerHTML = '<div class="loading">Cargando información del ítem...</div>';
    
    try {
      let itemData = null;
      
      // Primero intentamos por ID si está disponible
      if (itemId) {
        itemData = getLegendary3GenItem(itemId);
      }
      
      // Si no encontramos por ID, intentamos por nombre
      if (!itemData && itemName) {
        // Buscamos en los ítems legendarios por nombre
        const allItems = Object.values(LEGENDARY_ITEMS_3GEN);
        itemData = allItems.find(item => 
          item.name.toLowerCase() === itemName.toLowerCase()
        );
      }
      
      if (!itemData) {
        throw new Error(`No se encontró información local para el ítem: ${itemName || itemId}`);
      }
      
      // Actualizar el ID del ítem en el campo de entrada por si se cargó por nombre
      if (itemData.id) {
        this.itemIdInput.value = itemData.id;
        
        // Actualizar el botón activo basado en el ID del ítem
        const buttonId = this._findButtonIdByItemId(itemData.id);
        if (buttonId) {
          const button = document.getElementById(buttonId);
          this._setActiveButton(button);
        } else {
          // Si no se encuentra un botón correspondiente, limpiar la selección
          this._setActiveButton(null);
        }
      } else {
        // Si no hay ID, limpiar la selección
        this._setActiveButton(null);
      }
      
      // Mostrar mensaje de carga con loader animado
      this.craftingTreeEl.innerHTML = `
        <div class="loading" style="text-align: center; padding: 40px 0;">
          <div style="
            display: inline-block;
            width: 40px;
            height: 40px;
            border: 4px solid rgba(35, 42, 54, 0.3);
            border-top: 4px solid #eab308;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 15px;
          "></div>
          <div>Cargando precios de los materiales...</div>
        </div>`;
      
      // Crear árbol de ingredientes (esto ahora es asíncrono)
      this.currentTree = await createIngredientTree(itemData);
      
      // Renderizar árbol y esperar a que termine completamente
      await this.renderTree();
      
      // Mostrar resumen de costos
      this.renderSummary();
      
    } catch (error) {
      console.error('Error al cargar el árbol:', error);
      this.showError(`Error: ${error.message}`);
      this._setActiveButton(null);
    } finally {
      // Asegurarse de que el indicador de carga se oculte incluso si hay un error
      this.setLoading(false);
    }
  }
  
  /**
   * Renderiza el árbol de crafteo
   */
  async renderTree() {
    if (!this.currentTree) return Promise.resolve();
    
    this.craftingTreeEl.innerHTML = '<div class="loading">Cargando árbol de crafteo...</div>';
    
    try {
      // Limpiar el contenedor
      this.craftingTreeEl.innerHTML = '';
      
      // Renderizar el ingrediente raíz y esperar a que termine
      await this.renderIngredient(this.currentTree, this.craftingTreeEl);
      
      // Mostrar el resumen
      this.summaryEl.style.display = 'block';
      
      return Promise.resolve();
      
    } catch (error) {
      console.error('Error al renderizar el árbol de crafteo:', error);
      this.craftingTreeEl.innerHTML = `
        <div class="error">
          <p>Error al cargar el árbol de crafteo. Por favor, inténtalo de nuevo.</p>
          <button id="retry-load-tree" class="btn">Reintentar</button>
        </div>
      `;
      
      // Agregar manejador de eventos para el botón de reintentar
      const retryBtn = document.getElementById('retry-load-tree');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => this.loadTree());
      }
      
      return Promise.reject(error);
    }
  }
  
  /**
   * Renderiza un ingrediente y sus componentes
   */
  async renderIngredient(ingredient, container, depth = 0) {
    if (!ingredient) return Promise.resolve();
    
    // Textos personalizados para ítems específicos
    const customPriceTexts = [
      { 
        name: 'Don de exploración',
        display: 'Completar el mundo',
        keywords: ['don', 'exploración', 'exploracion']
      },
      { 
        name: 'Don de batalla',
        display: 'Ruta de recompensas del don de la batalla',
        keywords: ['don', 'batalla']
      },
      { 
        name: 'Esquirla de hematites',
        display: '200 Esquirlas espirituales',
        keywords: ['esquirla', 'hematites']
      },
      { 
        name: 'Esquirla de obsidiana',
        display: 'Por Karma y otros métodos',
        keywords: ['esquirla', 'obsidiana']
      }
    ];
    
    // Función para normalizar texto (eliminar tildes y convertir a minúsculas)
    const normalizeText = (text) => {
      if (!text) return '';
      return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    };
    
    // Buscar texto personalizado que coincida con el nombre del ingrediente
    let customPriceText = null;
    const normalizedIngredientName = normalizeText(ingredient.name || '');
    
    for (const item of customPriceTexts) {
      const nameMatch = normalizeText(item.name) === normalizedIngredientName;
      const keywordMatch = item.keywords.every(keyword => 
        normalizedIngredientName.includes(normalizeText(keyword))
      );
      
      if (nameMatch || keywordMatch) {
        customPriceText = item.display;
        console.log(`Encontrado texto personalizado para '${ingredient.name}':`, customPriceText);
        break;
      }
    }
    
    const itemEl = document.createElement('div');
    itemEl.className = 'tree-node';
    
    const hasChildren = ingredient.components && ingredient.components.length > 0;
    const isExpanded = depth < 2; // Expandir los primeros 2 niveles por defecto
    
    // Determinar la clase CSS según el tipo de ítem
    let itemClass = 'item-card-treeleg';
    if (ingredient.type?.includes('legendary')) itemClass += ' legendary';
    if (ingredient.type?.includes('precursor')) itemClass += ' precursor';
    if (ingredient.type === 'account_bound') itemClass += ' account-bound';
    
    // Obtener la URL del icono de forma asíncrona
    try {
      const iconUrl = await this.getIconUrl(ingredient);
      
      // Determinar si es un "Don", "Vial" (excepto viales comerciables) o "Estatua"
      const normalizedName = ingredient.name ? ingredient.name.toLowerCase() : '';
      const isDon = !customPriceText && normalizedName.includes('don');
      
      // Lista de viales que SÍ tienen precio y NO deben ser tratados como no comerciables
      const vialesConPrecio = [
        'vial de sangre poderosa',
        'vial de sangre potente',
        'vial de sangre fuerte',
        'vial de sangre',
        'vial de sangre débil'
      ];
      
      const isBasic = isBasic3GenMaterial(ingredient.id);
      const isVial = !customPriceText && 
                   normalizedName.includes('vial') && 
                   !vialesConPrecio.some(vial => normalizedName === vial) &&
                   !isBasic; // Si es material básico, nunca lo tratamos como vial especial
                   
      const isEstatua = !customPriceText && normalizedName.includes('estatua');
      const hasComponents = ingredient.components && ingredient.components.length > 0;
      
      // Calcular precios
      const price = ingredient.buyPrice || 0;
      let totalBuyPrice = 0;
      let totalSellPrice = 0;
      let showPrice = false;
      let priceTooltip = '';
      
      if (isDon || isVial || isEstatua) {
        // Para items "Don", "Vial" o "Estatua", verificar si tienen componentes con precio
        if (hasComponents) {
          // Calcular el precio total de los componentes
          const componentsPrices = this.calculateComponentsPrice(ingredient);
          if (componentsPrices.buy > 0 || componentsPrices.sell > 0) {
            totalBuyPrice = componentsPrices.buy;
            totalSellPrice = componentsPrices.sell;
            showPrice = true;
            
            const buyText = totalBuyPrice > 0 ? `Compra: ${formatGold(totalBuyPrice)}` : 'Compra: N/A';
            const sellText = totalSellPrice > 0 ? `Venta: ${formatGold(totalSellPrice)}` : 'Venta: N/A';
            priceTooltip = `${buyText} | ${sellText} (calculado de componentes)`;
          } else {
            priceTooltip = 'No comerciable';
          }
        } else {
          priceTooltip = 'No comerciable';
        }
      } else {
        // Para items normales, verificar si tienen precio o son legendarios
        const isLegendary = ingredient.type?.includes('legendary');
        const hasBuyPrice = ingredient.buyPrice > 0;
        const hasSellPrice = ingredient.sellPrice > 0;
        
        // Mostrar precio si es material básico, tiene precio cargado o es un ítem legendario con precio
        const isBasic = isBasic3GenMaterial(ingredient.id);
        const isLoaded = ingredient.isPriceLoaded();
        showPrice = isBasic || isLoaded || (isLegendary && (hasBuyPrice || hasSellPrice));
        
        // Depuración para Vial de sangre espesa
        if (ingredient.id == 24293) { // Usamos == en lugar de === para manejar tanto '24293' como 24293
          console.log('[DEBUG] Condiciones de precio para Vial de sangre espesa:', {
            id: ingredient.id,
            idType: typeof ingredient.id,
            isBasic,
            isLoaded,
            isLegendary,
            hasBuyPrice,
            hasSellPrice,
            showPrice,
            buyPrice: ingredient.buyPrice,
            sellPrice: ingredient.sellPrice,
            type: ingredient.type,
            ingredient: JSON.parse(JSON.stringify(ingredient)) // Copia simple del objeto
          });
          
          // Forzar mostrar el precio para depuración
          showPrice = true;
        }
                   
        totalBuyPrice = ingredient.getTotalBuyPrice();
        totalSellPrice = ingredient.getTotalSellPrice();
        
        // Si no tiene precio directo pero tiene componentes, calcular el precio de los componentes
        if ((!hasBuyPrice || !hasSellPrice) && hasComponents) {
          const componentsPrices = this.calculateComponentsPrice(ingredient);
          if (!hasBuyPrice && componentsPrices.buy > 0) {
            totalBuyPrice = componentsPrices.buy;
          }
          if (!hasSellPrice && componentsPrices.sell > 0) {
            totalSellPrice = componentsPrices.sell;
          }
        }
        
        if ((ingredient.isPriceLoaded() || isLegendary || hasComponents) && (totalBuyPrice > 0 || totalSellPrice > 0)) {
          const buyText = totalBuyPrice > 0 ? `Compra: ${formatGold(totalBuyPrice)}` : 'Compra: N/A';
          const sellText = totalSellPrice > 0 ? `Venta: ${formatGold(totalSellPrice)}` : 'Venta: N/A';
          priceTooltip = `${buyText} | ${sellText}${(!hasBuyPrice || !hasSellPrice) && hasComponents ? ' (calculado de componentes)' : ''}`;
        } else if (hasComponents) {
          priceTooltip = 'Precio calculado de los componentes';
        } else {
          priceTooltip = 'Precio no disponible';
        }
      }
      
      itemEl.innerHTML = `
        <div class="${itemClass}">
          ${hasChildren ? `
            <button class="toggle-children" data-expanded="${isExpanded}">
              ${isExpanded ? '−' : '+'}
            </button>
          ` : '<div style="width: 24px;"></div>'}
          
          <img class="item-icon" 
               src="${iconUrl}" 
               alt="${ingredient.name || 'Ítem sin nombre'}" 
               title="${ingredient.name || 'Ítem sin nombre'}" 
               onerror="this.onerror=null; this.src='${this._getDefaultIconUrl()}';">
          
          <div class="item-name">${ingredient.name || 'Ítem sin nombre'}</div>
          
          <div class="item-details">
            ${ingredient.count > 1 ? `<span class="item-count">x${ingredient.count}</span>` : ''}
            ${customPriceText ? `
              <div class="item-price-container has-price" title="${customPriceText}">
                <span class="price-amount">${customPriceText}</span>
              </div>
            ` : `
              <div class="item-price-container ${showPrice ? 'has-price' : 'no-price'}" 
                   title="${priceTooltip}" data-item-id="${ingredient.id}">
                ${showPrice ? `
                  ${totalBuyPrice > 0 ? `
                    <div class="price-row">
                      <span class="price-label">Compra:</span>
                      <span class="price-amount">${formatGold(totalBuyPrice)}</span>
                      ${(ingredient.count || 1) > 1 && ingredient.buyPrice > 0 ? `
                        <span class="price-note">(${formatGold(ingredient.buyPrice)} × ${ingredient.count})</span>
                      ` : ''}
                      ${!ingredient.buyPrice && hasComponents ? `
                        <span class="price-note">(calculado)</span>
                      ` : ''}
                    </div>
                  ` : ''}
                  ${totalSellPrice > 0 ? `
                    <div class="price-row">
                      <span class="price-label">Venta:</span>
                      <span class="price-amount">${formatGold(totalSellPrice)}</span>
                      ${(ingredient.count || 1) > 1 && ingredient.sellPrice > 0 ? `
                        <span class="price-note">(${formatGold(ingredient.sellPrice)} × ${ingredient.count})</span>
                      ` : ''}
                      ${!ingredient.sellPrice && hasComponents ? `
                        <span class="price-note">(calculado)</span>
                      ` : ''}
                    </div>
                  ` : ''}
                  ${!totalBuyPrice && !totalSellPrice && hasComponents ? `
                    <span class="price-amount">Sin precio</span>
                    <span class="price-note">(componentes sin precio)</span>
                  ` : ''}
                ` : ''}
              </div>
            `}
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error al cargar el ítem:', error);
      itemEl.innerHTML = `
        <div class="${itemClass} error">
          <div style="width: 24px;"></div>
          <img class="item-icon" src="${this._getDefaultIconUrl()}" alt="Error">
          <div class="item-name">Error al cargar el ítem</div>
        </div>
      `;
    }
    
    container.appendChild(itemEl);
    
    // Agregar manejador de eventos para expandir/colapsar
    if (hasChildren) {
      const toggleBtn = itemEl.querySelector('.toggle-children');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const subItems = itemEl.nextElementSibling;
          const isExpanded = toggleBtn.getAttribute('data-expanded') === 'true';
          
          if (isExpanded) {
            subItems.style.display = 'none';
            toggleBtn.textContent = '+';
            toggleBtn.setAttribute('data-expanded', 'false');
          } else {
            subItems.style.display = 'block';
            toggleBtn.textContent = '−';
            toggleBtn.setAttribute('data-expanded', 'true');
          }
        });
      }
      
      // Crear contenedor para los sub-ítems
      const subItemsEl = document.createElement('div');
      subItemsEl.className = 'sub-items';
      subItemsEl.style.display = isExpanded ? 'block' : 'none';
      
      container.appendChild(subItemsEl);
      
      // Renderizar componentes hijos y esperar a que todos terminen
      const componentPromises = ingredient.components.map(component => 
        this.renderIngredient(component, subItemsEl, depth + 1)
      );
      await Promise.all(componentPromises);
    }
  }
  
  /**
   * Muestra un mensaje informativo
   * @param {string} message - El mensaje a mostrar
   */
  showMessage(message) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message';
    messageEl.textContent = message;
    this.craftingTreeEl.innerHTML = '';
    this.craftingTreeEl.appendChild(messageEl);
    
    // Ocultar el mensaje después de 3 segundos
    setTimeout(() => {
      if (messageEl.parentNode === this.craftingTreeEl) {
        this.craftingTreeEl.removeChild(messageEl);
      }
    }, 3000);
  }

  /**
   * Muestra un mensaje de error
   * @param {string} message - El mensaje de error a mostrar
   */
  showError(message) {
    this.craftingTreeEl.innerHTML = `
      <div class="error">
        <strong>Error:</strong> ${message}
      </div>
    `;
    this.summaryEl.style.display = 'none';
  }
  
  /**
   * Renderiza el resumen de ganancias
   * @param {number} sellPrice - Precio de venta
   * @param {number} buyPrice - Precio de compra
   * @param {number} craftingCost - Costo total de crafteo
   */
  renderProfitSummary(sellPrice, buyPrice, craftingCost) {
    if (!this.summaryEl || !sellPrice || !craftingCost) return;
    
    // Eliminar cualquier sección de ganancias existente
    const existingProfitSections = this.summaryEl.querySelectorAll('.summary-profit');
    existingProfitSections.forEach(section => section.remove());
    
    // Calcular ganancias
    const profitSell = Math.round((sellPrice * 0.85) - craftingCost);
    const profitBuy = Math.round((buyPrice * 0.85) - craftingCost);
    
    // Calcular porcentajes de ganancia
    const profitSellPercent = Math.round((profitSell / craftingCost) * 100) || 0;
    const profitBuyPercent = Math.round((profitBuy / craftingCost) * 100) || 0;
    
    const profitEl = document.createElement('div');
    profitEl.className = 'summary-profit';
    profitEl.innerHTML = `
      <h3>Resumen de Ganancias</h3>
      
      <div class="summary-subsection">
        <h4>Por venta listada</h4>
        <div class="summary-item">
          <span>Precio de venta (85%):</span>
          <span>${formatGold(Math.round(sellPrice * 0.85))}</span>
        </div>
        <div class="summary-item">
          <span>Costo de crafteo:</span>
          <span>${formatGold(craftingCost)}</span>
        </div>
        <div class="summary-item profit-total">
          <strong>Ganancia estimada:</strong>
          <strong style="color: ${profitSell >= 0 ? 'var(--success)' : 'var(--error)'};">
            ${formatGold(profitSell)}
          </strong>
        </div>
      </div>
      
      <div class="summary-subsection" style="margin-top: 15px;">
        <h4>Por venta directa</h4>
        <div class="summary-item">
          <span>Precio de compra (85%):</span>
          <span>${formatGold(Math.round(buyPrice * 0.85))}</span>
        </div>
        <div class="summary-item">
          <span>Costo de crafteo:</span>
          <span>${formatGold(craftingCost)}</span>
        </div>
        <div class="summary-item profit-total">
          <strong>Ganancia estimada:</strong>
          <strong style="color: ${profitBuy >= 0 ? 'var(--success)' : 'var(--error)'};">
            ${formatGold(profitBuy)}
          </strong>
        </div>
      </div>
    `;
    
    // Agregar la nota informativa al final de la sección de ganancias
    profitEl.innerHTML += `
      <div class="summary-note">
        <small>Nota: Los precios de materiales mostrados están calculados de acuerdo a la oferta y demanda del mercado. Y no contempla otros métodos de obtención como puede ser la "Forja Mística".</small><br>
        <small>Nota 2: El precio para el trébol místico se ocupa la cantidad promedio que se requiere para obtener los 38 tréboles, por lo que según el RNG puede variar.</small>
      </div>`;
    
    // Insertar después del resumen de costos
    this.summaryEl.appendChild(profitEl);
  }
  
  /**
   * Renderiza el resumen de costos
   */
  renderSummary() {
    if (!this.currentTree) return;
    
    // Calcular totales recursivamente
    const totals = this.currentTree.calculateTotals();
    const totalBuy = totals.buy;
    const totalSell = totals.sell;
    const isCraftable = totals.isCraftable;
    
    // Función para calcular el costo total de crafteo
    const calculateCraftingCost = (ingredient) => {
      let cost = 0;
      
      if (ingredient.components && ingredient.components.length > 0) {
        // Si tiene componentes, sumamos el costo de cada uno
        ingredient.components.forEach(comp => {
          cost += calculateCraftingCost(comp);
        });
      } else if (ingredient.buyPrice > 0) {
        // Si no tiene componentes y tiene precio, sumamos su costo
        cost = ingredient.getTotalBuyPrice();
      }
      
      return cost;
    };
    
    // Calcular el costo total de crafteo
    const craftingCost = calculateCraftingCost(this.currentTree);
    
    let html = `
      <div class="summary-item">
        <span>Precio venta:</span>
        <span>${totalBuy > 0 ? formatGold(totalBuy) : 'N/A'}</span>
      </div>
      <div class="summary-item">
        <span>Precio compra:</span>
        <span>${totalSell > 0 ? formatGold(totalSell) : 'N/A'}</span>
      </div>`;
    
    // Mostrar el costo de crafteo si es mayor a 0
    if (craftingCost > 0) {
      html += `
        <div class="summary-item">
          <strong>Costo de crafteo total:</strong>
          <strong>${formatGold(craftingCost)}</strong>
        </div>`;
    }
    
    // Mostrar ahorro estimado si es posible calcularlo
    if (isCraftable && totalBuy > 0) {
      const craftCost = this.currentTree.getTotalBuyPrice();
      const savings = totalBuy - craftCost;
      const savingsPercent = Math.round((savings / totalBuy) * 100);
      
      html += `
        <div class="summary-item">
          <span>Costo de crafteo estimado:</span>
          <span>${formatGold(craftCost)}</span>
        </div>
        <div class="summary-item summary-total">
          <span>Ahorro estimado:</span>
          <span style="color: ${savings > 0 ? 'var(--success)' : 'var(--error)'}">
            ${formatGold(savings)} (${savingsPercent}%)
          </span>
        </div>`;
    } else if (craftingCost === 0) {
      html += `
        <div class="summary-item">
          <span>Información de crafteo:</span>
          <span>No disponible para todos los componentes</span>
        </div>`;
    }
    
    // Limpiar el contenedor de resumen
    this.summaryContentEl.innerHTML = html;
    
    // Mostrar el resumen de ganancias si hay datos suficientes
    if (totalBuy > 0 && totalSell > 0 && craftingCost > 0) {
      this.renderProfitSummary(totalBuy, totalSell, craftingCost);
    }
  }
  
  /**
   * Actualiza el estado de carga
   */
  setLoading(isLoading) {
    this.isLoading = isLoading;
    this.loadTreeBtn.disabled = isLoading;
    
    if (isLoading) {
      this.craftingTreeEl.innerHTML = '<div class="loading">Cargando datos...</div>';
      this.summaryEl.style.display = 'none';
    }
  }
  
  /**
   * Muestra un mensaje de error
   */
  showError(message) {
    this.craftingTreeEl.innerHTML = `
      <div class="error">
        <strong>Error:</strong> ${message}
      </div>
    `;
    this.summaryEl.style.display = 'none';
  }
  
  /**
   * Obtiene la URL del icono para un ingrediente
   * @param {Object} ingredient - El ingrediente del que obtener el icono
   * @returns {Promise<string>} Promesa que resuelve con la URL del icono
   */
  async getIconUrl(ingredient) {
    if (!ingredient) {
      console.warn('[getIconUrl] Se recibió un ingrediente nulo o indefinido');
      return this._getDefaultIconUrl();
    }
    
    try {
      // Si el ingrediente tiene un método _generateIconUrl, lo usamos
      if (typeof ingredient._generateIconUrl === 'function') {
        return await ingredient._generateIconUrl();
      }
      
      // Si tiene icono definido directamente
      if (ingredient.icon) {
        // Si ya es una URL completa, la devolvemos tal cual
        if (ingredient.icon.startsWith('http')) {
          return ingredient.icon;
        }
        
        // Si es una ruta con firma, la convertimos a URL completa
        if (ingredient.icon.includes('/')) {
          return `https://render.guildwars2.com/file/${ingredient.icon}`;
        }
        
        // Si es solo un ID numérico
        return `https://render.guildwars2.com/file/${ingredient.icon}.png`;
      }
      
      // Si tiene ID, intentamos con el ID
      if (ingredient.id) {
        return `https://render.guildwars2.com/file/${ingredient.id}.png`;
      }
      
      // Si todo falla, usamos el icono por defecto
      console.warn(`[getIconUrl] No se pudo determinar la URL del icono para:`, ingredient);
      return this._getDefaultIconUrl();
      
    } catch (error) {
      console.error(`[getIconUrl] Error al obtener el icono para ${ingredient.id || 'ingrediente desconocido'}:`, error);
      return this._getDefaultIconUrl();
    }
  }
  
  /**
   * Formatea una URL de icono, asegurando que sea una URL completa
   * @private
   */
  _formatIconUrl(iconPath) {
    if (!iconPath) return this._getDefaultIconUrl();
    
    // Si ya es una URL completa, la devolvemos tal cual
    if (iconPath.startsWith('http')) {
      return iconPath;
    }
    
    // Si es una ruta con firma (ej: '3C7F.../65015.png'), la convertimos a URL completa
    if (iconPath.includes('/')) {
      // Eliminamos cualquier prefijo 'file/' o '/' duplicado
      const cleanPath = iconPath
        .replace(/^file\//, '')  // Eliminar 'file/' al inicio
        .replace(/^\//, '');     // Eliminar '/' al inicio
      
      return `https://render.guildwars2.com/file/${cleanPath}`;
    }
    
    // Si es solo un ID numérico, lo convertimos a URL
    return `https://render.guildwars2.com/file/${iconPath}.png`;
  }
  
  /**
   * Calcula el precio total de los componentes de un ingrediente
   * @param {Object} ingredient - El ingrediente del que calcular el precio de los componentes
   * @returns {{buy: number, sell: number}} Objeto con los precios totales de compra y venta en cobre
   * @private
   */
  calculateComponentsPrice(ingredient) {
    if (!ingredient.components || ingredient.components.length === 0) {
      return { buy: 0, sell: 0 };
    }

    return ingredient.components.reduce((totals, component) => {
      // Si el componente tiene precio, sumar su precio total (precio unitario * cantidad)
      const buyPrice = component.buyPrice > 0 ? component.buyPrice * component.count : 0;
      const sellPrice = component.sellPrice > 0 ? component.sellPrice * component.count : 0;
      
      // Si el componente tiene subcomponentes, calcular recursivamente
      if ((buyPrice === 0 || sellPrice === 0) && component.components && component.components.length > 0) {
        const componentPrices = this.calculateComponentsPrice(component);
        return {
          buy: totals.buy + (buyPrice > 0 ? buyPrice : componentPrices.buy),
          sell: totals.sell + (sellPrice > 0 ? sellPrice : componentPrices.sell)
        };
      }
      
      return {
        buy: totals.buy + buyPrice,
        sell: totals.sell + sellPrice
      };
    }, { buy: 0, sell: 0 });
  }

  /**
   * Devuelve la URL del icono por defecto
   * @private
   */
  _getDefaultIconUrl() {
    return 'https://render.guildwars2.com/file/0120CB0368B7953F0D3BD2A0C9100BCF0839FF4D/219035.png';
  }

  /**
   * Limpia la caché de la API
   */
  clearCache() {
    const success = gw2API.clearCache();
    if (success) {
      alert('Caché limpiado correctamente');
      // Recargar el árbol actual
      if (this.currentTree) {
        this.loadTree();
      }
    } else {
      alert('Error al limpiar la caché');
    }
  }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  try {
    window.app = new LegendaryCraftingApp();
  } catch (error) {
    console.error('Error al inicializar la aplicación:', error);
    document.getElementById('craftingTree').innerHTML = `
      <div class="error">
        <strong>Error crítico:</strong> No se pudo inicializar la aplicación. Por favor, recarga la página.
      </div>
    `;
  }
});
