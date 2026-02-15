import asyncio
import re
from playwright.async_api import async_playwright
import mysql.connector
from datetime import datetime

# Configuración de BD
db_config = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': '',
    'database': 'despensa_inteligente'
}

# ══════════════════════════════════════════════════
# UTILIDADES
# ══════════════════════════════════════════════════

def limpiar_precio(texto):
    """Extrae número de un texto como '$ 22.850' → 22850"""
    digits = "".join(filter(str.isdigit, texto))
    return float(digits) if digits else None

def generar_variantes(termino):
    """
    MODO DIOS: Genera variantes inteligentes del término de búsqueda.
    Ej: "aceite 3000" → ["aceite 3000", "aceite 3.000", "aceite 3000ml", "aceite 3.000 ml"]
    Esto asegura que no se pierdan resultados por formato de número.
    """
    variantes = set()
    variantes.add(termino)

    # Detectar números en el término
    numeros = re.findall(r'\d[\d.]*', termino)
    for num in numeros:
        num_limpio = num.replace('.', '')  # "3.000" → "3000"

        if len(num_limpio) >= 4:
            # Formato con punto de miles: 3000 → 3.000
            con_punto = f"{int(num_limpio):,.0f}".replace(',', '.')
            # Variante SIN punto
            var_sin = termino.replace(num, num_limpio)
            variantes.add(var_sin)
            # Variante CON punto
            var_con = termino.replace(num, con_punto)
            variantes.add(var_con)
            # Con "ml" pegado
            variantes.add(var_sin.strip() + "ml")
            variantes.add(var_sin.strip() + " ml")

    return list(variantes)

# ══════════════════════════════════════════════════
# CONFIGURACIÓN DE UBICACIÓN
# ══════════════════════════════════════════════════

async def set_olimpica_location(page):
    try:
        print("📍 Configurando ubicación Olímpica (Santa Marta - Centro)...")
        await page.goto("https://www.olimpica.com/", wait_until="domcontentloaded", timeout=60000)
        await page.wait_for_timeout(6000)

        continue_btn = page.get_by_role("button", name="Continuar")
        if await continue_btn.is_visible():
            await continue_btn.click()
            await page.wait_for_timeout(5000)
            print("  ✅ 'Continuar' pulsado — ubicación confirmada.")
            return

        confirm_btn = page.get_by_role("button", name="Confirmar")
        if await confirm_btn.is_visible():
            addr_input = page.locator("input[placeholder*='dirección'], .vtex-address-form__container input").first
            if await addr_input.is_visible():
                val = await addr_input.input_value()
                if not val:
                    await addr_input.fill("centro")
            await confirm_btn.click()
            await page.wait_for_timeout(5000)
            print("  ✅ 'Confirmar' pulsado — ubicación guardada.")
            return

        trigger = page.locator(".vtex-modal-layout-0-x-triggerContainer--location-delivery-info, .olimpica-dinamic-flags-0-x-shippingMethod").first
        if await trigger.is_visible():
            await trigger.click()
            await page.wait_for_timeout(4000)
            if await continue_btn.is_visible():
                await continue_btn.click()
                print("  ✅ 'Continuar' tras trigger.")
                await page.wait_for_timeout(4000)
                return
            if await confirm_btn.is_visible():
                await confirm_btn.click()
                print("  ✅ 'Confirmar' tras trigger.")
                await page.wait_for_timeout(4000)
                return
    except Exception as e:
        print(f"  ⚠ Error ubicación Olímpica: {e}")

async def set_megatiendas_location(page):
    try:
        print("📍 Configurando ubicación Megatiendas (Santa Marta - Mercado)...")
        await page.goto("https://www.megatiendas.co/", wait_until="domcontentloaded", timeout=60000)
        await page.wait_for_timeout(3000)
        await page.evaluate("""
        localStorage.setItem('shippingData', JSON.stringify({
            "addressId": "mercado", "addressType": "pickup",
            "city": "Santa Marta", "state": "Magdalena",
            "pickupPointName": "Megatiendas Mercado"
        }));
        """)
        print("  ✅ Localización inyectada vía localStorage.")
    except Exception as e:
        print(f"  ⚠ Error ubicación Megatiendas: {e}")

# ══════════════════════════════════════════════════
# EXTRACCIÓN DE PRECIO (URL directa)
# ══════════════════════════════════════════════════

async def get_price(page, url, selector):
    """Extrae precio de una URL directa con un selector CSS."""
    if not url or not selector:
        return None
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=60000)
        await page.wait_for_selector(selector, timeout=15000)
        price_text = await page.inner_text(selector)
        return limpiar_precio(price_text)
    except Exception as e:
        print(f"    ⚠ Error en {url}: {e}")
        return None

