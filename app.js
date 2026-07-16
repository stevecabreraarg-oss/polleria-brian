const PRODUCTS = [
  { id: "pollo-entero", category: "Polleria", name: "Pollo entero", basePrice: 6000, tiers: [] },
  { id: "pata-muslo", category: "Polleria", name: "Pata Muslo", basePrice: 6000, tiers: [{ min: 5, price: 4500 }, { min: 3, price: 5000 }] },
  { id: "alitas", category: "Polleria", name: "Alitas", basePrice: 3500, tiers: [{ min: 5, price: 2000 }, { min: 3, price: 2500 }] },
  { id: "pechuga-entera", category: "Polleria", name: "Pechuga entera", basePrice: 11500, tiers: [] },
  { id: "pechuga-deshuesada", category: "Polleria", name: "Pechuga deshuesada", basePrice: 13500, tiers: [] },
  { id: "milanesas", category: "Polleria", name: "Milanesas", basePrice: 10500, tiers: [{ min: 2, price: 9000 }] },
  { id: "menudo", category: "Polleria", name: "Menudo", basePrice: 1000, tiers: [] },
  { id: "hamburguesa-pollo", category: "Congelados", name: "Hamburguesa de pollo", basePrice: 12000, tiers: [] },
  { id: "hamburguesa-carne", category: "Congelados", name: "Hamburguesa de carne", basePrice: 12000, tiers: [] },
  { id: "albondiga-carne", category: "Congelados", name: "Alb\u00f3ndiga de carne", basePrice: 12000, tiers: [] },
  { id: "albondiga-pollo", category: "Congelados", name: "Alb\u00f3ndiga de pollo", basePrice: 12000, tiers: [] },
  { id: "nuggets", category: "Congelados", name: "Nuggets", basePrice: 12000, tiers: [] },
  { id: "mini-arrollado", category: "Congelados", name: "Mini arrollado", basePrice: 17000, tiers: [] },
  { id: "arrollado-comun", category: "Congelados", name: "Arrollado com\u00fan", basePrice: 17000, tiers: [] },
  { id: "patitas-pollo", category: "Congelados", name: "Patitas de pollo", basePrice: 8500, tiers: [] },
  { id: "medallon-pollo", category: "Congelados", name: "Medall\u00f3n de pollo", basePrice: 8500, tiers: [] },
  { id: "medallon-merluza", category: "Congelados", name: "Medall\u00f3n de merluza", basePrice: 8500, tiers: [] }
];

const STORAGE_KEY = "polleria-brian-state-v1";
const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });

const state = loadState();
const ticket = [];
const el = {};

document.addEventListener("DOMContentLoaded", () => {
  bindElements();
  createTicketUi();
  setToday();
  fillProductSelects();
  bindEvents();
  updateSalePreview();
  render();
  registerServiceWorker();
});

function bindElements() {
  Object.assign(el, {
    todayLabel: document.querySelector("#todayLabel"),
    todayTotal: document.querySelector("#todayTotal"),
    weekTotal: document.querySelector("#weekTotal"),
    monthTotal: document.querySelector("#monthTotal"),
    saleForm: document.querySelector("#saleForm"),
    saleDate: document.querySelector("#saleDate"),
    productSelect: document.querySelector("#productSelect"),
    quantityInput: document.querySelector("#quantityInput"),
    unitPriceInput: document.querySelector("#unitPriceInput"),
    saleTotal: document.querySelector("#saleTotal"),
    priceRule: document.querySelector("#priceRule"),
    catalogList: document.querySelector("#catalogList"),
    salesList: document.querySelector("#salesList"),
    stockList: document.querySelector("#stockList"),
    stockTotal: document.querySelector("#stockTotal"),
    stockForm: document.querySelector("#stockForm"),
    stockProductSelect: document.querySelector("#stockProductSelect"),
    stockQtyInput: document.querySelector("#stockQtyInput"),
    periodFilter: document.querySelector("#periodFilter"),
    exportCsv: document.querySelector("#exportCsv"),
    exportPdf: document.querySelector("#exportPdf"),
    resetDemoButton: document.querySelector("#resetDemoButton")
  });
}

