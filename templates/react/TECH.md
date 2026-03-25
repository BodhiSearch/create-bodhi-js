# Technical Architecture: create-bodhi-js

## Overview

`create-bodhi-js` is a project scaffolding CLI tool for creating Bodhi-powered applications. This document describes the architecture, design decisions, and implementation approach.

## Repository Structure

### CLI Package (Single NPM Package)
- **Repository**: `BodhiSearch/create-bodhi-js`
- **NPM Package**: `create-bodhi-js` (no org scope for easier typing)
- **Purpose**: CLI tool that scaffolds projects from templates

### Template Repositories (Separate Git Repos)
- **React**: `BodhiSearch/template-bodhi-react-vite` - React + Vite + TypeScript + Tailwind + shadcn/ui
- **Svelte** (future): `BodhiSearch/template-bodhi-svelte-vite`
- **Vue** (future): `BodhiSearch/template-bodhi-vue-vite`

## Usage Patterns

### Command Syntax

```bash
# Default template (react)
npm create bodhi-js@latest my-app

# Explicit template
npm create bodhi-js@latest my-app -- --template react

# Future templates
npm create bodhi-js@latest my-app -- --template svelte
npm create bodhi-js@latest my-app -- --template vue

# Custom template from any Git repo
npm create bodhi-js@latest my-app -- --template gh:username/custom-template
```

### NPM Create Pattern

The `npm create` command is an alias for `npm init`, which transforms:
- `npm create <name>` → installs and executes `create-<name>`
- `npm create bodhi-js` → installs and executes `create-bodhi-js`

