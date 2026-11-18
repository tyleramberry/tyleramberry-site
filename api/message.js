// Vercel serverless function: POST /api/message
// Sends a visitor's note to Tyler via Resend. Needs RESEND_API_KEY in the Vercel project env.
// Optional env: CONTACT_TO (defaults to Tyler's Gmail), CONTACT_FROM (defaults to Resend's test sender).

const hits = new Map(); // best-effort per-instance rate limit: ip -> [timestamps]
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

function limited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  return list.length > MAX_PER_WINDOW;
}

function clean(s, max) {
  return String(s == null ? "" : s).replace(/\r/g, "").trim().slice(0, max);
}

function escHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  // Honeypot: real people never see or fill this field. Pretend success so bots move on.
  if (clean(body.website, 200)) return res.status(200).json({ ok: true });

  // Submitted faster than a human could type: also treat as a bot.
  const elapsed = Number(body.t);
  if (Number.isFinite(elapsed) && elapsed >= 0 && elapsed < 2500) return res.status(200).json({ ok: true });

  const message = clean(body.message, 5000);
  const name = clean(body.name, 120);
  const email = clean(body.email, 200);
  const page = clean(body.page, 200);

  if (message.length < 2) return res.status(400).json({ ok: false, error: "Write a message first." });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: "That email doesn't look right." });
  }

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (limited(ip)) return res.status(429).json({ ok: false, error: "Too many messages. Try again in a few minutes." });

  const key = process.env.RESEND_API_KEY;
  if (!key) return res.status(500).json({ ok: false, error: "Messaging isn't set up yet. Email tyleramberry@gmail.com instead." });

  const to = process.env.CONTACT_TO || "tyleramberry@gmail.com";
  const from = process.env.CONTACT_FROM || "tyleramberry.com <onboarding@resend.dev>";
  const who = name || email || "Someone";
  const firstLine = message.split("\n")[0].slice(0, 60);

  const text =
    message + "\n\n---\n" +
    "From: " + (name || "(no name)") + "\n" +
    "Reply to: " + (email || "(no email left)") + "\n" +
    "Page: " + (page || "(unknown)") + "\n";

  const html =
    '<div style="font:15px/1.55 -apple-system,Segoe UI,sans-serif;color:#18181b">' +
    '<p style="white-space:pre-wrap;margin:0 0 20px">' + escHtml(message) + "</p>" +
    '<p style="margin:0;color:#71717a;font-size:13px">From: ' + escHtml(name || "(no name)") +
    "<br>Reply to: " + escHtml(email || "(no email left)") +
    "<br>Page: " + escHtml(page || "(unknown)") + "</p></div>";

  const payload = { from, to: [to], subject: "Site message from " + who + ": " + firstLine, text, html };
  if (email) payload.reply_to = email;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      console.error("Resend error", r.status, await r.text());
      return res.status(502).json({ ok: false, error: "Couldn't send right now. Try again soon." });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Resend fetch failed", e);
    return res.status(502).json({ ok: false, error: "Couldn't send right now. Try again soon." });
  }
};
