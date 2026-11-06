import { createToken, cookieHeader, safeEqual, safeNext, SESSION_DAYS } from '../lib/auth.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function redirect(location, headers = {}) {
  return new Response(null, { status: 303, headers: { Location: location, 'Cache-Control': 'no-store', ...headers } });
}

export async function POST(request) {
  const form = await request.formData().catch(() => null);
  const code = (form?.get('code') || '').toString().trim();
  const next = safeNext((form?.get('next') || '/').toString());
  const secure = new URL(request.url).protocol === 'https:';

  const expected = process.env.ACCESS_CODE;
  if (!expected || !code || !(await safeEqual(code, expected))) {
    await sleep(600); // zpomalení zkoušení kódů
    const back = new URLSearchParams({ error: expected ? '1' : 'config' });
    if (next !== '/') back.set('next', next);
    return redirect(`/login?${back}`);
  }

  const token = await createToken();
  return redirect(next, { 'Set-Cookie': cookieHeader(token, SESSION_DAYS * 86400, secure) });
}

export function GET() {
  return redirect('/login');
}
