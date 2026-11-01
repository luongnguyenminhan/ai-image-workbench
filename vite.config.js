import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { bearerFromHeader, studioAuthConfig, verifyStudioToken } from './scripts/studio-auth.mjs';

export default defineConfig(({ mode }) => {
  // Empty prefix loads server-only vars (API key, login) for this Node process; only VITE_* reach the bundle.
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  const passwordAuth = studioAuthConfig(env);

  const devProxyTarget = env.VITE_DEV_AI_GATEWAY_PROXY_TARGET
    || env.VITE_DEV_SUB2API_PROXY_TARGET
    || env.AI_GATEWAY_UPSTREAM
    || env.AI_GATEWAY_BASE_URL
    || env.SUB2API_BASE_URL
    || '';
  const studioHistoryProxyTarget = env.VITE_STUDIO_HISTORY_PROXY_TARGET || env.STUDIO_HISTORY_BASE_URL || 'http://127.0.0.1:8787';

  // Same contract as nginx in Docker: check the studio login token, then swap in the server-held key.
  const gatewayBypass = passwordAuth?.apiKey
    ? (req, res) => {
      if (!verifyStudioToken(passwordAuth, bearerFromHeader(req.headers.authorization))) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: 'STUDIO_LOGIN_REQUIRED' } }));
        return req.url;
      }
      req.headers.authorization = `Bearer ${passwordAuth.apiKey}`;
      return undefined;
    }
    : undefined;

  const gatewayProxy = {
    target: devProxyTarget,
    changeOrigin: true,
    secure: true,
    ...(gatewayBypass ? { bypass: gatewayBypass } : {})
  };

  const devProxy = {
    '/studio-api': {
      target: studioHistoryProxyTarget,
      changeOrigin: true,
      secure: true,
      // Same-origin through the proxy, like nginx's `proxy_set_header Origin ""`; keeps
      // STUDIO_ALLOWED_ORIGINS (set for Docker in .env) from blocking dev POSTs.
      configure: (proxy) => proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'))
    },
    ...(devProxyTarget
      ? {
        '/v1': gatewayProxy,
        '/api': {
          target: devProxyTarget,
          changeOrigin: true,
          secure: true
        },
        '/login': {
          target: devProxyTarget,
          changeOrigin: true,
          secure: true
        }
      }
      : {})
  };

  return {
    base: process.env.STUDIO_BASE_PATH || process.env.VITE_BASE_PATH,
    plugins: [react()],
    publicDir: 'public',
    server: { proxy: devProxy },
    build: {
      outDir: 'dist',
      sourcemap: false,
      assetsDir: 'studio-assets',
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          studio: resolve(__dirname, 'studio.html')
        }
      }
    }
  };
});
