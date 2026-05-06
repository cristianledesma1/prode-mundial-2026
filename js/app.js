// ============================================================
// APP — Router y estado global
// ============================================================

const App = (() => {
  const $content = () => document.getElementById('app-content');
  const $header  = () => document.getElementById('app-header');

  function showLoading() {
    $content().innerHTML = `
      <div class="loading-screen">
        <div class="spinner"></div>
        <p>Cargando...</p>
      </div>`;
  }

  function showToast(msg, type = 'default', duration = 3200) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className   = 'toast show' + (type !== 'default' ? ' toast-' + type : '');
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.className = 'toast'; }, duration);
  }

  function navigate(path) {
    window.location.hash = '#' + path;
  }

  function setActiveNav(page) {
    document.querySelectorAll('.nav-link').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });
  }

  function handleRoute() {
    const hash = window.location.hash.slice(1) || '/login';
    const user = Auth.getUser();

    if (!user && hash !== '/login') { navigate('/login'); return; }
    if (user  && hash === '/login') { navigate('/partidos'); return; }

    const isLogin = hash === '/login';
    $header().classList.toggle('hidden', isLogin);

    const page = hash.replace('/', '');
    setActiveNav(page);

    // Mostrar link admin si hay clave en sesión
    const adminKey = sessionStorage.getItem('admin_key');
    document.getElementById('nav-admin-link').style.display = adminKey ? '' : 'none';

    switch (hash) {
      case '/login':      renderLogin();       break;
      case '/partidos':   Partidos.render();   break;
      case '/posiciones': Posiciones.render(); break;
      case '/perfil':     renderPerfil();      break;
      case '/admin':      Admin.render();      break;
      default:            navigate('/partidos');
    }
  }

  // ── Pantalla Login ─────────────────────────────────────────
  function renderLogin() {
    $header().classList.add('hidden');
    $content().innerHTML = `
      <div class="login-screen">
        <div class="login-logo">⚽🏆</div>
        <h1 class="login-title">Prode Mundial 2026</h1>
        <p class="login-subtitle">Predicí los partidos del Mundial<br>y competí con tus amigos</p>
        <div class="login-card">
          <p style="font-size:0.85rem;color:#666;margin-bottom:16px;">
            Ingresá con tu cuenta de Google
          </p>
          <div id="google-signin-btn" style="display:flex;justify-content:center;"></div>
        </div>
      </div>`;
    Auth.renderGoogleButton('google-signin-btn');
  }

  // ── Pantalla Perfil ────────────────────────────────────────
  function renderPerfil() {
    const user = Auth.getUser();
    if (!user) return navigate('/login');

    $content().innerHTML = `
      <div class="section-header">
        <h2 class="section-title">Mi Perfil</h2>
      </div>

      <div class="card">
        <div class="profile-avatar">👤</div>
        <p class="profile-email">${user.email}</p>

        <div class="form-group">
          <label class="form-label">Estado de pago</label>
          ${user.pagado
            ? '<span class="badge badge-green">✅ Confirmado</span>'
            : '<span class="badge badge-red">⏳ Pendiente — contactá al admin</span>'}
        </div>

        <div class="form-group">
          <label class="form-label" for="input-alias">Alias (aparece en la tabla)</label>
          <input id="input-alias" class="form-input" type="text"
            placeholder="Ej: Messi10"
            value="${user.alias || ''}"
            maxlength="20">
        </div>

        <button class="btn btn-primary btn-full" id="btn-save-alias">
          Guardar alias
        </button>

        <div class="divider"></div>

        <button class="btn btn-outline btn-full" id="btn-logout-perfil">
          Cerrar sesión
        </button>
      </div>

      <div class="card mt-12">
        <div class="card-title">Acceso Admin</div>
        <p style="font-size:0.82rem;color:#666;margin-bottom:10px;">
          Ingresá la clave para acceder al panel de administración
        </p>
        <div style="display:flex;gap:8px;">
          <input id="input-admin-key" class="form-input" type="password"
            placeholder="Clave admin"
            value="${sessionStorage.getItem('admin_key') || ''}">
          <button class="btn btn-gold" id="btn-set-admin">Ingresar</button>
        </div>
      </div>`;

    document.getElementById('btn-save-alias').addEventListener('click', async () => {
      const alias = document.getElementById('input-alias').value.trim();
      if (!alias) { showToast('El alias no puede estar vacío', 'error'); return; }
      const btn = document.getElementById('btn-save-alias');
      btn.disabled = true; btn.textContent = 'Guardando...';
      try {
        await API.login({ email: user.email, alias });
        Auth.setUser({ ...user, alias });
        showToast('Alias guardado ✅', 'success');
      } catch (e) {
        showToast(e.message, 'error');
      } finally {
        btn.disabled = false; btn.textContent = 'Guardar alias';
      }
    });

    document.getElementById('btn-logout-perfil').addEventListener('click', Auth.logout);

    document.getElementById('btn-set-admin').addEventListener('click', async () => {
      const key = document.getElementById('input-admin-key').value.trim();
      if (!key) return;
      try {
        await API.getAdminPagos(key);
        sessionStorage.setItem('admin_key', key);
        document.getElementById('nav-admin-link').style.display = '';
        showToast('Acceso admin activado 🔑', 'success');
      } catch {
        showToast('Clave incorrecta', 'error');
      }
    });
  }

  // ── Callback post-login ────────────────────────────────────
  function onLogin(user) {
    if (!user.alias) {
      showToast('¡Bienvenido! Configurá tu alias antes de predecir', 'default', 4000);
      navigate('/perfil');
    } else {
      navigate('/partidos');
    }
  }

  function init() {
    Auth.init();
    document.getElementById('btn-logout').addEventListener('click', Auth.logout);
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
  }

  return { init, navigate, showLoading, showToast, renderLogin, renderPerfil, onLogin };
})();

document.addEventListener('DOMContentLoaded', App.init);
