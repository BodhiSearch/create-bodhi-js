# CI Pending Setup

Steps required to get a green CI run on a freshly bootstrapped repo. Move these into the template's setup script / README once stabilized.

## 1. Populate env files locally

Copy the example files and fill in real values:

```bash
cp .env.example .env.local
cp e2e/.env.test.example e2e/.env.test
```

`.env.local` covers app runtime config (the `VITE_*` keys consumed by Vite).
`e2e/.env.test` covers Playwright global-setup (Bodhi server credentials + OpenAI key).

## 2. Push values to GitHub

The CI workflow (`.github/workflows/ci.yml`) reads non-secret config from `vars.*` and secret config from `secrets.*`. Split the env keys accordingly.

### Variables (non-secret — `gh variable set`)

From `.env.local`:

```bash
gh variable set VITE_BODHI_APP_CLIENT_ID   --body "$VITE_BODHI_APP_CLIENT_ID"
gh variable set VITE_BODHI_AUTH_SERVER_URL --body "$VITE_BODHI_AUTH_SERVER_URL"
```

From `e2e/.env.test`:

```bash
gh variable set BODHIAPP_CLIENT_ID   --body "$BODHIAPP_CLIENT_ID"
gh variable set BODHIAPP_USERNAME    --body "$BODHIAPP_USERNAME"
gh variable set BODHIAPP_USERID      --body "$BODHIAPP_USERID"
gh variable set BODHIAPP_AUTH_URL    --body "$BODHIAPP_AUTH_URL"
gh variable set BODHIAPP_AUTH_REALM  --body "$BODHIAPP_AUTH_REALM"
```

### Secrets (`gh secret set`)

From `e2e/.env.test`:

```bash
gh secret set BODHIAPP_CLIENT_SECRET --body "$BODHIAPP_CLIENT_SECRET"
gh secret set BODHIAPP_PASSWORD      --body "$BODHIAPP_PASSWORD"
gh secret set OPENAI_API_KEY         --body "$OPENAI_API_KEY"
```

### Dependabot scope (only if Dependabot is enabled)

Dependabot PRs run in a separate security context and **cannot read regular Actions secrets** — they only see secrets under the `dependabot` scope. Variables are shared across scopes, so only secrets need duplicating:

```bash
gh secret set BODHIAPP_CLIENT_SECRET --app dependabot --body "$BODHIAPP_CLIENT_SECRET"
gh secret set BODHIAPP_PASSWORD      --app dependabot --body "$BODHIAPP_PASSWORD"
gh secret set OPENAI_API_KEY         --app dependabot --body "$OPENAI_API_KEY"
```

Symptom if this step is skipped: dependabot PRs fail E2E with `Missing required environment variables in e2e/.env.test: BODHIAPP_CLIENT_SECRET, BODHIAPP_PASSWORD, OPENAI_API_KEY`.

## 3. Verify

```bash
gh variable list
gh secret list
gh secret list --app dependabot
```

Then trigger CI (push a commit or `gh workflow run ci.yml`) and confirm the job is green.
