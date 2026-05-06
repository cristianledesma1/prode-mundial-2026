// ============================================================
// AUTH — Google Identity Services
// Reemplazar con tu Google OAuth Client ID:
// ============================================================
const GOOGLE_CLIENT_ID = "297547033472-uf3rq09ghgejpuhblsplnm3ojur69im1.apps.googleusercontent.com";

const Auth = (() => {
  const USER_KEY = 'prode_user';

  function getUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  }

  function setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function logout() {
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem('admin_key');
    if (typeof google !== 'undefined') google.accounts.id.disableAutoSelect();
    document.getElementById('nav-admin-link').style.display = 'none';
    App.navigate('/login');
  }

  function parseJwt(token) {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(
      decodeURIComponent(
        atob(b64).split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
      )
    );
  }

  async function handleCredential(response) {
    try {
      App.showLoading();
      const payload  = parseJwt(response.credential);
      const userData = await API.login({ email: payload.email, alias: '' });
      const user     = { email: payload.email, nombre: payload.name || payload.email, ...userData };
      setUser(user);
      App.onLogin(user);
    } catch (e) {
      App.showToast('Error al iniciar sesión: ' + e.message, 'error');
      App.renderLogin();
    }
  }

  function init() {
    const tryInit = () => {
      if (typeof google === 'undefined' || !google.accounts) { setTimeout(tryInit, 200); return; }
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredential,
        auto_select: false
      });
    };
    tryInit();
  }

  function renderGoogleButton(containerId) {
    const tryRender = () => {
      if (typeof google === 'undefined' || !google.accounts) { setTimeout(tryRender, 200); return; }
      google.accounts.id.renderButton(
        document.getElementById(containerId),
        { type: 'standard', shape: 'pill', theme: 'outline', text: 'signin_with', size: 'large', locale: 'es', width: 280 }
      );
    };
    tryRender();
  }

  return { getUser, setUser, logout, init, renderGoogleButton };
})();
