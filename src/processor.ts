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

      let rendered: string;

      // Special handling for src/App.tsx - use simple string replacement
      // to avoid Handlebars parsing JSX syntax
      if (file === 'src/App.tsx') {
        rendered = content.replace(/\{\{projectName\}\}/g, vars.projectName);
      } else {
        // Compile and render template with Handlebars
        const template = Handlebars.compile(content);
        rendered = template(vars);
      }

      // Write back
      await fs.writeFile(filePath, rendered, 'utf-8');
      console.log(`✓ Processed: ${file}`);
    } catch (error) {
      // File might not exist (e.g., 404.html if no GitHub Pages)
      // That's okay, skip it
      console.log(`✗ Skipped: ${file} (${(error as Error).message})`);
    }
  }
}
