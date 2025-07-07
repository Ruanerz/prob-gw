// compareHandlers.js
// Manejadores para acciones relacionadas a la comparativa (guardar, etc.)

document.addEventListener('DOMContentLoaded', function () {
    initSaveComparativaHandler();
    loadComparativaFromURL();
});

/**
 * Inicializa el manejador del botón "Guardar comparativa"
 */
function initSaveComparativaHandler() {
    const saveBtn = document.getElementById('btn-guardar-comparativa');
    if (!saveBtn) return;

    // Mostrar u ocultar de acuerdo a autenticación
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) {
        saveBtn.style.display = 'none';
        return;
    }

    saveBtn.addEventListener('click', handleSaveComparativa);
}

/**
 * Maneja la lógica de guardado de una comparativa.
 * La comparativa se define como la lista actual de IDs cargados en window.ingredientObjs (raíces).
 */
function handleSaveComparativa() {
    if (!window.ingredientObjs || window.ingredientObjs.length === 0) {
        window.StorageUtils?.showToast('Agrega al menos un ítem a la comparativa', 'error');
        return;
    }

    // Obtener IDs y nombres de los ítems raíz en la comparativa
    const ids = window.ingredientObjs.map(obj => obj.id);
    const nombres = window.ingredientObjs.map(obj => obj.name);

    const comparativa = {
        ids,
        nombres,
        timestamp: Date.now()
    };

    if (window.StorageUtils) {
        if (typeof window.StorageUtils.saveComparativa === 'function') {
            window.StorageUtils.saveComparativa('gw2_comparativas', comparativa);
            window.StorageUtils.showToast('Comparativa guardada');
        } else {
            console.error('saveComparativa no está definida en StorageUtils');
            window.StorageUtils.showToast('Error guardando comparativa', 'error');
        }
    } else {
        alert('StorageUtils no está disponible.');
    }
}

// Inicialización automática si el DOM ya está listo
afterDomReady();

/**
 * Si la URL contiene ?ids=id1,id2,... carga automáticamente esos ítems
 */
function loadComparativaFromURL() {
    const params = new URLSearchParams(window.location.search);
    const idsParam = params.get('ids');
    if (!idsParam) return;

    const ids = idsParam.split(',').map(id => parseInt(id, 10)).filter(n => !isNaN(n));
    if (ids.length === 0) return;

    // Asegurar estructuras globales básicas
    window.ingredientObjs = window.ingredientObjs || [];
    window.globalQty = window.globalQty || 1;

    const tryLoad = () => {
        if (window.comparativa && typeof window.comparativa.agregarItemPorId === 'function') {
            (async () => {
                for (const id of ids) {
                    try {
                        await window.comparativa.agregarItemPorId(id);
                    } catch (e) {
                        console.error('Error cargando ítem de la URL', id, e);
                    }
                }
            })();
        } else {
            // Aún no disponible, reintentar
            setTimeout(tryLoad, 50);
        }
    };
    tryLoad();
}


function afterDomReady() {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(() => {
            initSaveComparativaHandler();
            loadComparativaFromURL();
        }, 1);
    }
}
