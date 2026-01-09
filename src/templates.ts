import { existsSync } from 'fs';
import { resolve } from 'path';

const TEMPLATES: Record<string, string> = {
  react: 'gh:BodhiSearch/template-bodhi-react-vite',
  // Future templates
  // svelte: 'gh:BodhiSearch/template-bodhi-svelte-vite',
  // vue: 'gh:BodhiSearch/template-bodhi-vue-vite',
};

function isLocalPath(name: string): boolean {
  return name.startsWith('/') || name.startsWith('./') || name.startsWith('../');
}

export function resolveTemplate(name: string): string {
  // Built-in template
  if (TEMPLATES[name]) {
    return TEMPLATES[name];
  }

  // Custom template (gh:user/repo, gitlab:user/repo, etc.)
  if (name.includes(':')) {
    return name;
  }

  // Local filesystem path
  if (isLocalPath(name)) {
    const absolutePath = name.startsWith('/') ? name : resolve(process.cwd(), name);
    if (!existsSync(absolutePath)) {
      throw new Error(`Template path does not exist: ${absolutePath}`);
    }
    return absolutePath;
  }

  throw new Error(
    `Unknown template: ${name}\n\nAvailable templates:\n${Object.keys(TEMPLATES)
      .map(t => `  - ${t}`)
      .join(
        '\n'
      )}\n\nOr use a custom template: gh:user/repo\nOr use a local path: /path/to/template`
  );
}

export function listTemplates(): string[] {
  return Object.keys(TEMPLATES);
}
