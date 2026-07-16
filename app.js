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
const el = {};

document.addEventListener("DOMContentLoaded", () => {
  bindElements();
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
  el.saleForm.addEventListener("submit", registerSale);
  el.stockForm.addEventListener("submit", addStock);
  el.periodFilter.addEventListener("change", renderSales);
  el.salesList.addEventListener("click", handleSalesListClick);
  el.exportCsv.addEventListener("click", exportCsv);
  el.exportPdf.addEventListener("click", () => window.print());
  el.resetDemoButton.addEventListener("click", clearData);
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
  const confirmed = confirm(`Anular venta de ${sale.productName}?`);
  if (!confirmed) return;
  state.sales.splice(index, 1);
  state.stock[sale.productId] = roundKg((state.stock[sale.productId] || 0) + sale.qty);
  saveState();
  render();
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
  const product = getProduct(el.productSelect.value);
  const qty = parseFloat(el.quantityInput.value) || 0;
  const unitPrice = parseFloat(el.unitPriceInput.value) || priceFor(product, qty);
  paintSalePreview(qty, unitPrice, "Precio editado");
}

function paintSalePreview(qty, unitPrice, helperText) {
  el.saleTotal.textContent = money.format(Math.round(qty * unitPrice));
  el.priceRule.textContent = helperText;
}

function registerSale(event) {
  event.preventDefault();
  const product = getProduct(el.productSelect.value);
  const qty = roundKg(parseFloat(el.quantityInput.value));
  const unitPrice = Math.round(parseFloat(el.unitPriceInput.value));
  if (!product || qty <= 0 || unitPrice < 0) return;

  state.sales.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    date: el.saleDate.value,
    productId: product.id,
    productName: product.name,
    category: product.category,
    qty,
    unitPrice,
    total: Math.round(qty * unitPrice),
    createdAt: new Date().toISOString()
  });
  state.stock[product.id] = roundKg((state.stock[product.id] || 0) - qty);
  saveState();
  el.quantityInput.value = "";
  updateSalePreview();
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
  saveState();
  render();
}

function render() {
  renderSummary();
  renderCatalog();
  renderSales();
  renderStock();
}

function renderSummary() {
  el.todayTotal.textContent = money.format(sumSales("day"));
  el.weekTotal.textContent = money.format(sumSales("week"));
  el.monthTotal.textContent = money.format(sumSales("month"));
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
  el.salesList.innerHTML = sales.map((sale) => `
    <article class="sale-item">
      <div>
        <strong>${sale.productName}</strong>
        <small>${formatDate(sale.date)} - ${number.format(sale.qty)} kg x ${money.format(sale.unitPrice)}</small>
      </div>
      <div class="sale-actions">
        <div class="money">${money.format(sale.total)}</div>
        <button class="delete-sale" type="button" data-delete-sale="${sale.id}" title="Anular venta">Anular</button>
      </div>
    </article>
  `).join("");
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
  return filteredSales(period).reduce((sum, sale) => sum + sale.total, 0);
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
  const sales = filteredSales(el.periodFilter.value);
  const rows = [
    ["Fecha", "Categoria", "Producto", "Cantidad kg", "Precio kg", "Total"],
    ...sales.map((sale) => [sale.date, sale.category, sale.productName, sale.qty, sale.unitPrice, sale.total])
  ];
  const csv = rows.map((row) => row.map(csvCell).join(";")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ventas-polleria-${el.periodFilter.value}.csv`;
  link.click();
  URL.revokeObjectURL(url);
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
