const { neon } = require("@neondatabase/serverless");

let schemaReady;

function getSql() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada.");
  return neon(process.env.DATABASE_URL);
}

function ensureSchema(sql) {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS page_views (
        id BIGSERIAL PRIMARY KEY,
        visitor_hash TEXT NOT NULL,
        page TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      await sql`CREATE TABLE IF NOT EXISTS orders (
        order_id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        shipping_address TEXT NOT NULL,
        items JSONB NOT NULL,
        total_cents INTEGER NOT NULL,
        payment_method TEXT NOT NULL,
        installments INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    })().catch(error => {
      schemaReady = undefined;
      throw error;
    });
  }
  return schemaReady;
}

module.exports = { getSql, ensureSchema };
