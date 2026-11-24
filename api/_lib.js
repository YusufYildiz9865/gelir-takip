// Ortak yardımcılar: Neon sorgusu, oturum anahtarı, doğrulama.
// "_" ile başlayan dosyalar Vercel'de adres (endpoint) olarak yayınlanmaz.
import crypto from 'node:crypto';

const DATABASE_URL = (process.env.DATABASE_URL || '').trim();
const TOKEN_HOURS = 12;

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// ---------- Neon (HTTP üzerinden SQL) ----------
export async function query(sql, params = []) {
  const m = DATABASE_URL.match(/@([^/:?]+)/);
  if (!m) throw new HttpError(500, 'Sunucuda DATABASE_URL ayarlanmamış (Vercel → Settings → Environment Variables).');
  const res = await fetch(`https://${m[1]}/sql`, {
    method: 'POST',
    headers: {
      'Neon-Connection-String': DATABASE_URL,
      'Neon-Raw-Text-Output': 'true',
      'Neon-Array-Mode': 'true',
    },
    body: JSON.stringify({ query: sql, params: params.map((p) => (p == null ? null : String(p))) }),
  });
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  if (!res.ok) throw new HttpError(500, 'Veritabanı hatası: ' + ((data && data.message) || res.status));
  const fields = (data && data.fields) || [];
  return ((data && data.rows) || []).map((row) =>
    Array.isArray(row) ? Object.fromEntries(fields.map((f, i) => [f.name, row[i]])) : row
  );
}

// ---------- Oturum anahtarı (imzalı, şifre içermez) ----------
function secret() {
  const s = process.env.AUTH_SECRET || DATABASE_URL;
  return crypto.createHash('sha256').update('gelir-takip-auth:' + s).digest();
}
const b64url = (buf) => Buffer.from(buf).toString('base64url');

export function signToken(username) {
  const payload = b64url(JSON.stringify({ u: username, exp: Date.now() + TOKEN_HOURS * 3600 * 1000 }));
  const sig = b64url(crypto.createHmac('sha256', secret()).update(payload).digest());
  return `${payload}.${sig}`;
}

export function requireUser(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  const [payload, sig] = token.split('.');
  if (!payload || !sig) throw new HttpError(401, 'Oturum bulunamadı. Lütfen giriş yapın.');
  const expected = b64url(crypto.createHmac('sha256', secret()).update(payload).digest());
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new HttpError(401, 'Oturum geçersiz. Lütfen tekrar giriş yapın.');
  let data;
  try {
    data = JSON.parse(Buffer.from(payload, 'base64url').toString());
  } catch (e) {
    throw new HttpError(401, 'Oturum geçersiz. Lütfen tekrar giriş yapın.');
  }
  if (!data.exp || data.exp < Date.now()) throw new HttpError(401, 'Oturum süresi doldu. Lütfen tekrar giriş yapın.');
  return data.u;
}

// ---------- Yardımcılar ----------
export function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try {
    return JSON.parse(req.body || '{}');
  } catch (e) {
    return {};
  }
}

export function handle(fn) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    try {
      await fn(req, res);
    } catch (e) {
      const status = e.status || 500;
      if (status === 500) console.error(e);
      res.status(status).json({ error: e.message || 'Sunucu hatası' });
    }
  };
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
