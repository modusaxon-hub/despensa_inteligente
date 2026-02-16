let allProducts = [];
let selections = {};

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
});

// ═══════════════════════════════════════════
// CARGA DE PRODUCTOS
// ═══════════════════════════════════════════

async function loadProducts() {
    try {
        const response = await fetch('api/get_products.php');
        allProducts = await response.json();

        allProducts.forEach(p => {
            if (!selections[p.id]) {
                const isPlaza = p.categoria.includes('CARNES') || p.categoria.includes('VERDURAS');
                selections[p.id] = { qty: 0, dest: isPlaza ? 'plaza' : 'store' };
            }
        });

        renderTable();
    } catch (error) {
        console.error('Error cargando catálogo:', error);
    }
}

// ═══════════════════════════════════════════
// RENDER DE TABLA
// ═══════════════════════════════════════════

function renderPriceCell(prod, tienda, tiendaKey) {
    const precio = prod.precios[tiendaKey];
    const precioTexto = precio ? `$${precio.toLocaleString()}` : 'N/D';
    const claseLink = precio ? 'price-link' : 'nd-link';
    const titleLink = precio ? 'Clic para editar' : 'Clic para agregar URL';

    // Estrella de favorito por tienda
    const isPreferred = prod.tienda_preferida === tiendaKey;
    const starClass = isPreferred ? 'store-star active' : 'store-star';
    const starTitle = isPreferred ? 'Tienda preferida (clic para quitar)' : 'Marcar como tienda preferida';

    return `
        <div class="price-container">
            <span class="${claseLink}" onclick="openUrlModal(${prod.id}, '${tienda}', '${prod.nombre}')" title="${titleLink}">
                ${precioTexto}
            </span>
            ${precio ? `<span class="${starClass}" onclick="toggleStoreFavorite(${prod.id}, '${tiendaKey}')" title="${starTitle}">★</span>` : ''}
        </div>
    `;
}

function renderTable() {
    const body = document.getElementById('planner-body');
    body.innerHTML = '';

    allProducts.forEach(prod => {
        const tr = document.createElement('tr');
        // Removed global favorite row highlight

        const currentDest = selections[prod.id]?.dest || 'store';

        // Lógica de Mejor Precio / Precio Seleccionado
        const prices = Object.values(prod.precios).filter(p => p > 0);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

        // Si hay tienda preferida, ese es el precio efectivo para cálculo (no afecta display aquí, pero sí highlight)
        const isBestPrice = (p, key) => {
            // Si hay preferida, solo esa es "best" (o seleccionada). Si no, es el mínimo.
            if (prod.tienda_preferida) return key === prod.tienda_preferida;
            return p === minPrice && minPrice > 0;
        };

        tr.innerHTML = `
            <td>
                <input type="number" class="qty-field" value="${selections[prod.id]?.qty || 0}" min="0" 
                       onchange="updateSelection(${prod.id}, 'qty', this.value)">
            </td>
            <td style="font-size: 12px;">
                <strong>${prod.nombre}</strong><br>
                <small style="color:#2e7d32; font-weight:bold; font-size:9px">${prod.categoria}</small>
            </td>
            <td class="price-cell ${isBestPrice(prod.precios.D1, 'D1') ? 'selected-price' : ''}">
                ${renderPriceCell(prod, 'd1', 'D1')}
            </td>
            <td class="price-cell ${isBestPrice(prod.precios.OLIMPICA, 'OLIMPICA') ? 'selected-price' : ''}">
                ${renderPriceCell(prod, 'olimpica', 'OLIMPICA')}
            </td>
            <td class="price-cell ${isBestPrice(prod.precios.ARA, 'ARA') ? 'selected-price' : ''}">
                ${renderPriceCell(prod, 'ara', 'ARA')}
            </td>
            <td class="price-cell ${isBestPrice(prod.precios.MEGATIENDAS, 'MEGATIENDAS') ? 'selected-price' : ''}">
                ${renderPriceCell(prod, 'megatiendas', 'MEGATIENDAS')}
            </td>
            <td>
                <select class="destination-select" onchange="updateSelection(${prod.id}, 'dest', this.value)">
                    <option value="store" ${currentDest === 'store' ? 'selected' : ''}>📍 Tiendas</option>
                    <option value="plaza" ${currentDest === 'plaza' ? 'selected' : ''}>🥬 Plaza</option>
                    <option value="meat" ${currentDest === 'meat' ? 'selected' : ''}>🥩 Carnicería</option>
                </select>
            </td>
        `;
        body.appendChild(tr);
    });
}

// ═══════════════════════════════════════════
// FAVORITOS DE TIENDA ⭐ (Nuevo)
// ═══════════════════════════════════════════

