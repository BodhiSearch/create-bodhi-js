# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CLI scaffolding tool for generating Bodhi-powered applications with React, TypeScript, Vite, Tailwind CSS, and shadcn/ui. Published to npm as `create-bodhi-js`.

## Build & Development

```bash
# Development (run CLI locally)
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint              # Fails on any warnings (--max-warnings 0)
npm run lint:fix          # Auto-fix issues

# Combined checks
npm run check             # Lint + typecheck
npm run check:fix         # Lint:fix + typecheck

# Testing (placeholder - tests coming soon)
npm test
```

**Testing the CLI locally (uses local template):**
```bash
npm run dev -- my-test-app --template ./templates/react
# Or with options:
npm run dev -- my-test-app --template ./templates/react --github-pages --github-org myorg
```

## Architecture

### Module Responsibilities

**5 core modules with clear separation of concerns:**

1. **index.ts** (20 LOC): CLI entry point
   - Commander setup and option parsing
   - Delegates to `create()` from cli.ts

2. **cli.ts** (134 LOC): User interaction layer
   - @clack/prompts for terminal UI
   - Project name validation (lowercase, numbers, hyphens only)
   - Interactive prompts for GitHub Pages and org
   - Next steps guidance output

3. **templates.ts** (28 LOC): Template resolution
   - Maps built-in templates (currently only `react`)
   - Resolves custom templates via git providers (gh:, gitlab:, bitbucket:)
   - Uses giget for multi-provider support

4. **scaffold.ts** (129 LOC): Project setup orchestration
   - Downloads template via giget
   - Flattens template subdirectories
   - Renames dotfiles (_gitignore → .gitignore)
   - Processes Handlebars templates (via processor.ts)
   - Conditionally removes GitHub Pages files
   - Removes template meta files (template.json, test-template.sh, TECH.md)
   - Initializes git and runs npm install

5. **processor.ts** (45 LOC): Template variable substitution
   - Handlebars compilation for specific files (see TEMPLATE_FILES)
   - Variables: projectName, githubOrg, githubPages, basePath, pathSegmentsToKeep
   - Gracefully skips missing files

### Template Processing

**TEMPLATE_FILES whitelist** (processor.ts:13-24):
Only these files get Handlebars processing:
- package.json
- vite.config.ts
- index.html
- public/404.html
- README.md
- playwright.config.ts
- CONTRIBUTING.md
- src/App.tsx
- .github/SECURITY.md
- .github/ISSUE_TEMPLATE/config.yml

When adding new template variables, update both:
1. `TemplateVars` interface in processor.ts
2. The variables passed in scaffold.ts

### Template Repository

The React template source lives in `templates/react/` in this monorepo. The external repo (https://github.com/BodhiSearch/template-bodhi-react-vite) is a force-push mirror synced automatically during release via the `sync-template` job in publish.yml.

When published to npm, the CLI still fetches from the external GitHub repo via giget at runtime. For local development and E2E tests, use `--template ./templates/react`.

### ⚠️ Never lint/typecheck/build `templates/` directly

The files under `templates/react/template/` are **Handlebars source, not valid TypeScript/JS**. They contain unprocessed placeholders such as `clientConfig=\{{`, `{{{mcpBuilderCalls}}}`, and `{{#if}}` blocks. Running `tsc`, `vite build`, or `eslint` against `templates/react/template/` **will fail with syntax errors** (e.g. `TS1127: Invalid character`) — this is expected and is **not** a regression.

To verify a template change (e.g. after bumping `@bodhiapp/*` deps), scaffold a real project and run checks on the **generated** app — this is exactly what CI's `template-e2e` job in `.github/workflows/ci.yml` does:

```bash
# 1. Build the CLI, then scaffold a throwaway app from the local template
npm run build
node dist/index.js test-app \
  --template ./templates/react \
  --ci --no-install --no-git --no-github-pages \
  --mcp-servers "https://mcp.exa.ai/mcp" \
  --dev-client-id "$VITE_BODHI_APP_CLIENT_ID"

# 2. Install deps in a SEPARATE step (inline --install breaks Playwright via nested symlinks)
cd test-app && npm install

# 3. Run checks against the generated app (NOT against templates/)
npm run lint && npm run typecheck && npm run build && npm test
npm run ci:test:e2e   # requires e2e/.env.test with BODHIAPP_* creds + a running Bodhi server
```

Note on the lockfile: `templates/react/template/package-lock.json` and `node_modules/` are **gitignored** — they are NOT committed and NOT shipped. The template ships only `package.json`; each scaffolded app generates its own lockfile on `npm install`. So when bumping deps you only edit `package.json` — there is no lockfile to commit. To sanity-check that the new versions actually resolve before relying on a full scaffold, you can temporarily copy `_npmrc` → `.npmrc` (it sets `include=optional` so all platform-specific `@bodhiapp/app-bindings-*` binaries resolve, not just the host's), run `npm install` inside `templates/react/template/`, then delete the temporary `.npmrc` — but the real verification is the scaffold-and-check flow above.

## Release Process

**Automated via GitHub Actions** (.github/workflows/publish.yml):

Triggered by git tag push (v*):
```bash
git tag v0.6.0
git push origin v0.6.0
```

Workflow:
1. Extracts version from tag (v1.2.3 → 1.2.3)
2. Runs lint → typecheck → build → test
3. Publishes to npm (OIDC auth)
4. Creates GitHub release
5. Verifies on npm
6. Auto-bumps to next minor -dev (1.2.3 → 1.3.0-dev)
7. Syncs `templates/react/` to external template repo (force-push mirror)

## Code Patterns

### ESM-only
- All code is ESM (no CommonJS)
- tsconfig: `"module": "ESNext"`, `"moduleResolution": "bundler"`
- package.json: `"type": "module"`

### Error Handling
- User-facing errors use picocolors for formatting
- Spinner cancels on failure with error message
- Graceful fallbacks (e.g., missing template files)

### Project Name Validation
Pattern: `/^[a-z0-9-]+$/` (lowercase, numbers, hyphens only)

### Git Provider Support
Via giget - supports: gh:, gitlab:, bitbucket: prefixes for custom templates

## Adding New Templates

1. Create template directory at `templates/<name>/` with:
   - template.json (metadata)
   - template/ subdirectory with project files
   - Handlebars variables in files listed in TEMPLATE_FILES
   - _gitignore (will be renamed to .gitignore)

2. Add entry to `TEMPLATES` object in templates.ts:
   ```typescript
   svelte: 'gh:BodhiSearch/template-bodhi-svelte-vite',
   ```

3. Test locally:
   ```bash
   npm run dev -- test-project --template ./templates/svelte
   ```

## Dependencies

**Core (5):**
- @clack/prompts: Terminal UI
- commander: CLI parsing
- giget: Git repo cloning
- handlebars: Template compilation
- picocolors: Terminal colors

**Dev (10):**
- tsup: Build tool
- tsx: Dev runner
- typescript-eslint: Linting
- prettier: Formatting

## Notes

- Tests coming soon (placeholder implementation)
- Only React template currently available (Svelte/Vue infrastructure ready)
- Strict TypeScript with ES2022 target
- Prettier: 100 char width, single quotes, trailing comma es5
- Node.js ≥18.0.0 required
