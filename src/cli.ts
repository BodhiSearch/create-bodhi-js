import * as p from '@clack/prompts';
import pc from 'picocolors';
import { scaffold } from './scaffold.js';
import { resolveTemplate } from './templates.js';

const POPULAR_MCP_SERVERS = ['https://mcp.exa.ai/mcp', 'https://mcp.deepwiki.com/mcp'];

export interface CreateOptions {
  template: string;
  install: boolean;
  git: boolean;
  githubPages?: boolean;
  githubOrg?: string;
  devClientId?: string;
  prodClientId?: string;
  mcpServers?: string;
  ci?: boolean;
}

export async function create(projectName: string | undefined, options: CreateOptions) {
  if (options.ci) {
    process.env.CI = 'true';
    process.env.NO_COLOR = '1';
    delete process.env.FORCE_COLOR;
  }

  console.log();
  p.intro(pc.bgCyan(pc.black(' create-bodhi-js ')));

  let targetDir = projectName;
  const template = options.template;

  // Validate project name if provided via CLI argument
  if (targetDir) {
    if (!/^[a-z0-9-]+$/.test(targetDir)) {
      p.log.error(
        'Invalid project name. Use lowercase letters, numbers, and hyphens only (e.g., my-chat-app)'
      );
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
  if (options.githubPages === undefined && !options.ci) {
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
    // Use CLI option if provided, otherwise prompt
    if (options.githubOrg) {
      githubOrg = options.githubOrg;
    } else {
      const orgResult = await p.text({
        message: 'Github Repo Owner (User/Org):',
        placeholder: '<gh-user>',
      });

      if (p.isCancel(orgResult)) {
        p.cancel('Operation cancelled');
        process.exit(0);
      }

      githubOrg = orgResult as string;
    }
    basePath = `/${targetDir}/`;
    pathSegmentsToKeep = 1;
  } else {
    githubOrg = 'YOUR_ORG';
  }

  // MCP servers setup
  let mcpServers: string[] = [];

  if (options.mcpServers) {
    // From CLI flag
    mcpServers = options.mcpServers
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  } else if (!options.ci) {
    // Step 1: Multi-select from popular presets
    const presetResult = await p.multiselect({
      message: 'Select MCP servers to request access to:',
      options: POPULAR_MCP_SERVERS.map(url => ({ value: url, label: url })),
      required: false,
    });

    if (p.isCancel(presetResult)) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }

    mcpServers = presetResult as string[];

    // Step 2: Free-form custom URLs
    const customResult = await p.text({
      message: 'Additional MCP server URLs (comma-separated, blank to skip):',
      placeholder: 'https://mcp.example.com/mcp',
      defaultValue: '',
    });

    if (p.isCancel(customResult)) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }

    if (customResult) {
      const customUrls = (customResult as string)
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      mcpServers = [...mcpServers, ...customUrls];
    }
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
      devClientId: options.devClientId,
      prodClientId: options.prodClientId,
      mcpServers,
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
