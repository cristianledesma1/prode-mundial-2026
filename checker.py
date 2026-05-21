"""
Deportick Ticket Checker — River Plate Final Apertura 2026
==========================================================
Usa un navegador real (Playwright) para que el JavaScript de la
página se ejecute y el texto "AGOTADO" se renderice correctamente.

Instalación (una sola vez):
    pip install playwright plyer pygame
    playwright install chromium

Uso:
    python checker.py

Detenelo con Ctrl+C.
"""

import time
import webbrowser
import sys

# ── Configuración ──────────────────────────────────────────────
URL        = "https://www.deportick.com/event/riverplatefinalapertura26"
SOLDOUT    = "AGOTADO"   # texto visible en la página cuando NO hay entradas
INTERVAL   = 30          # segundos entre chequeos (no bajar de 30)
HEADLESS   = True        # True = sin ventana | False = muestra el navegador
SOUND_FILE = r"C:\Users\led_c\Downloads\ringtones-page-gallo-despertador.mp3"
# ──────────────────────────────────────────────────────────────

try:
    from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout
    HAS_PW = True
except ImportError:
    HAS_PW = False

try:
    from plyer import notification as desk_notif
    HAS_NOTIF = True
except ImportError:
    HAS_NOTIF = False

try:
    import pygame
    pygame.mixer.init()
    HAS_PYGAME = True
except Exception:
    HAS_PYGAME = False


def play_sound():
    """Reproduce el MP3 configurado en SOUND_FILE (en loop hasta que el usuario lo cierra)."""
    if HAS_PYGAME:
        try:
            pygame.mixer.music.load(SOUND_FILE)
            pygame.mixer.music.play(loops=5)  # repite 5 veces
            return
        except Exception as e:
            print(f"  ⚠  No se pudo reproducir el sonido: {e}")
    # Fallback: abrir el archivo con el reproductor por defecto de Windows
    try:
        import os
        os.startfile(SOUND_FILE)
    except Exception:
        pass


def notify_desktop(title, msg):
    if HAS_NOTIF:
        try:
            desk_notif.notify(title=title, message=msg,
                              app_name="Deportick Checker", timeout=30)
        except Exception:
            pass


def check_with_playwright(page):
    """
    Navega a la URL, espera a que el JS cargue el contenido
    y devuelve (hay_entradas: bool|None, mensaje: str).
    """
    try:
        page.goto(URL, wait_until="networkidle", timeout=30_000)
        # Esperar un poco más por si hay renders tardíos
        page.wait_for_timeout(2000)
        content = page.content().upper()

        if SOLDOUT.upper() in content:
            return False, f'Sin entradas ("{SOLDOUT}" encontrado en la página)'
        return True, f'¡"{SOLDOUT}" NO encontrado → ¡ENTRADAS DISPONIBLES!'

    except PWTimeout:
        return None, "Timeout — la página tardó demasiado"
    except Exception as e:
        return None, f"Error: {e}"


def main():
    if not HAS_PW:
        print("❌  Playwright no está instalado. Ejecutá:")
        print("      pip install playwright")
        print("      playwright install chromium")
        sys.exit(1)

    print("=" * 58)
    print("  🎟️  Deportick Ticket Checker")
    print("  River Plate — Final Apertura 2026")
    print("=" * 58)
    print(f"  URL      : {URL}")
    print(f"  Texto    : '{SOLDOUT}' = sin entradas")
    print(f"  Intervalo: {INTERVAL}s")
    print(f"  Modo     : {'headless (sin ventana)' if HEADLESS else 'con ventana visible'}")
    print(f"  Notifs   : {'✅' if HAS_NOTIF else '❌ (pip install plyer)'}")
    print(f"  Sonido   : {'✅ ' + SOUND_FILE if HAS_PYGAME else '❌ (pip install pygame)'}")
    print("=" * 58)
    print("  Ctrl+C para detener\n")

    checks = 0

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=HEADLESS)
        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            locale="es-AR",
        )
        page = context.new_page()

        try:
            while True:
                hay, msg = check_with_playwright(page)
                checks += 1
                ts = time.strftime("%H:%M:%S")

                if hay is True:
                    print(f"\n{'='*58}")
                    print(f"  🎉  [{ts}] ¡¡ENTRADAS DISPONIBLES!!")
                    print(f"  {msg}")
                    print(f"  Abriendo el navegador…")
                    print(f"{'='*58}\n")
                    play_sound()
                    notify_desktop(
                        "🎟️ ¡Entradas disponibles!",
                        f"River Plate Final Apertura 2026\n{msg}"
                    )
                    webbrowser.open(URL)
                    break

                elif hay is False:
                    print(f"[{ts}] #{checks:>4}  ❌  {msg}")

                else:
                    print(f"[{ts}] #{checks:>4}  ⚠   {msg}")

                if checks % 10 == 0:
                    mins = (checks * INTERVAL) // 60
                    print(f"  ↳ {checks} chequeos · ~{mins}min monitoreando")

                time.sleep(INTERVAL)

        except KeyboardInterrupt:
            pass
        finally:
            browser.close()

    print("\n⏹  Checker detenido.")


if __name__ == "__main__":
    main()
