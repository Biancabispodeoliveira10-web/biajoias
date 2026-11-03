const crypto = require("node:crypto");
const { PRODUCT_PRICES } = require("../lib/catalog");
const { getSql, ensureSchema } = require("../lib/db");

const PAYMENT_METHODS = ["pix", "card"];
const MAX_ITEMS = 50;

const clean = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido." });

  const customer = req.body?.customer || {};
  const payment = req.body?.payment;

  const name = clean(customer.name, 120);
  const email = clean(customer.email, 160);
  const phone = clean(customer.phone, 40);
  const postalCode = clean(customer.postalCode, 12);
  const address = clean(customer.address, 160);
  const number = clean(customer.number, 20);
  const complement = clean(customer.complement, 80);
  const city = clean(customer.city, 80);
  const state = clean(customer.state, 2).toUpperCase();

  if (!name || !email.includes("@") || !phone || !postalCode || !address || !number || !city || state.length !== 2) {
    return res.status(400).json({ error: "Confira os dados de entrega." });
  }
  if (!PAYMENT_METHODS.includes(payment)) {
    return res.status(400).json({ error: "Escolha a forma de pagamento." });
  }

  const installments = payment === "card" ? Number(customer.installments) : 1;
  if (!Number.isInteger(installments) || installments < 1 || installments > 3) {
    return res.status(400).json({ error: "Escolha o número de parcelas." });
  }

  const cart = req.body?.items;
  if (!Array.isArray(cart) || cart.length === 0 || cart.length > MAX_ITEMS) {
    return res.status(400).json({ error: "Sua sacola está vazia ou com itens demais." });
  }
  const items = cart.map(item => {
    const price = PRODUCT_PRICES[item?.name];
    return price === undefined ? null : { name: item.name, priceCents: price * 100 };
  });
  if (items.includes(null)) {
    return res.status(400).json({ error: "Há itens inválidos na sacola. Atualize a página e tente de novo." });
  }

  const totalCents = items.reduce((sum, item) => sum + item.priceCents, 0);
  const shippingAddress = `${address}, ${number}${complement ? ` - ${complement}` : ""} - ${city}/${state} - CEP ${postalCode}`;
  const orderId = `BJ-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

  try {
    const sql = getSql();
    await ensureSchema(sql);
    await sql`INSERT INTO orders (order_id, status, customer_name, customer_email, customer_phone, shipping_address, items, total_cents, payment_method, installments)
      VALUES (${orderId}, ${"recebido"}, ${name}, ${email}, ${phone}, ${shippingAddress}, ${JSON.stringify(items)}, ${totalCents}, ${payment}, ${installments})`;
    return res.status(201).json({ orderId, totalCents });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Não foi possível registrar o pedido. Tente novamente." });
  }
};
