const loginPanel = document.querySelector("#login-panel");
const dashboard = document.querySelector("#dashboard");
const loginForm = document.querySelector("#admin-login-form");
const loginMessage = document.querySelector("#login-message");
const dashboardMessage = document.querySelector("#dashboard-message");
const numberFormat = new Intl.NumberFormat("pt-BR");
const moneyFormat = cents => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

function showDashboard(visible) {
  loginPanel.classList.toggle("admin-hidden", visible);
  dashboard.classList.toggle("admin-hidden", !visible);
}

async function loadDashboard() {
  dashboardMessage.textContent = "Carregando dados…";
  const response = await fetch("/api/admin/data", { credentials: "same-origin", cache: "no-store" });
  if (response.status === 401) {
    showDashboard(false);
    dashboardMessage.textContent = "";
    return;
  }
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Não foi possível carregar o painel.");
  document.querySelector("#unique-total").textContent = numberFormat.format(data.totals.unique_visitors || 0);
  document.querySelector("#views-total").textContent = numberFormat.format(data.totals.page_views || 0);
  document.querySelector("#unique-today").textContent = numberFormat.format(data.today.unique_visitors || 0);
  const body = document.querySelector("#orders-body");
  body.replaceChildren();
  document.querySelector("#orders-empty").classList.toggle("admin-hidden", data.orders.length > 0);
  for (const order of data.orders) {
    const row = document.createElement("tr");
    const addCell = text => { const cell = document.createElement("td"); cell.textContent = text; row.append(cell); return cell; };
    const idCell = addCell(order.order_id);
    const status = document.createElement("small"); status.textContent = order.status; idCell.append(status);
    const customer = addCell(order.customer_name);
    const contact = document.createElement("small"); contact.textContent = `${order.customer_email} · ${order.customer_phone}`; customer.append(contact);
    const address = document.createElement("small"); address.textContent = order.shipping_address; customer.append(address);
    const items = Array.isArray(order.items) ? order.items : [];
    const itemCell = addCell(items.map(item => item.name).join(", "));
    const itemPrices = document.createElement("small"); itemPrices.textContent = items.map(item => moneyFormat(item.priceCents)).join(" · "); itemCell.append(itemPrices);
    addCell(moneyFormat(order.total_cents));
    addCell(order.payment_method === "card" ? "Cartão" : "Pix");
    addCell(new Date(order.created_at).toLocaleString("pt-BR"));
    body.append(row);
  }
  dashboardMessage.textContent = `Atualizado em ${new Date().toLocaleTimeString("pt-BR")}.`;
  showDashboard(true);
}

async function checkSession() {
  try {
    const response = await fetch("/api/admin/session", { credentials: "same-origin", cache: "no-store" });
    if (response.ok) await loadDashboard();
  } catch {
    loginMessage.textContent = "Não foi possível conectar ao painel.";
  }
}

loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  loginMessage.textContent = "Verificando acesso…";
  const submit = loginForm.querySelector("button[type=submit]");
  submit.disabled = true;
  try {
    const response = await fetch("/api/admin/session", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: new FormData(loginForm).get("password") }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Não foi possível entrar.");
    loginForm.reset();
    loginMessage.textContent = "";
    await loadDashboard();
  } catch (error) {
    loginMessage.textContent = error.message;
  } finally {
    submit.disabled = false;
  }
});

document.querySelector("#admin-logout").addEventListener("click", async () => {
  await fetch("/api/admin/session", { method: "DELETE", credentials: "same-origin" });
  showDashboard(false);
});
document.querySelector("#refresh-dashboard").addEventListener("click", () => loadDashboard().catch(error => { dashboardMessage.textContent = error.message; }));
checkSession();