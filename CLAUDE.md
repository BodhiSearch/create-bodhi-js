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

**Testing the CLI locally:**
```bash
npm run dev -- my-test-app
# Or with options:
npm run dev -- my-test-app --github-pages --github-org myorg
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

The React template source: https://github.com/BodhiSearch/template-bodhi-react-vite

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

1. Add entry to `TEMPLATES` object in templates.ts:
   ```typescript
   svelte: 'gh:BodhiSearch/template-bodhi-svelte-vite',
   ```

2. Create template repository with:
   - template.json (metadata)
   - Handlebars variables in files listed in TEMPLATE_FILES
   - _gitignore (will be renamed to .gitignore)

3. Test locally:
   ```bash
   npm run dev -- test-project --template svelte
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
