import { downloadTemplate } from 'giget';
import { promises as fs } from 'fs';
import path from 'path';
import { processTemplates } from './processor.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

function isLocalPath(templateUrl: string): boolean {
  return (
    templateUrl.startsWith('/') || templateUrl.startsWith('./') || templateUrl.startsWith('../')
  );
}

export interface ScaffoldOptions {
  projectName: string;
  templateUrl: string;
  githubOrg: string;
  githubPages: boolean;
  basePath: string;
  pathSegmentsToKeep: number;
  install: boolean;
  git: boolean;
  devClientId?: string;
  prodClientId?: string;
}

export async function scaffold(options: ScaffoldOptions) {
  const {
    projectName,
    templateUrl,
    githubOrg,
    githubPages,
    basePath,
    pathSegmentsToKeep,
    install,
    git,
    devClientId,
    prodClientId,
  } = options;

  const targetDir = path.resolve(process.cwd(), projectName);

  // Check if directory exists
  try {
    await fs.access(targetDir);
    throw new Error(`Directory ${projectName} already exists`);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err;
    }
  }

  // Download or copy template
  if (isLocalPath(templateUrl)) {
    // Copy local template directory
    await fs.cp(templateUrl, targetDir, { recursive: true });
  } else {
    // Download from git provider
    await downloadTemplate(templateUrl, {
      dir: targetDir,
      offline: false,
      force: true,
    });
  }

  // Move files from template/ subdirectory to root if it exists
  const templateSubdir = path.join(targetDir, 'template');
  try {
    await fs.access(templateSubdir);
    // Move all files from template/ to targetDir
    const files = await fs.readdir(templateSubdir);
    for (const file of files) {
      await fs.rename(path.join(templateSubdir, file), path.join(targetDir, file));
    }
    await fs.rmdir(templateSubdir);
  } catch {
    // No template/ subdirectory, that's fine
  }

  // Rename dotfiles (underscore prefix to dot prefix)
  const dotfiles = ['_gitignore', '_editorconfig', '_prettierrc', '_prettierignore'];
  for (const file of dotfiles) {
    const oldPath = path.join(targetDir, file);
    const newPath = path.join(targetDir, file.replace('_', '.'));
    try {
      await fs.rename(oldPath, newPath);
    } catch {
      // File might not exist, that's okay
    }
  }

  // Process templates
  await processTemplates(targetDir, {
    projectName,
    githubOrg,
    githubPages,
    basePath,
    pathSegmentsToKeep,
    devClientId,
    prodClientId,
  });

  // Create .env.local if devClientId provided
  if (devClientId) {
    const envContent = `VITE_BODHI_APP_CLIENT_ID=${devClientId}
VITE_BODHI_AUTH_SERVER_URL=https://main-id.getbodhi.app/realms/bodhi
`;
    await fs.writeFile(path.join(targetDir, '.env.local'), envContent, 'utf-8');
  }

  // Conditional file deletion
  if (!githubPages) {
    const filesToDelete = [
      path.join(targetDir, '.github/workflows/deploy-pages.yml'),
      path.join(targetDir, 'public/404.html'),
    ];
    for (const file of filesToDelete) {
      try {
        await fs.unlink(file);
      } catch {
        // File might not exist
      }
    }
  }

  // Remove template.json and other meta files
  const metaFiles = ['template.json', 'test-template.sh', 'TECH.md'];
  for (const file of metaFiles) {
    try {
      await fs.unlink(path.join(targetDir, file));
    } catch {
      // File might not exist
    }
  }

  // Initialize git
  if (git) {
    try {
      await execAsync('git init', { cwd: targetDir });
      await execAsync('git add .', { cwd: targetDir });
      await execAsync('git commit -m "chore: initial commit from create-bodhi-js"', {
        cwd: targetDir,
      });
    } catch {
      // Git init failed, that's okay
      console.warn('Warning: Git initialization failed');
    }
  }

  // Install dependencies
  if (install) {
    await execAsync('npm install', { cwd: targetDir });
  }
}
