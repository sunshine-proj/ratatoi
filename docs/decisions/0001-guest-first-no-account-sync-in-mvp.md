# 0001 — Guest-first, local-only data in the MVP; account sync in V1

- **Status:** Accepted (Phase 7, 2026-11-24)
- **Context:** `PRD.md` §15 defaults to "guest-first with optional account sync". `AGENTS.md` says not to assume Supabase or any backend is configured until credentials and a schema exist. Neither exists for this project yet.

## Decision

The MVP stores everything in the browser and has no accounts:

- Three schema-validated, versioned `localStorage` documents: settings, plan, shopping list (`lib/storage/local-document.ts`).
- No server, no sign-in, no sync. Offline edits are simply local edits; there is nothing to queue or retry.
- Optional account sync (Supabase: auth, Postgres with row-level security, additive migrations) moves to **V1**.

## Why

- **Honesty:** shipping an unconfigured integration would mean code that can't be tested end to end, and UI that implies a feature that doesn't work.
- **Privacy and GDPR:** with no server, no personal data leaves the device. Data minimisation is trivially met for the MVP.
- **Offline:** local-first data makes the planner and shopping list work fully offline today, with no conflict handling needed.

## Consequences

- Data lives in one browser on one device. Clearing site data, or using another browser, starts fresh. The UI says this where data is saved ("Saved in this browser on this device only").
- Shared devices: anyone using the same browser profile can see the data. **Settings → Account** shows what is stored and can delete everything.
- When sync is added in V1, it needs: auth (no service-role keys in the browser), RLS on every table, a mapping from the local documents (which already carry `version` and stable ids), a sync queue with retry and backoff, and explicit conflict handling across devices (`PRD.md` §6.6 P1). The migration path in `local-document.ts` lets local data change shape safely before then.
