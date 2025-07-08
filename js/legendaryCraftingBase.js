// Shared logic for legendary crafting apps
import { gw2API } from './services/GuildWars2API.js';

export class LegendaryCraftingBase {
  constructor(config) {
    this.getItemById = config.getItemById;
    this.items = config.items || [];
    this.createIngredientTree = config.createIngredientTree;
    this.isBasicMaterial = config.isBasicMaterial || (() => false);
    this.quickLoadButtons = config.quickLoadButtons || {};
    const ids = config.elementIds || {};
    this.craftingTreeEl = document.getElementById(ids.craftingTree);
    this.summaryEl = document.getElementById(ids.summary);
    this.summaryContentEl = document.getElementById(ids.summaryContent);
    this.loadTreeBtn = ids.loadTree ? document.getElementById(ids.loadTree) : null;
    this.clearCacheBtn = ids.clearCache ? document.getElementById(ids.clearCache) : null;
    this.itemIdInput = ids.itemIdInput ? document.getElementById(ids.itemIdInput) : null;
    this.itemNameInput = ids.itemNameInput ? document.getElementById(ids.itemNameInput) : null;

    this.currentTree = null;
    this.isLoading = false;
    this.activeButton = null;

    this.calculateComponentsPrice = this.calculateComponentsPrice.bind(this);
    this.initializeEventListeners();

    if (this.craftingTreeEl) {
      this.craftingTreeEl.innerHTML = `
        <div style="text-align: center; padding: 40px 0; color: #ccc;">
          <p>Selecciona una legendaria de la lista superior para ver su árbol de crafteo</p>
        </div>`;
    }
  }

  _setActiveButton(button) {
    document.querySelectorAll('.item-tab-btn-treeleg').forEach(btn => btn.classList.remove('active'));
    if (button) {
      button.classList.add('active');
      this.activeButton = button;
    } else {
      this.activeButton = null;
    }
  }

  _findButtonIdByItemId(itemId) {
    const itemIdStr = String(itemId);
    const entry = Object.entries(this.quickLoadButtons).find(([_, d]) => d.itemId === itemIdStr);
    return entry ? entry[0] : null;
  }