function createTicketUi() {
  const submitButton = el.saleForm.querySelector("button[type='submit']");
  submitButton.textContent = "Agregar al ticket";

  const panel = document.createElement("section");
  panel.className = "panel";
  panel.id = "currentTicketPanel";
  panel.innerHTML = `
    <div class="section-title">
      <h2>Ticket actual</h2>
      <span class="stock-total" id="ticketItemCount">0 items</span>
    </div>
    <div class="sales-list" id="ticketList"></div>
    <div class="ticket" style="margin-top: 12px;">
      <div>
        <span>Total venta</span>
        <strong id="ticketTotal">$0</strong>
      </div>
      <small id="ticketHelp">Agrega articulos y finaliza la venta</small>
    </div>
    <div class="export-row" style="margin: 12px 0 0;">
      <button class="secondary-action" id="clearTicketButton" type="button">Vaciar</button>
      <button class="primary-action" id="finishSaleButton" type="button">Finalizar venta</button>
    </div>
  `;

  el.saleForm.insertAdjacentElement("afterend", panel);
  Object.assign(el, {
    ticketItemCount: panel.querySelector("#ticketItemCount"),
    ticketList: panel.querySelector("#ticketList"),
    ticketTotal: panel.querySelector("#ticketTotal"),
    ticketHelp: panel.querySelector("#ticketHelp"),
    clearTicketButton: panel.querySelector("#clearTicketButton"),
    finishSaleButton: panel.querySelector("#finishSaleButton")
  });
}

