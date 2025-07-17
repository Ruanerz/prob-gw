// Asegurarse de que storageUtils esté cargado
if (typeof window.StorageUtils === 'undefined') {
    console.error('Error: storageUtils.js no está cargado');
}

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        // Redirigir al login si no está autenticado
        window.location.href = 'login.html';
        return;
    }

    // Actualizar el saludo con el nombre del usuario
    const greetingElement = document.querySelector('.videos-board-topic');
    if (greetingElement) {
        greetingElement.textContent = `Hola ${user.name || 'Usuario'}`;
    }

    // Mostrar el avatar del usuario en la ilustración de bienvenida
    const welcomeImg = document.querySelector('.welcome-illustration img');
    if (welcomeImg && user.picture) {
        welcomeImg.src = user.picture;
        welcomeImg.alt = `Avatar de ${user.name || 'usuario'}`;
    }

    // Registrar eventos de refresco
    const refreshBtn = document.getElementById('refreshFavoritos');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            const container = document.getElementById('favoritos-items-container');
            if (container) {
                container.innerHTML = `
                    <div class="loading-placeholder">
                        <div class="spinner small"></div>
                        <p>Actualizando lista de favoritos...</p>
                    </div>`;
                setTimeout(loadAndDisplayFavoritos, 300);
            }
        });
    }

    const refreshCompBtn = document.getElementById('refreshComparativas');
    if (refreshCompBtn) {
        refreshCompBtn.addEventListener('click', function() {
            const cont = document.getElementById('lista-comparaciones');
            if (cont) {
                cont.innerHTML = `
                    <div class="loading-placeholder">
                        <div class="spinner small"></div>
                        <p>Actualizando lista de comparaciones...</p>
                    </div>`;
                setTimeout(loadAndDisplayComparativas, 300);
            }
        });
    }

    // Cargar y mostrar los ítems y comparativas guardadas
    loadAndDisplayFavoritos();
    loadAndDisplayComparativas();
});

function hideLoadingOverlay() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
        }, 300);
    }
}

window.addEventListener('load', hideLoadingOverlay);

/**
 * Carga y muestra los ítems guardados en la lista de favoritos
 */
function loadAndDisplayFavoritos() {
    const container = document.getElementById('favoritos-items-container');
    if (!container) {
        console.error('No se encontró el contenedor de favoritos');
        return;
    }
    
    // Obtener los ítems guardados usando storageUtils
    const favoritos = window.StorageUtils?.getFavoritos('gw2_favoritos_items') || [];
    
    if (!favoritos.length) {
        container.innerHTML = `
            <div class="no-items">
                <img src="img/empty-state.svg" alt="Sin ítems guardados" class="empty-state">
                <p>No hay ítems guardados aún.</p>
                <p>Guarda ítems desde la página de detalles para verlos aquí.</p>
            </div>`;
        return;
    }
    
    // Crear lista de ítems
    const list = document.createElement('ul');
    list.className = 'favoritos-list';
    
    favoritos.forEach((item, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'favorito-item';
        listItem.dataset.id = item.id;
        
        // Ícono real del ítem
        const icon = document.createElement('img');
        icon.className = 'favorito-icon';
        icon.src = 'img/sphere_5528251.svg'; // usa un placeholder local
        icon.alt = 'icono';
        icon.width = 24;
        icon.height = 24;
        
        // Enlace al ítem (nombre se actualizará tras fetch)
        const link = document.createElement('a');
        link.href = `item.html?id=${item.id}`;
        link.className = 'favorito-link';
        link.textContent = item.nombre || `Cargando...`;

        // Fetch para obtener nombre e icono reales si faltan
        fetch(`https://api.guildwars2.com/v2/items/${item.id}?lang=es`)
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (!data) return;
                if (data.icon) icon.src = data.icon;
                if (data.name) {
                    link.textContent = data.name;
                    // Actualizar storage si no tenía nombre
                    if (!item.nombre) {
                        item.nombre = data.name;
                        const favsAct = window.StorageUtils.getFavoritos('gw2_favoritos_items');
                        const idx = favsAct.findIndex(f => f.id === item.id);
                        if (idx !== -1) {
                            favsAct[idx].nombre = data.name;
                            localStorage.setItem('gw2_favoritos_items', JSON.stringify(favsAct));
                        }
                    }
                }
            })
            .catch(err => console.error('Error fetching item detalles:', err));
        
        // ID del ítem
        const itemId = document.createElement('span');
        itemId.className = 'favorito-id';
        itemId.textContent = `#${item.id}`;
        
        // Botón para eliminar
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-favorito';
        deleteBtn.title = 'Eliminar de favoritos';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (confirm(`¿Eliminar "${item.nombre || 'este ítem'}" de favoritos?`)) {
                // Eliminar usando storageUtils
                window.StorageUtils?.removeFavorito('gw2_favoritos_items', item.id);
                listItem.remove();
                
                // Mostrar mensaje si no quedan más ítems
                if (document.querySelectorAll('.favorito-item').length === 0) {
                    container.innerHTML = `
                        <div class="no-items">
                            <img src="img/empty-state.svg" alt="Sin ítems guardados" class="empty-state">
                            <p>No hay ítems guardados.</p>
                        </div>`;
                }
                
                // Mostrar notificación
                window.StorageUtils?.showToast('Ítem eliminado de favoritos');
            }
        };
        
        // Construir la estructura del ítem
        const itemContent = document.createElement('div');
        itemContent.className = 'favorito-content';
        itemContent.appendChild(icon);
        itemContent.appendChild(link);
        itemContent.appendChild(itemId);
        
        listItem.appendChild(itemContent);
        listItem.appendChild(deleteBtn);
        list.appendChild(listItem);
    });
    
    // Limpiar contenedor y agregar la lista
    container.innerHTML = '';
    container.appendChild(list);
    
    // Añadir contador de ítems
    const counter = document.createElement('div');
    counter.className = 'favoritos-counter';
    counter.textContent = `${favoritos.length} ${favoritos.length === 1 ? 'ítem' : 'ítems'} guardados`;
    container.prepend(counter);
}

