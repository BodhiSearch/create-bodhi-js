# e2e/ — End-to-end verification of the scaffolded app

These tests are the source of truth for "does the template still work?". They scaffold a real
project from `templates/react/` and exercise it the same way CI's `template-e2e` job does — so
**never** lint/typecheck/build `templates/` directly (it's Handlebars source, not valid TS; see
root `CLAUDE.md`).

## This environment is already fully provisioned

`e2e/.env.test` (gitignored, **not** committed) holds every credential the suite needs:

- `DEV_CLIENT_ID` — dev OAuth client (redirect `http://localhost:5173/my-test-app/callback`)
- `BODHIAPP_CLIENT_ID` / `BODHIAPP_CLIENT_SECRET` — Bodhi app client
- `BODHIAPP_USERNAME` / `BODHIAPP_USERID` / `BODHIAPP_PASSWORD` — Keycloak test account
- `BODHIAPP_AUTH_URL` / `BODHIAPP_AUTH_REALM` — auth server
- `OPENAI_API_KEY` — real key; the chat e2e makes real OpenAI calls

The local Bodhi server is self-hosted by the test via `@bodhiapp/app-bindings` (no external server
to start; it binds port 51135/1135 — if a port-in-use assertion fails, kill any local bodhi on
those ports and rerun). Required vars are enforced by `validateEnv()` in `env.ts`.

Because everything is wired up, **after any change just run the suite to confirm no regression** —
no setup needed:

```bash
npm test                                   # full suite (both specs), from repo root
npx vitest run e2e/verify-template.spec.ts # template-processing only — no creds/server needed
```

## What the two specs cover

- **`verify-template.spec.ts`** — scaffolds with `--no-install`; asserts no raw Handlebars leaks,
  that `ci.yml`/`deploy-pages.yml`/`.env.local` are wired to vars/secrets, MCP `addMcpServer` calls
  in `Header.tsx`, and the vite base path. Fast, offline, no credentials.
- **`bootstrap-e2e.spec.ts`** — scaffolds **with** install, runs the scaffolded app's `npm run check`
  (must leave a clean `git diff`), then runs its full Playwright `ci:test:e2e` against the live Bodhi
  server + real OpenAI. Slow (~60s+), needs `.env.test` and downloads Chromium on first run.

## When to extend these tests

**Add or extend a test for any major change — including dependency upgrades** (e.g. bumping
`@bodhiapp/*`). A `tsc -b` / `vite build` failure in the scaffolded app is the canary for SDK
breaking changes (the `@bodhiapp/bodhi-js-react` 0.0.38→0.0.39 bump broke a type predicate in
`src/lib/bodhi-models.ts`, caught by `bootstrap-e2e`'s `npm run check`). If a change adds new
generated behavior (a new template var, workflow file, runtime feature), add an assertion in
`verify-template.spec.ts` (static checks) or a Playwright scenario in the template's `e2e/` (runtime
checks) so the regression can't slip through silently.