function loadState() {
  const blank = { sales: [], stock: Object.fromEntries(PRODUCTS.map((product) => [product.id, 0])) };
  try {
    return { ...blank, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return blank;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setToday() {
  const today = toDateInput(new Date());
  el.saleDate.value = today;
  el.todayLabel.textContent = new Date().toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "short" });
}

function fillProductSelects() {
  const options = PRODUCTS.map((product) => `<option value="${product.id}">${product.category} - ${product.name}</option>`).join("");
  el.productSelect.innerHTML = options;
  el.stockProductSelect.innerHTML = options;
}

function bindEvents() {
  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });

  el.productSelect.addEventListener("change", updateSalePreview);
  el.quantityInput.addEventListener("input", updateSalePreview);
  el.unitPriceInput.addEventListener("input", updateSalePreviewFromManualPrice);
  el.saleForm.addEventListener("submit", addItemToTicket);
  el.ticketList.addEventListener("click", handleTicketListClick);
  el.finishSaleButton.addEventListener("click", finalizeSale);
  el.clearTicketButton.addEventListener("click", clearTicket);
  el.stockForm.addEventListener("submit", addStock);
  el.periodFilter.addEventListener("change", renderSales);
  el.salesList.addEventListener("click", handleSalesListClick);
  el.exportCsv.addEventListener("click", exportCsv);

  // PDF con totales de cierre de forma segura
  el.exportPdf.addEventListener("click", () => {
    const printHeader = document.createElement("div");
    printHeader.id = "pdfPrintHeader";
    printHeader.style.cssText = `
      display: none;
      border: 2px solid #333;
      padding: 15px;
      margin-bottom: 20px;
      background-color: #f9f9f9;
      border-radius: 6px;
      font-family: sans-serif;
    `;

    const styleTag = document.createElement("style");
    styleTag.id = "pdfPrintStyles";
    styleTag.innerHTML = `
      @media print {
        #pdfPrintHeader {
          display: block !important;
        }
        .delete-sale {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(styleTag);

    const diario = sumSales("day");
    const semanal = sumSales("week");
    const mensual = sumSales("month");

    printHeader.innerHTML = `
      <h2 style="margin: 0 0 10px 0; text-align: center; color: #111; font-size: 1.4rem; border-bottom: 2px solid #111; padding-bottom: 5px;">
        REPORTE DE CIERRE DE VENTAS
      </h2>
      <div style="display: flex; justify-content: space-between; gap: 10px; text-align: center; font-size: 1.1rem;">
        <div style="flex: 1; padding: 5px; border-right: 1px solid #ccc;">
          <span style="font-size: 0.85rem; text-transform: uppercase; color: #555; display: block;">Venta Diaria</span>
          <strong style="font-size: 1.3rem; color: #2e7d32;">${money.format(diario)}</strong>
        </div>
        <div style="flex: 1; padding: 5px; border-right: 1px solid #ccc;">
          <span style="font-size: 0.85rem; text-transform: uppercase; color: #555; display: block;">Venta Semanal</span>
          <strong style="font-size: 1.3rem; color: #1565c0;">${money.format(semanal)}</strong>
        </div>
        <div style="flex: 1; padding: 5px;">
          <span style="font-size: 0.85rem; text-transform: uppercase; color: #555; display: block;">Venta Mensual</span>
          <strong style="font-size: 1.3rem; color: #e65100;">${money.format(mensual)}</strong>
        </div>
      </div>
      <div style="margin-top: 10px; font-size: 0.8rem; text-align: right; color: #777;">
        Generado el: ${new Date().toLocaleString("es-AR")}
      </div>
    `;

    el.salesList.insertAdjacentElement("beforebegin", printHeader);

    // Evento de limpieza una vez se termine de generar el PDF
    const cleanup = () => {
      printHeader.remove();
      styleTag.remove();
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);

    window.print();
  });

  el.resetDemoButton.addEventListener("click", clearData);
}

function switchView(viewId) {
  document.querySelectorAll(".tab").forEach((button) => button.classList.toggle("is-active", button.dataset.view === viewId));
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("is-active", view.id === viewId));
}

function getProduct(productId) {
  return PRODUCTS.find((product) => product.id === productId);
}

function priceFor(product, qty) {
  const tier = product.tiers.find((item) => qty >= item.min);
  return tier ? tier.price : product.basePrice;
}

function tierText(product, qty) {
  const active = product.tiers.find((item) => qty >= item.min);
  if (active) return `Promo aplicada: desde ${active.min} kg`;
  if (!product.tiers.length) return "Precio fijo por kg";
  return product.tiers.map((item) => `${item.min}+ kg: ${money.format(item.price)}`).join(" | ");
}

function updateSalePreview() {
  const product = getProduct(el.productSelect.value);
  const qty = parseFloat(el.quantityInput.value) || 0;
  const unitPrice = priceFor(product, qty);
  el.unitPriceInput.value = unitPrice;
  paintSalePreview(qty, unitPrice, tierText(product, qty));
}

function updateSalePreviewFromManualPrice() {
  const qty = parseFloat(el.quantityInput.value) || 0;
  const unitPrice = parseFloat(el.unitPriceInput.value) || 0;
  paintSalePreview(qty, unitPrice, "Precio editado");
}

function paintSalePreview(qty, unitPrice, helperText) {
  el.saleTotal.textContent = money.format(Math.round(qty * unitPrice));
  el.priceRule.textContent = helperText;
}

function addItemToTicket(event) {
  event.preventDefault();
  const product = getProduct(el.productSelect.value);
  const qty = roundKg(parseFloat(el.quantityInput.value));
  const unitPrice = Math.round(parseFloat(el.unitPriceInput.value));
  if (!product || qty <= 0 || unitPrice < 0) return;

  ticket.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    productId: product.id,
    productName: product.name,
    category: product.category,
    qty,
    unitPrice,
    total: Math.round(qty * unitPrice)
  });

  el.quantityInput.value = "";
  updateSalePreview();
  renderTicket();
}

function handleTicketListClick(event) {
  // Acción de eliminar
  const removeButton = event.target.closest("[data-remove-ticket-item]");
  if (removeButton) {
    const index = ticket.findIndex((item) => item.id === removeButton.dataset.removeTicketItem);
    if (index !== -1) ticket.splice(index, 1);
    renderTicket();
    return;
  }

  // Acción de editar precio total
  const editButton = event.target.closest("[data-edit-ticket-item]");
  if (editButton) {
    const itemId = editButton.dataset.editTicketItem;
    const item = ticket.find((i) => i.id === itemId);
    if (!item) return;

    const inputVal = prompt(`Editar precio total para ${item.productName}:`, item.total);
    if (inputVal === null) return;

    const newTotal = Math.round(parseFloat(inputVal));
    if (isNaN(newTotal) || newTotal < 0) {
      alert("Por favor, ingresá un monto válido.");
      return;
    }

    item.total = newTotal;
    item.unitPrice = item.qty > 0 ? Math.round(newTotal / item.qty) : 0;
    
    renderTicket();
  }
}

function finalizeSale() {
  if (!ticket.length) {
    alert("Agrega al menos un articulo al ticket.");
    return;
  }

  const items = ticket.map((item) => ({ ...item }));
  const sale = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    date: el.saleDate.value,
    items,
    total: sumItems(items),
    createdAt: new Date().toISOString()
  };

  state.sales.unshift(sale);
  items.forEach((item) => {
    state.stock[item.productId] = roundKg((state.stock[item.productId] || 0) - item.qty);
  });

  saveState();
  ticket.splice(0, ticket.length);
  render();
}

function clearTicket() {
  if (!ticket.length) return;
  const confirmed = confirm("Vaciar el ticket actual?");
  if (!confirmed) return;
  ticket.splice(0, ticket.length);
  renderTicket();
}

function handleSalesListClick(event) {
  const button = event.target.closest("[data-delete-sale]");
  if (!button) return;
  deleteSale(button.dataset.deleteSale);
}

function deleteSale(saleId) {
  const index = state.sales.findIndex((sale) => sale.id === saleId);
  if (index === -1) return;
  const sale = state.sales[index];
  const items = saleItems(sale);
  const confirmed = confirm(`Anular venta de ${formatDate(sale.date)} por ${money.format(saleTotal(sale))}?`);
  if (!confirmed) return;

  state.sales.splice(index, 1);
  items.forEach((item) => {
    state.stock[item.productId] = roundKg((state.stock[item.productId] || 0) + item.qty);
  });

  saveState();
  render();
}

function addStock(event) {
  event.preventDefault();
  const productId = el.stockProductSelect.value;
  const qty = roundKg(parseFloat(el.stockQtyInput.value));
  if (!productId || qty <= 0) return;
  state.stock[productId] = roundKg((state.stock[productId] || 0) + qty);
  saveState();
  el.stockQtyInput.value = "";
  renderStock();
  renderSummary();
}

function clearData() {
  const confirmed = confirm("Borrar ventas y stock cargado?");
  if (!confirmed) return;
  state.sales = [];
  state.stock = Object.fromEntries(PRODUCTS.map((product) => [product.id, 0]));
  ticket.splice(0, ticket.length);
  saveState();
  render();
}

function render() {
  renderSummary();
  renderTicket();
  renderCatalog();
  renderSales();
  renderStock();
}

function renderSummary() {
  el.todayTotal.textContent = money.format(sumSales("day"));
  el.weekTotal.textContent = money.format(sumSales("week"));
  el.monthTotal.textContent = money.format(sumSales("month"));
}

function renderTicket() {
  el.ticketItemCount.textContent = `${ticket.length} ${ticket.length === 1 ? "item" : "items"}`;
  el.ticketTotal.textContent = money.format(sumItems(ticket));
  el.finishSaleButton.disabled = ticket.length === 0;
  el.clearTicketButton.disabled = ticket.length === 0;
  el.ticketHelp.textContent = ticket.length ? "Listo para finalizar" : "Agrega articulos y finaliza la venta";

  if (!ticket.length) {
    el.ticketList.innerHTML = document.querySelector("#emptyTemplate").innerHTML;
    return;
  }

  el.ticketList.innerHTML = ticket.map((item) => `
    <article class="sale-item">
      <div>
        <strong>${item.productName}</strong>
        <small>${number.format(item.qty)} kg x ${money.format(item.unitPrice)}</small>
      </div>
      <div class="sale-actions" style="display: flex; align-items: center; gap: 8px;">
        <div class="money">${money.format(item.total)}</div>
        <button class="edit-sale" type="button" data-edit-ticket-item="${item.id}" title="Editar precio total" style="background: #e0f2f1; color: #00796b; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">Editar</button>
        <button class="delete-sale" type="button" data-remove-ticket-item="${item.id}" title="Quitar articulo">Quitar</button>
      </div>
    </article>
  `).join("");
}

function renderCatalog() {
  el.catalogList.innerHTML = PRODUCTS.map((product) => {
    const promos = product.tiers.length
      ? product.tiers.map((tier) => `${tier.min}+ kg ${money.format(tier.price)}`).join(" / ")
      : "sin promo";
    return `
      <article class="product-item">
        <div>
          <strong>${product.name}</strong>
          <small>${product.category} - ${promos}</small>
        </div>
        <div class="money">${money.format(product.basePrice)}</div>
      </article>
    `;
  }).join("");
}

function renderSales() {
  const sales = filteredSales(el.periodFilter.value);
  if (!sales.length) {
    el.salesList.innerHTML = document.querySelector("#emptyTemplate").innerHTML;
    return;
  }

  el.salesList.innerHTML = sales.map((sale) => {
    const items = saleItems(sale);
    const title = items.length === 1 ? items[0].productName : `Venta con ${items.length} articulos`;
    const detail = items.map((item) => `${item.productName}: ${number.format(item.qty)} kg`).join(" | ");
    return `
      <article class="sale-item">
        <div>
          <strong>${title}</strong>
          <small>${formatDate(sale.date)} - ${detail}</small>
        </div>
        <div class="sale-actions">
          <div class="money">${money.format(saleTotal(sale))}</div>
          <button class="delete-sale" type="button" data-delete-sale="${sale.id}" title="Anular venta">Anular</button>
        </div>
      </article>
    `;
  }).join("");
}

function renderStock() {
  const totalKg = PRODUCTS.reduce((sum, product) => sum + (state.stock[product.id] || 0), 0);
  el.stockTotal.textContent = `${number.format(roundKg(totalKg))} kg`;
  el.stockList.innerHTML = PRODUCTS.map((product) => {
    const kg = roundKg(state.stock[product.id] || 0);
    return `
      <article class="stock-item">
        <div>
          <strong>${product.name}</strong>
          <small>${product.category}</small>
        </div>
        <span class="stock-chip ${kg <= 2 ? "low" : ""}">${number.format(kg)} kg</span>
      </article>
    `;
  }).join("");
}

function sumSales(period) {
  return filteredSales(period).reduce((sum, sale) => sum + saleTotal(sale), 0);
}

function filteredSales(period) {
  const now = new Date();
  return state.sales.filter((sale) => {
    const saleDate = parseLocalDate(sale.date);
    if (period === "all") return true;
    if (period === "day") return sameDay(saleDate, now);
    if (period === "week") return startOfWeek(saleDate).getTime() === startOfWeek(now).getTime();
    if (period === "month") return saleDate.getFullYear() === now.getFullYear() && saleDate.getMonth() === now.getMonth();
    return true;
  });
}

function exportCsv() {
  const rows = [["Fecha", "Venta", "Categoria", "Producto", "Cantidad kg", "Precio kg", "Total item", "Total venta"]];
  filteredSales(el.periodFilter.value).forEach((sale) => {
    saleItems(sale).forEach((item) => {
      rows.push([sale.date, sale.id, item.category, item.productName, item.qty, item.unitPrice, item.total, saleTotal(sale)]);
    });
  });

  const csv = rows.map((row) => row.map(csvCell).join(";")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ventas-polleria-${el.periodFilter.value}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function saleItems(sale) {
  if (Array.isArray(sale.items)) return sale.items;
  return [{
    productId: sale.productId,
    productName: sale.productName,
    category: sale.category,
    qty: sale.qty,
    unitPrice: sale.unitPrice,
    total: sale.total
  }];
}

function saleTotal(sale) {
  return typeof sale.total === "number" ? sale.total : sumItems(saleItems(sale));
}

function sumItems(items) {
  return items.reduce((sum, item) => sum + item.total, 0);
}

function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function parseLocalDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfWeek(date) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = result.getDay() || 7;
  result.setDate(result.getDate() - day + 1);
  result.setHours(0, 0, 0, 0);
  return result;
}

function formatDate(value) {
  return parseLocalDate(value).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function roundKg(value) {
  return Math.round((value || 0) * 100) / 100;
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }
}
