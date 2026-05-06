// ============================================================
// ADMIN — Panel de administración
// ============================================================

const Admin = (() => {
  let _tab = 'pagos'; // 'pagos' | 'resultados' | 'predicciones'

  function getKey() {
    return sessionStorage.getItem('admin_key') || '';
  }

  // ── Tab Pagos ──────────────────────────────────────────────
  async function loadPagos(container) {
    container.innerHTML = `<div class="loading-screen" style="min-height:160px"><div class="spinner"></div></div>`;
    try {
      const pagos = await API.getAdminPagos(getKey());
      if (!pagos.length) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">👥</div><p class="empty-text">No hay usuarios registrados</p></div>`;
        return;
      }
      container.innerHTML = pagos.map(u => `
        <div class="admin-user-row">
          <div class="admin-user-info">
            <div class="admin-user-alias">${u.alias || '(sin alias)'}</div>
            <div class="admin-user-email">${u.email}</div>
          </div>
          ${u.pagado
            ? '<span class="badge badge-green">✅ Pagado</span>'
            : `<button class="btn btn-primary btn-sm" data-email="${u.email}" data-action="pago">Confirmar pago</button>`}
        </div>`).join('');

      container.querySelectorAll('[data-action="pago"]').forEach(btn => {
        btn.addEventListener('click', async () => {
          btn.disabled = true; btn.textContent = '...';
          try {
            const admin = Auth.getUser();
            await API.confirmarPago({ email: btn.dataset.email, confirmado_por: admin?.email || 'admin' }, getKey());
            App.showToast('Pago confirmado ✅', 'success');
            loadPagos(container);
          } catch (e) {
            App.showToast(e.message, 'error');
            btn.disabled = false; btn.textContent = 'Confirmar pago';
          }
        });
      });
    } catch (e) {
      container.innerHTML = `<p style="color:var(--red);padding:12px">${e.message}</p>`;
    }
  }

  // ── Tab Resultados ─────────────────────────────────────────
  async function loadResultados(container) {
    container.innerHTML = `<div class="loading-screen" style="min-height:160px"><div class="spinner"></div></div>`;
    try {
      const partidos = await API.getPartidos();
      if (!partidos.length) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">📅</div><p class="empty-text">No hay partidos cargados</p></div>`;
        return;
      }
      container.innerHTML = partidos.map(p => {
        const ok = p.golesA !== null && p.golesB !== null;
        return `
          <div class="card" style="margin-bottom:8px;">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
              <div>
                <div style="font-weight:700;font-size:0.9rem;">${p.equipoA} vs ${p.equipoB}</div>
                <div style="font-size:0.74rem;color:#888;">${p.fase || ''} · ID ${p.id}</div>
              </div>
              ${ok
                ? `<span class="badge badge-green">${p.golesA} – ${p.golesB} (cargado)</span>`
                : `<form class="res-form" data-id="${p.id}" style="display:flex;gap:6px;align-items:center;">
                    <input class="form-input score-input" type="number" name="ga" min="0" max="20" placeholder="0" required style="width:46px!important;">
                    <span class="score-sep">–</span>
                    <input class="form-input score-input" type="number" name="gb" min="0" max="20" placeholder="0" required style="width:46px!important;">
                    <button type="submit" class="btn btn-primary btn-sm">Cargar</button>
                  </form>`}
            </div>
          </div>`;
      }).join('');

      container.querySelectorAll('.res-form').forEach(form => {
        form.addEventListener('submit', async e => {
          e.preventDefault();
          const ga  = parseInt(form.querySelector('[name="ga"]').value);
          const gb  = parseInt(form.querySelector('[name="gb"]').value);
          if (isNaN(ga) || isNaN(gb)) { App.showToast('Ingresá ambos goles', 'error'); return; }
          const btn = form.querySelector('button');
          btn.disabled = true; btn.textContent = '...';
          try {
            const res = await API.cargarResultado({ partido_id: form.dataset.id, golesA: ga, golesB: gb }, getKey());
            App.showToast(`Resultado cargado. ${res.predicciones_calculadas} predicciones calculadas ✅`, 'success');
            loadResultados(container);
          } catch (err) {
            App.showToast(err.message, 'error');
            btn.disabled = false; btn.textContent = 'Cargar';
          }
        });
      });
    } catch (e) {
      container.innerHTML = `<p style="color:var(--red);padding:12px">${e.message}</p>`;
    }
  }

  // ── Tab Predicciones ───────────────────────────────────────
  async function loadPredicciones(container) {
    container.innerHTML = `<div class="loading-screen" style="min-height:160px"><div class="spinner"></div></div>`;
    try {
      const partidos = await API.getPartidos();
      container.innerHTML = `
        <div class="form-group">
          <label class="form-label">Seleccioná un partido</label>
          <select id="sel-partido" class="form-input">
            <option value="">— Elegir partido —</option>
            ${partidos.map(p => `<option value="${p.id}">${p.equipoA} vs ${p.equipoB}</option>`).join('')}
          </select>
        </div>
        <div id="preds-list"></div>`;

      document.getElementById('sel-partido').addEventListener('change', async function () {
        const id  = this.value;
        const res = document.getElementById('preds-list');
        if (!id) { res.innerHTML = ''; return; }
        res.innerHTML = `<div class="spinner" style="margin:16px auto;display:block;width:32px;height:32px;border-width:2px;"></div>`;
        try {
          const preds = await API.getAdminPredicciones(id, getKey());
          if (!preds.length) {
            res.innerHTML = `<p style="color:#888;font-size:0.85rem;padding:8px 0">Sin predicciones para este partido.</p>`;
            return;
          }
          res.innerHTML = `
            <div class="card" style="padding:0;overflow:hidden;">
              <table style="width:100%;border-collapse:collapse;">
                <thead>
                  <tr style="border-bottom:1px solid var(--border);">
                    <th style="padding:8px 12px;text-align:left;font-size:0.72rem;color:#888;">Alias</th>
                    <th style="padding:8px;text-align:center;font-size:0.72rem;color:#888;">Predicción</th>
                    <th style="padding:8px;text-align:center;font-size:0.72rem;color:#888;">Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  ${preds.map(p => `
                    <tr style="border-bottom:1px solid #f0f0f0;">
                      <td style="padding:10px 12px;font-weight:600;font-size:0.88rem;">${p.alias}</td>
                      <td style="padding:10px 8px;text-align:center;font-weight:700;">${p.golesA_pred} – ${p.golesB_pred}</td>
                      <td style="padding:10px 8px;text-align:center;">
                        ${p.calculado
                          ? `<span class="badge ${Number(p.puntos) === 3 ? 'badge-gold' : 'badge-green'}">${Number(p.puntos) === 3 ? '⭐ ' : ''}${p.puntos} pts</span>`
                          : '<span class="badge badge-gray">—</span>'}
                      </td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>`;
        } catch (err) {
          res.innerHTML = `<p style="color:var(--red)">${err.message}</p>`;
        }
      });
    } catch (e) {
      container.innerHTML = `<p style="color:var(--red);padding:12px">${e.message}</p>`;
    }
  }

  // ── Render principal ───────────────────────────────────────
  function render() {
    const key = getKey();
    if (!key) {
      document.getElementById('app-content').innerHTML = `
        <div class="admin-key-screen">
          <div style="font-size:2.5rem">🔐</div>
          <h2>Panel Administrador</h2>
          <p>Ingresá la clave para acceder</p>
          <div style="display:flex;gap:8px;width:100%;max-width:300px">
            <input id="admin-key-input" class="form-input" type="password" placeholder="Clave admin">
            <button class="btn btn-gold" id="btn-admin-enter">Entrar</button>
          </div>
        </div>`;
      document.getElementById('btn-admin-enter').addEventListener('click', async () => {
        const k = document.getElementById('admin-key-input').value.trim();
        if (!k) return;
        try {
          await API.getAdminPagos(k);
          sessionStorage.setItem('admin_key', k);
          document.getElementById('nav-admin-link').style.display = '';
          render();
        } catch {
          App.showToast('Clave incorrecta', 'error');
        }
      });
      return;
    }

    const tabs = [
      { id: 'pagos',        label: '💰 Pagos' },
      { id: 'resultados',   label: '⚽ Resultados' },
      { id: 'predicciones', label: '📊 Predicciones' }
    ];

    document.getElementById('app-content').innerHTML = `
      <div class="section-header">
        <h2 class="section-title">Panel Admin</h2>
        <button class="btn btn-outline btn-sm" id="btn-admin-exit">🔓 Salir</button>
      </div>
      <div class="admin-tabs">
        ${tabs.map(t => `<button class="admin-tab ${_tab === t.id ? 'active' : ''}" data-tab="${t.id}">${t.label}</button>`).join('')}
      </div>
      <div id="admin-tab-content"></div>`;

    document.getElementById('btn-admin-exit').addEventListener('click', () => {
      sessionStorage.removeItem('admin_key');
      document.getElementById('nav-admin-link').style.display = 'none';
      App.navigate('/partidos');
    });

    document.querySelectorAll('.admin-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        _tab = btn.dataset.tab;
        document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadActiveTab();
      });
    });

    loadActiveTab();
  }

  function loadActiveTab() {
    const container = document.getElementById('admin-tab-content');
    if (!container) return;
    if      (_tab === 'pagos')         loadPagos(container);
    else if (_tab === 'resultados')    loadResultados(container);
    else if (_tab === 'predicciones')  loadPredicciones(container);
  }

  return { render };
})();
