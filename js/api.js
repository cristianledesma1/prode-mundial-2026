// ============================================================
// API — Prode Mundial 2026
// Reemplazar con la URL de tu Apps Script desplegado:
// ============================================================
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyZWhTGvmCuLedbAJvr6J7ETzZGDmDHTR2lKo_ChTn-Nr4M42-KG6AW0RU8bOwdZmOx1A/exec";

async function _get(path, params = {}) {
  const url = new URL(`${APPS_SCRIPT_URL}/${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res  = await fetch(url.toString());
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Error del servidor');
  return data.data;
}

async function _post(path, body = {}, adminKey = null) {
  let url = `${APPS_SCRIPT_URL}/${path}`;
  if (adminKey) url += `?X-Admin-Key=${encodeURIComponent(adminKey)}`;
  // Usar text/plain para evitar el preflight CORS con Apps Script
  const res  = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Error del servidor');
  return data.data;
}

const API = {
  // Públicos
  getPartidos:       ()                    => _get('partidos'),
  getPosiciones:     ()                    => _get('posiciones'),
  login:             body                  => _post('login', body),
  guardarPrediccion: body                  => _post('prediccion', body),
  getMisPredicciones: email               => _get('mis-predicciones', { email }),

  // Admin
  getAdminPagos:        key               => _get('admin/pagos', { 'X-Admin-Key': key }),
  confirmarPago:        (body, key)       => _post('admin/confirmar-pago', body, key),
  cargarResultado:      (body, key)       => _post('admin/resultado', body, key),
  getAdminPredicciones: (partido_id, key) => _get('admin/predicciones', { partido_id, 'X-Admin-Key': key }),
};
