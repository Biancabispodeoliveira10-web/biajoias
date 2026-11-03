const crypto = require("node:crypto");
const { getSql, ensureSchema } = require("../lib/db");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido." });

  const visitorId = req.body?.visitorId;
  const page = req.body?.page;
  if (typeof visitorId !== "string" || visitorId.length < 8 || visitorId.length > 100) {
    return res.status(400).json({ error: "Visitante inválido." });
  }
  if (typeof page !== "string" || !page.startsWith("/") || page.length > 200) {
    return res.status(400).json({ error: "Página inválida." });
  }

  const visitorHash = crypto.createHash("sha256").update(visitorId).digest("hex");
  try {
    const sql = getSql();
    await ensureSchema(sql);
    await sql`INSERT INTO page_views (visitor_hash, page) VALUES (${visitorHash}, ${page})`;
    return res.status(204).end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Não foi possível registrar a visita." });
  }
};