# ══════════════════════════════════════════════════
# BÚSQUEDA INTELIGENTE POR TIENDA
# ══════════════════════════════════════════════════

async def _extraer_via_js(page, base_url):
    """Extracción universal vía JavaScript: busca precios en el DOM con TreeWalker y reconstruye cards."""
    return await page.evaluate("""(baseUrl) => {
        const priceEls = document.querySelectorAll('.base__price, [class*=currencyContainer], [class*=sellingPrice], [class*=Price]');
        const results = [];
        for (const priceEl of priceEls) {
            const pText = priceEl.textContent.trim();
            if (!/\\$\\s*[\\d.,]+/.test(pText)) continue;
            
            // Subir hasta el card contenedor (link <a> o div con pocos hijos)
            let card = priceEl;
            for (let i = 0; i < 8; i++) {
                if (!card.parentElement) break;
                card = card.parentElement;
                if (card.tagName === 'A') break;
            }
            
            // Buscar nombre
            const nameEl = card.querySelector('h3, h2, [class*=productBrand], [class*=nameContainer], [class*=prod_name]');
            const nombre = nameEl ? nameEl.textContent.trim() : 'Producto';
            
            // Buscar link
            let href = '';
            if (card.tagName === 'A') {
                href = card.getAttribute('href') || '';
            } else {
                const linkEl = card.querySelector('a[href]');
                if (linkEl) href = linkEl.getAttribute('href') || '';
            }
            
            // Limpiar precio
            const digits = pText.replace(/[^\\d]/g, '');
            const precio = parseInt(digits) || 0;
            
            if (precio > 0 && nombre !== 'Producto') {
                const fullUrl = href.startsWith('http') ? href : (href ? baseUrl + href : '');
                results.push({ nombre, precio, url: fullUrl });
            }
        }
        return results;
    }""", base_url)

async def search_cheapest_d1(page, termino):
    """Busca en D1 con variantes inteligentes y retorna el más barato."""
    variantes = generar_variantes(termino)
    todos = []
    for var in variantes:
        try:
            url = f"https://domicilios.tiendasd1.com/search?name={var.replace(' ', '%20')}"
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)
            await page.wait_for_timeout(6000)

            # D1: cards son <a class="containerCard"> con .base__price y h3
            resultados = await page.evaluate("""() => {
                const cards = document.querySelectorAll('a.containerCard, a[class*=containerCard]');
                const results = [];
                for (const card of cards) {
                    const priceEl = card.querySelector('.base__price');
                    const nameEl = card.querySelector('h3');
                    if (priceEl && nameEl) {
                        const pText = priceEl.textContent.trim();
                        const digits = pText.replace(/[^\\d]/g, '');
                        const precio = parseInt(digits) || 0;
                        const nombre = nameEl.textContent.trim();
                        const href = card.getAttribute('href') || '';
                        if (precio > 0) {
                            results.push({
                                nombre: nombre,
                                precio: precio,
                                url: 'https://domicilios.tiendasd1.com' + href
                            });
                        }
                    }
                }
                return results;
            }""")

            # Si no encontró cards con ese selector, fallback JS genérico
            if not resultados:
                resultados = await _extraer_via_js(page, "https://domicilios.tiendasd1.com")

            todos.extend(resultados)
            print(f"    🔎 D1 '{var}' → {len(resultados)} resultado(s)")
        except Exception as e:
            print(f"    ⚠ Error buscando '{var}' en D1: {e}")

    # Deduplicar por URL
    vistos = {}
    for r in todos:
        key = r.get("url", r["nombre"])
        if key not in vistos or r["precio"] < vistos[key]["precio"]:
            vistos[key] = r

    unicos = sorted(vistos.values(), key=lambda x: x["precio"])
    return unicos[0] if unicos else None

async def search_cheapest_olimpica(page, termino):
    """Busca en Olímpica con variantes inteligentes y retorna el más barato."""
    variantes = generar_variantes(termino)
    todos = []
    for var in variantes:
        try:
            url = f"https://www.olimpica.com/busca?q={var.replace(' ', '%20')}"
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)
            await page.wait_for_timeout(5000)
            resultados = await _extraer_via_js(page, "https://www.olimpica.com")
            todos.extend(resultados)
            print(f"    🔎 Olímpica '{var}' → {len(resultados)} resultado(s)")
        except Exception as e:
            print(f"    ⚠ Error buscando '{var}': {e}")

    vistos = {}
    for r in todos:
        key = r.get("url", r["nombre"])
        if key not in vistos or r["precio"] < vistos[key]["precio"]:
            vistos[key] = r

    unicos = sorted(vistos.values(), key=lambda x: x["precio"])
    return unicos[0] if unicos else None

