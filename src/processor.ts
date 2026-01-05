import Handlebars from 'handlebars';
import { promises as fs } from 'fs';
import path from 'path';

interface TemplateVars {
  projectName: string;
  githubOrg: string;
  githubPages: boolean;
  basePath: string;
  pathSegmentsToKeep: number;
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
  '.github/SECURITY.md',
  '.github/ISSUE_TEMPLATE/config.yml',
];

export async function processTemplates(targetDir: string, vars: TemplateVars) {
  for (const file of TEMPLATE_FILES) {
    const filePath = path.join(targetDir, file);

    try {
      // Read file
      const content = await fs.readFile(filePath, 'utf-8');

      // Compile and render template
      const template = Handlebars.compile(content);
      const rendered = template(vars);

      // Write back
      await fs.writeFile(filePath, rendered, 'utf-8');
    } catch {
      // File might not exist (e.g., 404.html if no GitHub Pages)
      // That's okay, skip it
    }
  }
}
