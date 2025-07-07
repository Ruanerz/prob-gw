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