async function toggleStoreFavorite(productId, tiendaKey) {
    try {
        const res = await fetch('api/set_preferred_store.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ producto_id: productId, tienda: tiendaKey })
        });
        const data = await res.json();
        if (data.success) {
            // Actualizar estado local
            const prod = allProducts.find(p => p.id === productId);
            if (prod) {
                // Si la acción fue set, actualizamos. Si fue unset (null), borramos.
                prod.tienda_preferida = data.action === 'set' ? data.tienda_preferida : null;
            }
            renderTable();
            updateCalculations(); // Recalcular totales con la nueva preferencia
        } else {
            alert('Error: ' + (data.error || 'No se pudo cambiar tienda favorita.'));
        }
    } catch (e) {
        console.error('Error toggling store favorite:', e);
    }
}



// ═══════════════════════════════════════════
// AGREGAR PRODUCTO ➕
// ═══════════════════════════════════════════

function openAddModal() {
    document.getElementById('add-nombre').value = '';
    document.getElementById('add-categoria').value = 'General';
    document.getElementById('add-termino').value = '';
    document.getElementById('modal-add').style.display = 'flex';
}

async function addProduct() {
    const nombre = document.getElementById('add-nombre').value.trim();
    const categoria = document.getElementById('add-categoria').value;
    const termino = document.getElementById('add-termino').value.trim();

    if (!nombre) {
        alert('El nombre del producto es obligatorio.');
        return;
    }

    try {
        const res = await fetch('api/add_product.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, categoria, termino_busqueda: termino })
        });
        const data = await res.json();
        if (data.success) {
            closeModal('modal-add');
            await loadProducts(); // Recargar tabla
            alert(`✅ Producto "${nombre}" agregado (ID: ${data.id}).`);
        } else {
            alert('Error: ' + (data.error || 'No se pudo agregar.'));
        }
    } catch (e) {
        console.error('Error agregando producto:', e);
    }
}

// ═══════════════════════════════════════════
// URL MANUAL (cuando N/D) 🔗
// ═══════════════════════════════════════════

const tiendaNombres = {
    'd1': 'D1 (domicilios.tiendasd1.com)',
    'olimpica': 'Olímpica (olimpica.com)',
    'ara': 'ARA (ara.com.co)',
    'megatiendas': 'Megatiendas (megatiendas.co)'
};

const selectorSugerido = {
    'd1': '.base__price',
    'olimpica': '.olimpica-dinamic-flags-0-x-currencyContainer',
    'ara': '',
    'megatiendas': '.vtex-product-price-1-x-sellingPriceValue'
};

function openUrlModal(productoId, tienda, nombreProducto) {
    document.getElementById('url-producto-id').value = productoId;
    document.getElementById('url-tienda').value = tienda;

    // Buscar datos existentes
    const producto = allProducts.find(p => p.id === productoId);
    if (producto && producto.config_tiendas && producto.config_tiendas[tienda]) {
        const config = producto.config_tiendas[tienda];
        document.getElementById('url-input').value = config.url || '';
        document.getElementById('selector-input').value = config.selector || selectorSugerido[tienda] || '';
    } else {
        document.getElementById('url-input').value = '';
        document.getElementById('selector-input').value = selectorSugerido[tienda] || '';
    }

    document.getElementById('url-context').textContent =
        `Editar URL - Producto: ${nombreProducto} → Tienda: ${tiendaNombres[tienda]}`;
    document.getElementById('modal-url').style.display = 'flex';
}

async function saveProductUrl() {
    const productoId = document.getElementById('url-producto-id').value;
    const tienda = document.getElementById('url-tienda').value;
    const url = document.getElementById('url-input').value.trim();
    const selector = document.getElementById('selector-input').value.trim();

    if (!url) {
        alert('La URL es obligatoria.');
        return;
    }

    try {
        const res = await fetch('api/update_product.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ producto_id: parseInt(productoId), tienda, url, selector })
        });
        const data = await res.json();
        if (data.success) {
            closeModal('modal-url');
            alert(`✅ URL guardada. El bot usará esta URL en el próximo escaneo.`);
        } else {
            alert('Error: ' + (data.error || 'No se pudo guardar.'));
        }
    } catch (e) {
        console.error('Error guardando URL:', e);
    }
}

// ═══════════════════════════════════════════
// TRAER PRECIO EN TIEMPO REAL ⚡
// ═══════════════════════════════════════════

