// Tabs simples para item.html
// Muestra/oculta info-item, resumen-mercado y tab-mejores-horas-content

document.addEventListener('DOMContentLoaded', function() {
  const tabBtns = document.querySelectorAll('.item-tab-btn[data-tab]');
  const tabIds = ['info-item', 'resumen-mercado', 'tab-mejores-horas-content'];

  function showTab(tabId) {
    tabIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = (id === tabId) ? '' : 'none';
    });
    tabBtns.forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId));
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const tabId = btn.getAttribute('data-tab');
      showTab(tabId);
    });
  });

  // Mostrar por defecto la pestaña de crafteo
  showTab('info-item');
});
// Servicio para manejar las llamadas a la API de recetas v2

const API_BASE_URL = 'https://api.guildwars2.com/v2';

// Cache para almacenar respuestas y evitar peticiones duplicadas
const cache = {
    recipes: new Map(),
    items: new Map()
};

/**
 * Obtiene las recetas para un ítem específico
 * @param {number} itemId - ID del ítem
 * @returns {Promise<Array>} - Lista de recetas
 */
async function getRecipesForItem(itemId) {
    if (!itemId) {
        console.error('[ERROR] ID de ítem no proporcionado');
        return [];
    }

    const cacheKey = `item_${itemId}`;
    if (cache.recipes.has(cacheKey)) {
        return cache.recipes.get(cacheKey) || [];
    }

    try {
        const response = await fetch(`${API_BASE_URL}/recipes/search?output=${itemId}`);
        
        if (!response.ok) {
            return [];
        }
        
        const recipeIds = await response.json();
        if (!recipeIds || !Array.isArray(recipeIds) || recipeIds.length === 0) {
            return [];
        }
        const recipes = (await Promise.all(
            recipeIds.map(id => getRecipeDetails(id))
        )).filter(recipe => recipe !== null); // Filtrar recetas nulas
        
        if (recipes.length > 0) {
            cache.recipes.set(cacheKey, recipes);
        }
        return recipes;
    } catch (error) {
        console.error(`[ERROR] Error en getRecipesForItem para ítem ${itemId}:`, error);
        return [];
    }
}

window.getRecipesForItem = getRecipesForItem;

/**
 * Obtiene los detalles de una receta específica
 * @param {number} recipeId - ID de la receta
 * @returns {Promise<Object>} - Detalles de la receta
 */
window.getRecipeDetails = async function(recipeId) {
    if (cache.recipes.has(recipeId)) {
        return cache.recipes.get(recipeId);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}`);
        if (!response.ok) {
            return null;
        }
        
        const recipe = await response.json();
        if (!recipe) {
            return null;
        }
        cache.recipes.set(recipeId, recipe);
        return recipe;
    } catch (error) {
        console.error('Error en getRecipeDetails:', error);
        return null;
    }
}

/**
 * Obtiene información detallada de un ítem
 * @param {number} itemId - ID del ítem
 * @returns {Promise<Object>} - Información del ítem
 */
window.getItemDetails = async function(itemId) {
    if (cache.items.has(itemId)) {
        return cache.items.get(itemId);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/items/${itemId}`);
        if (!response.ok) throw new Error('Ítem no encontrado');
        
        const item = await response.json();
        cache.items.set(itemId, item);
        return item;
    } catch (error) {
        console.error('Error en getItemDetails:', error);
        return null;
    }
}

/**
 * Obtiene los precios de un ítem usando la API CSV
 * @param {number} itemId - ID del ítem
 * @returns {Promise<Object>} - Precios de compra y venta
 */
window.getItemPrices = async function(itemId) {
    const csvUrl = `https://api.datawars2.ie/gw2/v1/items/csv?fields=id,buy_price,sell_price&ids=${itemId}`;
    try {
        const csvText = await fetch(csvUrl).then(r => {
            if (!r.ok) throw new Error(`Error ${r.status} obteniendo precios para item ${itemId}`);
            return r.text();
        });

        const [headers, values] = csvText.trim().split('\n').map(line => line.split(','));
        const data = {};
        headers.forEach((h, i) => {
            const value = values[i];
            if (h === 'id') {
                data[h] = parseInt(value, 10);
            } else if (['buy_price', 'sell_price'].includes(h)) {
                data[h] = value !== '' && value !== undefined ? parseInt(value, 10) : 0;
            } else {
                data[h] = value;
            }
        });

        return {
            buys: { unit_price: data.buy_price || 0 },
            sells: { unit_price: data.sell_price || 0 }
        };
    } catch (e) {
        console.error(`Error obteniendo datos de mercado para item ${itemId}`, e);
        return { buys: { unit_price: 0 }, sells: { unit_price: 0 } };
    }
};

// Export para entornos que soporten CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports.getRecipesForItem = getRecipesForItem;
}
// Dependencias: estas funciones deben estar definidas globalmente antes de este archivo
// getRecipesForItem, getRecipeDetails, getItemDetails, getItemPrices

// Se asume que getRecipesForItem está definido globalmente en recipeService.js


/**
 * Transforma una receta de la API al formato esperado por CraftIngredient
 */
window.transformRecipeToIngredient = async function(recipe, count = 1, parentMultiplier = 1) {
    try {
        if (!recipe || !recipe.output_item_id) {
            console.error('[ERROR] Receta inválida o sin output_item_id:', recipe);
            return null;
        }
        
        // Obtener detalles del ítem de salida
        const outputItem = await getItemDetails(recipe.output_item_id);
        if (!outputItem) {
            console.warn(`[WARN] No se pudo obtener detalles para el ítem ${recipe.output_item_id}`);
            return null;
        }
        
        // Obtener precios
        const prices = await getItemPrices(recipe.output_item_id) || {};
        
        // Crear estructura base del ingrediente

        const ingredient = {
            id: recipe.output_item_id,
            name: outputItem?.name || 'Ítem desconocido',
            icon: outputItem?.icon || '',
            rarity: outputItem?.rarity,
            count: count,
            parentMultiplier: parentMultiplier,
            buy_price: prices?.buys?.unit_price || 0,
            sell_price: prices?.sells?.unit_price || 0,
            is_craftable: recipe.type !== 'GuildConsumable',
            recipe: {
                id: recipe.id,
                type: recipe.type,
                output_item_count: recipe.output_item_count || 1,
                min_rating: recipe.min_rating,
                disciplines: recipe.disciplines || []
            },
            children: []
        };
        
        // Validar que la estructura básica sea válida
        if (!ingredient.id || !ingredient.name) {
            console.error('[ERROR] Estructura de ingrediente inválida:', ingredient);
            return null;
        }

        // Procesar ingredientes hijos si los hay
        if (recipe.ingredients && recipe.ingredients.length > 0) {
            ingredient.children = await Promise.all(
                recipe.ingredients.map(async (ing) => {
                    // Verificar si el ingrediente es crafteable
                    const recipes = await getRecipesForItem(ing.item_id);
                    const isCraftable = recipes.length > 0;
                    
                    // Obtener detalles del ítem
                    const itemDetails = await getItemDetails(ing.item_id);
                    const prices = await getItemPrices(ing.item_id);
                    
                    const childIngredient = {
                        id: ing.item_id,
                        name: itemDetails?.name || 'Ítem desconocido',
                        icon: itemDetails?.icon || '',
                        rarity: itemDetails?.rarity,
                        count: ing.count,
                        parentMultiplier: 1, // Se ajustará en la recursión
                        buy_price: prices?.buys?.unit_price || 0,
                        sell_price: prices?.sells?.unit_price || 0,
                        is_craftable: isCraftable,
                        children: []
                    };


                    return childIngredient;
                })
            );
        }

        
        return ingredient;
    } catch (error) {
        console.error('Error en transformRecipeToIngredient:', error);
        return null;
    }
}

/**
 * Obtiene y transforma las recetas de un ítem
 */
window.getAndTransformRecipes = async function(itemId) {
    try {
        const recipes = await getRecipesForItem(itemId);
        if (!recipes || recipes.length === 0) return [];

        // getRecipesForItem ya devuelve los detalles completos de las recetas,
        // por lo que no es necesario volver a llamar a getRecipeDetails
        const transformedRecipes = await Promise.all(
            recipes.map(recipe =>
                window.transformRecipeToIngredient(recipe)
            )
        );

        return transformedRecipes.filter(Boolean); // Filtrar nulos
    } catch (error) {
        console.error('Error en getAndTransformRecipes:', error);
        return [];
    }
}

/**
 * Carga recursivamente los ingredientes de un ítem
 */
window.loadIngredientTree = async function(ingredient, depth = 0, maxDepth = 3) {
    if (depth >= maxDepth || !ingredient.is_craftable) {
        return ingredient;
    }
    
    try {
        const recipes = await getRecipesForItem(ingredient.id);
        if (recipes.length === 0) {
            return ingredient;
        }

        // getRecipesForItem devuelve objetos de receta completos, tomar la primera
        const recipe = recipes[0];
        if (!recipe) return ingredient;
        
        // Transformar y cargar los ingredientes hijos
        ingredient.children = await Promise.all(
            recipe.ingredients.map(async (ing) => {
                // Buscar la receta real del hijo
                const childRecipes = await getRecipesForItem(ing.item_id);
                let childIngredient = null;
                if (childRecipes.length > 0) {
                    const childRecipe = childRecipes[0];
                    if (childRecipe) {
                        // Pasa la receta real y el count correcto
                        childIngredient = await transformRecipeToIngredient(childRecipe, ing.count, 1);
                    }
                }
                // Si no hay receta, crea un ingrediente básico
                if (!childIngredient) {
                    // Obtener detalles básicos del ítem
                    const itemDetails = await getItemDetails(ing.item_id);
                    const prices = await getItemPrices(ing.item_id);
                    childIngredient = {
                        id: ing.item_id,
                        name: itemDetails?.name || '',
                        icon: itemDetails?.icon || '',
                        rarity: itemDetails?.rarity,
                        count: ing.count,
                        parentMultiplier: 1,
                        buy_price: prices?.buys?.unit_price || 0,
                        sell_price: prices?.sells?.unit_price || 0,
                        is_craftable: false,
                        children: []
                    };
                }
                // Recursividad solo si es crafteable
                if (childIngredient.is_craftable) {
                    return await loadIngredientTree(childIngredient, depth + 1, maxDepth);
                } else {
                    return childIngredient;
                }
            })
        );
        
        return ingredient;
    } catch (error) {
        console.error(`Error cargando ingrediente ${ingredient.id}:`, error);
        return ingredient;
    }
}
// js/item-mejores.js
// Estructura base para análisis avanzado de ítems GW2
// Mantiene la arquitectura y estilos compatibles con item.html y compare-craft

// Referencias a elementos para la pestaña 'Mejores Horas y Mercado' en item.html
function getMejoresHorasElements() {
    return {
        ventasComprasChartCtx: document.getElementById('ventas-compras-chart')?.getContext('2d'),
        horaPuntaDiv: document.getElementById('hora-punta'),
        promedioHoraDiv: document.getElementById('promedio-hora'),
        promedioDiaDiv: document.getElementById('promedio-dia')
    };
}

let ventasComprasChart = null;

// Utilidad para limpiar indicadores y alertas
function limpiarUI() {
    const els = getMejoresHorasElements();
    els.horaPuntaDiv.innerHTML = '';
    els.promedioHoraDiv.innerHTML = '';
    els.promedioDiaDiv.innerHTML = '';
    if (ventasComprasChart) {
        ventasComprasChart.destroy();
        ventasComprasChart = null;
    }
}

// Función global para integración en item.html
window.cargarMejoresHorasYMercado = async function(itemID) {
    limpiarUI();
    await cargarDatosItem(itemID);
};

// Función principal de carga y análisis
async function cargarDatosItem(itemID) {
    // 1. Obtener histórico horario
    // 2. Obtener estado actual
    // 3. Procesar y mostrar cada módulo
    try {
        const history = await obtenerHistorialHorario(itemID);
        const estado = await obtenerEstadoActual(itemID);
        mostrarGraficoVentasCompras(history);
        mostrarHoraPunta(history);
        mostrarPromedios(history);
    } catch (err) {
        // Manejo de error sin log
    }
}

