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
        document.body.classList.toggle('light-theme', this.theme === 'light');
        document.body.classList.toggle('dark-theme', this.theme === 'dark');
        
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
        { text: 'Inicio', href: 'index.html', target: 'tab-detalles', class: '' },
        { text: 'Dones', href: 'dones.html', target: 'tab-crafteo', class: '' },
        { text: 'Comparativa', href: 'compare-craft.html', target: 'tab-comparativa', class: '' },
        { text: 'Fractales', href: 'fractales-gold.html', target: 'tab-fractales', class: '' },
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
                showAccountMenu();
            }
        }
    ]
};

// Mostrar menú de cuenta con opciones de usuario
function showAccountMenu() {
    let modal = document.getElementById('account-modal');
    if (modal) modal.remove(); // Remover si ya existe
    
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) return;
    
    modal = document.createElement('div');
    modal.id = 'account-modal';
    modal.className = 'modal-overlay';
    
    modal.innerHTML = `
        <div class="account-modal-content">
            <img src="${user.picture || 'https://via.placeholder.com/50'}" class="account-avatar" alt="avatar">
            <div class="account-name">${user.name || 'Usuario'}</div>
            <div class="account-email">${user.email || ''}</div>

            <a href="cuenta.html" class="account-link">Mi Cuenta</a>

            <button onclick="window.Auth && window.Auth.logout && window.Auth.logout()" class="logout-btn">Cerrar sesión</button>

            <div class="close-wrapper">
                <button onclick="document.getElementById('account-modal').remove()" class="close-account-btn">Cerrar</button>
            </div>
        </div>
    `;
    
    // Cerrar al hacer clic fuera del modal
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    document.body.appendChild(modal);
}

// Actualizar el menú de autenticación según el estado
function updateAuthMenu() {
    const loginBtn = document.getElementById('loginBtn');
    const userInfo = document.getElementById('userInfo');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const isLoggedIn = !!localStorage.getItem('auth_token');
    
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
    }
}

// Inicializar la navegación cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigation);
} else {
    initNavigation();
}
