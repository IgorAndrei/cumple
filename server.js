// Mini servidor para micumple.zenti.cl (sin dependencias, Node 18+).
// Recibe el video de la reacción, registra eventos, avisa por ntfy y lista las fotos.
// Escucha solo en 127.0.0.1; nginx le pasa /api/ y /panel.
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 3100);
const ROOT = __dirname;
const DATA = path.join(ROOT, "data");
const VIDEOS = path.join(DATA, "videos");
const FOTOS = path.join(ROOT, "public", "fotos");
const LOG = path.join(DATA, "eventos.log");
const CLAVE = process.env.PANEL_CLAVE || "";
const NTFY = process.env.NTFY_TOPIC || "";
const MAX_VIDEO = 300 * 1024 * 1024;

fs.mkdirSync(VIDEOS, { recursive: true });

const TEXTOS = {
  abrio: "🎁 Isis abrió la página y empezó a perseguir el regalo",
  revelo: "🎫 Isis raspó la entrada: ¡ya sabe que va a ver a Hilary Duff!",
  acepto: "💃 Isis ACEPTÓ la cita del 20 de agosto",
  video: "🎥 Llegó el video de la reacción de Isis",
};

function registrar(tipo, prueba, extra = "") {
  const linea = `${new Date().toISOString()}\t${tipo}\t${prueba ? "prueba" : "real"}\t${extra}\n`;
  fs.appendFileSync(LOG, linea);
  if (!NTFY) return;
  const msg = (prueba ? "[PRUEBA] " : "") + (TEXTOS[tipo] || tipo);
  fetch(`https://ntfy.sh/${encodeURIComponent(NTFY)}`, {
    method: "POST",
    body: msg,
    headers: { Title: "micumple.zenti.cl", Tags: "birthday" },
  }).catch((e) => console.error("ntfy:", e.message));
}

function json(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(obj));
}

function leerCuerpo(req, max) {
  return new Promise((ok, mal) => {
    const partes = []; let total = 0;
    req.on("data", (c) => {
      total += c.length;
      if (total > max) { mal(new Error("muy grande")); req.destroy(); return; }
      partes.push(c);
    });
    req.on("end", () => ok(Buffer.concat(partes)));
    req.on("error", mal);
  });
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function panel(res, clave) {
  const eventos = fs.existsSync(LOG) ? fs.readFileSync(LOG, "utf8").trim().split("\n").filter(Boolean).reverse() : [];
  const videos = fs.readdirSync(VIDEOS).filter((f) => /\.(webm|mp4)$/.test(f)).sort().reverse();
  const k = encodeURIComponent(clave);
  const fmt = (iso) => new Date(iso).toLocaleString("es-CL", { timeZone: "America/Santiago" });
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" });
  res.end(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Panel micumple</title><style>
body{font:16px/1.5 system-ui,sans-serif;background:#ffe3ec;color:#3b0d22;margin:0;padding:24px 16px;max-width:720px;margin-inline:auto}
h1{color:#e0136b;margin:0 0 16px}h2{margin:28px 0 10px;font-size:18px}
video{width:100%;border-radius:12px;background:#000;margin-bottom:6px}
.v{background:#fffaf3;border-radius:12px;padding:12px;margin-bottom:14px}
table{width:100%;border-collapse:collapse;background:#fffaf3;border-radius:12px;overflow:hidden}
td{padding:8px 10px;border-bottom:1px solid #ffc9da;font-size:14px}.p{color:#7a3a55;font-size:12px}
a{color:#e0136b}</style></head><body>
<h1>Panel de la sorpresa</h1>
<h2>Videos (${videos.length})</h2>
${videos.map((v) => `<div class="v"><video src="/panel/video/${encodeURIComponent(v)}?clave=${k}" controls playsinline preload="metadata"></video>
<div class="p">${esc(v)} · <a href="/panel/video/${encodeURIComponent(v)}?clave=${k}&descargar=1">descargar</a></div></div>`).join("") || "<p>Todavía no hay videos.</p>"}
<h2>Eventos</h2>
<table>${eventos.map((l) => { const [t, tipo, modo, extra] = l.split("\t"); return `<tr><td>${esc(fmt(t))}</td><td>${esc(TEXTOS[tipo] || tipo)}${extra ? " · " + esc(extra) : ""}</td><td class="p">${esc(modo)}</td></tr>`; }).join("") || "<tr><td>Sin eventos.</td></tr>"}</table>
</body></html>`);
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const prueba = url.searchParams.has("prueba");
  try {
    if (req.method === "GET" && url.pathname === "/api/fotos") {
      const fotos = fs.existsSync(FOTOS)
        ? fs.readdirSync(FOTOS).filter((f) => /\.(jpe?g|png|webp|gif)$/i.test(f)).sort((a, b) => a.localeCompare(b, "es", { numeric: true }))
        : [];
      return json(res, 200, fotos.map((f) => "fotos/" + encodeURIComponent(f)));
    }

    if (req.method === "POST" && url.pathname === "/api/evento") {
      const cuerpo = JSON.parse((await leerCuerpo(req, 4096)).toString() || "{}");
      const tipo = String(cuerpo.tipo || "");
      if (!["abrio", "revelo", "acepto"].includes(tipo)) return json(res, 400, { error: "tipo" });
      registrar(tipo, prueba);
      return json(res, 200, { ok: true });
    }

    if (req.method === "POST" && url.pathname === "/api/video") {
      const tipo = String(req.headers["content-type"] || "");
      const ext = tipo.includes("mp4") ? "mp4" : "webm";
      const datos = await leerCuerpo(req, MAX_VIDEO);
      if (datos.length < 1000) return json(res, 400, { error: "vacío" });
      const nombre = `${new Date().toISOString().replace(/[:.]/g, "-")}${prueba ? "-prueba" : ""}.${ext}`;
      fs.writeFileSync(path.join(VIDEOS, nombre), datos);
      registrar("video", prueba, `${(datos.length / 1048576).toFixed(1)} MB`);
      return json(res, 200, { ok: true });
    }

    if (req.method === "GET" && (url.pathname === "/panel" || url.pathname.startsWith("/panel/video/"))) {
      const clave = url.searchParams.get("clave") || "";
      if (!CLAVE || clave !== CLAVE) { res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("Clave incorrecta"); }
      if (url.pathname === "/panel") return panel(res, clave);
      const nombre = path.basename(decodeURIComponent(url.pathname.slice("/panel/video/".length)));
      if (!fs.existsSync(path.join(VIDEOS, nombre))) { res.writeHead(404); return res.end(); }
      // nginx entrega el archivo (soporta saltar en el video)
      const cabeceras = { "X-Accel-Redirect": "/_videos/" + encodeURIComponent(nombre) };
      if (url.searchParams.has("descargar")) cabeceras["Content-Disposition"] = `attachment; filename="${nombre}"`;
      res.writeHead(200, cabeceras);
      return res.end();
    }

    res.writeHead(404); res.end();
  } catch (e) {
    console.error(e);
    json(res, 500, { error: "error" });
  }
}).listen(PORT, "127.0.0.1", () => console.log(`micumple escuchando en 127.0.0.1:${PORT}`));
