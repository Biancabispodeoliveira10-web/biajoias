const { passwordMatches, createToken, isAdmin, setSessionCookie, clearSessionCookie } = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    const ok = isAdmin(req);
    return res.status(ok ? 200 : 401).json({ ok });
  }

  if (req.method === "POST") {
    if (!process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET) {
      return res.status(500).json({ error: "O painel ainda não está configurado no servidor." });
    }
    if (!passwordMatches(req.body?.password)) {
      return res.status(401).json({ error: "Senha incorreta." });
    }
    setSessionCookie(res, createToken());
    return res.status(200).json({ ok: true });
  }

  if (req.method === "DELETE") {
    clearSessionCookie(res);
    return res.status(204).end();
  }

  return res.status(405).json({ error: "Método não permitido." });
};
