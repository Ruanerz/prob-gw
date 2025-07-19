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
// Función robusta para formatear cobre a oro/plata/cobre (soporta negativos y redondeo)
function formatGold(value) {
  const rounded = Math.round(value);
  const isNegative = rounded < 0;
  const absValue = Math.abs(rounded);

  const gold = Math.floor(absValue / 10000);
  const silver = Math.floor((absValue % 10000) / 100);
  const copper = absValue % 100;

  let parts = [];
  if (gold > 0) {
    parts.push(`${gold}g`);
    parts.push(`${silver.toString().padStart(2, '0')}s`);
    parts.push(`${copper.toString().padStart(2, '0')}c`);
  } else if (silver > 0) {
    parts.push(`${silver}s`);
    parts.push(`${copper.toString().padStart(2, '0')}c`);
  } else {
    parts.push(`${copper}c`);
  }

  let result = parts.join(' ');
  if (isNegative) result = '-' + result;
  return result.trim();
}

// Devuelve la misma cantidad pero con etiquetas span de colores
function formatGoldColored(value) {
  const rounded = Math.round(value);
  const isNegative = rounded < 0;
  const absValue = Math.abs(rounded);

  const gold = Math.floor(absValue / 10000);
  const silver = Math.floor((absValue % 10000) / 100);
  const copper = absValue % 100;

  let result = '';
  if (gold > 0) {
    result += `<span class="gold">${gold}<img src="img/Gold_coin.png" alt="Gold" width="12"></span>` +
              `<span class="silver">${silver.toString().padStart(2, '0')}<img src="img/Silver_coin.png" alt="Silver" width="12"></span>` +
              `<span class="copper">${copper.toString().padStart(2, '0')}<img src="img/Copper_coin.png" alt="Copper" width="12"></span>`;
  } else if (silver > 0) {
    result += `<span class="silver">${silver}<img src="img/Silver_coin.png" alt="Silver" width="12"></span> ` +
              `<span class="copper">${copper.toString().padStart(2, '0')}<img src="img/Copper_coin.png" alt="Copper" width="12"></span>`;
  } else {
    result += `<span class="copper">${copper.toString().padStart(2, '0')}<img src="img/Copper_coin.png" alt="Copper" width="12"></span>`;
  }

  if (isNegative) result = '-' + result.trim();
  return result.trim();
}

// Hacer disponible globalmente para todos los scripts
window.formatGold = formatGold;
window.formatGoldColored = formatGoldColored;

// Exportar para uso en Node.js si es necesario
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { formatGold, formatGoldColored };
}
// Configuración de Google OAuth
const GOOGLE_CLIENT_ID = '943692746860-dhc6ofk0rkl93s6ablfarv10fk1ghtnd.apps.googleusercontent.com'; // <-- Pon aquí tu Client ID real
// Construye dinámicamente la URI de redirección para que funcione tanto en local como en producción
const GOOGLE_REDIRECT_URI = `${window.location.origin}/auth.html`;

let currentUser = JSON.parse(localStorage.getItem('user')) || null;

