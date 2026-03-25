# {{projectName}}

{{#if githubPages}}
[![CI](https://github.com/{{githubOrg}}/{{projectName}}/actions/workflows/ci.yml/badge.svg)](https://github.com/{{githubOrg}}/{{projectName}}/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deploy](https://github.com/{{githubOrg}}/{{projectName}}/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/{{githubOrg}}/{{projectName}}/actions/workflows/deploy-pages.yml)

🚀 **[Live Demo](https://{{githubOrg}}.github.io/{{projectName}}/)**
{{else}}
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
{{/if}}

A modern, production-ready React + TypeScript application with comprehensive tooling and best practices.

## Features

### Core Stack
- ⚡ **[Vite 7](https://vite.dev/)** - Next generation frontend tooling
- ⚛️ **[React 19](https://react.dev/)** - Latest React with modern patterns
- 📘 **[TypeScript](https://www.typescriptlang.org/)** - Strict mode enabled
- 🎨 **[Tailwind CSS v4](https://tailwindcss.com/)** - Utility-first CSS with Vite plugin
- 🧩 **[shadcn/ui](https://ui.shadcn.com/)** - Re-usable components built with Radix UI
- 🤖 **[bodhi-js-react](https://github.com/BodhiSearch/bodhi-browser)** - Local LLM integration

### Code Quality
- 🔍 **ESLint 9** - Flat config with TypeScript support
- 💅 **Prettier** - Integrated with ESLint for consistent formatting
- 📝 **EditorConfig** - Cross-platform editor consistency
- 🎯 **Strict TypeScript** - Maximum type safety

### Testing
- ✅ **[Vitest](https://vitest.dev/)** - Fast unit testing with React Testing Library
- 🎭 **[Playwright](https://playwright.dev/)** - End-to-end testing with Chromium

{{#if githubPages}}
### CI/CD
- 🔄 **GitHub Actions** - Automated CI pipeline (lint → build → typecheck → test → e2e)
- 📦 **GitHub Pages** - Automated deployment with SPA routing
- 🤖 **Dependabot** - Automated dependency updates
- 🔐 **Security** - Automated security scanning and policy
{{/if}}

### Developer Experience
- 📋 **Issue/PR Templates** - Structured contribution workflow
- 📖 **Contributing Guide** - Conventional commits documentation
- 🔒 **Security Policy** - Responsible disclosure guidelines
- 📄 **MIT License** - Open source friendly

## Quick Start

### Prerequisites

- **Node.js**: 22.x or later
- **npm**: 10.x or later

### Installation

```bash
# Clone the repository
{{#if githubPages}}
git clone https://github.com/{{githubOrg}}/{{projectName}}.git
cd {{projectName}}
{{else}}
cd {{projectName}}
{{/if}}

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173{{basePath}}` to view the app.

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:
- `VITE_BODHI_APP_CLIENT_ID` - Your Bodhi OAuth client ID
- `VITE_BODHI_AUTH_SERVER_URL` - Bodhi auth server URL (default: https://id.getbodhi.app/realms/bodhi)

## Available Scripts

### Development
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

### Code Quality
- `npm run lint` - Check code with ESLint + Prettier
- `npm run lint:fix` - Auto-fix ESLint + Prettier issues
- `npm run typecheck` - TypeScript type checking
- `npm run check` - Run lint + typecheck
- `npm run check:fix` - Fix lint issues + typecheck

### Testing
- `npm test` - Run unit tests (Vitest)
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run test:e2e` - Run E2E tests (Playwright, headed mode)
- `npm run test:e2e:ui` - Interactive Playwright UI
- `npm run test:all` - Run all tests (unit + e2e)

## Project Structure

```
{{projectName}}/
├── .github/             # GitHub templates and workflows
│   ├── workflows/       # CI/CD pipelines
│   ├── ISSUE_TEMPLATE/  # Issue templates
│   └── ...
├── e2e/                 # Playwright E2E tests
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   └── ui/          # shadcn/ui components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions
│   ├── test/            # Test setup
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   ├── env.ts           # Environment variable validation
│   └── index.css        # Global styles
├── .editorconfig        # Editor configuration
├── .prettierrc          # Prettier configuration
├── components.json      # shadcn/ui configuration
├── eslint.config.js     # ESLint configuration
├── playwright.config.ts # Playwright configuration
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite configuration
└── package.json         # Dependencies and scripts
```

## Configuration

### shadcn/ui

Add new components:

```bash
npx shadcn@latest add <component-name>
```

Example:
```bash
npx shadcn@latest add dialog
```

### Tailwind CSS

Configuration is done via CSS variables in `src/index.css`. Uses Tailwind v4 with:
- OKLCH color system
- `tw-animate-css` for animations
- Dark mode support (via `next-themes`)

{{#if githubPages}}
### Enable GitHub Pages

**Via UI:**
1. Go to Repo → Settings → Pages
2. Under "Build and deployment", select Source: **GitHub Actions**

**Via CLI:**
```bash
gh api -X POST "/repos/{{githubOrg}}/{{projectName}}/pages" -f build_type=workflow
```

### GitHub Pages Deployment

Deployment is automated via GitHub Actions on push to `main`. To deploy manually:

```bash
# Trigger deploy workflow
gh workflow run deploy-pages.yml
```

The app is deployed to: `https://{{githubOrg}}.github.io/{{projectName}}/`
{{/if}}

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Credits

Generated with [create-bodhi-js](https://github.com/BodhiSearch/create-bodhi-js)
