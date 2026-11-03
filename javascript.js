const cart = [];
const cartCount = document.querySelector("#cart-count");
const toast = document.querySelector("#toast");
const cartDialog = document.querySelector("#cart-dialog");
const cartItems = document.querySelector("#cart-items");
const cartEmpty = document.querySelector("#cart-empty");
const cartTotal = document.querySelector("#cart-total");
const cartCheckout = document.querySelector("#cart-checkout");
const cartView = document.querySelector("#cart-view");
const checkoutView = document.querySelector("#checkout-view");
const checkoutForm = document.querySelector("#checkout-form");
const checkoutTotal = document.querySelector("#checkout-total");
const checkoutStatus = document.querySelector("#checkout-status");
const pixResult = document.querySelector("#pix-result");
const pixCode = document.querySelector("#pix-code");
const pixStatus = document.querySelector("#pix-status");
const cardResult = document.querySelector("#card-result");
const installmentField = document.querySelector("#installment-field");
const installmentsSelect = document.querySelector("#installments");
const checkoutSubmit = document.querySelector("#checkout-submit");
const money = value => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
let toastTimer;

function updateCart() {
  cartCount.textContent = cart.length;
  cartItems.replaceChildren();
  cartEmpty.hidden = cart.length > 0;
  cartItems.hidden = cart.length === 0;
  cartCheckout.disabled = cart.length === 0;
  cartCheckout.classList.toggle("is-disabled", cart.length === 0);
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  cartTotal.textContent = money(total);
  checkoutTotal.textContent = money(total);
  cart.forEach((item, index) => {
    const row = document.createElement("li");
    row.className = "cart-item";
    const details = document.createElement("div");
    details.className = "cart-item-details";
    const name = document.createElement("strong");
    name.textContent = item.name;
    const price = document.createElement("span");
    price.textContent = money(item.price);
    details.append(name, price);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "cart-remove";
    remove.dataset.remove = String(index);
    remove.setAttribute("aria-label", `Remover ${item.name} da sacola`);
    remove.textContent = "Remover";
    row.append(details, remove);
    cartItems.append(row);
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

function addItem(name, price) {
  cart.push({ name, price: Number(price) });
  updateCart();
  showToast(`${name} adicionada à sacola. Total: ${cartTotal.textContent}`);
}

function pixField(id, value) {
  const text = String(value);
  return `${id}${String(text.length).padStart(2, "0")}${text}`;
}

function crc16(payload) {
  let crc = 0xffff;
  for (let index = 0; index < payload.length; index++) {
    crc ^= payload.charCodeAt(index) << 8;
    for (let bit = 0; bit < 8; bit++) crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    crc &= 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function createPixCode(txid) {
  const pixAccount = pixField("00", "br.gov.bcb.pix") + pixField("01", "+5562981101643");
  const additionalData = pixField("05", txid);
  const payload = pixField("00", "01") + pixField("01", "11") + pixField("26", pixAccount) + pixField("52", "0000") + pixField("53", "986") + pixField("58", "BR") + pixField("59", "BIANCA BISPO DE OLIVEIRA") + pixField("60", "TRINDADE") + pixField("62", additionalData) + "6304";
  return payload + crc16(payload);
}

function buildOrderEmail(txid, total, payment) {
  const form = new FormData(checkoutForm);
  const shippingAddress = [form.get("address"), form.get("number"), form.get("complement"), form.get("postalCode"), form.get("city"), form.get("state")].filter(Boolean).join(", ");
  const items = cart.map(item => `- ${item.name}: ${money(item.price)}`).join("\n");
  const installments = Number(form.get("installments") || 1);
  const paymentDetails = payment === "card" ? `Cartão de crédito: ${installments}x de ${money(total / installments)} sobre o subtotal das peças (frete pendente).` : "Pagamento escolhido: Pix pela CAIXA. O frete será calculado antes da confirmação do pagamento.";
  const body = `Pedido Bia Joias ${txid}\n\nCliente: ${form.get("name")}\nE-mail: ${form.get("email")}\nCelular: ${form.get("phone")}\nEndereço: ${shippingAddress}\n\nItens:\n${items}\nSubtotal das peças: ${money(total)}\n${paymentDetails}\nFrete: calcular e informar ao cliente.\nChave Pix: 62981101643\n`;
  const subject = `Pedido Bia Joias ${txid}`;
  const mailto = `mailto:oi@biajoias.com.br?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  document.querySelector("#send-order-email").href = mailto;
  document.querySelector("#send-card-order-email").href = mailto;
  document.querySelector("#installment-summary").textContent = `${installments}x de ${money(total / installments)} no subtotal das peças. O frete será somado após o cálculo.`;
}

document.querySelectorAll("[data-price]").forEach(button => button.addEventListener("click", () => addItem(button.dataset.name, button.dataset.price)));
document.querySelectorAll('input[name="payment"]').forEach(input => input.addEventListener("change", () => {
  const isCard = input.checked && input.value === "card";
  installmentField.hidden = !isCard;
  installmentsSelect.required = isCard;
  checkoutSubmit.childNodes[0].textContent = isCard ? "Solicitar link de pagamento " : "Gerar Pix para pagamento ";
}));
document.querySelector(".bag").addEventListener("click", event => {
  event.preventDefault();
  cartView.hidden = false;
  checkoutView.hidden = true;
  document.querySelector("#checkout-form").hidden = false;
  pixResult.hidden = true;
  cardResult.hidden = true;
  updateCart();
  cartDialog.showModal();
});
document.querySelectorAll(".cart-close").forEach(button => button.addEventListener("click", () => cartDialog.close()));
document.querySelector("#cart-checkout").addEventListener("click", () => {
  if (cart.length === 0) return;
  cartView.hidden = true;
  checkoutView.hidden = false;
  checkoutStatus.textContent = "";
  checkoutForm.querySelector("input")?.focus();
});
document.querySelector("#checkout-back").addEventListener("click", () => {
  checkoutView.hidden = true;
  cartView.hidden = false;
  document.querySelector("#cart-checkout").focus();
});
checkoutForm.addEventListener("submit", event => {
  event.preventDefault();
  const txid = `BJ${Date.now().toString(36).toUpperCase()}`.slice(0, 25);
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  const payment = new FormData(checkoutForm).get("payment");
  buildOrderEmail(txid, total, payment);
  checkoutForm.hidden = true;
  if (payment === "card") {
    pixResult.hidden = true;
  cardResult.hidden = true;
    cardResult.hidden = false;
    document.querySelector("#card-result-title").focus();
    return;
  }
  pixCode.value = createPixCode(txid);
  cardResult.hidden = true;
  pixResult.hidden = false;
  pixStatus.textContent = `Código Pix gerado para ${money(total)} em peças. O frete ainda será calculado.`;
  document.querySelector("#pix-title").focus();
});
document.querySelector("#edit-card-order").addEventListener("click", () => {
  cardResult.hidden = true;
  checkoutForm.hidden = false;
  checkoutForm.querySelector("input")?.focus();
});
document.querySelector("#edit-order").addEventListener("click", () => {
  pixResult.hidden = true;
  cardResult.hidden = true;
  checkoutForm.hidden = false;
  checkoutForm.querySelector("input")?.focus();
});
document.querySelector("#copy-pix").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(pixCode.value);
    pixStatus.textContent = "Código Pix copiado. Abra o aplicativo do seu banco para colar e pagar após confirmar o frete.";
  } catch {
    pixCode.select();
    document.execCommand("copy");
    pixStatus.textContent = "Código Pix selecionado para copiar. Abra o aplicativo do seu banco para colar e pagar após confirmar o frete.";
  }
});
cartItems.addEventListener("click", event => {
  const button = event.target.closest("[data-remove]");
  if (!button) return;
  const removed = cart.splice(Number(button.dataset.remove), 1)[0];
  updateCart();
  showToast(`${removed.name} removida da sacola.`);
});

document.querySelectorAll(".filter").forEach(button => button.addEventListener("click", () => {
  document.querySelector(".filter.active")?.classList.remove("active");
  document.querySelectorAll(".filter").forEach(item => item.setAttribute("aria-pressed", "false"));
  button.classList.add("active");
  button.setAttribute("aria-pressed", "true");
  const category = button.dataset.filter;
  let visible = 0;
  document.querySelectorAll(".product").forEach(product => {
    const show = category === "todos" || product.dataset.category === category;
    product.classList.toggle("hidden", !show);
    if (show) visible++;
  });
  document.querySelector("#filter-status").textContent = `${visible} ${visible === 1 ? "produto encontrado" : "produtos encontrados"}`;
}));

const menuButton = document.querySelector(".menu-toggle");
menuButton.addEventListener("click", () => {
  const expanded = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!expanded));
  menuButton.setAttribute("aria-label", expanded ? "Abrir menu" : "Fechar menu");
  document.querySelector("#nav").classList.toggle("open", !expanded);
});
document.querySelectorAll("#nav a").forEach(link => link.addEventListener("click", () => {
  document.querySelector("#nav").classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Abrir menu");
}));
document.querySelector("#newsletter-form").addEventListener("submit", event => {
  event.preventDefault();
  document.querySelector("#newsletter-status").textContent = "Obrigada! Seu e-mail foi cadastrado.";
  event.currentTarget.reset();
});
updateCart();