// Procesa el fragmento OAuth (`#access_token=...`) que Discord devuelve cuando se usa response_type=token
async function processOAuthFragment() {
    const hash = window.location.hash.startsWith('#') ? window.location.hash.substring(1) : '';
    if (!hash) return;
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    if (!accessToken) return;
    const state = params.get('state') || 'discord';
    try {
        let user = null;
        if (state === 'discord') {
            const resp = await fetch('https://discord.com/api/users/@me', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (!resp.ok) throw new Error('Error al obtener perfil de Discord');
            const profile = await resp.json();
            let avatarUrl;
            if (profile.avatar) {
                avatarUrl = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`;
            } else {
                const index = profile.discriminator ? parseInt(profile.discriminator) % 5 : (parseInt(profile.id) >> 22) % 6;
                avatarUrl = `https://cdn.discordapp.com/embed/avatars/${index}.png`;
            }
            user = {
                id: profile.id,
                name: profile.global_name || profile.username,
                email: profile.email || '',
                picture: avatarUrl
            };
        } else {
            // Otros proveedores (Google usa auth.html) no se manejan aquí por ahora
            return;
        }
        // Guardar en localStorage
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('auth_token', accessToken);
        currentUser = user;
        // Limpiar fragmento para evitar exponer el token
        history.replaceState(null, null, window.location.pathname + window.location.search);
    } catch (err) {
        console.error('Error procesando OAuth fragment:', err);
    }
}


async function initAuth() {
        // Procesar fragmento OAuth antes de nada (Discord)
    await processOAuthFragment();

    // Actualizar currentUser desde localStorage
    currentUser = JSON.parse(localStorage.getItem('user')) || null;
    // Actualizar la UI
    updateAuthUI();
    
    // Si hay un token pero no hay usuario, forzar recarga
    if (localStorage.getItem('auth_token') && !currentUser) {
        const userFromStorage = localStorage.getItem('user');
        if (userFromStorage) {
            currentUser = JSON.parse(userFromStorage);
            updateAuthUI();
        } else {
            // Si hay token pero no usuario, limpiar todo
            localStorage.removeItem('auth_token');
            updateAuthUI();
        }
    }
}

function updateAuthUI() {
    // Esta función puede ser extendida si se requiere actualizar la UI global
    if (window.updateAuthMenu) window.updateAuthMenu();
}

function loginWithGoogle() {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&response_type=token&scope=email%20profile&access_type=online`;
    window.location.href = authUrl;
}

// Estructura base para Facebook (a implementar después)
function loginWithFacebook() {
    alert('Próximamente: Inicio de sesión con Facebook');
}

function logout() {
    currentUser = null;
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token'); // Elimina también el token para cerrar la sesión correctamente
    updateAuthUI();
    window.location.href = 'index.html';
}

function requireAuth() {
    if (!currentUser) {
        window.location.href = 'auth.html?redirect=' + encodeURIComponent(window.location.pathname);
        return false;
    }
    return true;
}

document.addEventListener('DOMContentLoaded', initAuth);

const DISCORD_CLIENT_ID = '1391252012561207386';
const DISCORD_REDIRECT_URI = "https://ruanerz.github.io/prob-gw/index.html";

function loginWithDiscord() {
    const authUrl = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=token&scope=identify&state=discord`;
    window.location.href = authUrl;
}

window.Auth = {
    get currentUser() { return currentUser; },
    initAuth,
    loginWithGoogle,
    loginWithFacebook,
    loginWithDiscord,
    logout,
    requireAuth
};
// Theme management
const ThemeManager = {
    init() {
        this.theme = localStorage.getItem('theme') || 'dark';
        this.applyTheme();
    },
    
    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', this.theme);
        this.applyTheme();
    },
    
    applyTheme() {
        // Cambiar clases en el <body>
        document.body.classList.toggle('light-theme', this.theme === 'light');
        document.body.classList.toggle('dark-theme', this.theme === 'dark');

        // Cambiar clases en el video de fondo
        const bg = document.getElementById('bg-video');
        const overlay = document.getElementById('bg-overlay');
        if (bg) {
            bg.classList.toggle('dark', this.theme === 'dark');
        }
        if (overlay) {
            overlay.style.background = this.theme === 'dark' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.6)';
        }

        // Actualizar el ícono del botón
        const themeButtons = document.querySelectorAll('.theme-toggle');
        themeButtons.forEach(btn => {
            btn.textContent = this.theme === 'dark' ? '🌙' : '☀️';
        });
    }
};

// Navigation menu data
const navigationData = {
    menuItems: [
        { text: 'Inicio', href: '/', target: 'tab-detalles', class: '' },
        { text: 'Dones', href: 'dones.html', target: 'tab-crafteo', class: '' },
        { text: 'Comparativa', href: 'compare-craft.html', target: 'tab-comparativa', class: '', requiresLogin: true },
        { text: 'Fractales', href: 'fractales-gold.html', target: 'tab-fractales', class: '', requiresLogin: true },
        { text: 'Legendarias', href: 'leg-craft.html', target: 'tab-leg-craft', class: '' },
        { text: 'Forja Mística', href: 'forja-mistica.html', target: 'tab-forja-mistica', class: '' },
    ],
    rightMenuItems: [
        { 
            text: '🌙', 
            href: '#', 
            target: '', 
            class: 'right-btn theme-toggle',
            id: 'theme-toggle',
            onClick: (e) => {
                e.preventDefault();
                ThemeManager.toggleTheme();
            }
        },
        { 
            text: 'Iniciar sesión', 
            href: '#', 
            target: '', 
            class: 'right-btn',
            id: 'loginBtn',
            onClick: (e) => {
                e.preventDefault();
                window.location.href = 'login.html';
            }
        },
        {
            text: '',
            href: '#',
            target: '',
            class: 'right-btn',
            id: 'userInfo',
            style: 'display: none; padding: 0 10px;',
            onClick: (e) => {
                e.preventDefault();
                showAccountModal();
            }
        }
    ]
};


