import { cookieHeader } from '../lib/auth.js';

function logout(request) {
  const secure = new URL(request.url).protocol === 'https:';
  return new Response(null, {
    status: 303,
    headers: { Location: '/login?logout=1', 'Set-Cookie': cookieHeader('', 0, secure), 'Cache-Control': 'no-store' },
  });
}

export const GET = logout;
export const POST = logout;
