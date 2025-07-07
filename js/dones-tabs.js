// Manejo de pestañas en dones.html
document.addEventListener('DOMContentLoaded', function() {
  // Obtener todos los botones de pestaña
  const tabButtons = document.querySelectorAll('.item-tab-btn');
  
  // Función para cambiar de pestaña
  function switchTab(tabId) {
    // Ocultar todos los contenidos
    document.querySelectorAll('.container-don, .container-tributo').forEach(tab => {
      tab.style.display = 'none';
    });
    
    // Desactivar todos los botones
    tabButtons.forEach(button => {
      button.classList.remove('active');
    });
    
    // Activar la pestaña seleccionada
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
      selectedTab.style.display = 'block';
    }
    
    // Activar el botón correspondiente
    const activeButton = document.querySelector(`.item-tab-btn[data-tab="${tabId}"]`);
    if (activeButton) {
      activeButton.classList.add('active');
    }
    
    // Guardar la pestaña activa en el almacenamiento local
    localStorage.setItem('activeDonTab', tabId);
  }
  
  // Manejar clics en los botones de pestaña
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const tabId = this.getAttribute('data-tab');
      switchTab(tabId);
    });
  });
  
  // Cargar la pestaña guardada o mostrar la primera por defecto
  const savedTab = localStorage.getItem('activeDonTab');
  if (savedTab && document.getElementById(savedTab)) {
    switchTab(savedTab);
  } else if (tabButtons.length > 0) {
    const defaultTab = tabButtons[0].getAttribute('data-tab');
    switchTab(defaultTab);
  }
});