async def search_cheapest_megatiendas(page, termino):
    """Busca en Megatiendas con variantes inteligentes y retorna el más barato."""
    variantes = generar_variantes(termino)
    todos = []
    for var in variantes:
        try:
            url = f"https://www.megatiendas.co/busca?q={var.replace(' ', '%20')}"
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)
            await page.wait_for_timeout(5000)
            resultados = await _extraer_via_js(page, "https://www.megatiendas.co")
            todos.extend(resultados)
            print(f"    🔎 Mega '{var}' → {len(resultados)} resultado(s)")
        except Exception as e:
            print(f"    ⚠ Error buscando '{var}': {e}")

    vistos = {}
    for r in todos:
        key = r.get("url", r["nombre"])
        if key not in vistos or r["precio"] < vistos[key]["precio"]:
            vistos[key] = r

    unicos = sorted(vistos.values(), key=lambda x: x["precio"])
    return unicos[0] if unicos else None

# ══════════════════════════════════════════════════
# ORQUESTADOR PRINCIPAL
# ══════════════════════════════════════════════════

async def run_scraper():
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT id, nombre_personalizado as nombre, termino_busqueda,
               url_d1, selector_d1, url_olimpica, selector_olimpica,
               url_ara, selector_ara, url_megatiendas, selector_megatiendas
        FROM productos WHERE id = 195
    """)
    products = cursor.fetchall()

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        # Pre-configuración de ubicaciones
        await set_megatiendas_location(page)
        await set_olimpica_location(page)

        for prod in products:
            print(f"\n{'='*60}")
            print(f"🛒 Procesando: {prod['nombre']}")
            print(f"{'='*60}")

            termino = prod.get('termino_busqueda')
            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

            # ── BÚSQUEDA INTELIGENTE POR TIENDA ──

            tiendas_config = [
                {
                    'nombre': 'D1',
                    'search_fn': search_cheapest_d1,
                    'url_legacy': prod['url_d1'],
                    'selector': prod['selector_d1'],
                },
                {
                    'nombre': 'OLIMPICA',
                    'search_fn': search_cheapest_olimpica,
                    'url_legacy': prod['url_olimpica'],
                    'selector': prod['selector_olimpica'],
                },
                {
                    'nombre': 'MEGATIENDAS',
                    'search_fn': search_cheapest_megatiendas,
                    'url_legacy': prod['url_megatiendas'],
                    'selector': prod['selector_megatiendas'],
                },
            ]

            for tienda in tiendas_config:
                print(f"\n  🏪 {tienda['nombre']}:")
                precio = None
                nombre_encontrado = None

                # PRIORIDAD 1: Búsqueda inteligente con variantes
                if termino:
                    print(f"    🧠 Búsqueda inteligente: variantes de '{termino}'")
                    variantes = generar_variantes(termino)
                    print(f"    📋 Variantes generadas: {variantes}")

                    resultado = await tienda['search_fn'](page, termino)
                    if resultado:
                        precio = resultado['precio']
                        nombre_encontrado = resultado['nombre']
                        print(f"    💰 MÁS BARATO: {nombre_encontrado} → ${precio:,.0f}")
                    else:
                        print(f"    ❌ Sin resultados por búsqueda.")

                # PRIORIDAD 2: URL legacy (fallback)
                if not precio and tienda['url_legacy'] and tienda['selector']:
                    print(f"    🔗 Fallback: URL directa...")
                    precio = await get_price(page, tienda['url_legacy'], tienda['selector'])
                    if precio:
                        print(f"    💰 Precio (URL directa): ${precio:,.0f}")

                # GUARDAR RESULTADO
                if precio:
                    cursor.execute(
                        "INSERT INTO precios_tiendas (producto_id, tienda, precio, fecha_registro) VALUES (%s, %s, %s, %s)",
                        (prod['id'], tienda['nombre'], precio, now)
                    )
                else:
                    print(f"    ⚠️ SIN PRECIO — Requiere configuración manual (URL o SKU).")

        conn.commit()
        await browser.close()

    cursor.close()
    conn.close()
    print(f"\n{'='*60}")
    print("✅ Sincronización finalizada.")
    print(f"{'='*60}")

if __name__ == "__main__":
    asyncio.run(run_scraper())