// ------------------ COMPARATIVAS ------------------
/**
 * Carga y muestra las comparativas guardadas
 */
function loadAndDisplayComparativas() {
    const container = document.getElementById('lista-comparaciones');
    if (!container) {
        console.error('No se encontró el contenedor de comparativas');
        return;
    }

    const comparativas = window.StorageUtils?.getComparativas('gw2_comparativas') || [];

    if (!comparativas.length) {
        container.innerHTML = `
            <div class="no-items">
                <img src="img/empty-state.svg" alt="Sin comparativas" class="empty-state">
                <p>No hay comparativas guardadas.</p>
                <p>Guarda una comparativa desde la sección de comparativa para verla aquí.</p>
            </div>`;
        return;
    }

    const list = document.createElement('ul');
    list.className = 'favoritos-list';

    comparativas.forEach((comp, idx) => {
        const listItem = document.createElement('li');
        listItem.className = 'favorito-item';

        // Ícono
        const icon = document.createElement('span');
        icon.className = 'favorito-icon';
        icon.innerHTML = '📊';

        const nombre = comp.nombres && comp.nombres.length ? comp.nombres.join(', ') : `Comparativa ${idx + 1}`;
        const fecha = new Date(comp.timestamp || Date.now()).toLocaleDateString();

        const link = document.createElement('a');
        link.href = `compare-craft.html?ids=${comp.ids.join(',')}`;
        link.className = 'favorito-link';
        link.textContent = nombre;

        const meta = document.createElement('span');
        meta.className = 'favorito-id';
        meta.textContent = `(${comp.ids.length} ítems · ${fecha})`;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-favorito';
        deleteBtn.title = 'Eliminar comparativa';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (confirm('¿Eliminar esta comparativa?')) {
                const firma = [...comp.ids].sort((a,b)=>a-b).join('-');
                window.StorageUtils?.removeComparativa('gw2_comparativas', firma);
                listItem.remove();
                if (document.querySelectorAll('.comparativa-item').length === 0) {
                    container.innerHTML = '<p>No hay comparativas guardadas.</p>';
                }
                window.StorageUtils?.showToast('Comparativa eliminada');
            }
        };

        const itemContent = document.createElement('div');
        itemContent.className = 'favorito-content';
        itemContent.appendChild(icon);
        itemContent.appendChild(link);
        itemContent.appendChild(meta);

        listItem.appendChild(itemContent);
        listItem.appendChild(deleteBtn);
        list.appendChild(listItem);
    });

    container.innerHTML = '';
    container.appendChild(list);
}

