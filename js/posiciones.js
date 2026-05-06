// ============================================================
// POSICIONES — Tabla de posiciones
// ============================================================

const Posiciones = (() => {
  async function render() {
    App.showLoading();
    try {
      const user  = Auth.getUser();
      const tabla = await API.getPosiciones();

      if (!tabla.length) {
        document.getElementById('app-content').innerHTML = `
          <div class="section-header">
            <h2 class="section-title">Posiciones</h2>
          </div>
          <div class="empty-state">
            <div class="empty-icon">🏆</div>
            <p class="empty-text">Aún no hay participantes registrados</p>
          </div>`;
        return;
      }

      const rowsHtml = tabla.map((entry, i) => {
        const rank  = i + 1;
        const isMe  = user && entry.email === user.email;
        const pagHtml = entry.pagado
          ? '<span class="badge badge-green">✅</span>'
          : '<span class="badge badge-gray">⏳</span>';

        return `
          <tr class="rank-${rank <= 3 ? rank : 'other'} ${isMe ? 'is-me' : ''}">
            <td><span class="rank-badge">${rank}</span></td>
            <td>
              <strong>${entry.alias || entry.email}</strong>
              ${isMe ? '<span style="font-size:0.7rem;color:#888;"> (vos)</span>' : ''}
            </td>
            <td><strong style="font-size:1rem;">${entry.puntos}</strong></td>
            <td>
              ${entry.plenos > 0
                ? `<span class="badge badge-gold">⭐ ${entry.plenos}</span>`
                : '<span style="color:#ccc;">—</span>'}
            </td>
            <td>${pagHtml}</td>
          </tr>`;
      }).join('');

      document.getElementById('app-content').innerHTML = `
        <div class="section-header">
          <h2 class="section-title">Posiciones</h2>
          <span class="section-sub">${tabla.length} participantes</span>
        </div>
        <div class="card" style="padding:0;overflow:hidden;">
          <table class="standings-table">
            <thead>
              <tr>
                <th style="width:36px">#</th>
                <th>Alias</th>
                <th style="width:54px">Pts</th>
                <th style="width:68px">Plenos</th>
                <th style="width:48px">Pago</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>
        <p style="font-size:0.74rem;color:#888;text-align:center;margin-top:8px;">
          Máx. 3 pts por partido &nbsp;·&nbsp; ⭐ = pleno (3/3)
        </p>`;

    } catch (err) {
      document.getElementById('app-content').innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <p class="empty-text">Error al cargar: ${err.message}</p>
          <button class="btn btn-outline mt-16" onclick="Posiciones.render()">Reintentar</button>
        </div>`;
    }
  }

  return { render };
})();
