// Modal de feedback/contacto

document.addEventListener('DOMContentLoaded', function() {
  const openBtn = document.getElementById('open-feedback-modal');
  const modal = document.getElementById('feedback-modal');
  const closeBtn = document.getElementById('close-feedback-modal');
  if (!openBtn || !modal || !closeBtn) return;

  openBtn.addEventListener('click', function(e) {
    e.preventDefault();
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  });

  closeBtn.addEventListener('click', function() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  });

  // Cierra modal con fondo
  modal.querySelector('.search-modal-backdrop').addEventListener('click', function() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  });

  // Escape para cerrar
  document.addEventListener('keydown', function(e) {
    if (modal.style.display === 'block' && e.key === 'Escape') {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  });
});