// --- Funciones stub para cada módulo ---
async function obtenerHistorialHorario(itemID) {
    try {
        const url = `https://api.datawars2.ie/gw2/v2/history/hourly/json?itemID=${itemID}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error al obtener histórico horario: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (err) {
        throw new Error(`Error al obtener histórico horario: ${err.message}`);
    }
}
async function obtenerEstadoActual(itemID) {
    try {
        const fields = 'buy_price,sell_price,buy_quantity,sell_quantity,last_updated';
        const url = `https://api.datawars2.ie/gw2/v1/items/json?fields=${fields}&ids=${itemID}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error al obtener estado actual: ${response.statusText}`);
        }
        const data = await response.json();
        if (Array.isArray(data)) {
            return data[0] || {};
        }
        return data || {};
    } catch (err) {
        throw new Error(`Error al obtener estado actual: ${err.message}`);
    }
}
function mostrarGraficoVentasCompras(history) {
    const { ventasComprasChartCtx } = getMejoresHorasElements();
    if (!ventasComprasChartCtx) {
        return;
    }
    if (!history || history.length === 0) {
        // No hay datos para mostrar
        let tablaExistente = document.getElementById('mejores-table');
        if (tablaExistente) tablaExistente.remove();
        return;
    }

    // Usa el campo 'date' para la hora real
    const horas = history.map((dato) => dato.date || '');
    const horaMin = horas[0] || '';
    const horaMax = horas[horas.length - 1] || '';
    const totalHoras = horas.length;

    // Etiquetas para eje X: solo hora en formato 24h (HH:00)
    const etiquetas = horas.map((h) => {
        // Intenta parsear la hora en formato ISO o 'YYYY-MM-DD HH:mm'
        let dateObj;
        if (h.includes('T')) {
            dateObj = new Date(h);
        } else if (/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(h)) {
            dateObj = new Date(h.replace(' ', 'T'));
        }
        if (dateObj && !isNaN(dateObj)) {
            let hh = dateObj.getHours().toString().padStart(2, '0');
            return `${hh}:00`;
        }
        // Si no es fecha válida, intenta extraer hora con regex
        let match = h.match(/(\d{2}):(\d{2})/);
        return match ? `${match[1]}:00` : h;
    });

    // Muestra resumen arriba del gráfico
    let resumenDiv = document.getElementById('resumen-horas');
    if (!resumenDiv) {
        resumenDiv = document.createElement('div');
        resumenDiv.id = 'resumen-horas';
        resumenDiv.className = 'info-box';
        const card = ventasComprasChartCtx.canvas.closest('.card');
        if (card) card.insertBefore(resumenDiv, card.firstChild);
    }
    // Formatea las fechas del historial igual que la tabla
    function formateaFechaHistorial(fechaStr) {
        let dateObj = fechaStr ? new Date(fechaStr) : null;
        if (dateObj && !isNaN(dateObj)) {
            return `${dateObj.getFullYear()}-${(dateObj.getMonth()+1).toString().padStart(2,'0')}-${dateObj.getDate().toString().padStart(2,'0')} ${dateObj.getHours().toString().padStart(2,'0')}:00`;
        }
        return fechaStr;
    }
    resumenDiv.innerHTML = `<strong>Historial:</strong> ${formateaFechaHistorial(horaMin)} &rarr; ${formateaFechaHistorial(horaMax)} &nbsp; | &nbsp; <strong>Total de horas:</strong> ${totalHoras}`;

    const ventas = history.map((dato) => dato.sell_sold || 0);
    const compras = history.map((dato) => dato.buy_sold || 0);

    if (ventasComprasChart) {
        ventasComprasChart.destroy();
    }

    // --- TABLA DE LAS PRIMERAS 24 HORAS ---
    let tablaExistente = document.getElementById('mejores-table');
    if (tablaExistente) tablaExistente.remove();
    const tabla = document.createElement('table');
    tabla.className = 'table-modern';
    tabla.id = 'mejores-table';
    tabla.innerHTML = `
      <thead>
        <tr>
          <th><div class="dato-item">Fecha/Hora</div></th>
          <th><div class="dato-item">Vendidos</div></th>
          <th><div class="dato-item">Comprados</div></th>
          <th><div class="dato-item">Precio venta avg</div></th>
          <th><div class="dato-item">Precio compra avg</div></th>
        </tr>
      </thead>
      <tbody>
        ${history.slice(-24).reverse().map(dato => {
            // Formatea la fecha/hora
            let raw = dato.date || '';
            let dateObj = raw ? new Date(raw) : null;
            let fechaHora = dateObj && !isNaN(dateObj) ?
                `${dateObj.getFullYear()}-${(dateObj.getMonth()+1).toString().padStart(2,'0')}-${dateObj.getDate().toString().padStart(2,'0')} ${dateObj.getHours().toString().padStart(2,'0')}:00` : raw;
            return `<tr>
              <td><div class="dato-item-info">${fechaHora}</div></td>
              <td><div class="dato-item-info">${dato.sell_sold ?? ''}</div></td>
              <td><div class="dato-item-info">${dato.buy_sold ?? ''}</div></td>
              <td><div class="dato-item-info">${dato.sell_price_avg != null ? formatGoldColored(dato.sell_price_avg) : ''}</div></td>
              <td><div class="dato-item-info">${dato.buy_price_avg != null ? formatGoldColored(dato.buy_price_avg) : ''}</div></td>
            </tr>`;
        }).join('')}
      </tbody>
    `;
    // Inserta la tabla después del gráfico
    const card = ventasComprasChartCtx.canvas.closest('.card');
    if (card) card.appendChild(tabla);

    ventasComprasChart = new Chart(ventasComprasChartCtx, {
        type: 'line',
        data: {
            labels: etiquetas,
            datasets: [
                {
                    label: 'Vendidos por hora',
                    data: ventas,
                    backgroundColor: 'rgba(54, 162, 235, 0.3)',
                    borderColor: 'rgb(54, 235, 235)',
                    borderWidth: 2,
                    pointRadius: 2,
                    tension: 0.2
                },
                {
                    label: 'Comprados por hora',
                    data: compras,
                    backgroundColor: 'rgba(255, 206, 86, 0.3)',
                    borderColor: 'rgb(255, 168, 86)',
                    borderWidth: 2,
                    pointRadius: 2,
                    tension: 0.2
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            const idx = context[0].dataIndex;
                            let raw = horas[idx] || '';
                            let dateObj;
                            if (raw.includes('T')) {
                                dateObj = new Date(raw);
                            } else if (/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(raw)) {
                                dateObj = new Date(raw.replace(' ', 'T'));
                            }
                            if (dateObj && !isNaN(dateObj)) {
                                let yyyy = dateObj.getFullYear();
                                let mm = (dateObj.getMonth()+1).toString().padStart(2,'0');
                                let dd = dateObj.getDate().toString().padStart(2,'0');
                                let hh = dateObj.getHours().toString().padStart(2,'0');
                                let min = dateObj.getMinutes().toString().padStart(2,'0');
                                return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
                            }
                            return raw;
                        },
                        label: function(context) {
                            // Siempre muestra el nombre de la serie + valor
                            return `${context.dataset.label}: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Hora (24h)' }
                },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Cantidad' }
                }
            }
        }
    });
}

function mostrarHoraPunta(history) {
    const { horaPuntaDiv } = getMejoresHorasElements();
    if (!horaPuntaDiv) return;
    horaPuntaDiv.innerHTML = '';
    if (!history || history.length === 0) return;

    let maxTotal = -Infinity;
    let datoMax = null;
    history.forEach(d => {
        const total = (d.sell_sold || 0) + (d.buy_sold || 0);
        if (total > maxTotal) {
            maxTotal = total;
            datoMax = d;
        }
    });

    if (datoMax) {
        let fecha = datoMax.date || '';
        let dateObj = fecha ? new Date(fecha) : null;
        if (dateObj && !isNaN(dateObj)) {
            const yyyy = dateObj.getFullYear();
            const mm = (dateObj.getMonth()+1).toString().padStart(2,'0');
            const dd = dateObj.getDate().toString().padStart(2,'0');
            const hh = dateObj.getHours().toString().padStart(2,'0');
            fecha = `${yyyy}-${mm}-${dd} ${hh}:00`;
        }
        horaPuntaDiv.innerHTML = `<b>Hora punta:</b> ${fecha} &nbsp;|&nbsp; Vendidos: ${datoMax.sell_sold ?? '-'} &nbsp;|&nbsp; Comprados: ${datoMax.buy_sold ?? '-'}`;
    }
}
function mostrarPromedios(history) {
    const { promedioHoraDiv, promedioDiaDiv } = getMejoresHorasElements();
    if (!promedioHoraDiv || !promedioDiaDiv) return;
    promedioHoraDiv.innerHTML = '';
    promedioDiaDiv.innerHTML = '';
    if (!history || history.length === 0) return;

    let totalSell = 0;
    let totalBuy = 0;
    const dias = {};

    history.forEach(d => {
        const sell = d.sell_sold || 0;
        const buy = d.buy_sold || 0;
        totalSell += sell;
        totalBuy += buy;

        let fecha = d.date ? new Date(d.date) : null;
        if (fecha && !isNaN(fecha)) {
            const key = fecha.toISOString().split('T')[0];
            if (!dias[key]) dias[key] = { s:0, b:0 };
            dias[key].s += sell;
            dias[key].b += buy;
        }
    });

    const horas = history.length || 1;
    const numDias = Object.keys(dias).length || 1;

    const avgSellHora = totalSell / horas;
    const avgBuyHora = totalBuy / horas;
    const avgSellDia = totalSell / numDias;
    const avgBuyDia = totalBuy / numDias;

    promedioHoraDiv.innerHTML = `<div class="dato-item">Promedio por hora</div><div class="dato-item-info">Vendidos: ${avgSellHora.toFixed(1)} | Comprados: ${avgBuyHora.toFixed(1)}</div>`;
    promedioDiaDiv.innerHTML = `<div class="dato-item">Promedio por día</div><div class="dato-item-info">Vendidos: ${avgSellDia.toFixed(1)} | Comprados: ${avgBuyDia.toFixed(1)}</div>`;
}
// itemHandlers.js
// Manejadores para las acciones de los ítems

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar manejador del botón de guardar ítem
    initSaveItemHandler();
});

/**
 * Inicializa el manejador del botón de guardar ítem
 */
function initSaveItemHandler() {
    const saveButton = document.getElementById('btn-guardar-item');
    if (!saveButton) return;
    
    // Mostrar/ocultar según autenticación
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) {
        saveButton.style.display = 'none';
        return;
    }
    
    // Agregar manejador de clic
    saveButton.addEventListener('click', handleSaveItem);
}

/**
 * Maneja el guardado de un ítem
 */
function handleSaveItem() {
    // Obtener datos del ítem actual
    const itemId = new URLSearchParams(window.location.search).get('id');
    const itemName = document.querySelector('.item-name')?.textContent || 'Ítem sin nombre';
    
    if (!itemId) {
        window.StorageUtils?.showToast('No se pudo obtener el ítem actual', 'error');
        return;
    }
    
    // Guardar el ítem
    const item = { id: parseInt(itemId), nombre: itemName };
    window.StorageUtils?.saveFavorito('gw2_favoritos_items', item);
    
    // Mostrar notificación
    window.StorageUtils?.showToast('Ítem guardado en favoritos');
}

// Inicialización automática si el DOM ya está cargado
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initSaveItemHandler, 1);
}
// storageUtils.js
// Utilidades para manejar favoritos en localStorage

/**
 * Guarda un ítem como favorito
 * @param {string} key - Clave de almacenamiento (ej: 'gw2_favoritos_items')
 * @param {Object} item - Objeto con id y nombre del ítem
 * @param {number} maxItems - Máximo de ítems a guardar (opcional, por defecto 20)
 * @returns {Array} - Lista actualizada de favoritos
 */
function saveFavorito(key, item, maxItems = 20) {
    if (!item || !item.id) return [];
    
    // Obtener favoritos actuales
    const favoritos = getFavoritos(key);
    
    // Evitar duplicados
    const sinDuplicados = favoritos.filter(fav => fav.id !== item.id);
    
    // Agregar el nuevo ítem al principio
    const nuevosFavoritos = [item, ...sinDuplicados];
    
    // Limitar la cantidad de ítems
    const listaRecortada = nuevosFavoritos.slice(0, maxItems);
    
    // Guardar en localStorage
    localStorage.setItem(key, JSON.stringify(listaRecortada));
    
    return listaRecortada;
}

/**
 * Obtiene la lista de favoritos
 * @param {string} key - Clave de almacenamiento
 * @returns {Array} - Lista de favoritos
 */
function getFavoritos(key) {
    try {
        return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (e) {
        console.error('Error al leer favoritos:', e);
        return [];
    }
}

/**
 * Elimina un ítem de favoritos
 * @param {string} key - Clave de almacenamiento
 * @param {number} itemId - ID del ítem a eliminar
 * @returns {Array} - Lista actualizada de favoritos
 */
function removeFavorito(key, itemId) {
    const favoritos = getFavoritos(key);
    const nuevosFavoritos = favoritos.filter(item => item.id !== itemId);
    localStorage.setItem(key, JSON.stringify(nuevosFavoritos));
    return nuevosFavoritos;
}

/**
 * Muestra una notificación toast
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación (success, error, info)
 */
function showToast(message, type = 'success') {
    // Crear contenedor si no existe
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Crear toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.opacity = '0';
    toast.textContent = message;
    
    // Agregar al DOM
    container.appendChild(toast);
    
    // Mostrar con animación
    setTimeout(() => {
        toast.style.opacity = '1';
    }, 10);
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        toast.style.opacity = '0';
        // Eliminar después de la animación
        setTimeout(() => {
            toast.remove();
            // Eliminar contenedor si no hay más toasts
            if (container.children.length === 0) {
                container.remove();
            }
        }, 300);
    }, 3000);
}

// --- Nuevas utilidades para guardar comparativas ---
/**
 * Guarda una comparativa
 * @param {string} key - Clave de almacenamiento (ej: 'gw2_comparativas')
 * @param {Object} comparativa - Objeto con arreglo ids[] y metadatos (nombres, timestamp)
 * @param {number} maxItems - Máximo de comparativas a guardar
 * @returns {Array} - Lista actualizada de comparativas
 */
function saveComparativa(key, comparativa, maxItems = 20) {
    if (!comparativa || !Array.isArray(comparativa.ids) || comparativa.ids.length === 0) return [];

    const existentes = getComparativas(key);

    // Generar una firma única basada en los IDs ordenados
    const firma = [...comparativa.ids].sort((a,b)=>a-b).join('-');

    const sinDuplicados = existentes.filter(c => {
        const f = Array.isArray(c.ids) ? [...c.ids].sort((a,b)=>a-b).join('-') : '';
        return f !== firma;
    });

    const nuevas = [comparativa, ...sinDuplicados].slice(0, maxItems);
    localStorage.setItem(key, JSON.stringify(nuevas));
    return nuevas;
}

function getComparativas(key) {
    try {
        return JSON.parse(localStorage.getItem(key) || '[]');
    } catch(e) {
        console.error('Error al leer comparativas:', e);
        return [];
    }
}

function removeComparativa(key, firmaComparativa) {
    const existentes = getComparativas(key);
    const filtradas = existentes.filter(c => {
        const f = Array.isArray(c.ids) ? [...c.ids].sort((a,b)=>a-b).join('-') : '';
        return f !== firmaComparativa;
    });
    localStorage.setItem(key, JSON.stringify(filtradas));
    return filtradas;
}

// Exportar funciones para uso global
window.StorageUtils = {
    // Favoritos de ítems
    saveFavorito,
    getFavoritos,
    removeFavorito,
    // Comparativas
    saveComparativa,
    getComparativas,
    removeComparativa,
    // Misceláneas
    showToast
};
const rarityClasses = {
  Basic: 'rarity-basic',
  Fine: 'rarity-fine',
  Masterwork: 'rarity-masterwork',
  Rare: 'rarity-rare',
  Exotic: 'rarity-exotic',
  Ascended: 'rarity-ascended',
  Legendary: 'rarity-legendary'
};

window.getRarityClass = function(rarity) {
  return rarityClasses[rarity] || '';
};
// GW2 Item Tracker v2 - UI Y PRESENTACIÓN (item-ui.js)

// --- Helpers para el input de cantidad global (definidos localmente) ---
function setQtyInputValue(val) {
  const input = document.getElementById('qty-global');
  if (!input) return;
  // Prefiere el valor temporal si existe
  if (typeof window._qtyInputValue !== 'undefined') {
    input.value = window._qtyInputValue;
  } else {
    input.value = window.globalQty;
  }
}

function getQtyInputValue() {
  const input = document.getElementById('qty-global');
  return input ? parseInt(input.value, 10) : 1;
}

// --- Helpers visuales ---

// La función calcPercent se importa desde item.js
function renderWiki(name) {
  if (!name) return;
  const nombre = encodeURIComponent(name.replaceAll(' ', '_'));
  const wikiES = `https://wiki.guildwars2.com/wiki/es:${nombre}`;
  const wikiEN = `https://wiki.guildwars2.com/wiki/${nombre}`;
  const wikiLinksEl = document.getElementById('wiki-links');
  wikiLinksEl.innerHTML = `
    <div class="wiki-links">
      <a href="${wikiES}" target="_blank">Wiki en Español</a>
      <a href="${wikiEN}" target="_blank">Wiki en Inglés</a>
    </div>
  `;
}

// --- Helpers de UI ---
function showLoader(show) {
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = show ? 'block' : 'none';
}
function showError(msg) {
  const errorMessage = document.getElementById('error-message');
  if (errorMessage) {
    errorMessage.textContent = msg;
    errorMessage.style.display = 'block';
  }
}
function hideError() {
  const errorMessage = document.getElementById('error-message');
  if (errorMessage) errorMessage.style.display = 'none';
}

// --- Renderizado recursivo de ingredientes ---
function renderRows(ings, nivel = 1, parentId = null, rowGroupIndex = 0, parentExpanded = true, path = []) {
  // DEPURACIÓN opcional de los radios renderizados
  // ings.forEach((ing, idx) => {
  //   if (nivel > 0) {
  //     console.log('[RENDER RADIO]', { id: ing.id, parentId, modeForParentCrafted: ing.modeForParentCrafted });
  //   }
  // });
  
  return ings.map((ing, idx) => {
    const groupIdx = nivel === 0 ? idx : rowGroupIndex;
    const rowBgClass = groupIdx % 2 === 0 ? 'row-bg-a' : 'row-bg-b';
    const indent = nivel > 0 ? `style="padding-left:${nivel * 30}px"` : '';
    const childClass = `child-of-${ing.id}`;
    const currentPath = [...path, ing._uid].join('-');
    const expandButton = (ing.is_craftable && ing.children && ing.children.length)
      ? `<button class="btn-expand-path" data-path="${currentPath}">${ing.expanded ? '-' : '+'}</button>` : '';
    const isChild = nivel > 0;
    const extraClass = isChild ? `child-of-${parentId}` : '';
    const extraStyle = isChild && !parentExpanded ? 'style="display:none"' : '';
    // --- Lógica para mostrar/ocultar total crafted ---
    const isRoot = nivel === 1 && parentId === null;
    const noMarketPrice = (!ing.buy_price && !ing.sell_price);
    const isLeaf = !(ing.children && ing.children.length);
    const hideTotals = isLeaf; // ocultar solo para nodos hoja

    // Precio de referencia seguro (0 si no es número válido)
    const craftedPriceSafe = (typeof ing.crafted_price === 'number' && !isNaN(ing.crafted_price) && ing.crafted_price > 0) ? ing.crafted_price : 0;
    const rarityClass = typeof getRarityClass === 'function' ? getRarityClass(ing.rarity) : '';
    
    return `
      <tr data-path="${currentPath}" class="${isChild ? `subrow subrow-${nivel} ${extraClass}` : ''} ${rowBgClass}" ${extraStyle}>
        <td class="th-border-left-items" ${indent}><img src="${ing.icon}" width="32"></td>
        <td><a href="item.html?id=${ing.id}" class="item-link ${rarityClass}" target="_blank">${ing.name}</a></td>
        <td>${ing.countTotal || ing.count}</td>
        <td class="item-solo-buy">
          <div>${formatGoldColored(ing.total_buy)}</div>
          <div class="item-solo-precio">${formatGoldColored(ing.buy_price)} <span style="color: #c99b5b">c/u</span></div>
          ${parentId !== null ? `<input type="radio" name="mode-${ing._uid}" class="chk-mode-buy" data-uid="${ing._uid}" ${ing.modeForParentCrafted === 'buy' ? 'checked' : ''} title="Usar precio de compra para el padre">` : ''}
        </td>
        <td class="item-solo-sell">
          <div>${formatGoldColored(ing.total_sell)}</div>
          <div class="item-solo-precio">${formatGoldColored(ing.sell_price)} <span style="color: #c99b5b">c/u</span></div>
          ${parentId !== null ? `<input type="radio" name="mode-${ing._uid}" class="chk-mode-sell" data-uid="${ing._uid}" ${ing.modeForParentCrafted === 'sell' ? 'checked' : ''} title="Usar precio de venta para el padre">` : ''}
        </td>
        <td class="item-solo-crafted">
          ${
            // Nodo raíz SIEMPRE muestra total crafted
            (isRoot && ing.is_craftable) ? `
              <div>${formatGoldColored(ing.total_crafted)}</div>
              <div class="item-solo-precio">${formatGoldColored(craftedPriceSafe)} <span style="color: #c99b5b">c/u</span></div>
            ` :
            // Ingredientes padre sin precio de mercado también lo muestran aunque sean el último hijo
            (parentId !== null && nivel > 0 && ing.is_craftable && noMarketPrice) ? `
              <div>${formatGoldColored(ing.total_crafted)}</div>
              <div class="item-solo-precio">${formatGoldColored(craftedPriceSafe)} <span style="color: #c99b5b">c/u</span></div>
              <input type="radio" name="mode-${ing._uid}" class="chk-mode-crafted" data-uid="${ing._uid}" ${ing.modeForParentCrafted === 'crafted' ? 'checked' : ''} title="Usar precio de crafteo para el padre">
            ` :
            // Nodos hoja (sin hijos) ocultan todo, salvo casos anteriores ya tratados
            (!hideTotals ? `
              <div>${formatGoldColored(ing.total_crafted || ing.total_buy)}</div>
              <div class="item-solo-precio">${ing.is_craftable ? formatGoldColored(craftedPriceSafe) : formatGoldColored(ing.buy_price)} <span style="color: #c99b5b">c/u</span></div>
              ${parentId !== null && nivel > 0 ? `<input type="radio" name="mode-${ing._uid}" class="chk-mode-crafted" data-uid="${ing._uid}" ${ing.modeForParentCrafted === 'crafted' ? 'checked' : ''} title="Usar precio de crafteo para el padre">` : ''}
            ` :
              ``
            )
          }
        </td>
        <td class="th-border-right-items">${expandButton}</td>
      </tr>
      ${(ing.is_craftable && ing.children && ing.children.length && parentExpanded && ing.expanded) ? renderRows(ing.children, nivel + 1, ing.id, groupIdx, ing.expanded, [...path, ing._uid]) : ''}
    `;
  }).join('');
}

// --- Renderizado de la fila principal del ítem (nodo raíz) ---
// --- Renderizado SOLO del nodo raíz. Prohibido usar mainNode.total_buy, siempre usar getTotals(mainNode.children) ---
function renderMainItemRow(mainNode, nivel = 0) {
    if (!mainNode) return '';
    // ✔️ Siempre calcular los totales del nodo raíz con la suma de los hijos
    const qtyValue = (typeof getQtyInputValue !== 'undefined' ? getQtyInputValue() : window.globalQty) || 1;
    const totals = mainNode && mainNode.children ? getTotals(mainNode.children) : { totalBuy: 0, totalSell: 0, totalCrafted: 0 };
    // 🚫 Prohibido: usar mainNode.total_buy, mainNode.total_sell, mainNode.total_crafted para la UI
    const buyPriceUnit = mainNode.buy_price || 0;
    const sellPriceUnit = mainNode.sell_price || 0;
    const rarityClass = typeof getRarityClass === 'function' ? getRarityClass(mainNode.rarity) : '';
    const indent = nivel > 0 ? 'style="margin-left: ' + (nivel * 20) + 'px;"' : '';
    const filaMainItem = `
    <tr class="ingred-row ${mainNode.expanded ? 'expanded' : ''}" data-item-id="${mainNode.id}">
        <td>
            <div class="flex gap-2 items-center" ${indent}>
                <button class="btn-expandir ${mainNode.expanded ? 'expanded' : ''}" data-item-id="${mainNode.id}">
                    ${mainNode.expanded ? '▼' : '▶'}
                </button>
                <img src="${mainNode.icon}" class="w-6 h-6">
                ${mainNode.name}
            </div>
        </td>
        <td>${qtyValue}</td>
        <td class="item-solo-buy">
            <div>${formatGoldColored(totals.totalBuy)}</div>
            <div class="item-solo-precio">${formatGoldColored(buyPriceUnit)} <span style="color: #c99b5b">c/u</span></div>
        </td>
        <td class="item-solo-sell">
            <div>${formatGoldColored(totals.totalSell)}</div>
            <div class="item-solo-precio">${formatGoldColored(sellPriceUnit)} <span style="color: #c99b5b">c/u</span></div>
        </td>
        <td class="item-solo-craft">
            <div>${formatGoldColored(totals.totalCrafted)}</div>
        </td>
        <td></td>
    </tr>
    `;
    return filaMainItem;
}

// --- Renderizado de la sección 7: Ingredientes para craftear ---
function renderCraftingSectionUI() {
  // Asegurar que los datos estén recalculados antes de leer los totales
  if (window.ingredientObjs && window.ingredientObjs.length > 0) {
    recalcAll(window.ingredientObjs, window.globalQty);
  }

  // Obtener output_item_count de la receta principal
  // Cálculo robusto del outputCount como en la comparativa:
  let outputCount = 1;
  const mainRoot = window.ingredientObjs && window.ingredientObjs.length > 0 ? window.ingredientObjs[0] : null;
  if (mainRoot && mainRoot.recipe && mainRoot.recipe.output_item_count && !isNaN(mainRoot.recipe.output_item_count)) {
    outputCount = mainRoot.recipe.output_item_count;
  } else if (window._mainRecipeOutputCount && !isNaN(window._mainRecipeOutputCount)) {
    outputCount = window._mainRecipeOutputCount;
  }

  // --- Totales robustos: buy/sell de hijos y crafted desde el nodo raíz ---
  let totals = { totalBuy: 0, totalSell: 0, totalCrafted: 0 };
  if (mainRoot && mainRoot.children && mainRoot.children.length > 0) {
    const childTotals = getTotals(mainRoot.children);
    totals.totalBuy = childTotals.totalBuy;
    totals.totalSell = childTotals.totalSell;
  }
  if (mainRoot && typeof mainRoot.total_crafted === 'number') {
    totals.totalCrafted = mainRoot.total_crafted;
  }

  // Los detalles de artesanía ya se muestran en el encabezado del ítem
  const mainNode = window.ingredientObjs && window.ingredientObjs.length > 0 ? window.ingredientObjs[0] : null;

  const qtyValue = (typeof getQtyInputValue() !== 'undefined' ? getQtyInputValue() : window.globalQty);
  // Mostrar el precio de mercado directo del ítem (buy_price * cantidad global)
const precioCompraTotal = mainNode && typeof mainNode.buy_price === 'number' ? mainNode.buy_price * qtyValue : 0;
  // Mostrar el precio de mercado directo del ítem (sell_price * cantidad global)
const precioVentaTotal = mainNode && typeof mainNode.sell_price === 'number' ? mainNode.sell_price * qtyValue : 0;
  const precioCraftTotal = totals.totalCrafted;
  const precioCraftingMinTotal = Math.min(totals.totalBuy, totals.totalSell, totals.totalCrafted);
  const precioCraftingMinUnidad = outputCount > 0 ? precioCraftingMinTotal / outputCount : precioCraftingMinTotal;
  const precioCompraUnidad = outputCount > 0 ? totals.totalBuy / outputCount : totals.totalBuy;
  const precioVentaUnidad = outputCount > 0 ? totals.totalSell / outputCount : totals.totalSell;
  const precioCraftUnidad = outputCount > 0 ? totals.totalCrafted / outputCount : totals.totalCrafted;
  const preciosFinales = [precioCompraTotal, precioVentaTotal, precioCraftingMinTotal];
  const precioMinimoFinal = Math.min(...preciosFinales.filter(x => x > 0));
  const preciosFinalesUnidad = [precioCompraUnidad, precioVentaUnidad, precioCraftingMinUnidad];
  const precioMinimoFinalUnidad = Math.min(...preciosFinalesUnidad.filter(x => x > 0));
  const minIdx = preciosFinales.indexOf(precioMinimoFinal);
  const minIdxUnidad = preciosFinalesUnidad.indexOf(precioMinimoFinalUnidad);
  let mensaje = '';
  if (minIdx === 0) mensaje = 'Mejor comprar (Buy)';
  else if (minIdx === 1) mensaje = 'Mejor vender (Sell)';
  else mensaje = 'Mejor craftear (Crafteo)';

  // --- Renderizar tabla de ingredientes con separación de nodo raíz ---
  // 🔥 Checklist de buenas prácticas de renderizado:
  // 1. El nodo raíz SOLO se renderiza con renderMainItemRow(mainNode, 0)
  // 2. NUNCA debe pasar por renderRows()
  // 3. Los hijos se renderizan SIEMPRE con renderRows(mainNode.children, 1)
  // 4. Prohibido: renderRows([mainNode], 0)
  let htmlTabla = '';
  if (mainNode) {
    // ✔️ Renderizar la fila principal (nodo raíz) usando solo renderMainItemRow
    htmlTabla += renderMainItemRow(mainNode, 0);
    // ✔️ Renderizar ingredientes hijos (nivel 1) usando solo renderRows
    htmlTabla += renderRows(mainNode.children, 1);
  }
  // 🚫 Nunca hacer: htmlTabla += renderRows([mainNode], 0); // Esto mostraría mal los totales del nodo raíz

  // Profit
  let profitHtml = '';
  let profitHtmlUnidad = '';
  if (precioVentaTotal > 0) {
    const ventaTrasComisionTotal = precioVentaTotal - (precioVentaTotal * 0.15);
    const ventaTrasComisionUnidad = outputCount > 0 ? ventaTrasComisionTotal / outputCount : ventaTrasComisionTotal;
    const profitBuyUnidad = ventaTrasComisionUnidad - (totals.totalBuy / outputCount);
    const profitSellUnidad = ventaTrasComisionUnidad - (totals.totalSell / outputCount);
    const profitCraftedUnidad = ventaTrasComisionUnidad - (totals.totalCrafted / outputCount);
    const profitBuyTotal = ventaTrasComisionTotal - totals.totalBuy;
    const profitSellTotal = ventaTrasComisionTotal - totals.totalSell;
    const profitCraftedTotal = ventaTrasComisionTotal - totals.totalCrafted;
    if (outputCount === 1) {
      profitHtml = `<section id='profit-section'><br>
        <div class="table-modern-totales">
        <div class="titulo-con-ayuda">
          <div class="ayuda-tooltip">?
            <span class="tooltiptext-modern"> Esta sección muestra la ganancia estimada al vender el ítem después de craftearlo. Se calcula como: (Precio venta - 15% comisión) - costo total de crafteo. También muestra 3 posibles resultados dependiendo de la forma de craftear.</span>
          </div>
          <h3>Profit si se craftea y se vende (ganancia estimada)</h3>
        </div>
        <table class='table-totales totales-crafting-comparativa' style='margin-bottom: 8px;'>
          <tr style='text-align:center;'>
            <td><div class='base-comparativa'>${formatGoldColored(Math.round(profitBuyTotal))} <br><span style='font-size:0.93em;'>Profit "Comprar"</span></div></td>
            <td><div class='base-comparativa'>${formatGoldColored(Math.round(profitSellTotal))} <br><span style='font-size:0.93em;'>Profit "Vender"</span></div></td>
            <td><div class='base-comparativa'>${formatGoldColored(Math.round(profitCraftedTotal))} <br><span style='font-size:0.93em;'>Profit "Craftear"</span></div></td>
          </tr>
          <tr><td colspan='3' style='text-align:center;font-size:0.98em;color:#a1a1aa;'>La ganancia se calcula como: (Precio venta - 15% comisión) - costo total</td></tr>
        </table>
      </div>
      </section>`;
    }
    if (outputCount > 1) {
      const precioVentaUnidadMercado = (_mainSellPrice != null) ? _mainSellPrice : 0;
      const ventaTrasComisionUnidadMercado = precioVentaUnidadMercado - (precioVentaUnidadMercado * 0.15);
      const profitBuyUnidadMercado = ventaTrasComisionUnidadMercado - (totals.totalBuy / outputCount);
      const profitSellUnidadMercado = ventaTrasComisionUnidadMercado - (totals.totalSell / outputCount);
      const profitCraftedUnidadMercado = ventaTrasComisionUnidadMercado - (totals.totalCrafted / outputCount);
      profitHtmlUnidad = `<section id='profit-section-unidad'><br>
        <div class="table-modern-totales">          
        <h3>Profit si se craftea y se vende por UNIDAD (ganancia estimada)</h3>
        <div style='margin-bottom:8px;color:#a1a1aa;font-size:1em;'>Esta receta produce <b>${outputCount}</b> unidades por crafteo. Los siguientes cálculos son por unidad.</div>
        <table class='table-totales totales-crafting-comparativa' style='margin-bottom: 8px;'>
          <tr style='text-align:center;'>
            <td><div class='base-comparativa'>${formatGoldColored(Math.round(profitBuyUnidadMercado))} <br><span style='font-size:0.93em;'>Profit "Comprar"</span></div></td>
            <td><div class='base-comparativa'>${formatGoldColored(Math.round(profitSellUnidadMercado))} <br><span style='font-size:0.93em;'>Profit "Vender"</span></div></td>
            <td><div class='base-comparativa'>${formatGoldColored(Math.round(profitCraftedUnidadMercado))} <br><span style='font-size:0.93em;'>Profit "Craftear"</span></div></td>
          </tr>
          <tr><td colspan='3' style='text-align:center;font-size:0.98em;color:#a1a1aa;'>La ganancia por unidad se calcula como: (Precio venta unitario - 15% comisión) - costo unitario</td></tr>
        </table>
      </div>
      </section>`;
    }
  }

  // --- Insertar tabla de ingredientes en el HTML ---
  let tablaIngredientes = `<table class="table-crafting" id="tabla-crafting">
    <thead>
      <tr>
        <th>Ítem</th>
        <th>Cantidad</th>
        <th>Total Compra</th>
        <th>Total Venta</th>
        <th>Total Crafteo</th>
        <th>Modo</th>
      </tr>
    </thead>
    <tbody>
      ${htmlTabla}
    </tbody>
  </table>`;

  // Tablas de totales
  // Input SIEMPRE antes de la tabla de ingredientes
  let inputQtyHtml = `<div id="qty-global-container" style="margin:18px 0 18px 0;display:flex;align-items:center;gap:12px;">
    <label for="qty-global" style="font-weight:500;">Cantidad global:</label>
    <input id="qty-global" type="number" min="1" value="${qtyValue}" style="width:60px;height:36px;" autocomplete="off">
  </div>`;
  let tablaTotales = `<div class="table-modern-totales">
    <div class="titulo-con-ayuda">
      <div class="ayuda-tooltip">?
        <span class="tooltiptext-modern">Esta sección muestra el costo total de los materiales necesarios para craftear el ítem. Con costo de materiales en venta directa, pedido y crafteo de sus propio materiales.</span>
      </div>
      <h3>Precio total materiales - Crafting</h3>
    </div>
    <div id="totales-crafting">      
      <table class="table-totales" style="margin-top:12px;">
        <tr>
          <th><div class="tooltip-modern">Total Compra
            <span class="tooltiptext-modern">Suma total si haces PEDIDO de materiales en el mercado.</span>
          </div></th>
          <td class="item-solo-buy">${formatGoldColored(totals.totalBuy)} </td>
          <th><div class="tooltip-modern">Total Venta
            <span class="tooltiptext-modern">Suma total si COMPRAS materiales en el mercado.</span>
          </div></th>
          <td class="item-solo-sell">${formatGoldColored(totals.totalSell)}</td>
          <th><div class="tooltip-modern">Total Crafteo
            <span class="tooltiptext-modern">Suma total si CRAFTEAS todos los materiales posibles desde cero.</span>
          </div></th>
          <td class="item-solo-crafted">${formatGoldColored(totals.totalCrafted)}</td>
        </tr>
      </table>
    </div>
    </div>`;
  let tablaTotalesUnidad = '';
  if (outputCount > 1) {
    tablaTotalesUnidad = `<div class="table-modern-totales">
    <div class="titulo-con-ayuda">
      <div class="ayuda-tooltip">?
        <span class="tooltiptext-modern">Muestra el costo por unidad ya que esta receta produce múltiples ítems</span>
      </div>
      <h3>Costos por unidad (${outputCount} unidades por crafteo)</h3>
    </div>
    <div style='margin-bottom:8px;color:#a1a1aa;font-size:1em;'>Esta receta produce <b>${outputCount}</b> unidades por crafteo.</div>
      <div id="totales-crafting">
        <table class="table-totales" style="margin-top:12px;">
          <tr>
            <th><div class="tooltip-modern">Total Compra
              <span class="tooltiptext-modern">Suma total si haces PEDIDO de materiales en el mercado.</span>
            </div></th>
            <td class="item-solo-buy">${formatGoldColored(totals.totalBuy / outputCount)}</td>
            <th><div class="tooltip-modern">Total Venta
              <span class="tooltiptext-modern">Suma total si COMPRAS materiales en el mercado.</span>
            </div></th>
            <td class="item-solo-sell">${formatGoldColored(totals.totalSell / outputCount)}</td>
            <th><div class="tooltip-modern">Total Crafteo
              <span class="tooltiptext-modern">Suma total si CRAFTEAS todos los materiales posibles desde cero.</span>
            </div></th>
            <td class="item-solo-crafted">${formatGoldColored(totals.totalCrafted / outputCount)}</td>
          </tr>
        </table>
      </div>
    </div>`;
  }

  let tablaComparativa = '';
  let tablaComparativaUnidad = '';
  // Generar tabla comparativa antes del return
  if (outputCount === 1) {
    tablaComparativa = `<section id='comparativa-section'>
      <div class="table-modern-totales">
        <div class="titulo-con-ayuda">
          <div class="ayuda-tooltip">?
            <span class="tooltiptext-modern"> Esta sección compara el precio de compra directa y pedido en el mercado con el costo de crafteo más bajo.</span>
          </div>
          <h3>Comparativa de precios de Bazar vs Crafting</h3>
        </div>
        <br>
        <table class='table-totales totales-crafting-comparativa'>
          <tr style='text-align:center;'>
            <td><div class='base-comparativa' style='${minIdx===0 ? 'background:#e84d4d33;' : ''}'>${formatGoldColored(precioCompraTotal)} <br><span style='font-size:0.93em;'>Precio compra</span></div></td>
            <td><div class='base-comparativa' style='${minIdx===1 ? 'background:#4db1e833;' : ''}'>${formatGoldColored(precioVentaTotal)} <br><span style='font-size:0.93em;'>Precio venta</span></div></td>
            <td><div class='base-comparativa' style='${minIdx===2 ? 'background:#4fc17833;' : ''}'>${formatGoldColored(precioCraftingMinTotal)} <br><span style='font-size:0.93em;'>Precio crafting más bajo</span></div></td>
          </tr>
          <tr><td colspan='3' style='text-align:center;font-size:1.07em;'>${mensaje}</td></tr>
        </table>
      </div>
      </section>`;
  }
  if (outputCount > 1) {
    const globalQty = window.globalQty || 1;
    const precioCompraUnidadMercado = (_mainBuyPrice != null) ? (_mainBuyPrice * globalQty) / outputCount : 0;
    const precioVentaUnidadMercado = (_mainSellPrice != null) ? (_mainSellPrice * globalQty) / outputCount : 0;
    const precioCraftingMinUnidadReal = outputCount > 0 ? precioCraftingMinTotal / outputCount : precioCraftingMinTotal;
    const preciosUnidadCorr = [precioCompraUnidadMercado, precioVentaUnidadMercado, precioCraftingMinUnidadReal];
    const precioMinimoUnidadReal = Math.min(...preciosUnidadCorr.filter(x => x > 0));
    const minIdxUnidad = preciosUnidadCorr.indexOf(precioMinimoUnidadReal);
    tablaComparativaUnidad = `<section id='comparativa-section-unidad'>
      <div class=\"table-modern-totales\"><br>
        <h3>Comparativa de precios de Bazar vs Crafting por UNIDAD</h3>
        <div style='margin-bottom:8px;color:#a1a1aa;font-size:1em;'>Esta receta produce <b>${outputCount}</b> unidades por crafteo. Los siguientes precios son por unidad.</div>
        <table class='table-totales totales-crafting-comparativa'>
          <tr style='text-align:center;'>
            <td><div style='${minIdxUnidad===0 ? 'background:#e84d4d33;font-weight:bold;border-radius:6px;padding:10px;' : ''}'>${formatGoldColored(precioCompraUnidadMercado)} <br><span style='font-size:0.93em;'>Precio compra</span></div></td>
            <td><div style='${minIdxUnidad===1 ? 'background:#4db1e833;font-weight:bold;border-radius:6px;padding:10px;' : ''}'>${formatGoldColored(precioVentaUnidadMercado)} <br><span style='font-size:0.93em;'>Precio venta</span></div></td>
            <td><div style='${minIdxUnidad===2 ? 'background:#4fc17833;font-weight:bold;border-radius:6px;padding:10px;' : ''}'>${formatGoldColored(precioCraftingMinUnidadReal)} <br><span style='font-size:0.93em;'>Precio crafting más bajo</span></div></td>
          </tr>
          <tr><td colspan='3' style='text-align:center;font-size:1.07em;'>${mensaje}</td></tr>
        </table>
      </div>
      </section>`;
  }

  // HTML FINAL: inputQtyHtml SIEMPRE antes de la tabla de ingredientes
  let htmlFinal = `
    ${inputQtyHtml}
    <table class="table-modern tabla-tarjetas">
      <thead class="header-items">
        <tr>
          <th class="th-border-left">Ícono</th>
          <th>Nombre</th>
          <th>Cantidad</th>
          <th>Total Compra</th>
          <th>Total Venta</th>
          <th>Total Crafteo</th>
          <th class="th-border-right"></th>
        </tr>
      </thead>
      <tbody>${renderRows(window.ingredientObjs)}</tbody>
    </table>
    ${tablaTotales}
    ${outputCount > 1 ? tablaTotalesUnidad : ''}
    ${tablaComparativa}
    ${outputCount > 1 ? tablaComparativaUnidad : ''}
    ${profitHtml}
    ${outputCount > 1 ? profitHtmlUnidad : ''}
  `;
  // console.log('[LOG][renderCraftingSectionUI] Antes del return.', outputCount);
  return htmlFinal;

}

// --- Renderizado principal refactorizado ---
async function renderItemUI(itemData, marketData) {
  // console.log('%cLEGACY renderItemUI ejecutado', 'color: #f44336; font-weight: bold;', itemData);

  const itemHeader = document.getElementById('item-header');
  // Verificar si hay información de artesanía
  let craftingInfo = '';
  if (itemData.details?.disciplines?.length > 0 || itemData.details?.min_rating > 0) {
    const disciplineNames = {
      'Artificer': 'Artesano',
      'Armorsmith': 'Armero',
      'Chef': 'Cocinero',
      'Huntsman': 'Cazador',
      'Jeweler': 'Joyero',
      'Leatherworker': 'Peletero',
      'Tailor': 'Sastre',
      'Weaponsmith': 'Armero de armas',
      'Scribe': 'Escriba'
    };

    const translatedDisciplines = (itemData.details.disciplines || [])
      .map(d => disciplineNames[d] || d);

    craftingInfo = `
      <div style="margin-top: 4px; color: #a1a1aa; font-size: 0.95rem;">
        ${itemData.details.min_rating ? `<span style="color: #16c198; font-weight: 500;">Nivel:</span> ${itemData.details.min_rating} ` : ''}
        ${translatedDisciplines.length > 0 ? 
          `<span style="color: #16c198; font-weight: 500;">${itemData.details.min_rating ? '• ' : ''}Disciplinas:</span> ${translatedDisciplines.join(', ')}` : ''}
      </div>
    `;
  }

  const rarityClass = typeof getRarityClass === 'function' ? getRarityClass(itemData.rarity) : '';
  itemHeader.innerHTML = `
    <img src="${itemData.icon}" alt=""/>
    <div>
      <h2 class="${rarityClass}">${itemData.name}</h2>
      <div style="color:#a1a1aa;font-size:1.05rem;">
        ID: ${itemData.id} &nbsp;|&nbsp; ${itemData.type} ${itemData.rarity ? ' - ' + itemData.rarity : ''}
      </div>
      ${craftingInfo}
    </div>
  `;

  // Precios
  const precios = `
    <table class="table-modern">
      <tr>
        <th><div class="dato-item tooltip-modern">Precio de compra
          <span class="tooltiptext-modern">Precio al que los compradores están dispuestos a adquirir el ítem (mejor oferta de compra).</span>
        </div></th>
        <td><div class="dato-item-info">${formatGoldColored(marketData.buy_price)}</div></td>
      </tr>
      <tr>
        <th><div class="dato-item tooltip-modern">Precio de venta
          <span class="tooltiptext-modern">Precio al que los vendedores ofrecen el ítem (mejor oferta de venta).</span>
        </div></th>
        <td><div class="dato-item-info">${formatGoldColored(marketData.sell_price)}</div></td>
      </tr>
      <tr>
        <th><div class="dato-item tooltip-modern">Disponibles para vender
          <span class="tooltiptext-modern">Cantidad total de ítems listados actualmente para vender en el mercado.</span>
        </div></th>
        <td><div class="dato-item-info">${marketData.sell_quantity ?? '-'}</div></td>
      </tr>
      <tr>
        <th><div class="dato-item tooltip-modern">Disponibles para comprar
          <span class="tooltiptext-modern">Cantidad total de ítems que los compradores buscan adquirir en el mercado.</span>
        </div></th>
        <td><div class="dato-item-info">${marketData.buy_quantity ?? '-'}</div></td>
      </tr>
    </table>
  `;
  // --- Renderizar resumen de mercado SOLO en #resumen-mercado ---
  const resumenMercadoDiv = document.getElementById('resumen-mercado');

  if (resumenMercadoDiv) {

    resumenMercadoDiv.innerHTML = `
      <table class=\"table-modern\">
        <tr>
          <th><div class="dato-item tooltip-modern">Precio de compra
            <span class="tooltiptext-modern">Precio al que los compradores están dispuestos a adquirir el ítem (mejor oferta de compra).</span>
          </div></th>
          <td><div class="dato-item-info">${formatGoldColored(marketData.buy_price)}</div></td>
        </tr>
        <tr>
          <th><div class="dato-item tooltip-modern">Precio de venta
            <span class="tooltiptext-modern">Precio al que los vendedores ofrecen el ítem (mejor oferta de venta).</span>
          </div></th>
          <td><div class="dato-item-info">${formatGoldColored(marketData.sell_price)}</div></td>
        </tr>
        <tr>
          <th><div class="dato-item tooltip-modern">Disponibles para vender
            <span class="tooltiptext-modern">Cantidad total de ítems listados actualmente para vender en el mercado.</span>
          </div></th>
          <td><div class="dato-item-info">${marketData.sell_quantity ?? '-'}</div></td>
        </tr>
        <tr>
          <th><div class="dato-item tooltip-modern">Disponibles para comprar
            <span class="tooltiptext-modern">Cantidad total de ítems que los compradores buscan adquirir en el mercado.</span>
          </div></th>
          <td><div class="dato-item-info">${marketData.buy_quantity ?? '-'}</div></td>
        </tr>
      </table>
      <section id="ventas-compras" class="bloque-section">
        <h3>Ventas y Compras Recientes</h3>
        <table class="table-modern">
          <tr><th></th><th style="text-align:center;">1 día</th><th style="text-align:center;">2 días</th><th style="text-align:center;">7 días</th><th style="text-align:center;">1 mes</th></tr>
          <tr>
            <th><div class="dato-item tooltip-modern">Ventas
                <span class="tooltiptext-modern">Cantidad de ítems comprados directamente en el periodo (actividad de salida del mercado).</span>
                </div>
            </th>
            <td><div class="dato-item-info">${marketData['1d_sell_sold'] ?? '-'}</div></td>
            <td><div class="dato-item-info">${marketData['2d_sell_sold'] ?? '-'}</div></td>
            <td><div class="dato-item-info">${marketData['7d_sell_sold'] ?? '-'}</div></td>
            <td><div class="dato-item-info">${marketData['1m_sell_sold'] ?? '-'}</div></td>
          </tr>
          <tr>
            <th><div class="dato-item tooltip-modern">Compras
                <span class="tooltiptext-modern">Cantidad de ítems vendidos directamente en el periodo (actividad de entrada al mercado).</span>
                </div></th>
            <td><div class="dato-item-info">${marketData['1d_buy_sold'] ?? '-'}</div></td>
            <td><div class="dato-item-info">${marketData['2d_buy_sold'] ?? '-'}</div></td>
            <td><div class="dato-item-info">${marketData['7d_buy_sold'] ?? '-'}</div></td>
            <td><div class="dato-item-info">${marketData['1m_buy_sold'] ?? '-'}</div></td>
          </tr>
          <tr><td colspan="5" style="color:#888;font-size:0.95em;">* Basado en actividad reciente.</td></tr>
        </table>
      </section>
      <section id="porcentajes-rotacion" class="bloque-section">
        <h3>Porcentajes de Rotación</h3>
        <table class="table-modern">
          <tr><th></th><th style="text-align:center;">1 día</th><th style="text-align:center;">2 días</th><th style="text-align:center;">7 días</th><th style="text-align:center;">1 mes</th></tr>
          <tr>
            <th><div class="dato-item tooltip-modern">Ventas/Supply
                <span class="tooltiptext-modern">Porcentaje de ítems comprados directamente respecto al total disponible (rotación de inventario en el mercado).</span>
                </div></th>
            <td><div class="dato-item-info">${calcPercent(marketData['1d_sell_sold'], marketData.sell_quantity)}</div></td>
            <td><div class="dato-item-info">${calcPercent(marketData['2d_sell_sold'], marketData.sell_quantity)}</div></td>
            <td><div class="dato-item-info">${calcPercent(marketData['7d_sell_sold'], marketData.sell_quantity)}</div></td>
            <td><div class="dato-item-info">${calcPercent(marketData['1m_sell_sold'], marketData.sell_quantity)}</div></td>
          </tr>
          <tr>
            <th><div class="dato-item tooltip-modern">Compras/Demand
                <span class="tooltiptext-modern">Porcentaje de ítems vendidos directamente respecto a la demanda total (flujo de entrada al mercado).</span>
                </div></th>
            <td><div class="dato-item-info">${calcPercent(marketData['1d_buy_sold'], marketData.buy_quantity)}</div></td>
            <td><div class="dato-item-info">${calcPercent(marketData['2d_buy_sold'], marketData.buy_quantity)}</div></td>
            <td><div class="dato-item-info">${calcPercent(marketData['7d_buy_sold'], marketData.buy_quantity)}</div></td>
            <td><div class="dato-item-info">${calcPercent(marketData['1m_buy_sold'], marketData.buy_quantity)}</div></td>
          </tr>
          <tr><td colspan="5" style="color:#888;font-size:0.95em;">* Basado en actividad reciente comparada con la cantidad disponible.</td></tr>
        </table>
      </section>
    `;
  }

  // --- Renderizar SOLO crafting en #info-item ---
  const infoItemDiv = document.getElementById('info-item');

  if (infoItemDiv) {
    // 🔥 Recalcular todos los ingredientes ANTES de renderizar la UI
    if (window.ingredientObjs && window.ingredientObjs.length > 0) {
      recalcAll(window.ingredientObjs, window.globalQty);
    }
    infoItemDiv.innerHTML = `
      <div id=\"seccion-totales\"></div>
      <div id=\"seccion-comparativa\"></div>
      <div id=\"seccion-crafting\"></div>
    `;
    document.getElementById('seccion-totales').innerHTML = '';
    document.getElementById('seccion-comparativa').innerHTML = '';
    document.getElementById('seccion-crafting').innerHTML = renderCraftingSectionUI();
  }



  renderWiki(itemData.name);
  installUIEvents();
}

// --- Instalación de eventos y render seguro ---
function installUIEvents() {
  // Evitar doble instalación
  if (window._uiEventsInstalled) return;
  window._uiEventsInstalled = true;
  
  // console.log('[INIT] installUIEvents llamada');
  
  // Handler input cantidad global - LÓGICA IDÉNTICA A compare-ui.js
  if (!window._qtyGlobalHandlerInstalled) {
    window._qtyGlobalHandlerInstalled = true;
    // INPUT: permite escribir varios dígitos, no fuerza recalculo salvo que sea válido
    document.addEventListener('input', function(e) {
      if (e.target && e.target.id === 'qty-global') {
        window._qtyInputValue = e.target.value;
        // NO recalcula, NO renderiza, NO actualiza globalQty aquí
      }
    });
    // BLUR: si el valor es inválido, lo pone en 1
    document.addEventListener('blur', function(e) {
      if (e.target && e.target.id === 'qty-global') {
        const input = e.target;
        let val = parseInt(input.value, 10);
        if (isNaN(val) || val < 1) {
          setGlobalQty(1);
          window._qtyInputValue = '1';
        } else {
          setGlobalQty(val);
          window._qtyInputValue = input.value;
        }
        if (typeof window._qtyInputValue !== 'undefined' && String(window._qtyInputValue) === String(window.globalQty)) {
          delete window._qtyInputValue;
        }
        window.ingredientObjs.forEach(ing => ing.recalc(window.globalQty));
        const node = document.querySelector('#seccion-crafting, div#seccion-crafting');
        if (node) node.innerHTML = renderCraftingSectionUI();
      }
    }, true);
    // ENTER: igual que blur
    document.addEventListener('keydown', function(e) {
      if (e.target && e.target.id === 'qty-global' && (e.key === 'Enter')) {
        e.preventDefault(); // Evita salto de línea o submit
        const input = e.target;
        let val = parseInt(input.value, 10);
        if (isNaN(val) || val < 1) {
          setGlobalQty(1);
          window._qtyInputValue = '1';
        } else {
          setGlobalQty(val);
          window._qtyInputValue = input.value;
        }
        if (typeof window._qtyInputValue !== 'undefined' && String(window._qtyInputValue) === String(window.globalQty)) {
          delete window._qtyInputValue;
        }
        window.ingredientObjs.forEach(ing => ing.recalc(window.globalQty));
        const node = document.querySelector('#seccion-crafting, div#seccion-crafting');
        if (node) node.innerHTML = renderCraftingSectionUI();
      }
    });
  }

  // Manejador centralizado para los radios de modo
  document.addEventListener('change', function(e) {
    const input = e.target;
    if (!input.matches('.chk-mode-buy, .chk-mode-sell, .chk-mode-crafted')) return;
  
    const uid = input.dataset.uid;
    if (!uid) return;
    const ing = findIngredientByUid(window.ingredientObjs, uid);
    if (!ing) return;
  
    if (input.classList.contains('chk-mode-buy')) {
      ing.modeForParentCrafted = 'buy';
    } else if (input.classList.contains('chk-mode-sell')) {
      ing.modeForParentCrafted = 'sell';
    } else if (input.classList.contains('chk-mode-crafted')) {
      ing.modeForParentCrafted = 'crafted';
    }
  
    recalcAll(window.ingredientObjs, window.globalQty);
    safeRenderTable();
  });

  // Handler global para expandir/colapsar ingredientes hijos por data-path
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn-expand-path');
    if (!btn) return;
    const pathStr = btn.getAttribute('data-path');
    if (!pathStr) return;
    const path = pathStr.split('-').map(x => x.trim());
    const ing = findIngredientByPath(window.ingredientObjs, path);
    if (ing) {
      ing.expanded = !ing.expanded;
      if (typeof safeRenderTable === 'function') safeRenderTable();
    }
  });
}




// --- Inicialización de eventos y render seguro ---
function safeRenderTable() {
  // Siempre recalcula y renderiza la sección de ingredientes y totales.
  recalcAll(window.ingredientObjs, window.globalQty);

  const seccion = document.getElementById('seccion-crafting');
  if (seccion) {
    // Guardar el valor actual del input y el estado de los expandibles
    const qtyInput = document.getElementById('qty-global');
    const currentQty = qtyInput ? qtyInput.value : window.globalQty;
    const expandedStates = snapshotExpandState(window.ingredientObjs);

    // Renderizar de nuevo toda la sección
    seccion.innerHTML = renderCraftingSectionUI();

    // Restaurar el valor del input y el estado de los expandibles
    const newQtyInput = document.getElementById('qty-global');
    if (newQtyInput) {
      newQtyInput.value = currentQty;
    }
    restoreExpandState(window.ingredientObjs, expandedStates);
  }
}
  // Re-sincronizar el input de cantidad global
  setTimeout(() => {
    setQtyInputValue(window.globalQty);
    const input = document.getElementById('qty-global');

    if (input) {
      // Debug opcional sobre cambios en el input
      // input.addEventListener('input', (e) => {
      //   console.log('[DEBUG] input qty-global changed:', e.target.value);
      // });
      // input.addEventListener('change', (e) => {
      //   console.log('[DEBUG] change qty-global:', e.target.value);
      // });
    }
  }, 0);

  // --- FIX: Instalar listeners de expand/collapse tras renderizar ---
  setTimeout(() => {
    if (typeof installUIEvents === 'function') {
      installUIEvents();

    } else {
      console.warn('[ADVERTENCIA] installUIEvents no está definido');
    }
  }, 0);

// --- Inicialización principal ---
// --- Exportaciones ---
async function initItemUI(itemData, marketData) {
  window._lastItemData = itemData;
  window._lastMarketData = marketData;
  showLoader(false);
  hideError();
  await renderItemUI(itemData, marketData);
}

window.showLoader = showLoader;
window.showError = showError;
window.hideError = hideError;
window.renderItemUI = renderItemUI;
window.installUIEvents = installUIEvents;

  // GW2 Item Tracker v2 - Integración con DataWars2 API v2
  
  
  // --- Clase CraftIngredient ---
  let __uidCounter = 0;
  // Garantizar que globalQty exista siempre
  if (typeof window.globalQty === 'undefined' || isNaN(parseInt(window.globalQty,10))) {
    window.globalQty = 1;
  }
  export class CraftIngredient {
    constructor(id, name, icon, rarity, count, recipe, buy_price, sell_price, is_craftable, children = [], parentId = null, mode = 'buy') {
      this._uid = CraftIngredient.nextUid++;
      this.id = id;
      this.name = name;
      this.icon = icon;
      this.rarity = rarity;
      this.count = count;
      this.recipe = recipe;
      this.buy_price = buy_price;
      this.sell_price = sell_price;
      this.is_craftable = is_craftable;
      this.children = (children || []).map(c => new CraftIngredient(c.id, c.name, c.icon, c.rarity, c.count, c.recipe, c.buy_price, c.sell_price, c.is_craftable, c.children, this.id, c.modeForParentCrafted));
      this._parentId = parentId;
      this.modeForParentCrafted = mode;
  
      this.countTotal = 0;
      this.total_buy = 0;
      this.total_sell = 0;
      this.total_crafted = 0;
    }
  
    recalc(isRoot, parentCountTotal = null) {
      // Determina si es el nodo raíz si se le indica explícitamente O si no tiene padre.
      // Esto hace que la lógica sea robusta frente a llamadas incorrectas desde la UI.
      const amIRoot = (isRoot === true) || (!this._parentId);
      
      // El recuento total para el nodo raíz se basa en la cantidad global. Para los hijos, se basa en el recuento del padre.
      this.countTotal = (amIRoot ? (window.globalQty || 1) : (parentCountTotal || 1)) * this.count;
  
      // Primero, recalcula los hijos (cálculo ascendente).
      if (this.children && this.children.length > 0) {
          this.children.forEach(c => c.recalc(false, this.countTotal));
      }
  
      // Ahora, calcula los totales para el nodo actual basándose en los valores actualizados de sus hijos.
      if (amIRoot) {
          // El valor de un nodo raíz es SIEMPRE la suma de los valores de sus hijos.
          this.total_buy = this.children.reduce((sum, child) => sum + (child.total_buy || 0), 0);
          this.total_sell = this.children.reduce((sum, child) => sum + (child.total_sell || 0), 0);
          
          // El precio "crafteado" del raíz es la suma de los valores elegidos de sus hijos (comprar, vender o craftear).
          this.total_crafted = this.children.reduce((sum, ing) => {
              let valueToAdd = 0;
              switch (ing.modeForParentCrafted) {
                  case 'buy': valueToAdd = ing.total_buy; break;
                  case 'sell': valueToAdd = ing.total_sell; break;
                  case 'crafted': valueToAdd = ing.total_crafted; break;
                  default: valueToAdd = ing.total_buy; break; // Por defecto, usar el precio de compra.
              }
              return sum + (valueToAdd || 0);
          }, 0);
  
            } else { // Para todos los nodos que no son raíz.
          // Por defecto, el costo de compra/venta se basa en el precio de mercado.
          this.total_buy = (this.buy_price || 0) * this.countTotal;
          this.total_sell = (this.sell_price || 0) * this.countTotal;

          // Si el ítem es crafteable y tiene ingredientes, calculamos su costo de crafteo.
          if (this.is_craftable && this.children.length > 0) {
              this.total_crafted = this.children.reduce((sum, ing) => {
                  let valueToAdd = 0;
                  switch (ing.modeForParentCrafted) {
                      case 'buy': valueToAdd = ing.total_buy; break;
                      case 'sell': valueToAdd = ing.total_sell; break;
                      case 'crafted': valueToAdd = ing.total_crafted; break;
                      default: valueToAdd = ing.total_buy; break;
                  }
                  return sum + (valueToAdd || 0);
              }, 0);

              // Si un subcomponente no se puede comprar, su costo es el de sus materiales.
              if (!this.buy_price && !this.sell_price) {
                  this.total_buy = this.children.reduce((sum, child) => sum + (child.total_buy || 0), 0);
                  this.total_sell = this.children.reduce((sum, child) => sum + (child.total_sell || 0), 0);
              }
          } else {
              // Si no es crafteable o no tiene ingredientes, el costo de crafteo es nulo.
              this.total_crafted = null;
          }
      }
    }
  }
  // Propiedad estática para UIDs únicos.
  CraftIngredient.nextUid = 0;
  
  const params = new URLSearchParams(window.location.search);
  const itemId = parseInt(params.get('id'), 10);
  const loader = document.getElementById('loader');
  const errorMessage = document.getElementById('error-message');
  const infoItem = document.getElementById('info-item');
  const ingredientesEl = document.getElementById('ingredientes');
  const wikiLinksEl = document.getElementById('wiki-links');
  const itemHeader = document.getElementById('item-header');
  
  // Elementos del DOM
  
  function calcPercent(sold, available) {
    if (!sold || !available || isNaN(sold) || isNaN(available) || available === 0) return '-';
    return ((sold / available) * 100).toFixed(1) + '%';
  }
  
  
  // --- Fin de formatGold ---
  
  async function main() {
    if (!itemId) {
      window.showError('ID de ítem no válido.');
      return;
    }
    window.showLoader(true);
    window.hideError();
    try {
      // 1. Datos de mercado desde Datawars2 CSV (por ítem)
      const csvUrl = `https://api.datawars2.ie/gw2/v1/items/csv?fields=buy_price,sell_price,buy_quantity,sell_quantity,last_updated,1d_buy_sold,1d_sell_sold,2d_buy_sold,2d_sell_sold,7d_buy_sold,7d_sell_sold,1m_buy_sold,1m_sell_sold&ids=${itemId}`;
      const csvText = await fetch(csvUrl).then(r => r.text());
      const [headers, values] = csvText.trim().split('\n').map(line => line.split(','));
      const marketData = {};
      headers.forEach((h, i) => {
        if (h === 'last_updated') {
          marketData[h] = values[i] || '-';
        } else if (h === 'buy_price' || h === 'sell_price') {
          marketData[h] = values[i] !== '' ? parseInt(values[i], 10) : null;
        } else {
          marketData[h] = values[i] !== '' ? parseInt(values[i], 10) : null;
        }
      });
      if (!marketData.buy_price && !marketData.sell_price) throw new Error('No se encontró información de mercado para este ítem.');
      // Guardar precios principales globales para uso en comparativa
      window._mainBuyPrice = marketData.buy_price;
      window._mainSellPrice = marketData.sell_price;
  
      // 2. Datos básicos desde API oficial GW2
      const apiRes = await fetch(`https://api.guildwars2.com/v2/items/${itemId}`);
      const apiData = await apiRes.json();
  
      // Renderizar encabezado y datos básicos con color por rareza
      const rarityClass = typeof getRarityClass === 'function' ? getRarityClass(apiData.rarity) : '';
      itemHeader.innerHTML = `
        <img src="${apiData.icon}" alt=""/>
        <div>
          <h2 class="${rarityClass}">${apiData.name}</h2>
          <div style="color:#a1a1aa;font-size:1.05rem;">ID: ${apiData.id} &nbsp;|&nbsp; ${apiData.type} ${apiData.rarity ? ' - ' + apiData.rarity : ''}</div>
        </div>
      `;
      // Sección 1: Tabla de precios + Sección 2 + Sección 3
      let html = `
        <table class="table-modern">
          <tr><th><div class="dato-item">Precio de compra</div></th><td><div class="dato-item-info">${formatGoldColored(marketData.buy_price)}</div></td></tr>
          <tr><th><div class="dato-item">Precio de venta</div></th><td><div class="dato-item-info">${formatGoldColored(marketData.sell_price)}</div></td></tr>
          <tr><th><div class="dato-item">Disponibles para comprar</div></th><td><div class="dato-item-info">${marketData.buy_quantity ?? '-'}</div></td></tr>
          <tr><th><div class="dato-item">Disponibles para vender</div></th><td><div class="dato-item-info">${marketData.sell_quantity ?? '-'}</div></td></tr>
          <!-- <tr><th><div class="dato-item">Última actualización</div></th><td><div class="dato-item-info">${marketData.last_updated || '-'}</div></td></tr> -->
        </table>
        
        <!-- Sección 2: Ventas y Compras Recientes -->
        <section id="ventas-compras" class="bloque-section">
          <h3>Ventas y Compras Recientes</h3>
          <table class="table-modern">
            <tr><th></th><th>1 día</th><th>2 días</th><th>7 días</th><th>1 mes</th></tr>
            <tr>
              <th><div class="dato-item tooltip-modern">Ventas
                  <span class="tooltiptext-modern">Cantidad de ítems vendidos en el periodo (actividad de salida del mercado).</span>
                  </div>
              </th>
              <td><div class="dato-item-info">${marketData['1d_sell_sold'] ?? '-'}</div></td>
              <td><div class="dato-item-info">${marketData['2d_sell_sold'] ?? '-'}</div></td>
              <td><div class="dato-item-info">${marketData['7d_sell_sold'] ?? '-'}</div></td>
              <td><div class="dato-item-info">${marketData['1m_sell_sold'] ?? '-'}</div></td>
            </tr>
            <tr>
              <th><div class="dato-item tooltip-modern">Compras
    <span class="tooltiptext-modern">Cantidad de ítems comprados en el periodo (actividad de entrada al mercado).</span>
  </div></th>
              <td><div class="dato-item-info">${marketData['1d_buy_sold'] ?? '-'}</div></td>
              <td><div class="dato-item-info">${marketData['2d_buy_sold'] ?? '-'}</div></td>
              <td><div class="dato-item-info">${marketData['7d_buy_sold'] ?? '-'}</div></td>
              <td><div class="dato-item-info">${marketData['1m_buy_sold'] ?? '-'}</div></td>
            </tr>
            <tr><p style="color:#888;font-size:0.95em;">* Basado en actividad reciente.</p></tr>
          </table>
        </section>
        
        <!-- Sección 3: Porcentajes de rotación -->
        <section id="porcentajes-rotacion" class="bloque-section">
          <h3>Porcentajes de Rotación</h3>
          <table class="table-modern">
            <tr><th></th><th>1 día</th><th>2 días</th><th>7 días</th><th>1 mes</th></tr>
            <tr>
              <th><div class="dato-item tooltip-modern">Ventas/Supply
    <span class="tooltiptext-modern">Porcentaje de ítems vendidos respecto al total disponible (rotación de inventario en el mercado).</span>
  </div></th>
              <td><div class="dato-item-info">${calcPercent(marketData['1d_sell_sold'], marketData.sell_quantity)}</div></td>
              <td><div class="dato-item-info">${calcPercent(marketData['2d_sell_sold'], marketData.sell_quantity)}</div></td>
              <td><div class="dato-item-info">${calcPercent(marketData['7d_sell_sold'], marketData.sell_quantity)}</div></td>
              <td><div class="dato-item-info">${calcPercent(marketData['1m_sell_sold'], marketData.sell_quantity)}</div></td>
            </tr>
            <tr>
              <th><div class="dato-item tooltip-modern">Compras/Demand
    <span class="tooltiptext-modern">Porcentaje de ítems comprados respecto a la demanda total (flujo de entrada al mercado).</span>
  </div></th>
              <td><div class="dato-item-info">${calcPercent(marketData['1d_buy_sold'], marketData.buy_quantity)}</div></td>
              <td><div class="dato-item-info">${calcPercent(marketData['2d_buy_sold'], marketData.buy_quantity)}</div></td>
              <td><div class="dato-item-info">${calcPercent(marketData['7d_buy_sold'], marketData.buy_quantity)}</div></td>
              <td><div class="dato-item-info">${calcPercent(marketData['1m_buy_sold'], marketData.buy_quantity)}</div></td>
            </tr>
            <tr><p style="color:#888;font-size:0.95em;">* Basado en actividad reciente comparada con la cantidad disponible.</p></tr>
          </table>
          
        </section>
      
  
      
      <!-- Sección 5: Placeholder para Totales de Costo -->
      <section id="seccion-totales"></section>
      
      <!-- Sección 6: Placeholder para Comparativa de Ganancia -->
      <section id="seccion-comparativa"></section>
      
      <!-- Sección 7: Ingredientes para craftear -->
      <section id="seccion-crafting"></section>
      `;
  
     
  
      // Renderizar la sección 7 (crafting)
      const craftingHtml = await renderCraftingSection(itemId);
      html = html.replace('<section id="seccion-crafting"></section>', `<section id="seccion-crafting">${craftingHtml}</section>`);
  
      window.renderItemUI(apiData, marketData);
  
      // Renderizar enlaces wiki
      renderWiki(apiData.name);
    } catch (e) {
      window.showError(e.message || 'Error al cargar el ítem.');
    } finally {
      window.showLoader(false);
    }
  }
  
  // Estructura de datos para ingredientes de crafteo y lógica de cálculo
  
  
  // --- Helpers de estado global ---

// --- Paso 2: Asigna _parentId de forma robusta a todo el árbol ---
/**
 * Asigna el campo _parentId a cada nodo del árbol de ingredientes.
 * Debe ejecutarse SIEMPRE después de construir el árbol y antes de cualquier renderizado o manipulación.
 * @param {Array} nodos - Array de nodos raíz del árbol de ingredientes
 * @param {string|null} parentId - ID del padre (usar "" o null en la raíz)
 */
function asignarParentIds(nodos, parentId = "") {
  nodos.forEach(ing => {
    ing._parentId = parentId !== null ? String(parentId) : "";
    if (Array.isArray(ing.children)) {
      asignarParentIds(ing.children, ing.id);
    }
  });
}



  window.ingredientObjs = []; // SIEMPRE global
  async function renderCraftingSection(itemId) {
    // --- SNAPSHOT DE EXPANSIÓN ---
  
  
    // Guardar snapshot antes de reconstruir
    const _expandSnapshot = window.ingredientObjs ? snapshotExpandState(window.ingredientObjs) : {};
  
    // Siempre asegurar que sea array
    if (!window.ingredientObjs || !Array.isArray(window.ingredientObjs)) window.ingredientObjs = [];
  
    // --- ÁRBOL DE INGREDIENTES Y LOGICA ---
    function createCraftIngredientFromRecipe(recipe, parentMultiplier = 1, parentId = null) {
      const ingredient = new CraftIngredient(
        recipe.id,
        recipe.name,
        recipe.icon,
        recipe.rarity,
        recipe.count || 1,
        recipe.recipe || null,
        recipe.buy_price || 0,
        recipe.sell_price || 0,
        recipe.is_craftable || false,
        [], // Los hijos se añaden después
        parentId
      );
    
      if (recipe.children && recipe.children.length > 0) {
        ingredient.children = recipe.children.map(child => {
          const childClone = typeof structuredClone === 'function'
            ? structuredClone(child)
            : JSON.parse(JSON.stringify(child));
          return createCraftIngredientFromRecipe(childClone, child.count * parentMultiplier, ingredient.id); // 🔥 Aquí pasa el id del padre
        });
      }
    
      return ingredient;
    }
    
  
    try {
      // 1. Obtener y transformar recetas usando el nuevo servicio
      const recipes = await getAndTransformRecipes(itemId);
      if (!recipes || recipes.length === 0) {
        return '<div style="color:#a1a1aa;">Este ítem no tiene receta de crafteo.</div>';
      }
  
      // 2. Cargar el árbol completo de ingredientes para la primera receta
      const mainRecipe = await loadIngredientTree(recipes[0]);
      if (!mainRecipe) {
        throw new Error('No se pudo cargar la receta principal');
      }
  
      // 4. Crear la estructura de CraftIngredient
      const mainIngredient = createCraftIngredientFromRecipe(mainRecipe);
  
      // 5. Preparar datos del ítem principal para renderizar
  
      const itemData = {
        id: mainIngredient.id,
        name: mainIngredient.name,
        icon: mainIngredient.icon,
        rarity: mainIngredient.rarity || 'Basic',
        type: mainIngredient.type || 'Consumable',
        level: mainIngredient.level || 0,
        vendor_value: mainIngredient.vendor_value || 0,
        flags: mainIngredient.flags || [],
        restrictions: mainIngredient.restrictions || [],
        details: {
          type: mainIngredient.recipe?.type || mainIngredient.type || 'Consumable',
          min_rating: mainIngredient.recipe?.min_rating || 0,
          disciplines: mainIngredient.recipe?.disciplines || []
        }
      };
  
      // 6. Obtener precios de mercado
      const marketData = {
        buys: { unit_price: mainIngredient.buy_price || 0 },
        sells: { unit_price: mainIngredient.sell_price || 0 }
      };
  
  // GW2 Item Tracker v2 - Integración con DataWars2 API v2
  
  
  
      // 8. Restaurar estado expandido y recalcular
      restoreExpandState([mainIngredient], _expandSnapshot);
      [mainIngredient].forEach(ing => ing.recalc(window.globalQty));
      window.ingredientObjs = [mainIngredient];
      
    } catch (error) {
      console.error('Error en renderCraftingSection:', error);
      window.showError('Error al cargar la receta: ' + error.message);
      return '<div style="color:#ff6b6b;">Error al cargar la receta: ' + error.message + '</div>';
    }
  
    function renderTable() {
      // Obtener el output_item_count de la receta principal
      const outputCount = (window._mainRecipeOutputCount && !isNaN(window._mainRecipeOutputCount)) ? window._mainRecipeOutputCount : 1;
      const mainRoot = window.ingredientObjs && window.ingredientObjs.length > 0 ? window.ingredientObjs[0] : null;
      const totals = mainRoot ? {
        tBuy: mainRoot.total_buy || 0,
        tSell: mainRoot.total_sell || 0,
        tCrafted: mainRoot.total_crafted || 0
      } : { tBuy: 0, tSell: 0, tCrafted: 0 };
      // Renderiza el input respetando el valor temporal si existe
      const qtyValue = (typeof window.globalQty !== 'undefined' ? window.globalQty : 1);
      // Sección 9: comparativa
      // Usar precio de compra y venta del item principal (marketData)
      const mainNode = window.ingredientObjs && window.ingredientObjs.length > 0 ? window.ingredientObjs[0] : null;
const precioCompraTotal = (mainNode && typeof mainNode.buy_price === 'number') ? mainNode.buy_price * qtyValue : 0;
const precioVentaTotal = (mainNode && typeof mainNode.sell_price === 'number') ? mainNode.sell_price * qtyValue : 0;
      // El crafting más barato posible: el menor entre buy, sell y crafted
      const precioCraftingMinTotal = Math.min(totals.tBuy, totals.tSell, totals.tCrafted);
      const precioCraftingMinUnidad = outputCount > 0 ? precioCraftingMinTotal / outputCount : precioCraftingMinTotal;
  
      // Por unidad
      const precioCompraUnidad = outputCount > 0 ? precioCompraTotal / outputCount : precioCompraTotal;
      const precioVentaUnidad = outputCount > 0 ? precioVentaTotal / outputCount : precioVentaTotal;
  
      // Usar el crafting mínimo en la comparativa
      const preciosFinales = [precioCompraTotal, precioVentaTotal, precioCraftingMinTotal];
      const precioMinimoFinal = Math.min(...preciosFinales.filter(x => x > 0));
      const preciosFinalesUnidad = [precioCompraUnidad, precioVentaUnidad, precioCraftingMinUnidad];
      const precioMinimoFinalUnidad = Math.min(...preciosFinalesUnidad.filter(x => x > 0));
      // Índices para resaltar la columna correspondiente
      const minIdx = preciosFinales.indexOf(precioMinimoFinal);
      const minIdxUnidad = preciosFinalesUnidad.indexOf(precioMinimoFinalUnidad);
      let mensaje = '';
      if (minIdx === 0) mensaje = 'Mejor comprar (Buy)';
      else if (minIdx === 1) mensaje = 'Mejor vender (Sell)';
      else mensaje = 'Mejor craftear (Crafteo)';
  
      // Sección 10: profit mejorada - 3 profits distintos
      let profitHtml = '';
      let profitHtmlUnidad = '';
      if (precioVentaTotal > 0) {
        // Lógica: (precio de venta - comisión 15%) - costo, multiplicar por cantidad solo al final
        const ventaTrasComisionTotal = precioVentaTotal - (precioVentaTotal * 0.15);
        const ventaTrasComisionUnidad = outputCount > 0 ? ventaTrasComisionTotal / outputCount : ventaTrasComisionTotal;
        const profitBuyUnidad = ventaTrasComisionUnidad - (totals.tBuy / outputCount);
        const profitSellUnidad = ventaTrasComisionUnidad - (totals.tSell / outputCount);
        const profitCraftedUnidad = ventaTrasComisionUnidad - (totals.tCrafted / outputCount);
        const profitBuyTotal = ventaTrasComisionTotal - totals.tBuy;
        const profitSellTotal = ventaTrasComisionTotal - totals.tSell;
        const profitCraftedTotal = ventaTrasComisionTotal - totals.tCrafted;
        // Mostrar solo la tabla global si produce 1 unidad
        if (outputCount === 1) {
          profitHtml = `<section id='profit-section'><br>
            <div class="table-modern-totales">
            <h3>Profit si se craftea y se vende (ganancia estimada)</h3>
            <table class='table-totales totales-crafting-comparativa' style='margin-bottom: 8px;'>
              <tr style='text-align:center;'>
                <td>${formatGoldColored(Math.round(profitBuyTotal))} <br><span style='font-size:0.93em;'>Profit "Comprar"</span></td>
                <td>${formatGoldColored(Math.round(profitSellTotal))} <br><span style='font-size:0.93em;'>Profit "Vender"</span></td>
                <td>${formatGoldColored(Math.round(profitCraftedTotal))} <br><span style='font-size:0.93em;'>Profit "Craftear"</span></td>
              </tr>
              <tr><td colspan='3' style='text-align:center;font-size:0.98em;color:#a1a1aa;'>La ganancia se calcula como: (Precio venta - 15% comisión) - costo total</td></tr>
            </table>
          </div>
          </section>`;
        }
        // Mostrar solo la tabla por unidad si produce más de 1 unidad
        if (outputCount > 1) {
          // El precio de venta por unidad es el precio de mercado unitario menos 15%
          const precioVentaUnidadMercado = (mainNode && typeof mainNode.sell_price === 'number') ? (mainNode.sell_price * qtyValue) / outputCount : 0;
const ventaTrasComisionUnidadMercado = precioVentaUnidadMercado - (precioVentaUnidadMercado * 0.15);
          const profitBuyUnidadMercado = ventaTrasComisionUnidadMercado - (totals.tBuy / outputCount);
          const profitSellUnidadMercado = ventaTrasComisionUnidadMercado - (totals.tSell / outputCount);
          const profitCraftedUnidadMercado = ventaTrasComisionUnidadMercado - (totals.tCrafted / outputCount);
          profitHtmlUnidad = `<section id='profit-section-unidad'><br>
            <div class="table-modern-totales">          
            <h3>Profit si se craftea y se vende por UNIDAD (ganancia estimada)</h3>
            <div style='margin-bottom:8px;color:#a1a1aa;font-size:1em;'>Esta receta produce <b>${outputCount}</b> unidades por crafteo. Los siguientes cálculos son por unidad.</div>
            <table class='table-totales totales-crafting-comparativa' style='margin-bottom: 8px;'>
              <tr style='text-align:center;'>
                <td>${formatGoldColored(Math.round(profitBuyUnidadMercado))} <br><span style='font-size:0.93em;'>Profit "Compra"</span></td>
                <td>${formatGoldColored(Math.round(profitSellUnidadMercado))} <br><span style='font-size:0.93em;'>Profit "Venta"</span></td>
                <td>${formatGoldColored(Math.round(profitCraftedUnidadMercado))} <br><span style='font-size:0.93em;'>Profit "Crafteo"</span></td>
              </tr>
              <tr><td colspan='3' style='text-align:center;font-size:0.98em;color:#a1a1aa;'>La ganancia por unidad se calcula como: (Precio venta unitario - 15% comisión) - costo unitario</td></tr>
            </table>
          </div>
          </section>`;
        }
      }
  
      // Tablas de totales
      let tablaTotales = `<div class="table-modern-totales">
        <h3>Precio total materiales - Crafting</h3>
        <div id="totales-crafting">      
          <table class="table-totales" style="margin-top:12px;">
            
            <tr>
              <th><div class="tooltip-modern">Total "Compra"
    <span class="tooltiptext-modern">Suma total si haces PEDIDO de materiales en el mercado.</span>
  </div></th>
              <td class="item-solo-buy">${formatGoldColored(totals.tBuy)}</td>
              <th><div class="tooltip-modern">Total "Venta"
    <span class="tooltiptext-modern">Suma total si COMPRAS materiales en el mercado.</span>
  </div></th>
              <td class="item-solo-sell">${formatGoldColored(totals.tSell)}</td>
              <th><div class="tooltip-modern">Total "Crafteo"
    <span class="tooltiptext-modern">Suma total si CRAFTEAS todos los materiales posibles desde cero.</span>
  </div></th>
              <td class="item-solo-crafted">${formatGoldColored(totals.tCrafted)}</td>
            </tr>
          </table>
        </div>
        </div>`;
      // Tabla extra por unidad SOLO si outputCount > 1
      let tablaTotalesUnidad = '';
      if (outputCount > 1) {
        tablaTotalesUnidad = `<div class="table-modern-totales">
        <div style='margin-bottom:8px;color:#a1a1aa;font-size:1em;'>Esta receta produce <b>${outputCount}</b> unidades por crafteo. Los siguientes costos son por unidad.</div>
          <div id="totales-crafting">
            
            <table class="table-totales" style="margin-top:12px;">
              <tr>
                <th><div class="tooltip-modern">Total "Compra"
    <span class="tooltiptext-modern">Suma total si haces PEDIDO de materiales en el mercado.</span>
  </div></th>
                <td class="item-solo-buy">${formatGoldColored(totals.tBuy / outputCount)}</td>
                <th><div class="tooltip-modern">Total "Venta"
    <span class="tooltiptext-modern">Suma total si COMPRAS materiales en el mercado.</span>
  </div></th>
                <td class="item-solo-sell">${formatGoldColored(totals.tSell / outputCount)}</td>
                <th><div class="tooltip-modern">Total "Crafteo"
    <span class="tooltiptext-modern">Suma total si CRAFTEAS todos los materiales posibles desde cero.</span>
  </div></th>
                <td class="item-solo-crafted">${formatGoldColored(totals.tCrafted / outputCount)}</td>
              </tr>
            </table>
          </div>
        </div>`;
      }
  
      // Tablas comparativas
      let tablaComparativa = '';
      let tablaComparativaUnidad = '';
      if (outputCount === 1) {
        tablaComparativa = `<section id='comparativa-section'>
          <div class=\"table-modern-totales\"><br>
            <h3>Comparativa de precios de Bazar vs Crafting</h3>
            <table class='table-totales totales-crafting-comparativa'>
              <tr style='text-align:center;'>
                <td><div style='${minIdx===0 ? 'background:#e84d4d33;font-weight:bold;border-radius:6px;padding:10px;' : ''}'>${formatGoldColored(precioCompraTotal)} <br><span style='font-size:0.93em;'>Precio compra</span></div></td>
                <td><div style='${minIdx===1 ? 'background:#4db1e833;font-weight:bold;border-radius:6px;padding:10px;' : ''}'>${formatGoldColored(precioVentaTotal)} <br><span style='font-size:0.93em;'>Precio venta</span></div></td>
                <td><div style='${minIdx===2 ? 'background:#4fc17833;font-weight:bold;border-radius:6px;padding:10px;' : ''}'>${formatGoldColored(precioCraftingMinTotal)} <br><span style='font-size:0.93em;'>Precio crafting más bajo</span></div></td>
              </tr>
              <tr><td colspan='3' style='text-align:center;font-size:1.07em;'>${mensaje}</td></tr>
            </table>
          </div>
          </section>`;
      }
      if (outputCount > 1) {
        // El precio de compra y venta por unidad son SIEMPRE el precio de mercado unitario (no dividir)
        const precioCompraUnidadMercado = (mainNode && typeof mainNode.buy_price === 'number') ? (mainNode.buy_price * qtyValue) / outputCount : 0;
const precioVentaUnidadMercado = (mainNode && typeof mainNode.sell_price === 'number') ? (mainNode.sell_price * qtyValue) / outputCount : 0;    // El precio crafting mínimo por unidad
        const precioCraftingMinUnidadReal = outputCount > 0 ? precioCraftingMinTotal / outputCount : precioCraftingMinTotal;
        // Para el highlight, solo comparar precios positivos
        const preciosUnidadCorr = [precioCompraUnidadMercado, precioVentaUnidadMercado, precioCraftingMinUnidadReal];
        const precioMinimoUnidadReal = Math.min(...preciosUnidadCorr.filter(x => x > 0));
        const minIdxUnidad = preciosUnidadCorr.indexOf(precioMinimoUnidadReal);
        tablaComparativaUnidad = `<section id='comparativa-section-unidad'>
          <div class="table-modern-totales"><br>
            <h3>Comparativa de precios de Bazar vs Crafting por UNIDAD</h3>
            <div style='margin-bottom:8px;color:#a1a1aa;font-size:1em;'>Esta receta produce <b>${outputCount}</b> unidades por crafteo. Los siguientes precios son por unidad.</div>
            <table class='table-totales totales-crafting-comparativa'>
              <tr style='text-align:center;'>
                <td><div style='${minIdxUnidad===0 ? 'background:#e84d4d33;font-weight:bold;border-radius:6px;padding:10px;' : ''}'>${formatGoldColored(precioCompraUnidadMercado)} <br><span style='font-size:0.93em;'>Precio compra</span></div></td>
                <td><div style='${minIdxUnidad===1 ? 'background:#4db1e833;font-weight:bold;border-radius:6px;padding:10px;' : ''}'>${formatGoldColored(precioVentaUnidadMercado)} <br><span style='font-size:0.93em;'>Precio venta</span></div></td>
                <td><div style='${minIdxUnidad===2 ? 'background:#4fc17833;font-weight:bold;border-radius:6px;padding:10px;' : ''}'>${formatGoldColored(precioCraftingMinUnidadReal)} <br><span style='font-size:0.93em;'>Precio crafting más bajo</span></div></td>
              </tr>
              <tr><td colspan='3' style='text-align:center;font-size:1.07em;'>${mensaje}</td></tr>
            </table>
          </div>
          </section>`;
      }
  
      const html = `
        <h3>Ingredientes para craftear</h3>
        <div style=\"margin:18px 0 18px 0;display:flex;align-items:center;gap:12px;\">\n        <label for=\"qty-global\" style=\"font-weight:500;\">Cantidad global:</label>\n        <input id=\"qty-global\" type=\"number\" min=\"1\" value=\"${qtyValue}\" style=\"width:60px;height:36px;\" autocomplete=\"off\">\n      </div>\n      
        <table class="table-modern tabla-tarjetas">
          <thead class="header-items">
            <tr>
              <th class="th-border-left">Ícono</th>
              <th>Nombre</th>
              <th>Cantidad</th>
              <th>Total Compra</th>
              <th>Total Venta</th>
              <th>Total Crafteo</th>
              <th class="th-border-right"></th>
            </tr>
          </thead>
          <tbody>${renderRows(ingredientObjs)}</tbody>
        </table>
        ${tablaTotales}
        ${outputCount > 1 ? tablaTotalesUnidad : ''}
        ${tablaComparativa}
        ${outputCount > 1 ? tablaComparativaUnidad : ''}
        ${profitHtml}
        ${outputCount > 1 ? profitHtmlUnidad : ''}
      `;
      return html;
    }
    window.renderTable = renderTable;
  
    function renderRows(ings, nivel = 0, parentId = null, rowGroupIndex = 0, parentExpanded = true) {
      // (Eliminado: listener de expandir/cerrar hijos, ahora será global tras renderizado)
      return ings.map((ing, idx) => {
        const groupIdx = nivel === 0 ? idx : rowGroupIndex;
        const rowBgClass = groupIdx % 2 === 0 ? 'row-bg-a' : 'row-bg-b';
        const indent = nivel > 0 ? `style=\"padding-left:${nivel * 30}px\"` : '';
        // Identificador único para asociar hijos
        const childClass = `child-of-${ing.id}`;
        // Botón solo si hay hijos
        const expandButton = (ing.is_craftable && ing.children && ing.children.length)
          ? `<button class=\"btn-expand\" data-uid=\"${ing._uid}\">${ing.expanded ? '-' : '+'}</button>` : '';
        // Clases extra para hijos
        const isChild = nivel > 0;
        // Si es hijo, inicia oculto con display:none si el padre no está expandido
        const extraClass = isChild ? `child-of-${parentId}` : '';
        const extraStyle = isChild && !parentExpanded ? 'style="display:none"' : '';
        return `
          <tr data-uid=\"${ing._uid}\"${isChild ? ` data-parent=\"${String(parentId)}\"` : ''} class=\"${isChild ? `subrow subrow-${nivel} ${extraClass}` : ''} ${rowBgClass}\" ${extraStyle}>
            <td class=\"th-border-left-items\" ${indent}><img src=\"${ing.icon}\" width=\"32\"></td>
            <td><a href=\"item.html?id=${ing.id}\" class=\"item-link\" target=\"_blank\">${ing.name}</a></td>
            <td>${ing.countTotal}</td>
            <td class=\"item-solo-buy\">
              <div>${formatGoldColored(ing.total_buy)}</div>
              <div class=\"item-solo-precio\">${formatGoldColored(ing.buy_price)} c/u</div>
              ${parentId !== null ? `<input type=\"radio\" name=\"mode-buy-sell-${ing._uid}\" class=\"chk-mode-buy\" data-uid=\"${ing._uid}\" ${ing.modeForParentCrafted === 'buy' ? 'checked' : ''} title=\"Usar precio de compra para el padre\">` : ''}
            </td>
            <td class=\"item-solo-sell\">
              <div>${formatGoldColored(ing.total_sell)}</div>
              <div class=\"item-solo-precio\">${formatGoldColored(ing.sell_price)} c/u</div>
              ${parentId !== null ? `<input type=\"radio\" name=\"mode-buy-sell-${ing._uid}\" class=\"chk-mode-sell\" data-uid=\"${ing._uid}\" ${ing.modeForParentCrafted === 'sell' ? 'checked' : ''} title=\"Usar precio de venta para el padre\">` : ''}
            </td>
            <td class=\"item-solo-crafted\">
              ${(ing.is_craftable && ing.total_crafted !== null) ? `
                <div>${formatGoldColored(ing.total_crafted)}</div>
                <div class=\"item-solo-precio\">${formatGoldColored(ing.crafted_price)} c/u</div>
                ${(nivel > 0 && parentId !== null) ? `<input type=\"radio\" name=\"mode-crafted-${ing._uid}\" class=\"chk-mode-crafted\" data-uid=\"${ing._uid}\" ${ing.modeForParentCrafted === 'crafted' ? 'checked' : ''} title=\"Usar precio de crafteo para el padre\">` : ''}
              ` : 'N/A'}
            </td>
            <td class=\"th-border-right-items\">${expandButton}</td>
          </tr>
          ${ing.is_craftable && ing.children && ing.children.length ? renderRows(ing.children, nivel + 1, ing.id, groupIdx, parentExpanded && ing.expanded) : ''}
        `;
      }).join('');
    }
  
    // Handler global para expandir/cerrar subingredientes (solo una vez)
    if (!window._expandBtnHandlerInstalled) {
      window._expandBtnHandlerInstalled = true;
      document.addEventListener('click', function(e) {
        if (e.target.matches('.btn-expand')) {
          const uid = e.target.getAttribute('data-uid');
          if (!uid) return;
          const ing = findIngredientByUid(window.ingredientObjs, uid);
          if (ing) {
            ing.expanded = !ing.expanded;
          }
          // Forzar render para reflejar el estado
          if (typeof safeRenderTable === 'function') safeRenderTable();
          e.stopPropagation();
        }
      });
    }
  
    // Handler para los checkboxes de subingredientes (solo una vez)
    function setCheckboxState(ings) {
      for (const ing of ings) {
        if (typeof ing.useCrafted !== 'undefined') {
          ing.useCrafted = !ing.useCrafted;
        }
        if (ing.children && ing.children.length) {
          setCheckboxState(ing.children);
        }
      }
    }
  
    document.addEventListener('change', function(e) {
      if (e.target && e.target.classList.contains('chk-crafted')) {
        const uid = e.target.getAttribute('data-uid');
        if (!uid) return;
        const ing = findIngredientByUid(ingredientObjs, uid);
        if (!ing) return;
        setCheckboxState([ing]);
        recalcAll(ingredientObjs);
        const node = document.querySelector('#seccion-crafting, div#seccion-crafting');
        if (node) node.innerHTML = renderTable();
      }
    });
  
    // Handler unificado para el input global qty-global (solo se instala una vez)
    if (!window._qtyGlobalHandlerInstalled) { // Usamos una bandera única para evitar duplicados
      window._qtyGlobalHandlerInstalled = true;

      // INPUT: No hace nada, solo permite al usuario escribir.
      document.addEventListener('input', function(e) {
        if (e.target && e.target.id === 'qty-global') {
          // El recálculo se aplazará hasta el evento 'blur' o 'keydown (Enter)'.
        }
      });

      // Función que aplica el cambio de cantidad
      const applyQtyChange = (inputEl) => {
        let val = parseInt(inputEl.value, 10);

        // Valida el número, si es inválido, lo establece en 1
        if (isNaN(val) || val < 1) {
          val = 1;
          inputEl.value = '1'; // Corrige el valor en la UI
        }
        
        // Solo recalcula si el valor ha cambiado
        if (window.globalQty !== val) {
            setGlobalQty(val); // Actualiza la variable global

            // Recalcula los ingredientes desde la raíz
            window.ingredientObjs.forEach(ing => ing.recalc(true));

            // Renderiza únicamente la sección de crafteo para no perder el foco del input
            const node = document.querySelector('#seccion-crafting, div#seccion-crafting');
            if (node) {
              node.innerHTML = renderTable();
            }
        }
      };

      // BLUR: aplica el cambio cuando el input pierde el foco
      document.addEventListener('blur', function(e) {
        if (e.target && e.target.id === 'qty-global') {
          applyQtyChange(e.target);
        }
      }, true);

      // KEYDOWN: aplica el cambio al presionar Enter
      document.addEventListener('keydown', function(e) {
        if (e.target && e.target.id === 'qty-global' && e.key === 'Enter') {
          e.preventDefault(); // Evita el envío del formulario
          applyQtyChange(e.target);
        }
      });
    }
    // Función para marcar botones de expandir como activos
    function marcarBotonesExpand(ings) {
      for (const ing of ings) {
        if (ing.expanded) {
          const btn = document.querySelector(`.btn-expand[data-uid='${ing._uid}']`);
          if (btn) btn.textContent = '-';
          if (ing.children && ing.children.length) marcarBotonesExpand(ing.children);
        }
      }
    }
  
    // Aplicar cambios después de un pequeño retraso para asegurar que el DOM esté listo
    setTimeout(() => {
      // Mostrar todas las filas ocultas
      document.querySelectorAll('tr.subrow').forEach(row => row.classList.remove('hidden-row'));
      
      // Inicializar botones de expandir
      document.querySelectorAll('.btn-expand').forEach(btn => btn.textContent = '+');
      
      // Aplicar estado de expansión guardado si existe
      if (window.ingredientObjs) {
        marcarBotonesExpand(window.ingredientObjs);
      }
    }, 0);
  }
   
   // Handler global para radios buy/sell en subingredientes: asegura que el modo se actualiza antes de recalcular
  if (!window._modeRadioHandlerInstalled) {
    window._modeRadioHandlerInstalled = true;
    // Handler para cambios en los radios de compra/venta
    document.addEventListener('change', function(e) {
      // Handler para radios buy/sell/crafted en cualquier nivel
      if (
        e.target &&
        (
          e.target.classList.contains('chk-mode-buy') ||
          e.target.classList.contains('chk-mode-sell') ||
          e.target.classList.contains('chk-mode-crafted')
        )
      ) {
        const uid = e.target.getAttribute('data-uid');
        if (!uid) return;
        if (!window.ingredientObjs || !Array.isArray(window.ingredientObjs) || !window.ingredientObjs.length) {
          return;
        }
        const ing = findIngredientByUid(window.ingredientObjs, uid);
        if (ing) {
          // Detectar el modo seleccionado
          if (e.target.classList.contains('chk-mode-buy')) ing.modeForParentCrafted = 'buy'; // no change
          else if (e.target.classList.contains('chk-mode-sell')) ing.modeForParentCrafted = 'sell';
          else if (e.target.classList.contains('chk-mode-crafted')) ing.modeForParentCrafted = 'crafted';
          // console.log('RADIO change', ing.name, 'uid', uid, 'nuevo modo', ing.modeForParentCrafted);
        }
        // Recalcular y renderizar TODO el árbol
        const _expandSnapshot = snapshotExpandState(window.ingredientObjs);
        window.ingredientObjs.forEach(ing => ing.recalc(window.globalQty));
        restoreExpandState(window.ingredientObjs, _expandSnapshot);
        safeRenderTable();
      }
    });
  }

  
  
  
  function findIngredientByUid(ings, uid) {
    for (const ing of ings) {
      if (String(ing._uid) === String(uid)) return ing;
      if (ing.children && ing.children.length) {
        const found = findIngredientByUid(ing.children, uid);
        if (found) return found;
      }
    }
    return null;
  }
  // Mantener función anterior por compatibilidad (usada en secciones viejas)
  function findIngredientById(ings, id) {
    for (const ing of ings) {
      if (String(ing.id) === String(id)) return ing;
      if (ing.children && ing.children.length) {
        const found = findIngredientById(ing.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // --- Lógica de negocio compartida con item-ui.js ---
  function setIngredientObjs(val) {
    window.ingredientObjs = val;
  }

  function setGlobalQty(val) {
    window.globalQty = val;
  }

  function snapshotExpandState(ings) {
    if (!ings) return [];
    return ings.map(ing => ({
      id: ing.id,
      expanded: ing.expanded,
      children: snapshotExpandState(ing.children || [])
    }));
  }

  function restoreExpandState(ings, snapshot) {
    if (!ings || !snapshot) return;
    for (let i = 0; i < ings.length; i++) {
      if (snapshot[i]) {
        ings[i].expanded = snapshot[i].expanded;
        restoreExpandState(ings[i].children, snapshot[i].children);
      }
    }
  }

  function recalcAll(ingredientObjs, globalQty) {
    if (!ingredientObjs) return;
    ingredientObjs.forEach((ing, idx) => {
      if (idx === 0) {
        ing.recalc(globalQty, null, null, true);
      } else {
        ing.recalc(globalQty);
      }
    });
  }

  function getTotals(ingredientObjs) {
    let totalBuy = 0, totalSell = 0, totalCrafted = 0;
    for (const ing of ingredientObjs) {
      totalBuy += ing.total_buy || 0;
      totalSell += ing.total_sell || 0;
      // Si el ingrediente no es crafteable, usar el costo de compra
      const craftedVal =
        (ing.total_crafted !== undefined && ing.total_crafted !== null)
          ? ing.total_crafted
          : ing.total_buy || 0;
      totalCrafted += craftedVal;
    }
    return { totalBuy, totalSell, totalCrafted };
  }

  function findIngredientByIdAndParent(ings, id, parentId) {
    for (const ing of ings) {
      if (String(ing.id) === String(id) && String(ing._parentId) === String(parentId)) {
        return ing;
      }
      if (Array.isArray(ing.children) && ing.children.length) {
        const found = findIngredientByIdAndParent(ing.children, id, parentId);
        if (found) return found;
      }
    }
    return null;
  }

  function findIngredientByPath(ings, pathArr) {
    let current = ings;
    let ing = null;
    for (let i = 0; i < pathArr.length; i++) {
      const uid = pathArr[i];
      ing = (current || []).find(n => String(n._uid) === String(uid));
      if (!ing) return null;
      current = ing.children;
    }
    return ing;
  }

  // Exponer funciones para item-ui.js
  window.setIngredientObjs = setIngredientObjs;
  window.setGlobalQty = setGlobalQty;
  window.snapshotExpandState = snapshotExpandState;
  window.restoreExpandState = restoreExpandState;
  window.recalcAll = recalcAll;
  window.getTotals = getTotals;
  window.findIngredientByIdAndParent = findIngredientByIdAndParent;
  window.findIngredientByPath = findIngredientByPath;
  window.findIngredientByUid = findIngredientByUid;
  window.findIngredientById = findIngredientById;
  window.calcPercent = calcPercent;
  
  
  
  
  // Función para renderizar enlaces a la wiki
  function renderWiki(name) {
    if (!name) return '';
    const wikiName = name.replace(/\s+/g, '_');
    const wikiES = `https://wiki.guildwars2.com/wiki/es:${encodeURIComponent(wikiName)}`;
    const wikiEN = `https://wiki.guildwars2.com/wiki/${encodeURIComponent(wikiName)}`;
    
    return `
      <div class="wiki-links">
        <a href="${wikiES}" target="_blank" title="Ver en Wiki (Español)">
          <i class="fas fa-book"></i> Wiki ES
        </a>
        <a href="${wikiEN}" target="_blank" title="View on Wiki (English)" style="margin-left: 10px;">
          <i class="fas fa-book"></i> Wiki EN
        </a>
      </div>
    `;
  }
  
  // Inicializar la aplicación
  main();