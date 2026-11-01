// Password login for the studio, configured only through server-side env vars.
// Shared by the history service (Docker + `npm run history:service`) and the Vite dev proxy.
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const TOKEN_PREFIX = 'studio';

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

// STUDIO_USERS="a@x.com:pass1,b@y.com:pass2" (passwords may contain ':' but not ',').
// STUDIO_LOGIN_EMAIL/STUDIO_LOGIN_PASSWORD still work as one more user.
function parseUsers(env) {
  const users = new Map();
  for (const entry of String(env.STUDIO_USERS || '').split(',')) {
    const separator = entry.indexOf(':');
    if (separator <= 0) continue;
    const email = normalizeEmail(entry.slice(0, separator));
    const password = entry.slice(separator + 1).trim();
    if (email && password) users.set(email, password);
  }
  const legacyEmail = normalizeEmail(env.STUDIO_LOGIN_EMAIL);
  if (legacyEmail && env.STUDIO_LOGIN_PASSWORD) users.set(legacyEmail, String(env.STUDIO_LOGIN_PASSWORD));
  return users;
}

export function studioAuthConfig(env = process.env) {
  const users = parseUsers(env);
  if (!users.size) return null;
  return {
    users,
    apiKey: String(env.AI_GATEWAY_API_KEY || '').trim(),
    secret: String(env.STUDIO_SESSION_SECRET || '').trim(),
    ttlMs: Math.max(1, Number(env.STUDIO_SESSION_TTL_HOURS || 168)) * 60 * 60 * 1000
  };
}

// Hash both sides first so timingSafeEqual never sees different lengths.
function safeEqual(left, right) {
  const a = createHash('sha256').update(String(left)).digest();
  const b = createHash('sha256').update(String(right)).digest();
  return timingSafeEqual(a, b);
}

// Returns the normalized email on success, otherwise ''.
export function checkStudioCredentials(config, email, password) {
  const normalized = normalizeEmail(email);
  const expected = config.users.get(normalized);
  // Compare against a dummy for unknown emails so both paths cost the same.
  const passwordOk = safeEqual(String(password || ''), expected ?? `missing:${normalized}`);
  return expected !== undefined && passwordOk ? normalized : '';
}

// Each user's tokens are keyed by their own password, so changing or removing one user
// signs out only that user.
function signature(config, email, payload) {
  const key = `${config.secret}:${email}:${config.users.get(email)}`;
  return createHmac('sha256', key).update(payload).digest('base64url');
}

export function signStudioToken(config, email, now = Date.now()) {
  const expiresAt = now + config.ttlMs;
  const payload = Buffer.from(JSON.stringify({ sub: email, exp: expiresAt })).toString('base64url');
  return { token: `${TOKEN_PREFIX}.${payload}.${signature(config, email, payload)}`, expiresAt };
}

export function verifyStudioToken(config, token, now = Date.now()) {
  const [prefix, payload, sig] = String(token || '').split('.');
  if (prefix !== TOKEN_PREFIX || !payload || !sig) return null;
  let data;
  try {
    data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  const email = normalizeEmail(data?.sub);
  if (!config.users.has(email) || !(Number(data.exp) > now)) return null;
  return safeEqual(sig, signature(config, email, payload)) ? { ...data, sub: email } : null;
}

export function bearerFromHeader(value) {
  const match = typeof value === 'string' ? value.match(/^Bearer\s+(.+)$/i) : null;
  return match ? match[1].trim() : '';
}
