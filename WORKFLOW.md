# Template Development Workflow

## Working with template-bodhi-react-vite

When making changes to the React Vite template:

### 1. Test in my-test-app First
- Make all code changes in `my-test-app/` directory first
- This allows immediate testing in browser (dev server on port 5173)
- Verify UI/functionality before syncing to template

### 2. Run Linter Before Sync
```bash
cd my-test-app
npm run check:fix
```
- Runs lint:fix + typecheck
- Ensures code quality and type correctness
- Linter may auto-format code (TypeScript return types, extracted functions, etc.)

### 3. Review Git Staged Changes
```bash
cd my-test-app
git diff --cached
```
- Check staged changes for guidance on what needs syncing
- Note: Linter formatting changes are cosmetic, sync only substantive changes

### 4. Sync to Template
- Copy substantive changes from `my-test-app/src/` to `template-bodhi-react-vite/template/src/`
- Keep template variables intact (e.g., `{{projectName}}`, `{{githubOrg}}`)
- Files to watch:
  - `src/App.tsx` (basePath uses `{{projectName}}`)
  - `package.json` (name, version use template vars)
  - `vite.config.ts` (base path)
  - `README.md`, `CONTRIBUTING.md` (project references)

### 5. Verify Sync
- Ensure template files have correct Handlebars variables
- Do not sync test-specific files or my-test-app references

## Example Workflow

```bash
# 1. Make changes in my-test-app, test in browser
cd my-test-app
# (edit files, verify in http://localhost:5173/my-test-app/)

# 2. Run linter
npm run check:fix

# 3. Review what changed
git diff --cached

# 4. Sync to template (manual file edits)
# Edit template-bodhi-react-vite/template/src/* files

# 5. Verify template variables intact
grep -r "{{projectName}}" ../template-bodhi-react-vite/template/
```

## Rationale

- **Test-first approach**: Catch UI/functionality issues immediately
- **Linter before sync**: Maintain code quality standards
- **Template variables**: Ensure scaffolding works for all projects
- **Git staging**: Use as checklist for what needs syncing

## Bootstrap Principle

**Keep Vite+Tailwind defaults intact.** Override conflicting styles within components rather than modifying default CSS files. Keep demo/placeholder code contained in single files for easy removal.

- ✓ Override styles in component files (e.g., `fixed inset-0` in Layout.tsx)
- ✗ Modify App.css or index.css to fix conflicts
- ✓ Keep chat demo self-contained in ChatDemo.tsx
- ✗ Scatter demo code across multiple helper files
