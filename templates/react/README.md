# template-bodhi-react-vite

Official Vite + React + TypeScript template for bodhi-js applications.

## Features

This template includes:

- ⚡ **[Vite 7](https://vite.dev/)** - Next generation frontend tooling
- ⚛️ **[React 19](https://react.dev/)** - Latest React with modern patterns
- 📘 **[TypeScript](https://www.typescriptlang.org/)** - Strict mode enabled
- 🎨 **[Tailwind CSS v4](https://tailwindcss.com/)** - Utility-first CSS with Vite plugin
- 🧩 **[shadcn/ui](https://ui.shadcn.com/)** - Re-usable components built with Radix UI
- 🤖 **[bodhi-js-react](https://github.com/BodhiSearch/bodhi-browser)** - Local LLM integration

### Code Quality
- 🔍 **ESLint 9** - Flat config with TypeScript support
- 💅 **Prettier** - Integrated with ESLint
- 📝 **EditorConfig** - Cross-platform consistency
- 🎯 **Strict TypeScript** - Maximum type safety

### Testing
- ✅ **[Vitest](https://vitest.dev/)** - Fast unit testing
- 🎭 **[Playwright](https://playwright.dev/)** - E2E testing

### CI/CD (Optional)
- 🔄 **GitHub Actions** - Automated CI pipeline
- 📦 **GitHub Pages** - Automated deployment
- 🤖 **Dependabot** - Automated dependency updates

## Usage

Use with npx (when published):

```bash
# Coming soon
npx create-bodhi-js@latest my-app
```

Manual usage (for now):

```bash
# Clone this repository
git clone https://github.com/BodhiSearch/template-bodhi-react-vite.git my-app
cd my-app

# Process template manually or wait for create-bodhi-js CLI
```

## Template Structure

```
template/              # Template files with Handlebars variables
├── _gitignore         # Renamed to .gitignore during scaffolding
├── _editorconfig      # Renamed to .editorconfig during scaffolding
├── _prettierrc        # Renamed to .prettierrc during scaffolding
├── _prettierignore    # Renamed to .prettierignore during scaffolding
├── package.json       # Parameterized with {{projectName}}
├── vite.config.ts     # Parameterized with {{basePath}}
├── index.html         # Parameterized with {{projectName}}
├── README.md          # Parameterized template README
└── ...                # Other project files
template.json          # Template metadata and configuration
```

## Template Variables

- `projectName` - Project name (kebab-case)
- `githubOrg` - GitHub organization/username
- `githubPages` - Enable GitHub Pages deployment (boolean)
- `basePath` - Base path for deployment (e.g., `/` or `/project-name/`)
- `pathSegmentsToKeep` - SPA routing segments (0 for custom domain, 1 for GitHub Pages)

## Development

To modify this template:

1. Edit files in `template/` directory
2. Use Handlebars syntax for variables: `{{variableName}}`
3. Use conditional blocks: `{{#if githubPages}}...{{/if}}`
4. Update `template.json` with new variables or configuration
5. Test with `create-bodhi-js` CLI

## License

MIT License - see [LICENSE](../bodhi-browser/demo-chat/LICENSE)