// Actualizar el menú de autenticación según el estado
function updateAuthMenu() {
    const loginBtn = document.getElementById('loginBtn');
    const userInfo = document.getElementById('userInfo');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const isLoggedIn = !!localStorage.getItem('auth_token');

    document.querySelectorAll('[data-requires-login]')
        .forEach(link => {
            link.style.display = isLoggedIn ? '' : 'none';
        });
    
    if (isLoggedIn && user) {
        // Usuario autenticado
        if (loginBtn) loginBtn.style.display = 'none';
        if (userInfo) {
            userInfo.style.display = 'block';
            userInfo.innerHTML = `
                <img src="${user.picture || 'https://via.placeholder.com/24'}"
                     alt="avatar"
                     style="width:24px;height:24px;border-radius:50%;vertical-align:middle;margin-right:5px;">
                ${user.name || 'Usuario'}
            `;
            userInfo.onclick = (e) => {
                e.preventDefault();
                showAccountModal();
            };
        }
    } else {
        // Usuario no autenticado
        if (loginBtn) loginBtn.style.display = 'block';
        if (userInfo) userInfo.style.display = 'none';
    }
}

// Escucha cambios de almacenamiento para refrescar el menú
window.addEventListener('storage', updateAuthMenu);

// Modal para elegir proveedor de autenticación
function showAuthOptions() {
    let modal = document.getElementById('auth-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'auth-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="auth-modal-content">
                <h3 style='margin-bottom:18px;color:#fff;'>Iniciar sesión</h3>
                <button id="google-login-btn" class="auth-btn google-btn">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" alt="google"> Google
                </button>
                <button id="facebook-login-btn" class="auth-btn facebook-btn">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/facebook/facebook-original.svg" alt="facebook"> Facebook
                </button>
                <button id="discord-login-btn" class="auth-btn discord-btn">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/discord/discord-original.svg" alt="discord"> Discord
                </button>
                <a href="login.html" class="auth-classic-link">¿Prefieres iniciar sesión clásico?</a>
                <button onclick="document.getElementById('auth-modal').remove()" class="auth-cancel-btn">Cancelar</button>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('google-login-btn').onclick = () => {
            if (window.Auth && window.Auth.loginWithGoogle) window.Auth.loginWithGoogle();
        };
        document.getElementById('facebook-login-btn').onclick = () => {
            if (window.Auth && window.Auth.loginWithFacebook) window.Auth.loginWithFacebook();
        };
        document.getElementById('discord-login-btn').onclick = () => {
            if (window.Auth && window.Auth.loginWithDiscord) window.Auth.loginWithDiscord();
        };
    }
}

