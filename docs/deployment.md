# Deployment

The app has **not been deployed yet**. This guide is what to check when it is.

## Requirements

- **HTTPS.** Required for installation and the service worker. HSTS is already sent.
- **Node.js 24 or newer**, running `npm ci && npm run build && npm run start`, or a platform with native Next.js 16 support.
- **No environment variables** are needed. There is no backend, database, or analytics.
- `proxy.ts` (unknown recipe → real 404) runs in Next.js's Node.js proxy runtime; the host must support Next.js proxy/middleware.

## Options

1. **A managed Next.js host** (e.g. Vercel, or another platform with Next.js 16 support, ideally in an EU region): connect the repository, use the default build command, and set the production domain. Static pages and assets are cached at the edge automatically.
2. **Self-hosted Node.js** behind a reverse proxy that terminates TLS (e.g. Caddy or nginx with Let's Encrypt): run `npm run start` (port 3000 by default) with a process manager, and let the proxy serve HTTPS. Keep `/sw.js` uncached (the app already sends `Cache-Control: no-cache` for it).

## Headers (already configured in `next.config.ts`)

`Content-Security-Policy` (production builds only), `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`. `tests/e2e/security.spec.ts` checks them and fails on any CSP violation or third-party request.

## After the first deployment

1. Run `npm run test:e2e` against the build locally, and Lighthouse against the live URL (`docs/performance.md`).
2. Install the app on a real Android phone (Chrome), on iOS (Safari → Share → Add to Home Screen), and on desktop Chrome/Edge. Check that it opens offline after one visit.
3. Run the manual screen-reader checklist in `docs/accessibility.md`.
4. Fill in the operator details in the privacy notice (see `docs/launch-checklist.md`).
5. Confirm the host's server-log retention matches the privacy notice ("standard technical logs… for security and reliability").
