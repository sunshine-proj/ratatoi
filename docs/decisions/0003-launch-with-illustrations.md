# 0003 — Launch with illustrations, add photos later

- **Status:** Accepted (2026-11-24, product owner)
- **Context:** `AGENTS.md` says food should look appealing and recipes need prominent photos, but only licensed, owned, or permitted images may be used. No photography has been commissioned or licensed, and scraping images isn't allowed.

## Decision

Launch with the designed recipe illustrations that are already in the app, and add licensed photos after launch. Missing photos no longer block a public launch.

## Why

- Illustrations are owned by the project, so there's no licensing risk.
- They fill the same 4:3 frame a photo will use, so adding photos later causes no layout change.
- Using unlicensed or stock-scraped photos to meet a launch date would break the content rules.

## Consequences

- Copy must not promise photos. The recipes intro no longer says "photo-led", and every recipe page says "There's no photo of this recipe yet; the picture is an illustration."
- The schema already requires `alt`, `attribution`, and `licence` for any photo, and the recipe page shows them. Adding a photo is a data change only (`data/recipes/index.ts` plus the file in `public/images/`).
- Photography stays on the roadmap as post-launch work.
