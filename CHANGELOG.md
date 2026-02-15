# CHANGELOG — Despensa Inteligente

## [2026-02-15] — Scraper de Precios y Configuración de Ubicación

### 🆕 Añadido
- **Función `set_olimpica_location(page)`**: Configura Santa Marta Centro automáticamente con manejo de 3 estados de modal (Continuar / Confirmar / Cobertura).
- **Función `set_megatiendas_location(page)`**: Inyecta ubicación Santa Marta Mercado vía localStorage.
- **Campo `fecha_registro`** en INSERT de `precios_tiendas` para registro temporal preciso.
- **Regla TASK.md** añadida a `configurador-global/INSTRUCTIONS.md` y `planificacion-pro/SKILL.md`.
- **Bitácora técnica** (`technical/BITACORA_2026-02-15.html`) con cronología de errores y soluciones.

### 🔧 Corregido
- `wait_until` de `"networkidle"` a `"domcontentloaded"` en `get_price()` — elimina timeouts en sitios con analytics pesados.
- Selector de precio Olímpica: `.vtex-product-price-1-x-sellingPriceValue` → `.olimpica-dinamic-flags-0-x-currencyContainer`.
- URL de producto aceite Olímpica actualizada (la anterior daba 404).
- Precio de Aceite de Coco D1 corregido: $39.900 → $10.450.
- Bloque `except` duplicado eliminado en `set_olimpica_location()`.

### 📊 Precios Verificados (Santa Marta)
| Producto | Olímpica | Megatiendas |
| :--- | :--- | :--- |
| Aceite 3000ml (más barato) | Medalla de Oro $19.990 | Ricaceite $21.990 |

### ⏳ Pendiente
- Implementación de scraper con búsqueda genérica por término.
- Sistema de favoritos por tienda (URLs priorizadas por el usuario).
- Verificación de selector D1 (`.base__price`).
