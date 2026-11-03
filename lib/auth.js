const crypto = require("node:crypto");

const COOKIE_NAME = "biajoias_admin";
const SESSION_SECONDS = 60 * 60 * 8;

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest();
}

function sign(payload) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET não configurada.");
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

function passwordMatches(input) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof input !== "string") return false;
  return crypto.timingSafeEqual(sha256(input), sha256(expected));
}

function createToken() {
  const payload = String(Date.now() + SESSION_SECONDS * 1000);
  return `${payload}.${sign(payload)}`;
}

function isValidToken(token) {
  if (typeof token !== "string") return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return false;
  return Number(payload) > Date.now();
}

function readCookie(req, name) {
  for (const part of (req.headers.cookie || "").split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return value.join("=");
  }
  return undefined;
}

function isAdmin(req) {
  return isValidToken(readCookie(req, COOKIE_NAME));
}

function setSessionCookie(res, token) {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`);
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
}

module.exports = { passwordMatches, createToken, isAdmin, setSessionCookie, clearSessionCookie };
