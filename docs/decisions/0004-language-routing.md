# 0004 — Languages in the URL, English unprefixed

- **Status:** Accepted (V1, 2026-11-25)
- **Context:** The app adds Latvian, Lithuanian, and Estonian. Pages are prerendered (Cache Components), work offline through a service worker, and are installable. There's no account, so the language can't come from a profile.

## Decision

- **Each language has its own addresses:** `/lv/…`, `/lt/…`, `/et/…`. English keeps the existing unprefixed addresses. Internally, all routes live under `app/[locale]`, and `proxy.ts` rewrites unprefixed requests to `/en/…`. `/en/…` itself redirects to the unprefixed address.
- **Pages are prerendered for every language.** Server Components read the locale with `next/root-params`; Client Components get it, with that language's messages only, from a provider in the root layout.
- **Opening an unprefixed address goes to your language:** the one you picked (a functional `pp-locale` cookie), or otherwise the browser's `Accept-Language`. Only real page loads are redirected (`Sec-Fetch-Mode: navigate`), never fetches, router requests, or the service worker's own requests. The redirect sends `Vary: Cookie, Accept-Language`.
- **Unknown addresses are real 404s** in their language: the proxy rewrites any path that matches no page to a static `/[locale]/missing` route, so the not-found page is prerendered with the app shell and a 404 status.
- **One manifest per language** (`/lt/manifest.webmanifest`, start URL `/lt`), so an installed app opens in the language it was installed from.
- **The service worker precaches the current language** (`/sw.js?locale=lt`). Choosing a language registers it again for that language.

## Why

- Prefixes keep every page static, shareable, and cacheable, offline included: a page's language never depends on anything but its URL.
- English URLs, bookmarks, and installed apps from before keep working.
- A cookie is the only way the bare address can open in a chosen language before any page loads. It holds just the language code, is set only when someone chooses a language, and is a functional cookie the person asked for. The privacy notice explains it, and "Delete everything" removes it.

## Consequences

- `usePathname()` reports `/en/…` on English pages. Use `splitLocale()` to get the locale-free path, or `window.location` for the address people see.
- Internal links must keep the prefix: use `components/ui/link.tsx` and `localePath()`.
- The proxy runs on every page request; it must stay fast and dependency-free.
- The privacy notice no longer says "no cookies"; it says "no tracking cookies" and describes the language cookie.
