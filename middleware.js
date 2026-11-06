// Vercel Routing Middleware – bez platné session cookie pustí jen na přihlašovací stránku.
import { readCookie, verifyToken } from './lib/auth.js';

export const config = {
  // vše kromě přihlašovací stránky, jejích assetů, API přihlášení a robots.txt
  matcher: ['/((?!login|api/login|api/logout|assets/login|robots\\.txt|favicon\\.svg).*)'],
};

export default async function middleware(request) {
  if (await verifyToken(readCookie(request))) return; // pokračovat na statický obsah

  const url = new URL(request.url);
  const login = new URL('/login', url);
  const next = url.pathname + url.search;
  if (next !== '/') login.searchParams.set('next', next);
  return Response.redirect(login, 302);
}
