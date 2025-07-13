// Configuración de Google OAuth
const GOOGLE_CLIENT_ID = '943692746860-dhc6ofk0rkl93s6ablfarv10fk1ghtnd.apps.googleusercontent.com'; // <-- Pon aquí tu Client ID real
// Construye dinámicamente la URI de redirección para que funcione tanto en local como en producción
const GOOGLE_REDIRECT_URI = `${window.location.origin}/auth.html`;

let currentUser = JSON.parse(localStorage.getItem('user')) || null;

function initAuth() {
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
const DISCORD_REDIRECT_URI = `${window.location.origin}/auth.html`;

function loginWithDiscord() {
    const authUrl = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=token&scope=identify&state=discord`;
    window.location.href = authUrl;
}

window.Auth = {
    get currentUser() { return currentUser; },
    loginWithGoogle,
    loginWithFacebook,
    loginWithDiscord,
    logout,
    requireAuth
};
