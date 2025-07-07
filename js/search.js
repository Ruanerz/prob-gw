/*
Archivo desactivado. Toda la lógica de búsqueda está ahora en busqueda.js.
TODO el contenido original ha sido comentado para evitar errores de sintaxis.
*/
            this.items = this.items.filter(item => 
                item && 
                typeof item.id === 'number' && 
                typeof item.name_es === 'string' &&
                item.name_es !== 'Sin nombre'  // Filtrar ítems sin nombre
            );

            if (this.items.length === 0) {
                throw new Error('No se encontraron ítems válidos');
            }

            // Obtener precios de mercado para los ítems
            console.log('Obteniendo precios de mercado...');
            await this.loadMarketPrices();
            
            // Ordenar ítems por nombre para mejor búsqueda
            this.items.sort((a, b) => a.name_es.localeCompare(b.name_es));

            // Inicializar listeners
            this.setupEventListeners();

            // Mostrar mensaje de éxito en la consola
            console.log('Búsqueda inicializada con éxito. Ítems disponibles:', this.items.length);
            console.log('Ejemplo de ítem cargado:', this.items[0]);

        } catch (error) {
            console.error('Error inicializando buscador:', error);
            App.showError('Error al cargar los ítems. Por favor, intenta nuevamente.');
        } finally {
            this.isLoading = false;
        }
    }

    setupEventListeners() {
        if (!this.searchInput || !this.suggestionsContainer) {
            console.error('Elementos HTML faltantes para el buscador');
            return;
        }

        // Evento de entrada
        this.searchInput.addEventListener('input', Utils.debounce((e) => {
            this.handleSearch(e.target.value);
        }, 300));

        // Evento de clic en sugerencias
        this.suggestionsContainer.addEventListener('click', (e) => {
            const target = e.target.closest('.suggestion-item');
            if (target) {
                this.selectSuggestion(target.dataset.itemId);
            }
        });

        // Evento de tecla enter
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.value.length >= 3) {
                this.handleSearch(e.target.value);
            }
        });
    }

    handleSearch(query) {
        if (!query || query.length < 3) {
            this.suggestionsContainer.innerHTML = '';
            this.suggestionsContainer.classList.add('hidden');
            return;
        }

        if (!this.items || !Array.isArray(this.items)) {
            console.error('Items no inicializados');
            return;
        }

        // Buscar ítems que coincidan con la query
        const results = this.items.filter(item => 
            item.name_es.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 10);

        this.renderSuggestions(results);
    }

    renderSuggestions(filteredItems) {
        if (!this.suggestionsContainer) return;

        // Limpiar sugerencias anteriores
        this.suggestionsContainer.innerHTML = '';

        if (!filteredItems || filteredItems.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = 'No se encontraron resultados';
            this.suggestionsContainer.appendChild(noResults);
            return;
        }

        // Mostrar hasta 10 sugerencias
        const itemsToShow = filteredItems.slice(0, 10);
        
        itemsToShow.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'suggestion-item';
            itemElement.dataset.itemId = item.id;
            
            // Formatear precios
            const formatPrice = (price) => {
                if (!price) return 'N/A';
                const gold = Math.floor(price / 10000);
                const silver = Math.floor((price % 10000) / 100);
                const copper = price % 100;
                return `${gold}<small>g</small> ${silver}<small>s</small> ${copper}<small>c</small>`;
            };
            
            const buyPrice = formatPrice(item.buy_price);
            const sellPrice = formatPrice(item.sell_price);
            
            // Crear elemento de ícono
            const iconElement = document.createElement('img');
            iconElement.className = 'item-icon';
            iconElement.src = item.icon || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM3NzdhODIiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1ib3giPjxyZWN0IHg9IjMiIHk9IjMiIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgcng9IjIiIHJ5PSIyIi8+PHBhdGggZD0iTTMgOWgxOE0zIDE1aDE4TTkgM3YxOE02IDE1aDciLz48L3N2Zz4=';
            iconElement.alt = item.name_es;
            iconElement.onerror = () => {
                iconElement.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM3NzdhODIiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1ib3giPjxyZWN0IHg9IjMiIHk9IjMiIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgcng9IjIiIHJ5PSIyIi8+PHBhdGggZD0iTTMgOWgxOE0zIDE1aDE4TTkgM3YxOE02IDE1aDciLz48L3N2Zz4=';
            };
            
            // Crear contenedor de detalles
            const detailsElement = document.createElement('div');
            detailsElement.className = 'item-details';
            
            // Nombre del ítem
            const nameElement = document.createElement('div');
            nameElement.className = 'item-name';
            nameElement.textContent = item.name_es;
            
            // Precios
            const pricesElement = document.createElement('div');
            pricesElement.className = 'item-prices';
            
            const buyPriceElement = document.createElement('span');
            buyPriceElement.className = 'price-buy';
            buyPriceElement.innerHTML = `Compra: ${buyPrice}`;
            
            const sellPriceElement = document.createElement('span');
            sellPriceElement.className = 'price-sell';
            sellPriceElement.innerHTML = `Venta: ${sellPrice}`;
            
            pricesElement.appendChild(buyPriceElement);
            pricesElement.appendChild(sellPriceElement);
            
            // Construir la estructura
            detailsElement.appendChild(nameElement);
            detailsElement.appendChild(pricesElement);
            
            itemElement.appendChild(iconElement);
            itemElement.appendChild(detailsElement);
            
            itemElement.addEventListener('click', () => this.selectSuggestion(item.id));
            this.suggestionsContainer.appendChild(itemElement);
        });
    }

    async loadMarketPrices() {
        try {
            // Tomar solo los primeros 20 ítems para no sobrecargar la API
            const itemsToUpdate = this.items.slice(0, 20);
            const itemIds = itemsToUpdate.map(item => item.id);
            
            // Obtener precios de mercado
            const pricesResponse = await fetch(
                `https://api.guildwars2.com/v2/commerce/prices?ids=${itemIds.join(',')}`
            );
            
            if (!pricesResponse.ok) {
                console.warn('No se pudieron cargar los precios de mercado');
                return;
            }
            
            const prices = await pricesResponse.json();
            
            // Actualizar precios en los ítems
            const pricesMap = new Map(prices.map(p => [p.id, p]));
            
            this.items = this.items.map(item => {
                const priceData = pricesMap.get(item.id);
                if (priceData) {
                    return {
                        ...item,
                        buy_price: priceData.buys?.unit_price || 0,
                        sell_price: priceData.sells?.unit_price || 0
                    };
                }
                return item;
            });
            
        } catch (error) {
            console.error('Error cargando precios de mercado:', error);
        }
    }

    async selectSuggestion(itemId) {
        if (!this.items || !Array.isArray(this.items)) {
            console.error('Items no inicializados');
            return;
        }

        const item = this.items.find(i => i.id === parseInt(itemId));
        if (!item) {
            console.error('Ítem no encontrado');
            return;
        }

        try {
            // Almacenar en sessionStorage
            sessionStorage.setItem('selectedItem', JSON.stringify(item));
            
            // Redirigir a detalle.html
            window.location.href = `detalle.html?id=${itemId}`;
        } catch (error) {
            console.error('Error al seleccionar ítem:', error);
            App.showError('Error al seleccionar el ítem. Por favor, intenta nuevamente.');
        }
    }
}
