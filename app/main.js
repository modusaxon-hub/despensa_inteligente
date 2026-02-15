let allProducts = [];
let selectedIds = new Set();

document.addEventListener('DOMContentLoaded', () => {
    console.log('Despensa Inteligente - Sincronizando con Base de Datos...');
    loadProducts();
});

async function loadProducts() {
    try {
        const response = await fetch('api/get_products.php');
        allProducts = await response.json();

        console.log(`Cargados ${allProducts.length} productos.`);
        renderList();
        updateBudget();
    } catch (error) {
        console.error('Error cargando productos:', error);
    }
}

function renderList() {
    const container = document.getElementById('product-list');
    if (!container) return;

    container.innerHTML = '';

    if (allProducts.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:2rem; color:#888;">No hay productos registrados. Por favor, importa el CSV.</p>';
        return;
    }

    allProducts.forEach(prod => {
        const prices = Object.entries(prod.precios);
        let minPrice = 0;
        let bestStore = 'N/A';

        if (prices.length > 0) {
            minPrice = Math.min(...prices.map(p => p[1]));
            bestStore = prices.find(p => p[1] === minPrice)[0];
        }

        const row = document.createElement('div');
        row.className = `product-row ${selectedIds.has(prod.id) ? 'selected' : ''}`;

        // El checkbox y la fila activan el toggle
        row.innerHTML = `
            <div class="check-container">
                <input type="checkbox" ${selectedIds.has(prod.id) ? 'checked' : ''} onclick="event.stopPropagation(); toggleProduct(${prod.id})">
            </div>
            <div class="prod-main-info" onclick="toggleProduct(${prod.id})">
                <span class="prod-category">${prod.categoria}</span>
                <h4>${prod.nombre}</h4>
            </div>
            <div class="best-option" onclick="toggleProduct(${prod.id})">
                <span class="best-price">$${minPrice.toLocaleString()}</span>
                <span class="best-store">${prices.length > 1 ? 'MEJOR EN: ' : ''}${bestStore}</span>
            </div>
        `;
        container.appendChild(row);
    });
}

function toggleProduct(id) {
    if (selectedIds.has(id)) {
        selectedIds.delete(id);
    } else {
        selectedIds.add(id);
    }
    renderList();
    updateBudget();
}

function updateBudget() {
    let total = 0;
    let storeTotals = {};

    allProducts.forEach(prod => {
        if (selectedIds.has(prod.id)) {
            const prices = Object.entries(prod.precios);
            if (prices.length > 0) {
                const minPrice = Math.min(...prices.map(p => p[1]));
                const bestStore = prices.find(p => p[1] === minPrice)[0];

                total += minPrice;
                storeTotals[bestStore] = (storeTotals[bestStore] || 0) + minPrice;
            }
        }
    });

    // Actualizar UI
    document.getElementById('total-budget').textContent = total.toLocaleString();
    document.getElementById('selected-items-count').textContent = `${selectedIds.size} productos seleccionados`;

    // Desglose por tienda
    const breakdown = document.getElementById('budget-breakdown');
    if (breakdown) {
        breakdown.innerHTML = selectedIds.size > 0 ? '<h4>Gasto por Tienda:</h4>' : '';
        for (const [store, subtotal] of Object.entries(storeTotals)) {
            breakdown.innerHTML += `
                <div class="price-row" style="font-size: 0.85rem; padding: 4px 0;">
                    <span>${store}</span>
                    <strong>$${subtotal.toLocaleString()}</strong>
                </div>
            `;
        }
    }
}

function generateShoppingList() {
    if (selectedIds.size === 0) {
        alert('Selecciona al menos un producto primero.');
        return;
    }

    // Aquí podrías implementar la exportación real
    let msg = "Lista de compras optimizada:\n\n";
    allProducts.forEach(p => {
        if (selectedIds.has(p.id)) {
            const prices = Object.entries(p.precios);
            const minPrice = Math.min(...prices.map(p => p[1]));
            const store = prices.find(p => p[1] === minPrice)[0];
            msg += `- ${p.nombre}: $${minPrice.toLocaleString()} (${store})\n`;
        }
    });

    console.log(msg);
    alert('Lista generada en consola. (Próximamente exportación a PDF/WhatsApp)');
}
