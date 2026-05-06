// ============================================================
// PARTIDOS — Vista de partidos y predicciones
// ============================================================

const Partidos = (() => {
  let _partidos    = [];
  let _predicciones = [];
  let _filter = 'proximos';

  function formatFecha(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
         + ' · ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }

  function isPast(iso) { return new Date(iso) <= new Date(); }

  function getPred(id) {
    return _predicciones.find(p => String(p.partido_id) === String(id));
  }

  function cardHtml(p) {
    const pred       = getPred(p.id);
    const pasado     = isPast(p.fecha);
    const conResultado = p.golesA !== null && p.golesB !== null;

    const scoreHtml = conResultado
      ? `<div class="match-score">${p.golesA} <span class="dash">–</span> ${p.golesB}</div>`
      : `<div class="match-score pending">– <span class="dash">–</span> –</div>`;

    let footer = '';
    if (pred) {
      const pts = (pred.calculado && pred.puntos !== undefined) ? Number(pred.puntos) : null;
      const ptsHtml = pts !== null
        ? `<span class="pts-badge ${pts === 3 ? 'pleno' : ''}">${pts === 3 ? '⭐ PLENO' : pts + ' pts'}</span>`
        : '';
      footer = `<span class="pred-info">Tu pred: <strong>${pred.golesA_pred} – ${pred.golesB_pred}</strong></span>${ptsHtml}`;

    } else if (pasado) {
      footer = `<span class="match-locked">🔒 Partido cerrado</span>`;

    } else {
      footer = `
        <form class="pred-form" data-id="${p.id}">
          <div class="pred-form-row">
            <span class="pred-form-label">Tu predicción:</span>
            <div class="score-inputs">
              <input class="form-input score-input" type="number" name="ga" min="0" max="20" placeholder="0" required>
              <span class="score-sep">–</span>
              <input class="form-input score-input" type="number" name="gb" min="0" max="20" placeholder="0" required>
            </div>
            <button type="submit" class="btn btn-primary btn-sm">Predecir</button>
          </div>
        </form>`;
    }

    return `
      <div class="match-card">
        <div class="match-header">
          <span class="match-phase">${p.fase || 'Fase de grupos'}</span>
          <span class="match-date">${formatFecha(p.fecha)}</span>
        </div>
        <div class="match-teams">
          <span class="team-name home">${p.equipoA}</span>
          ${scoreHtml}
          <span class="team-name away">${p.equipoB}</span>
        </div>
        <div class="match-footer">${footer}</div>
      </div>`;
  }

  function attachForms() {
    document.querySelectorAll('.pred-form').forEach(form => {
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const user = Auth.getUser();
        if (!user) return;

        const ga  = parseInt(form.querySelector('[name="ga"]').value);
        const gb  = parseInt(form.querySelector('[name="gb"]').value);
        if (isNaN(ga) || isNaN(gb)) { App.showToast('Ingresá ambos resultados', 'error'); return; }

        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true; btn.textContent = 'Enviando...';

        try {
          await API.guardarPrediccion({
            email: user.email,
            partido_id: form.dataset.id,
            golesA_pred: ga,
            golesB_pred: gb
          });
          App.showToast('Predicción guardada ✅', 'success');
          await render();
        } catch (err) {
          App.showToast(err.message, 'error');
          btn.disabled = false; btn.textContent = 'Predecir';
        }
      });
    });
  }

  async function render() {
    App.showLoading();
    const user = Auth.getUser();

    try {
      [_partidos, _predicciones] = await Promise.all([
        API.getPartidos(),
        user ? API.getMisPredicciones(user.email) : Promise.resolve([])
      ]);

      const ahora    = new Date();
      const proximos = _partidos.filter(p => new Date(p.fecha) > ahora);
      const jugados  = _partidos.filter(p => new Date(p.fecha) <= ahora);
      const lista    = _filter === 'proximos' ? proximos : jugados;

      const listHtml = lista.length
        ? lista.map(cardHtml).join('')
        : `<div class="empty-state">
             <div class="empty-icon">${_filter === 'proximos' ? '📅' : '⚽'}</div>
             <p class="empty-text">${_filter === 'proximos' ? 'No hay próximos partidos' : 'No hay partidos jugados aún'}</p>
           </div>`;

      document.getElementById('app-content').innerHTML = `
        <div class="section-header">
          <h2 class="section-title">Partidos</h2>
          <span class="section-sub">${user?.alias || ''}</span>
        </div>
        <div class="filter-tabs">
          <div class="filter-tab ${_filter === 'proximos' ? 'active' : ''}" data-filter="proximos">
            Próximos (${proximos.length})
          </div>
          <div class="filter-tab ${_filter === 'jugados' ? 'active' : ''}" data-filter="jugados">
            Jugados (${jugados.length})
          </div>
        </div>
        <div id="matches-list">${listHtml}</div>`;

      document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => { _filter = tab.dataset.filter; render(); });
      });
      attachForms();

    } catch (err) {
      document.getElementById('app-content').innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <p class="empty-text">Error al cargar: ${err.message}</p>
          <button class="btn btn-outline mt-16" onclick="Partidos.render()">Reintentar</button>
        </div>`;
    }
  }

  return { render };
})();
