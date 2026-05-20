"""
Deportick Ticket Checker — River Plate Final Apertura 2026
==========================================================
Monitorea la página de Deportick y avisa cuando hay entradas.

Instalación (una sola vez):
    pip install requests plyer

Uso:
    python checker.py

Detenelo con Ctrl+C.
"""

import time
import webbrowser
import sys

import requests

try:
    from plyer import notification as desk_notif
    HAS_NOTIF = True
except ImportError:
    HAS_NOTIF = False
    print("⚠  plyer no instalado — sin notificaciones de escritorio.")
    print("   Instalalo con: pip install plyer\n")

# ── Configuración ──────────────────────────────────────────────
URL      = "https://www.deportick.com/event/riverplatefinalapertura26"
SOLDOUT  = "AGOTADO"   # texto que aparece en la página cuando NO hay entradas
INTERVAL = 60          # segundos entre chequeos (no bajar de 30)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-AR,es;q=0.9,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "no-cache",
}
# ──────────────────────────────────────────────────────────────


def check_tickets():
    """Devuelve (hay_entradas: bool|None, mensaje: str)"""
    try:
        r = requests.get(URL, headers=HEADERS, timeout=20)
        if r.status_code == 403:
            return None, "403 Forbidden — Deportick bloqueó la solicitud"
        if not r.ok:
            return None, f"HTTP {r.status_code}"
        html = r.text.upper()
        if SOLDOUT.upper() in html:
            return False, f'Sin entradas ("{SOLDOUT}" encontrado en la página)'
        return True, f'¡"{SOLDOUT}" NO encontrado → posibles entradas disponibles!'
    except requests.exceptions.Timeout:
        return None, "Timeout — la página tardó demasiado"
    except Exception as e:
        return None, f"Error: {e}"


def notify_desktop(title, msg):
    if HAS_NOTIF:
        try:
            desk_notif.notify(title=title, message=msg, app_name="Deportick Checker", timeout=30)
        except Exception:
            pass


def main():
    print("=" * 58)
    print("  🎟️  Deportick Ticket Checker")
    print("  River Plate — Final Apertura 2026")
    print("=" * 58)
    print(f"  URL      : {URL}")
    print(f"  Texto    : '{SOLDOUT}' = sin entradas")
    print(f"  Intervalo: {INTERVAL}s")
    print(f"  Notifs   : {'✅' if HAS_NOTIF else '❌ (pip install plyer)'}")
    print("=" * 58)
    print("  Ctrl+C para detener\n")

    checks = 0
    errors = 0

    while True:
        hay, msg = check_tickets()
        checks += 1
        ts = time.strftime("%H:%M:%S")

        if hay is True:
            # ✅ ENTRADAS ENCONTRADAS
            print(f"\n{'='*58}")
            print(f"  🎉  [{ts}] ¡¡ENTRADAS DISPONIBLES!!")
            print(f"  {msg}")
            print(f"  Abriendo el navegador…")
            print(f"{'='*58}\n")
            notify_desktop("🎟️ ¡Entradas disponibles!", f"River Plate Final Apertura 2026\n{msg}")
            webbrowser.open(URL)
            sys.exit(0)

        elif hay is False:
            errors = 0
            icon = "❌"
            print(f"[{ts}] #{checks:>4}  {icon}  {msg}")

        else:
            errors += 1
            print(f"[{ts}] #{checks:>4}  ⚠   {msg}")
            if errors >= 5:
                print(f"\n⚠  5 errores seguidos. Verificá tu conexión.")
                print(f"   Esperando {INTERVAL * 2}s antes del próximo intento…\n")
                time.sleep(INTERVAL * 2)
                errors = 0
                continue

        # Mostrar cada 10 chequeos un resumen
        if checks % 10 == 0:
            elapsed = checks * INTERVAL
            m, s = divmod(elapsed, 60)
            print(f"  ↳ {checks} chequeos · ~{m}min {s}s monitoreando · sin entradas aún")

        time.sleep(INTERVAL)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⏹  Checker detenido por el usuario.")
