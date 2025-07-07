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
