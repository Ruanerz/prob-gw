// Función robusta para formatear cobre a oro/plata/cobre (soporta negativos y redondeo)
function formatGold(value) {
  const rounded = Math.round(value);
  const isNegative = rounded < 0;
  const absValue = Math.abs(rounded);

  const gold = Math.floor(absValue / 10000);
  const silver = Math.floor((absValue % 10000) / 100);
  const copper = absValue % 100;

  let result = '';
  if (gold > 0) {
    result += `${gold}g ${silver.toString().padStart(2, '0')}s ${copper.toString().padStart(2, '0')}c`;
  } else if (silver > 0) {
    result += `${silver}s ${copper.toString().padStart(2, '0')}c`;
  } else {
    result += `${copper.toString().padStart(2, '0')}c`;
  }

  if (isNegative) result = '-' + result.trim();
  return result.trim();
}

// Hacer disponible globalmente para todos los scripts
window.formatGold = formatGold;

// Exportar para uso en Node.js si es necesario
if (typeof module !== 'undefined' && module.exports) {
  module.exports = formatGold;
}
