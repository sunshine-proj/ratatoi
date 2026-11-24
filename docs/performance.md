# Performance

Lighthouse (latest), mobile preset (simulated slow 4G, mid-range phone), production build served locally, three runs per page. Measured 2026-11-24.

| Page | Performance | Accessibility | Best practices | SEO | LCP (runs) | CLS |
|---|---|---|---|---|---|---|
| `/` Today | 88–93 | 100 | 100 | 100 | 3.3–3.9 s | 0 |
| `/recipes` | 90–100 | 100 | 100 | 100 | 0.9–3.6 s | 0 |
| `/recipes/[slug]` | 92–100 | 100 | 100 | 100 | 0.8–3.4 s | 0 |
| `/planner` | 92 | 100 | 100 | 100 | 3.4 s | 0 |
| `/shopping-list` | 91 | 100 | 100 | 100 | 3.5 s | 0 |
| `/privacy` | 100 | 100 | 100 | 100 | 0.8 s | 0 |

Total blocking time is 30–80 ms everywhere.

## What changed in Phase 8

- **CLS 0.118 → 0:** the new footer was being pushed down as browser-rendered content loaded. Page content now reserves at least one screen, so nothing visible moves.
- **Fonts:** removed an unused monospace font (5 → 2 preloaded files); the heading font is no longer preloaded; fonts use `display: optional`, so text never re-renders late.
- **Images:** none yet. Recipe images go through `next/image` (responsive sizes, `fill` with a fixed 4:3 frame), so adding photos won't cause layout shift.

## Why LCP varies between runs

Lighthouse's simulation estimates LCP as the time to finish every request started before the largest element painted. On a fast local server the JavaScript is sometimes requested before that paint and sometimes after, so the same page scores either ~0.8 s or ~3.4 s. On Today, Plan, and Shopping, the main content genuinely needs JavaScript, because it comes from data saved in the browser.

JavaScript per page is about **190 KB gzipped** for the framework and app shell, plus about **50 KB** on interactive pages (Zod for validating saved data, and recipe data).

## Follow-ups

- Switch client-side validation to `zod/mini` to cut the Zod chunk.
- Split UI strings per area, so pages load only the text they use.
- Measure on real devices after deployment (field data, not only lab runs).
