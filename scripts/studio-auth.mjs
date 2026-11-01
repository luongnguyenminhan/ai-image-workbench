// Password login for the studio, configured only through server-side env vars.
// Shared by the history service (Docker + `npm run history:service`) and the Vite dev proxy.
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const TOKEN_PREFIX = 'studio';

export function studioAuthConfig(env = process.env) {
  const email = String(env.STUDIO_LOGIN_EMAIL || '').trim().toLowerCase();
  const password = String(env.STUDIO_LOGIN_PASSWORD || '');
  if (!email || !password) return null;
  return {
    email,
    password,
    apiKey: String(env.AI_GATEWAY_API_KEY || '').trim(),
    // Derived from the credentials when unset, so changing the password signs everyone out.
    secret: String(env.STUDIO_SESSION_SECRET || '').trim()
      || createHash('sha256').update(`studio-session:${email}:${password}`).digest('hex'),
    ttlMs: Math.max(1, Number(env.STUDIO_SESSION_TTL_HOURS || 168)) * 60 * 60 * 1000
  };
}

// Hash both sides first so timingSafeEqual never sees different lengths.
function safeEqual(left, right) {
  const a = createHash('sha256').update(String(left)).digest();
  const b = createHash('sha256').update(String(right)).digest();
  return timingSafeEqual(a, b);
}

export function checkStudioCredentials(config, email, password) {
  const emailOk = safeEqual(String(email || '').trim().toLowerCase(), config.email);
  const passwordOk = safeEqual(String(password || ''), config.password);
  return emailOk && passwordOk;
}

function signature(config, payload) {
  return createHmac('sha256', config.secret).update(payload).digest('base64url');
}

export function signStudioToken(config, now = Date.now()) {
  const expiresAt = now + config.ttlMs;
  const payload = Buffer.from(JSON.stringify({ sub: config.email, exp: expiresAt })).toString('base64url');
  return { token: `${TOKEN_PREFIX}.${payload}.${signature(config, payload)}`, expiresAt };
}

export function verifyStudioToken(config, token, now = Date.now()) {
  const [prefix, payload, sig] = String(token || '').split('.');
  if (prefix !== TOKEN_PREFIX || !payload || !sig) return null;
  if (!safeEqual(sig, signature(config, payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data?.sub === config.email && Number(data.exp) > now ? data : null;
  } catch {
    return null;
  }
}

export function bearerFromHeader(value) {
  const match = typeof value === 'string' ? value.match(/^Bearer\s+(.+)$/i) : null;
  return match ? match[1].trim() : '';
}
