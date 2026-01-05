import * as p from '@clack/prompts';
import pc from 'picocolors';
import { scaffold } from './scaffold.js';
import { resolveTemplate } from './templates.js';

export interface CreateOptions {
  template: string;
  install: boolean;
  git: boolean;
  githubPages?: boolean;
}

export async function create(projectName: string | undefined, options: CreateOptions) {
  console.log();
  p.intro(pc.bgCyan(pc.black(' create-bodhi-js ')));

  let targetDir = projectName;
  const template = options.template;

  // Validate project name if provided via CLI argument
  if (targetDir) {
    if (!/^[a-z0-9-]+$/.test(targetDir)) {
      p.log.error('Invalid project name. Use lowercase letters, numbers, and hyphens only (e.g., my-chat-app)');
      process.exit(1);
    }
  }

  // Prompt for project name if not provided
  if (!targetDir) {
    const result = await p.text({
      message: 'Project name:',
      placeholder: 'my-bodhi-app',
      validate: value => {
        if (!value) return 'Project name is required';
        if (!/^[a-z0-9-]+$/.test(value)) return 'Use lowercase letters, numbers, and hyphens only';
        return undefined;
      },
    });

    if (p.isCancel(result)) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }

    targetDir = result as string;
  }

  // Resolve template
  let templateUrl: string;
  try {
    templateUrl = resolveTemplate(template);
  } catch (error) {
    p.log.error((error as Error).message);
    process.exit(1);
  }

  // GitHub Pages setup
  let enableGithubPages = options.githubPages ?? false;
  if (!options.githubPages) {
    const result = await p.confirm({
      message: 'Enable GitHub Pages deployment?',
      initialValue: false,
    });

    if (p.isCancel(result)) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }

    enableGithubPages = result as boolean;
  }

  // Get GitHub org if GitHub Pages enabled
  let githubOrg = '';
  let basePath = '/';
  let pathSegmentsToKeep = 0;

  if (enableGithubPages) {
    const orgResult = await p.text({
      message: 'Github Repo Owner (User/Org):',
      placeholder: '<gh-user>',
    });

    if (p.isCancel(orgResult)) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }

    githubOrg = orgResult as string;
    basePath = `/${targetDir}/`;
    pathSegmentsToKeep = 1;
  }

  // Scaffold project
  const spinner = p.spinner();
  spinner.start('Scaffolding project...');

  try {
    await scaffold({
      projectName: targetDir,
      templateUrl,
      githubOrg,
      githubPages: enableGithubPages,
      basePath,
      pathSegmentsToKeep,
      install: options.install,
      git: options.git,
    });

    spinner.stop('Project scaffolded successfully!');

    // Show next steps
    p.note(
      [`cd ${targetDir}`, !options.install && 'npm install', 'npm run dev']
        .filter(Boolean)
        .join('\n'),
      'Next steps'
    );

    p.outro(pc.green('Happy coding! 🚀'));
  } catch (error) {
    spinner.stop('Failed to scaffold project');
    p.log.error((error as Error).message);
    process.exit(1);
  }
}
