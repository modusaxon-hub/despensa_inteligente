import asyncio
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

async def get_price(page, url, selector):
    if not url or not selector:
        return None
    try:
        await page.goto(url, wait_until="networkidle", timeout=60000)
        # Esperar a que el selector del precio sea visible
        await page.wait_for_selector(selector, timeout=10000)
        price_text = await page.inner_text(selector)
        # Limpiar el texto para obtener solo números (ej: "$ 4.500" -> 4500)
        clean_price = "".join(filter(str.isdigit, price_text))
        return float(clean_price) if clean_price else None
    except Exception as e:
        print(f"Error raspando {url}: {e}")
        return None

async def run_scraper():
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    
    # Obtener productos con URLs y selectores definidos
    cursor.execute("SELECT id, nombre, url_d1, selector_d1, url_olimpica, selector_olimpica, url_ara, selector_ara, url_megatiendas, selector_megatiendas FROM productos")
    products = cursor.fetchall()
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36")
        page = await context.new_page()
        
        for prod in products:
            print(f"Procesando: {prod['nombre']}")
            
            stores = [
                ('D1', prod['url_d1'], prod['selector_d1']),
                ('OLIMPICA', prod['url_olimpica'], prod['selector_olimpica']),
                ('ARA', prod['url_ara'], prod['selector_ara']),
                ('MEGATIENDAS', prod['url_megatiendas'], prod['selector_megatiendas'])
            ]
            
            for store_name, url, selector in stores:
                if url and selector:
                    price = await get_price(page, url, selector)
                    if price:
                        print(f"  -> {store_name}: ${price}")
                        # Guardar en la tabla de precios
                        cursor.execute(
                            "INSERT INTO precios_tiendas (producto_id, tienda, precio) VALUES (%s, %s, %s)",
                            (prod['id'], store_name, price)
                        )
            
        conn.commit()
        await browser.close()
    
    cursor.close()
    conn.close()
    print("Sincronización finalizada.")

if __name__ == "__main__":
    asyncio.run(run_scraper())
