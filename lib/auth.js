// Sdílená logika přihlášení – běží v Edge middleware i v Node funkcích (Web Crypto API).

export const COOKIE_NAME = 'eer26_auth';
export const SESSION_DAYS = 30;

const enc = new TextEncoder();

function b64url(buf) {
  let s = '';
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmacKey() {
  const code = process.env.ACCESS_CODE;
  if (!code) return null; // bez nastaveného kódu je vše zamčeno (fail closed)
  const secret = `${code}|${process.env.SESSION_SECRET || ''}`;
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

async function sign(payload) {
  const key = await hmacKey();
  if (!key) return null;
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(payload)));
}

// Porovnání v konstantním čase (přes HMAC obou hodnot, aby nezáleželo na délce).
export async function safeEqual(a, b) {
  const k = await crypto.subtle.importKey('raw', crypto.getRandomValues(new Uint8Array(32)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const [ha, hb] = await Promise.all([
    crypto.subtle.sign('HMAC', k, enc.encode(String(a))),
    crypto.subtle.sign('HMAC', k, enc.encode(String(b))),
  ]);
  const x = new Uint8Array(ha), y = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export async function createToken() {
  const exp = Date.now() + SESSION_DAYS * 864e5;
  const payload = `v1.${exp}`;
  const sig = await sign(payload);
  return sig ? `${payload}.${sig}` : null;
}

export async function verifyToken(token) {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') return false;
  const exp = Number(parts[1]);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = await sign(`v1.${parts[1]}`);
  if (!expected) return false;
  return safeEqual(expected, parts[2]);
}

export function readCookie(request, name = COOKIE_NAME) {
  const header = request.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > -1 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

export function cookieHeader(value, maxAgeSeconds, secure = true) {
  return [
    `${COOKIE_NAME}=${encodeURIComponent(value)}`,
    'Path=/',
    `Max-Age=${maxAgeSeconds}`,
    'HttpOnly',
    'SameSite=Lax',
    secure ? 'Secure' : '',
  ].filter(Boolean).join('; ');
}

// Povolíme jen relativní cestu v rámci webu (ochrana proti open redirectu).
export function safeNext(next) {
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return '/';
  if (next.startsWith('/login') || next.startsWith('/api/')) return '/';
  return next;
}
