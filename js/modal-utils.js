(function() {
  function loadScript(url) {
    var script = document.createElement('script');
    script.src = url;
    document.body.appendChild(script);
  }

  window.openSearchModal = function(scriptUrl = 'js/search-modal.js') {
    var modal = document.getElementById('search-modal');
    if (!modal) return;
    modal.style.display = 'block';
    if (!window._searchLoaded && scriptUrl !== null) {
      var loadMain = function() {
        if (scriptUrl) loadScript(scriptUrl);
      };
      if (!window.formatGold) {
        var goldScript = document.createElement('script');
        goldScript.src = 'js/formatGold.js';
        document.body.appendChild(goldScript);
        goldScript.onload = loadMain;
      } else {
        loadMain();
      }
      window._searchLoaded = true;
    }
  };

  window.closeSearchModal = function() {
    var modal = document.getElementById('search-modal');
    if (!modal) return;
    modal.style.display = 'none';
  };

  window.initSearchModal = function() {
    var openBtn = document.getElementById('open-search-modal');
    var modal = document.getElementById('search-modal');
    if (!openBtn || !modal) return;

    var closeBtn = document.getElementById('close-search-modal');
    var backdrop = modal.querySelector('.search-modal-backdrop');
    var scriptUrl = openBtn.dataset.script || 'js/search-modal.js';

    openBtn.addEventListener('click', function(e) {
      e.preventDefault();
      openSearchModal(scriptUrl);
    });

    if (closeBtn) closeBtn.addEventListener('click', closeSearchModal);
    if (backdrop) backdrop.addEventListener('click', closeSearchModal);

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeSearchModal();
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initSearchModal);
  } else {
    window.initSearchModal();
  }
})();
