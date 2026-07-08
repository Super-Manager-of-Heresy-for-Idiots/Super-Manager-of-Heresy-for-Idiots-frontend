# E2E (Playwright) — tactical battle happy path

Scaffold for MAP_PLAN §1.10. This is the **skeleton** the Phase 2 scenarios grow from. It is
intentionally isolated from the app build (`tsc -b`) and the unit run (`npm run test`), and it is
**not wired up yet** — the one spec is `test.skip` until the items below are filled in.

## One-time setup (needs the local dev stack)

```bash
npm i -D @playwright/test
npx playwright install chromium
```

Add the script to `package.json` (kept out of the committed file to avoid lockfile drift):

```json
"test:e2e": "playwright test"
```

## Run

Bring up the full stack (core backend + map-service + frontend), then:

```bash
E2E_BASE_URL=http://localhost:5173 E2E_CAMPAIGN_ID=<seeded-campaign> npm run test:e2e
```

## What still needs filling in

1. **Auth** — add a Playwright global-setup that logs in a GM and saves `storageState`, then
   reference it in `playwright.config.ts` (`use.storageState`). The app uses JWT via the auth store.
2. **Seed data** — a campaign with at least one player character and one monster to add, plus a map
   definition to attach. Capture its id in `E2E_CAMPAIGN_ID`.
3. **Stable selectors** — the spec's steps are TODOs; add `data-testid`s (or rely on roles/labels)
   on the command bar actions, roster rows, AttackForm controls, log entries and the fog/HP tools so
   the steps don't couple to styling.

Once wired, remove the `test.skip` in `tactical-battle.happy-path.spec.ts`.
