// Manejo de pestañas en dones.html
document.addEventListener('DOMContentLoaded', function() {
  const tabButtons = document.querySelectorAll('.item-tab-btn');
  const loaded = {};

  async function switchTab(tabId) {
    document.querySelectorAll('.container-don, .container-tributo').forEach(tab => {
      tab.style.display = 'none';
    });
    
    tabButtons.forEach(button => {
      button.classList.remove('active');
    });
    
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
      selectedTab.style.display = 'block';
    }
    
    const activeButton = document.querySelector(`.item-tab-btn[data-tab="${tabId}"]`);
    if (activeButton) {
      activeButton.classList.add('active');
    }
    localStorage.setItem('activeDonTab', tabId);

    if (!loaded[tabId] && window.DonesPages) {
      loaded[tabId] = true;
      if (tabId === 'tab-don-suerte') window.DonesPages.loadSpecialDons();
      else if (tabId === 'tab-tributo-mistico') window.DonesPages.loadTributo();
      else if (tabId === 'tab-tributo-draconico') window.DonesPages.loadDraconicTribute();
      else if (tabId === 'dones-1ra-gen') window.DonesPages.loadDones1Gen();
    }
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
