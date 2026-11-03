const { isAdmin } = require("../../lib/auth");
const { getSql, ensureSchema } = require("../../lib/db");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Método não permitido." });
  if (!isAdmin(req)) return res.status(401).json({ error: "Entre para ver o painel." });

  try {
    const sql = getSql();
    await ensureSchema(sql);
    const [totals] = await sql`SELECT COUNT(DISTINCT visitor_hash)::int AS unique_visitors, COUNT(*)::int AS page_views FROM page_views`;
    const [today] = await sql`SELECT COUNT(DISTINCT visitor_hash)::int AS unique_visitors FROM page_views WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo'`;
    const orders = await sql`SELECT order_id, status, customer_name, customer_email, customer_phone, shipping_address, items, total_cents, payment_method, installments, created_at
      FROM orders ORDER BY created_at DESC LIMIT 500`;
    return res.status(200).json({ totals, today, orders });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Não foi possível carregar o painel." });
  }
};
