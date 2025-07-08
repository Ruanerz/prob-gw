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
})();
