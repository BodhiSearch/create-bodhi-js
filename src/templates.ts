const TEMPLATES: Record<string, string> = {
  react: 'gh:BodhiSearch/template-bodhi-react-vite',
  // Future templates
  // svelte: 'gh:BodhiSearch/template-bodhi-svelte-vite',
  // vue: 'gh:BodhiSearch/template-bodhi-vue-vite',
};

export function resolveTemplate(name: string): string {
  // Built-in template
  if (TEMPLATES[name]) {
    return TEMPLATES[name];
  }

  // Custom template (gh:user/repo, gitlab:user/repo, etc.)
  if (name.includes(':')) {
    return name;
  }

  throw new Error(
    `Unknown template: ${name}\n\nAvailable templates:\n${Object.keys(TEMPLATES)
      .map(t => `  - ${t}`)
      .join('\n')}\n\nOr use a custom template: gh:user/repo`
  );
}

export function listTemplates(): string[] {
  return Object.keys(TEMPLATES);
}
