let allProducts = [];
let selections = {};

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
});

async function loadProducts() {
    try {
        const response = await fetch('api/get_products.php');
        allProducts = await response.json();

        // Inicializar selecciones si el producto ya venía marcado en el catálogo o historial
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

function renderTable() {
    const body = document.getElementById('planner-body');
    body.innerHTML = '';

    allProducts.forEach(prod => {
        const tr = document.createElement('tr');

        const priceD1 = prod.precios.D1 ? `$${prod.precios.D1.toLocaleString()}` : '<span class="empty">N/D</span>';
        const priceOli = prod.precios.OLIMPICA ? `$${prod.precios.OLIMPICA.toLocaleString()}` : '<span class="empty">N/D</span>';
        const priceAra = prod.precios.ARA ? `$${prod.precios.ARA.toLocaleString()}` : '<span class="empty">N/D</span>';
        const priceMega = prod.precios.MEGATIENDAS ? `$${prod.precios.MEGATIENDAS.toLocaleString()}` : '<span class="empty">N/D</span>';

        // Determinar si es un item de plaza sugerido
        const currentDest = selections[prod.id]?.dest || 'store';

        tr.innerHTML = `
            <td>
                <input type="number" class="qty-field" value="${selections[prod.id]?.qty || 0}" min="0" 
                       onchange="updateSelection(${prod.id}, 'qty', this.value)">
            </td>
            <td style="font-size: 12px;">
                <strong>${prod.nombre}</strong><br>
                <small style="color:#2e7d32; font-weight:bold; font-size:9px">${prod.categoria}</small>
            </td>
            <td class="price-cell">${priceD1}</td>
            <td class="price-cell">${priceOli}</td>
            <td class="price-cell">${priceAra}</td>
            <td class="price-cell">${priceMega}</td>
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
                const prices = Object.values(prod.precios);
                if (prices.length > 0) {
                    totalStores += Math.min(...prices) * sel.qty;
                }
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
