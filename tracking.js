(() => {
  try {
    const key = "biajoias-visitor-id";
    let visitorId = localStorage.getItem(key);
    if (!visitorId) { visitorId = crypto.randomUUID(); localStorage.setItem(key, visitorId); }
    const page = location.pathname === "/index.html" ? "/" : location.pathname;
    fetch("/api/visits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visitorId, page }), keepalive: true }).catch(() => {});
  } catch {}
})();