**References**:
- [npm-init documentation](https://docs.npmjs.com/cli/v11/commands/npm-init/)
- [Building an npm create package](https://www.alexchantastic.com/building-an-npm-create-package)

## CLI Implementation

### Technology Stack

**Core Libraries**:
- **[giget](https://github.com/unjs/giget)** - Template cloning from Git repos (no git dependency, supports multiple providers)
- **[@clack/prompts](https://www.npmjs.com/package/@clack/prompts)** - Modern, beautiful interactive CLI prompts
- **[handlebars](https://handlebarsjs.com/)** - Template variable replacement
- **[commander](https://github.com/tj/commander.js)** - CLI argument parsing

**Why These Choices**:
- **giget over degit**: Modern, maintained, no git dependency, supports auth
- **@clack/prompts over inquirer**: Better UX, async-native, modern design (2025 standard)
- **handlebars**: Logic-less templating, Mustache-compatible, widely adopted

### Template Resolution

```javascript
const TEMPLATES = {
  react: 'gh:BodhiSearch/template-bodhi-react-vite',
  svelte: 'gh:BodhiSearch/template-bodhi-svelte-vite', // future
  vue: 'gh:BodhiSearch/template-bodhi-vue-vite', // future
};

function resolveTemplate(name) {
  // Built-in template
  if (TEMPLATES[name]) {
    return TEMPLATES[name];
  }

  // Custom template (gh:user/repo, gitlab:user/repo, etc.)
  if (name.includes(':')) {
    return name;
  }

  throw new Error(`Unknown template: ${name}`);
}
```

### CLI Flow

```
1. Parse CLI arguments (project name, --template, --no-install, etc.)
   ↓
2. Show interactive prompts (if args missing)
   - Project name
   - GitHub Pages deployment?
   - Initialize git?
   - Install dependencies?
   ↓
3. Download template via giget
   ↓
4. Process Handlebars variables in template files
   - {{projectName}}
   - {{githubOrg}}
   - {{basePath}}
   - {{#if githubPages}}...{{/if}}
   ↓
5. Rename dotfiles (_gitignore → .gitignore)
   ↓
6. Conditional file deletion (e.g., remove deploy-pages.yml if no GitHub Pages)
   ↓
7. Initialize git repo (if selected)
   ↓
8. Install dependencies (if selected)
   ↓
9. Show next steps
```

### Package Structure

```
create-bodhi-js/
├── src/
│   ├── index.ts           # Entry point
│   ├── cli.ts             # Commander CLI setup
│   ├── prompts.ts         # @clack/prompts questions
│   ├── templates.ts       # Template resolution
│   ├── processor.ts       # Handlebars processing
│   ├── files.ts           # File operations (rename, delete)
│   └── utils.ts           # Helper functions
├── package.json
│   ├── name: "create-bodhi-js"
│   ├── bin: { "create-bodhi-js": "./dist/index.js" }
│   └── main: "./dist/index.js"
├── tsconfig.json
├── .github/
│   └── workflows/
│       └── publish.yml    # NPM publish on release
└── README.md
```

## Template Format

### Template Variables

Templates use Handlebars syntax for parameterization:

```handlebars
{
  "name": "{{projectName}}",
  "description": "My awesome app"
}
```

```typescript
// vite.config.ts
export default defineConfig({
  base: '{{basePath}}',
});
```

### Conditional Blocks

```handlebars
{{#if githubPages}}
<script>
  // GitHub Pages SPA routing script
</script>
{{/if}}
```

### Template Metadata (template.json)

```json
{
  "name": "bodhi-react-vite",
  "description": "React + TypeScript + Vite template",
  "variables": {
    "projectName": {
      "description": "Project name (kebab-case)",
      "required": true,
      "default": "my-app"
    },
    "githubPages": {
      "type": "boolean",
      "default": false
    }
  },
  "files": {
    "rename": {
      "_gitignore": ".gitignore"
    },
    "template": [
      "package.json",
      "vite.config.ts"
    ],
    "conditionalDelete": {
      "githubPages": {
        "false": [".github/workflows/deploy-pages.yml"]
      }
    }
  }
}
```

## Why Separate Template Repositories?

### Advantages ✅

1. **Independent Versioning**: Each template can be versioned separately
2. **Smaller CLI Package**: No bundled template files in npm package
3. **Community Templates**: Users can create and share custom templates
4. **Template Updates**: Update templates without republishing CLI
5. **Clear Separation**: Template development independent of CLI development
6. **Git-based**: Leverage Git for versioning, branches, tags

### Disadvantages ❌

1. **More Repositories**: Multiple repos to maintain
2. **Network Dependency**: Requires network access to clone templates

### Alternative Considered: Monorepo

```
template-bodhi-vite/
├── templates/
│   ├── react/
│   ├── svelte/
│   └── vue/
```

**Rejected because**:
- Harder to version independently
- Larger clones (download all templates even if using one)
- Less flexible for community contributions

## Publishing & CI/CD

### NPM Publishing

**Package Name**: `create-bodhi-js` (no `@bodhiapp/` org)

**Workflow Triggers**:
- Manual dispatch
- Git tag (e.g., `v1.0.0`)
- GitHub Release

**GitHub Workflow**:
```yaml
name: Publish to NPM
on:
  release:
    types: [created]
  workflow_dispatch:

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: '22'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm test
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Version Management

- Use semantic versioning (semver)
- CLI versions independent of template versions
- Templates use Git tags/branches for versioning

## Future Enhancements

### Multiple Framework Support

1. **Svelte Template** (`template-bodhi-svelte-vite`)
   - Svelte + Vite + TypeScript
   - `@bodhiapp/bodhi-js-svelte` wrapper (to be created)

2. **Vue Template** (`template-bodhi-vue-vite`)
   - Vue 3 + Vite + TypeScript
   - `@bodhiapp/bodhi-js-vue` wrapper (to be created)

### Advanced Features

- **Template Variants**: `--template react-minimal`, `--template react-full`
- **Template Registry**: JSON file mapping template names to URLs
- **Template Validation**: Schema validation for template.json
- **Template Caching**: Local cache for faster repeated usage
- **Template Listing**: `npm create bodhi-js -- --list-templates`
- **Dry Run**: `npm create bodhi-js my-app -- --dry-run`

### Custom Template Support

Users can use any Git template:

```bash
# GitHub
npm create bodhi-js my-app -- --template gh:user/repo

# GitLab
npm create bodhi-js my-app -- --template gitlab:user/repo

# BitBucket
npm create bodhi-js my-app -- --template bitbucket:user/repo
```

## Testing Strategy

### Unit Tests
- Template resolution logic
- Handlebars variable replacement
- File operations (rename, delete)

### Integration Tests
- Full CLI flow from start to finish
- Template cloning and processing
- Generated project validation

### E2E Tests
- Scaffold project → install → build → test
- Verify generated project is functional

## References

- [create-vite source](https://github.com/vitejs/vite/tree/main/packages/create-vite)
- [giget documentation](https://github.com/unjs/giget)
- [@clack/prompts guide](https://www.npmjs.com/package/@clack/prompts)
- [npm create specification](https://docs.npmjs.com/cli/v11/commands/npm-init/)
- [Handlebars documentation](https://handlebarsjs.com/)

## License

MIT License - see [LICENSE](LICENSE) for details.
