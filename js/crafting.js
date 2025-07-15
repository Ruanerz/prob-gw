// crafting.js
// Lógica compartida para cálculo de crafteo y estructura de ingredientes

class CraftIngredient {
  constructor({id, name, icon, rarity, count, parentMultiplier = 1, buy_price, sell_price, crafted_price, is_craftable, recipe, children}) {
    this.modeForParentCrafted = "buy";
    this.id = id;
    this.name = name;
    this.icon = icon;
    this.rarity = rarity;
    this.count = count;
    this.parentMultiplier = parentMultiplier || 1;
    this.buy_price = buy_price;
    this.sell_price = sell_price;
    this.crafted_price = crafted_price; // Calculado
    this.is_craftable = is_craftable;
    this.recipe = recipe || null; // Receta si es crafteable
    this.children = children || [];
    this.mode = 'buy'; // buy, sell, crafted
    this.expanded = false;
    this.total_buy = 0;
    this.total_sell = 0;
    this.total_crafted = 0;
    this.recalc();
  }
  recalc(globalQty = window.globalQty || 1, parentCountTotal = null, parentOutputCount = null) {
    if (parentCountTotal === null || parentOutputCount === null) {
      this.countTotal = this.count * globalQty;
    } else {
      this.countTotal = this.count * (parentCountTotal / parentOutputCount);
    }
    if (this.is_craftable && this.children.length > 0) {
      this.children.forEach(child => child.recalc(globalQty, this.countTotal, this.recipe ? this.recipe.output_item_count : 1));
      this.crafted_price = this.children.reduce((sum, ing) => {
        if (ing.modeForParentCrafted === 'buy') return sum + (ing.buy_price ?? 0) * ing.countTotal;
        if (ing.modeForParentCrafted === 'sell') return sum + (ing.sell_price ?? 0) * ing.countTotal;
        return sum + (ing.total_crafted ?? 0);
      }, 0) / (this.recipe.output_item_count || 1);
    }
    this.total_buy = (this.buy_price ?? 0) * this.countTotal;
    this.total_sell = (this.sell_price ?? 0) * this.countTotal;
    if (this.is_craftable && this.children.length > 0) {
      this.total_crafted = this.children.reduce((sum, ing) => {
        const opciones = [ing.total_buy, ing.total_sell, ing.total_crafted].filter(x => typeof x === 'number' && x >= 0);
        const minHijo = Math.min(...opciones);
        return sum + minHijo;
      }, 0);
    } else {
      this.total_crafted = (this.crafted_price ?? 0) * this.countTotal;
    }
    if (!this.buy_price && !this.sell_price) {
      this.total_buy = this.total_crafted;
      this.total_sell = this.total_crafted;
    }
  }
}

// Puedes agregar aquí funciones auxiliares para obtener recetas, precios, etc. en el futuro.