// Mostrar modal con información de la cuenta
function showAccountModal() {
    const existing = document.getElementById('account-modal');
    if (existing) return;

    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) return;

    const modal = document.createElement('div');
    modal.id = 'account-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="account-modal-content">
            <img src="${user.picture || 'https://via.placeholder.com/64'}" class="account-avatar" alt="avatar">
            <div class="account-name">${user.name || 'Usuario'}</div>
            <div class="account-email">${user.email || ''}</div>
            <a href="cuenta.html" class="account-link">Mi Cuenta</a>
            <button onclick="window.Auth && window.Auth.logout && window.Auth.logout()" class="logout-btn">Cerrar sesión</button>
            <button class="close-account-btn">Cerrar</button>
        </div>
    `;
    document.body.appendChild(modal);

    const close = () => modal.remove();
    modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
    });
    modal.querySelector('.close-account-btn').addEventListener('click', close);
}

// Function to create the navigation HTML
function createNavigation() {
    // Create the main nav element
    const nav = document.createElement('nav');
    nav.className = 'topbar item-tabs-bar';

    // Create menu center div
    const menuCenter = document.createElement('div');
    menuCenter.className = 'menu-center';

    // Add menu items to center menu
    navigationData.menuItems.forEach(item => {
        const link = document.createElement('a');
        link.href = item.href;
        link.className = `item-tab ${item.class}`.trim();
        if (item.target) {
            link.setAttribute('data-target', item.target);
        }
        if (item.requiresLogin) {
            link.setAttribute('data-requires-login', 'true');
        }
        link.textContent = item.text;
        menuCenter.appendChild(link);
    });

    // Create menu right div
    const menuRight = document.createElement('div');
    menuRight.className = 'menu-right';

    // Add items to right menu
    navigationData.rightMenuItems.forEach(item => {
        const link = document.createElement('a');
        link.href = item.href;
        link.className = `item-tab ${item.class}`.trim();
        if (item.target) {
            link.setAttribute('data-target', item.target);
        }
        if (item.id) {
            link.id = item.id;
        }
        link.textContent = item.text;
        
        // Add click event if specified
        if (item.onClick) {
            link.addEventListener('click', item.onClick);
        }
        
        menuRight.appendChild(link);
    });

    // Append sections to nav
    nav.appendChild(menuCenter);
    nav.appendChild(menuRight);

    return nav;
}

// Function to initialize the navigation
function initNavigation() {
    const header = document.querySelector('header');
    if (header) {
        const nav = createNavigation();
        header.insertBefore(nav, header.firstChild);
        ThemeManager.init();
        updateAuthMenu();
        nav.querySelectorAll('a.item-tab').forEach(link => {
            if (link.id !== 'userInfo') {
                link.addEventListener('click', () => {
                    const modal = document.getElementById('account-modal');
                    if (modal) modal.remove();
                });
            }
        });
    }
}

// Inicializar la navegación cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigation);
} else {
    initNavigation();
}
// Modal de feedback/contacto

function createFeedbackModal() {
  if (!document.getElementById('open-feedback-modal')) {
    const btn = document.createElement('a');
    btn.href = '#';
    btn.id = 'open-feedback-modal';
    btn.className = 'feedback-float';
    btn.textContent = 'Feedback';
    document.body.appendChild(btn);
  }

  if (!document.getElementById('feedback-modal')) {
    const modal = document.createElement('div');
    modal.id = 'feedback-modal';
    modal.className = 'search-modal hidden';
    modal.innerHTML = `
      <div class="search-modal-backdrop"></div>
      <div class="search-modal-content">
        <button class="close-modal" id="close-feedback-modal">×</button>
        <div class="text-center"><h2>¿Mejoras?¿Bugs?</h2></div>
        <div class="mb-18-0-8-0">
          <p>¿Tienes dudas, sugerencias o comentarios?</p><br>
          <p>Escríbeme por discord <a href="https://discord.gg/rtAEcMys" target="_blank" class="item-link">SERVER RUANERZ</a>
          <br>en el canal general.</p><br>
          <p>Por privado puedes escribirme a Ruanerz#0220 en discord.</p><br>
          <p>También puedes escribirme en mi canal de <a href="https://www.youtube.com/@Ruanerz?sub_confirmation=1" target="_blank" class="item-link">Youtube</a>.</p>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }
}

function initFeedbackModal() {
  createFeedbackModal();
  const openBtn = document.getElementById('open-feedback-modal');
  const modal = document.getElementById('feedback-modal');
  const closeBtn = document.getElementById('close-feedback-modal');
  if (!openBtn || !modal || !closeBtn) return;

  const open = function(e) {
    e.preventDefault();
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  };

  const close = function() {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  };

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  modal.querySelector('.search-modal-backdrop').addEventListener('click', close);
  document.addEventListener('keydown', function(e) {
    if (!modal.classList.contains('hidden') && e.key === 'Escape') {
      close();
    }
  });
}

document.addEventListener('DOMContentLoaded', initFeedbackModal);