  _handleQuickLoad(buttonId) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    const data = this.quickLoadButtons[buttonId];
    if (!data) return;
    if (this.itemIdInput) this.itemIdInput.value = data.itemId;
    if (this.itemNameInput) this.itemNameInput.value = data.itemName || '';
    this._setActiveButton(button);
    this.loadItem({ itemId: data.itemId });
  }

  initializeEventListeners() {
    if (this.loadTreeBtn) {
      this.loadTreeBtn.addEventListener('click', () => {
        this._setActiveButton(null);
        this.loadItem({ itemId: this.itemIdInput?.value, itemName: this.itemNameInput?.value });
      });
    }

    if (this.clearCacheBtn) {
      this.clearCacheBtn.addEventListener('click', () => {
        this.clearCache();
        this._setActiveButton(null);
      });
    }

    Object.keys(this.quickLoadButtons).forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', () => this._handleQuickLoad(id));
    });
  }

  async loadItem({ itemId, itemName }) {
    const id = parseInt(itemId);
    const name = itemName ? itemName.toLowerCase() : '';
    if (!id && !name) {
      this.showError('Por favor ingresa un ID o nombre de ítem válido');
      return;
    }

    this.setLoading(true);
    if (this.craftingTreeEl) this.craftingTreeEl.innerHTML = '<div class="loading">Cargando información del ítem...</div>';

    try {
      let itemData = null;
      if (id) itemData = this.getItemById(id);
      if (!itemData && name) {
        itemData = this.items.find(i => i.name.toLowerCase() === name);
      }
      if (!itemData) throw new Error(`No se encontró información local para el ítem: ${itemName || itemId}`);

      if (this.itemIdInput && itemData.id) this.itemIdInput.value = itemData.id;
      const buttonId = this._findButtonIdByItemId(itemData.id);
      if (buttonId) {
        const button = document.getElementById(buttonId);
        this._setActiveButton(button);
      } else {
        this._setActiveButton(null);
      }

      if (this.craftingTreeEl) this.craftingTreeEl.innerHTML = `
        <div class="loading" style="text-align: center; padding: 40px 0;">
          <div style="display:inline-block;width:40px;height:40px;border:4px solid rgba(35,42,54,0.3);border-top:4px solid #eab308;border-radius:50%;animation: spin 0.8s linear infinite;margin:0 auto 15px;"></div>
          <div>Cargando precios de los materiales...</div>
        </div>`;

      this.currentTree = await this.createIngredientTree(itemData);
      await this.renderTree();
      this.renderSummary();
    } catch (error) {
      console.error('Error al cargar el árbol:', error);
      this.showError(`Error: ${error.message}`);
    } finally {
      this.setLoading(false);
    }
  }

  async renderTree() {
    if (!this.currentTree || !this.craftingTreeEl) return;
    this.craftingTreeEl.innerHTML = '<div class="loading">Cargando árbol de crafteo...</div>';
    try {
      this.craftingTreeEl.innerHTML = '';
      await this.renderIngredient(this.currentTree, this.craftingTreeEl);
      this.summaryEl.style.display = 'block';
    } catch (error) {
      console.error('Error al renderizar el árbol de crafteo:', error);
      this.craftingTreeEl.innerHTML = `
        <div class="error">
          <p>Error al cargar el árbol de crafteo. Por favor, inténtalo de nuevo.</p>
          <button id="retry-load-tree" class="btn">Reintentar</button>
        </div>`;
      const retryBtn = document.getElementById('retry-load-tree');
      if (retryBtn) retryBtn.addEventListener('click', () => this.loadItem({ itemId: this.itemIdInput?.value, itemName: this.itemNameInput?.value }));
    }
  }

  async renderIngredient(ingredient, container, depth = 0) {
    if (!ingredient) return;
    const itemEl = document.createElement('div');
    itemEl.className = 'tree-node';
    const hasChildren = ingredient.components && ingredient.components.length > 0;
    const isExpanded = depth < 2;
    let itemClass = 'item-card-treeleg';
    if (ingredient.type?.includes('legendary')) itemClass += ' legendary';
    if (ingredient.type?.includes('precursor')) itemClass += ' precursor';
    if (ingredient.type === 'account_bound') itemClass += ' account-bound';

    try {
      const iconUrl = await this.getIconUrl(ingredient);
      const normalizedName = ingredient.name ? ingredient.name.toLowerCase() : '';
      const vialesConPrecio = [
        'vial de sangre poderosa',
        'vial de sangre potente',
        'vial de sangre fuerte',
        'vial de sangre',
        'vial de sangre débil'
      ];
      const isVial = normalizedName.includes('vial') && !vialesConPrecio.some(v => normalizedName === v);
      const hasComponents = hasChildren;

      const isLegendary = ingredient.type?.includes('legendary');
      const hasBuyPrice = ingredient.buyPrice > 0;
      const hasSellPrice = ingredient.sellPrice > 0;
      const showPrice = this.isBasicMaterial(ingredient.id) || ingredient.isPriceLoaded() || (isLegendary && (hasBuyPrice || hasSellPrice));
      let totalBuyPrice = ingredient.getTotalBuyPrice();
      let totalSellPrice = ingredient.getTotalSellPrice();

      if ((!hasBuyPrice || !hasSellPrice) && hasComponents) {
        const compPrices = this.calculateComponentsPrice(ingredient);
        if (!hasBuyPrice && compPrices.buy > 0) totalBuyPrice = compPrices.buy;
        if (!hasSellPrice && compPrices.sell > 0) totalSellPrice = compPrices.sell;
      }

      let priceTooltip = '';
      if ((ingredient.isPriceLoaded() || isLegendary || hasComponents) && (totalBuyPrice > 0 || totalSellPrice > 0)) {
        const buyText = totalBuyPrice > 0 ? `Compra: ${formatGold(totalBuyPrice)}` : 'Compra: N/A';
        const sellText = totalSellPrice > 0 ? `Venta: ${formatGold(totalSellPrice)}` : 'Venta: N/A';
        priceTooltip = `${buyText} | ${sellText}${(!hasBuyPrice || !hasSellPrice) && hasComponents ? ' (calculado de componentes)' : ''}`;
      } else if (hasComponents) {
        priceTooltip = 'Precio calculado de los componentes';
      } else if (isVial) {
        priceTooltip = 'No comerciable';
      } else {
        priceTooltip = 'Precio no disponible';
      }

      itemEl.innerHTML = `
        <div class="${itemClass}">
          ${hasChildren ? `<button class="toggle-children" data-expanded="${isExpanded}">${isExpanded ? '−' : '+'}</button>` : '<div style="width: 24px;"></div>'}
          <img class="item-icon" src="${iconUrl}" alt="${ingredient.name || 'Item'}" title="${ingredient.name || 'Item'}" onerror="this.onerror=null;this.src='${this._getDefaultIconUrl()}';">
          <div class="item-name">${ingredient.name || 'Item'}</div>
          <div class="item-details">
            ${ingredient.count > 1 ? `<span class="item-count">x${ingredient.count}</span>` : ''}
            <div class="item-price-container ${showPrice ? 'has-price' : 'no-price'}" title="${priceTooltip}">
              ${showPrice ? `<div class="price-row"><span class="price-label">Compra:</span><span class="price-amount">${formatGold(totalBuyPrice)}</span></div>` : ''}
              ${showPrice ? `<div class="price-row"><span class="price-label">Venta:</span><span class="price-amount">${formatGold(totalSellPrice)}</span></div>` : ''}
            </div>
          </div>
        </div>`;

      container.appendChild(itemEl);

      if (hasChildren) {
        const toggleBtn = itemEl.querySelector('.toggle-children');
        if (toggleBtn) {
          toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const subItems = itemEl.nextElementSibling;
            const expanded = toggleBtn.getAttribute('data-expanded') === 'true';
            if (expanded) {
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
        const subItemsEl = document.createElement('div');
        subItemsEl.className = 'sub-items';
        subItemsEl.style.display = isExpanded ? 'block' : 'none';
        container.appendChild(subItemsEl);
        const promises = ingredient.components.map(c => this.renderIngredient(c, subItemsEl, depth + 1));
        await Promise.all(promises);
      }
    } catch (error) {
      console.error('Error al renderizar ingrediente:', error);
      itemEl.innerHTML = `<div class="item-card-treeleg"><div class="item-name">Error al cargar el ítem</div></div>`;
      container.appendChild(itemEl);
    }
  }

  showMessage(message) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message';
    messageEl.textContent = message;
    if (this.craftingTreeEl) {
      this.craftingTreeEl.innerHTML = '';
      this.craftingTreeEl.appendChild(messageEl);
      setTimeout(() => {
        if (messageEl.parentNode === this.craftingTreeEl) {
          this.craftingTreeEl.removeChild(messageEl);
        }
      }, 3000);
    }
  }

  showError(message) {
    if (this.craftingTreeEl) {
      this.craftingTreeEl.innerHTML = `<div class="error"><strong>Error:</strong> ${message}</div>`;
    }
    if (this.summaryEl) this.summaryEl.style.display = 'none';
  }

  renderProfitSummary(sellPrice, buyPrice, craftingCost) {
    if (!this.summaryEl || !sellPrice || !craftingCost) return;
    const existing = this.summaryEl.querySelectorAll('.summary-profit');
    existing.forEach(s => s.remove());
    const profitSell = Math.round((sellPrice * 0.85) - craftingCost);
    const profitBuy = Math.round((buyPrice * 0.85) - craftingCost);
    const profitEl = document.createElement('div');
    profitEl.className = 'summary-profit';
    profitEl.innerHTML = `
      <h3>Resumen de Ganancias</h3>
      <div class="summary-subsection">
        <h4>Por venta listada</h4>
        <div class="summary-item"><span>Precio de venta (85%):</span><span>${formatGold(Math.round(sellPrice * 0.85))}</span></div>
        <div class="summary-item"><span>Costo de crafteo:</span><span>${formatGold(craftingCost)}</span></div>
        <div class="summary-item profit-total"><strong>Ganancia estimada:</strong><strong style="color: ${profitSell >= 0 ? 'var(--success)' : 'var(--error)'};">${formatGold(profitSell)}</strong></div>
      </div>
      <div class="summary-subsection" style="margin-top: 15px;">
        <h4>Por venta directa</h4>
        <div class="summary-item"><span>Precio de compra (85%):</span><span>${formatGold(Math.round(buyPrice * 0.85))}</span></div>
        <div class="summary-item"><span>Costo de crafteo:</span><span>${formatGold(craftingCost)}</span></div>
        <div class="summary-item profit-total"><strong>Ganancia estimada:</strong><strong style="color: ${profitBuy >= 0 ? 'var(--success)' : 'var(--error)'};">${formatGold(profitBuy)}</strong></div>
      </div>
      <div class="summary-note"><small>Nota: Los precios de materiales mostrados están calculados de acuerdo a la oferta y demanda del mercado. Y no contempla otros métodos de obtención como puede ser la "Forja Mística".</small><br><small>Nota 2: El precio para el trébol místico se ocupa la cantidad promedio que se requiere para obtener los 77 tréboles, por lo que según el RNG puede variar.</small></div>`;
    this.summaryEl.appendChild(profitEl);
  }

  renderSummary() {
    if (!this.currentTree) return;
    const totals = this.currentTree.calculateTotals();
    const totalBuy = totals.buy;
    const totalSell = totals.sell;
    const isCraftable = totals.isCraftable;

    const calculateCraftingCost = (ingredient) => {
      let cost = 0;
      if (ingredient.components && ingredient.components.length > 0) {
        ingredient.components.forEach(comp => { cost += calculateCraftingCost(comp); });
      } else if (ingredient.buyPrice > 0) {
        cost = ingredient.getTotalBuyPrice();
      }
      return cost;
    };

    const craftingCost = calculateCraftingCost(this.currentTree);
    let html = `
      <div class="summary-item"><span>Precio venta:</span><span>${totalBuy > 0 ? formatGold(totalBuy) : 'N/A'}</span></div>
      <div class="summary-item"><span>Precio compra:</span><span>${totalSell > 0 ? formatGold(totalSell) : 'N/A'}</span></div>`;
    if (craftingCost > 0) {
      html += `<div class="summary-item"><strong>Costo de crafteo total:</strong><strong>${formatGold(craftingCost)}</strong></div>`;
    }
    if (isCraftable && totalBuy > 0) {
      const craftCost = this.currentTree.getTotalBuyPrice();
      const savings = totalBuy - craftCost;
      const savingsPercent = Math.round((savings / totalBuy) * 100);
      html += `<div class="summary-item"><span>Costo de crafteo estimado:</span><span>${formatGold(craftCost)}</span></div><div class="summary-item summary-total"><span>Ahorro estimado:</span><span style="color: ${savings > 0 ? 'var(--success)' : 'var(--error)'}">${formatGold(savings)} (${savingsPercent}%)</span></div>`;
    } else if (craftingCost === 0) {
      html += `<div class="summary-item"><span>Información de crafteo:</span><span>No disponible para todos los componentes</span></div>`;
    }

    this.summaryContentEl.innerHTML = html;
    if (totalBuy > 0 && totalSell > 0 && craftingCost > 0) {
      this.renderProfitSummary(totalBuy, totalSell, craftingCost);
    }
  }

  setLoading(isLoading) {
    this.isLoading = isLoading;
    if (isLoading && this.craftingTreeEl) {
      this.craftingTreeEl.innerHTML = '<div class="loading">Cargando datos...</div>';
      if (this.summaryEl) this.summaryEl.style.display = 'none';
    }
  }

  async getIconUrl(ingredient) {
    if (!ingredient) return this._getDefaultIconUrl();
    try {
      if (typeof ingredient._generateIconUrl === 'function') return await ingredient._generateIconUrl();
      if (ingredient.icon) {
        if (ingredient.icon.startsWith('http')) return ingredient.icon;
        if (ingredient.icon.includes('/')) return `https://render.guildwars2.com/file/${ingredient.icon}`;
        return `https://render.guildwars2.com/file/${ingredient.icon}.png`;
      }
      if (ingredient.id) return `https://render.guildwars2.com/file/${ingredient.id}.png`;
      return this._getDefaultIconUrl();
    } catch (e) {
      console.error('[getIconUrl] Error al obtener icono', e);
      return this._getDefaultIconUrl();
    }
  }

  calculateComponentsPrice(ingredient) {
    if (!ingredient.components || ingredient.components.length === 0) return { buy: 0, sell: 0 };
    return ingredient.components.reduce((totals, component) => {
      const buyPrice = component.buyPrice > 0 ? component.buyPrice * component.count : 0;
      const sellPrice = component.sellPrice > 0 ? component.sellPrice * component.count : 0;
      if ((buyPrice === 0 || sellPrice === 0) && component.components && component.components.length > 0) {
        const compPrices = this.calculateComponentsPrice(component);
        return { buy: totals.buy + (buyPrice > 0 ? buyPrice : compPrices.buy), sell: totals.sell + (sellPrice > 0 ? sellPrice : compPrices.sell) };
      }
      return { buy: totals.buy + buyPrice, sell: totals.sell + sellPrice };
    }, { buy: 0, sell: 0 });
  }

  _getDefaultIconUrl() {
    return 'https://render.guildwars2.com/file/0120CB0368B7953F0D3BD2A0C9100BCF0839FF4D/219035.png';
  }

  clearCache() {
    const success = gw2API.clearCache();
    if (success) {
      alert('Caché limpiado correctamente');
      if (this.currentTree) this.loadItem({ itemId: this.itemIdInput?.value, itemName: this.itemNameInput?.value });
    } else {
      alert('Error al limpiar la caché');
    }
  }
}
