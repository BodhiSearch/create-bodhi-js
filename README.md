# create-bodhi-js

Scaffold Bodhi-powered applications with React, TypeScript, Vite, Tailwind CSS, shadcn/ui, and comprehensive tooling.

## Usage

```bash
# Interactive mode
npm create bodhi-js@latest

# With project name
npm create bodhi-js@latest my-app

# With options
npm create bodhi-js@latest my-app -- --template react --github-pages
```

## Features

**Core Stack**:
- ⚡ [Vite 7](https://vite.dev/) - Next generation frontend tooling
- ⚛️ [React 19](https://react.dev/) - Latest React with modern patterns
- 📘 [TypeScript](https://www.typescriptlang.org/) - Strict mode enabled
- 🎨 [Tailwind CSS v4](https://tailwindcss.com/) - Utility-first CSS
- 🧩 [shadcn/ui](https://ui.shadcn.com/) - Re-usable components
- 🤖 [bodhi-js-react](https://github.com/BodhiSearch/bodhi-browser) - Local LLM integration

**Code Quality**:
- 🔍 ESLint 9 + Prettier
- 📝 EditorConfig
- 🎯 Strict TypeScript

**Testing**:
- ✅ [Vitest](https://vitest.dev/) - Unit testing
- 🎭 [Playwright](https://playwright.dev/) - E2E testing

**CI/CD** (optional):
- 🔄 GitHub Actions
- 📦 GitHub Pages deployment
- 🤖 Dependabot

## Options

```
Usage: create-bodhi-js [project-name] [options]

Arguments:
  project-name              Name of the project

Options:
  -V, --version             output the version number
  -t, --template <name>     Template to use (react, svelte, vue) (default: "react")
  --no-install              Skip dependency installation
  --no-git                  Skip git initialization
  --github-pages            Enable GitHub Pages deployment setup
  -h, --help                display help for command
```

## Templates

### Available Templates

- **react** - React + TypeScript + Vite + Tailwind + shadcn/ui + bodhi-js-react (default)

### Custom Templates

Use any Git repository as a template:

```bash
npm create bodhi-js@latest my-app -- --template gh:username/my-template
```

Supported Git providers (via [giget](https://github.com/unjs/giget)):
- GitHub: `gh:user/repo`
- GitLab: `gitlab:user/repo`
- BitBucket: `bitbucket:user/repo`

## What's Included?

When you scaffold a project with `create-bodhi-js`, you get:

```
my-app/
├── .github/              # GitHub templates and workflows
│   ├── workflows/        # CI/CD pipelines
│   ├── ISSUE_TEMPLATE/   # Issue templates
│   └── ...
├── e2e/                  # Playwright E2E tests
├── public/               # Static assets
├── src/
│   ├── components/       # React components
│   │   └── ui/           # shadcn/ui components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   ├── test/             # Test setup
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   ├── env.ts            # Environment variable validation
│   └── index.css         # Global styles
├── .editorconfig         # Editor configuration
├── .prettierrc           # Prettier configuration
├── components.json       # shadcn/ui configuration
├── eslint.config.js      # ESLint configuration
├── playwright.config.ts  # Playwright configuration
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
└── package.json          # Dependencies and scripts
```

## Post-Installation

After scaffolding your project:

1. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your Bodhi OAuth credentials
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Run tests**:
   ```bash
   npm test           # Unit tests
   npm run test:e2e   # E2E tests
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Related

- [bodhi-browser](https://github.com/BodhiSearch/bodhi-browser) - Bodhi Browser Extension
- [template-bodhi-react-vite](https://github.com/BodhiSearch/template-bodhi-react-vite) - React template source
