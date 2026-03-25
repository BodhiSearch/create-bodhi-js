import Handlebars from 'handlebars';
import { promises as fs } from 'fs';
import path from 'path';

interface TemplateVars {
  projectName: string;
  githubOrg: string;
  githubPages: boolean;
  basePath: string;
  pathSegmentsToKeep: number;
  devClientId?: string;
  prodClientId?: string;
  mcpServers?: string[];
}

const TEMPLATE_FILES = [
  'package.json',
  'vite.config.ts',
  'index.html',
  'public/404.html',
  'README.md',
  'playwright.config.ts',
  'CONTRIBUTING.md',
  'src/App.tsx',
  'src/components/Header.tsx',
  '.github/SECURITY.md',
  '.github/ISSUE_TEMPLATE/config.yml',
  '.github/workflows/ci.yml',
  '.github/workflows/deploy-pages.yml',
];

export async function processTemplates(targetDir: string, vars: TemplateVars) {
  // Pre-format mcp_servers array literal so it's prettier-clean
  const mcpServers = vars.mcpServers ?? [];
  const mcpServersLiteral =
    mcpServers.length === 0
      ? '[]'
      : '[' + mcpServers.map(url => `{ url: '${url}' }`).join(', ') + ']';

  const templateVars = { ...vars, mcpServersLiteral };

  for (const file of TEMPLATE_FILES) {
    const filePath = path.join(targetDir, file);

    try {
      // Read file
      const content = await fs.readFile(filePath, 'utf-8');

      // Compile and render template
      const template = Handlebars.compile(content);
      const rendered = template(templateVars);

      // Write back
      await fs.writeFile(filePath, rendered, 'utf-8');
    } catch (error) {
      // Only ignore ENOENT (file not found) - e.g., 404.html if no GitHub Pages
      // Fail loudly on other errors (Handlebars compilation, undefined variables, etc.)
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        continue;
      }
      throw new Error(`Failed to process template ${file}: ${error}`);
    }
  }
}
