import { Command } from 'commander';
import { create } from './cli.js';

const program = new Command();

program
  .name('create-bodhi-js')
  .description('Scaffold Bodhi-powered applications')
  .version('0.1.0')
  .argument('[project-name]', 'Name of the project')
  .option('-t, --template <name>', 'Template to use (react, svelte, vue)', 'react')
  .option('--no-install', 'Skip dependency installation')
  .option('--no-git', 'Skip git initialization')
  .option('--github-pages', 'Enable GitHub Pages deployment setup')
  .option('--github-org <org>', 'GitHub repository owner (user/org)')
  .action(async (projectName, options) => {
    await create(projectName, options);
  });

program.parse();