async function checkPriceNow() {
    const productoId = document.getElementById('url-producto-id').value;
    const tienda = document.getElementById('url-tienda').value;
    const url = document.getElementById('url-input').value.trim();
    const selector = document.getElementById('selector-input').value.trim();

    if (!url) {
        alert('Por favor ingresa una URL primero.');
        return;
    }

    // Identificar botón para feedback visual
    // Buscamos por onclick ya que no le puse ID directo, aunque tiene la clase btn-primary con estilo inline
    const buttons = document.querySelectorAll('#modal-url button');
    let btn;
    buttons.forEach(b => {
        if (b.innerText.includes('Traer Precio')) btn = b;
    });

    // Fallback search
    if (!btn) btn = document.querySelector('#modal-url button[onclick="checkPriceNow()"]');

    const originalText = btn ? btn.textContent : '⚡ Traer Precio';
    if (btn) {
        btn.textContent = '⏳ Buscando...';
        btn.disabled = true;
    }

    try {
        const res = await fetch('api/check_price.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ producto_id: productoId, tienda, url, selector })
        });
        const data = await res.json();

        if (data.success) {
            alert(data.mensaje);
            // Si encontró precio, recargamos la tabla para que se vea reflejado
            if (data.precio > 0) {
                await loadProducts();
            }
        } else {
            alert('⚠️ ' + (data.error || 'No se pudo obtener precio.'));
            if (data.debug_output) console.warn('Debug Output:', data.debug_output);
        }
    } catch (e) {
        console.error('Error checking price:', e);
        alert('Error: ' + e.message + '\n(Ver consola para más detalles)');
    } finally {
        if (btn) {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }
}

// ═══════════════════════════════════════════
// ACTUALIZAR TODO (SCRAPER COMPLETO) 🔄
// ═══════════════════════════════════════════

async function runFullScraper() {
    if (!confirm('Esto actualizará TODOS los precios usando el bot. Puede tardar varios minutos.\n\n¿Deseas continuar?')) return;

    // Buscar botón
    const btn = document.querySelector('button[onclick="runFullScraper()"]');
    const originalText = btn ? btn.textContent : '🔄 Actualizando...';
    if (btn) {
        btn.textContent = '⏳ Actualizando todo... (No cierres)';
        btn.disabled = true;
    }

    try {
        // Llamar al endpoint que ejecuta auto_bot.py sin argumentos
        const res = await fetch('api/run_full_scraper.php');
        const data = await res.json();

        if (data.success) {
            alert(data.mensaje);
            await loadProducts();
        } else {
            const logSnippet = data.log ? data.log.slice(-1000) : 'Sin detalles';
            alert('⚠️ ' + (data.error || 'Hubo un problema.') + '\n\nLOG (Últimos caracteres):\n' + logSnippet);
            console.warn('Bot Log Full:', data.log);
        }
    } catch (e) {
        console.error('Error running full scraper:', e);
        alert('Error de conexión o timeout. Es posible que el proceso siga corriendo en segundo plano. Verifica en unos minutos.');
    } finally {
        if (btn) {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }
}

// ═══════════════════════════════════════════
// MODALES
// ═══════════════════════════════════════════

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

// Cerrar modal al hacer clic fuera
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.style.display = 'none';
    }
});

// ═══════════════════════════════════════════
// CÁLCULOS Y SELECCIONES
// ═══════════════════════════════════════════

function updateSelection(id, field, value) {
    if (!selections[id]) {
        selections[id] = { qty: 0, dest: 'store' };
    }

    if (field === 'qty') selections[id].qty = parseInt(value) || 0;
    if (field === 'dest') selections[id].dest = value;

    updateCalculations();
}

function updateCalculations() {
    let totalStores = 0;

    Object.keys(selections).forEach(id => {
        const sel = selections[id];
        if (sel.qty > 0 && sel.dest === 'store') {
            const prod = allProducts.find(p => p.id == id);
            if (prod && prod.precios) {
                // Cálculo inteligente: Usar preferida o mínima
                let effectivePrice = 0;

                if (prod.tienda_preferida && prod.precios[prod.tienda_preferida]) {
                    effectivePrice = prod.precios[prod.tienda_preferida];
                } else {
                    const prices = Object.values(prod.precios).filter(p => p > 0);
                    effectivePrice = prices.length > 0 ? Math.min(...prices) : 0;
                }

                totalStores += effectivePrice * sel.qty;
            }
        }
    });

    const budgetPlaza = parseFloat(document.getElementById('budget-plaza').value) || 0;
    const budgetMeat = parseFloat(document.getElementById('budget-meat').value) || 0;
    const totalSpecial = budgetPlaza + budgetMeat;

    document.getElementById('total-stores').textContent = `$${totalStores.toLocaleString()}`;
    document.getElementById('total-special').textContent = `$${totalSpecial.toLocaleString()}`;
    document.getElementById('grand-total').textContent = `$${(totalStores + totalSpecial).toLocaleString()}`;
}

function confirmPurchase() {
    alert('Mercado confirmado. Se ha generado la lista de compras optimizada.');
}
