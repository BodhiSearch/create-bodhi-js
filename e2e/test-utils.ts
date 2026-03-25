import { execSync, spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { Page } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ScaffoldResult {
  tempDir: string;
  projectDir: string;
  devServer?: ChildProcess;
  cleanup: () => Promise<void>;
  basePath: string;
}

export interface ScaffoldOptions {
  projectName: string;
  devClientId?: string;
  githubOrg?: string;
  githubPages?: boolean;
  template?: string;
  prodClientId?: string;
  mcpServers?: string;
  noInstall?: boolean;
  skipDevServer?: boolean;
}

export async function scaffoldProject(options: ScaffoldOptions): Promise<ScaffoldResult> {
  const {
    projectName,
    devClientId,
    githubOrg = 'tempOrg',
    githubPages = true,
    template,
    prodClientId,
    mcpServers,
    noInstall = false,
    skipDevServer = false,
  } = options;

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'create-bodhi-js-e2e-'));
  const projectDir = path.join(tempDir, projectName);

  const cliPath = path.resolve(__dirname, '../src/index.ts');
  const command = [
    'npx',
    'tsx',
    cliPath,
    projectName,
    '--ci',
    githubPages ? '--github-pages' : '--no-github-pages',
    githubPages && githubOrg ? '--github-org' : '',
    githubPages && githubOrg ? githubOrg : '',
    devClientId ? '--dev-client-id' : '',
    devClientId ? devClientId : '',
    prodClientId ? '--prod-client-id' : '',
    prodClientId ? prodClientId : '',
    template ? '--template' : '',
    template ? template : '',
    mcpServers ? '--mcp-servers' : '',
    mcpServers ? mcpServers : '',
    noInstall ? '--no-install' : '',
  ]
    .filter(Boolean)
    .join(' ');

  execSync(command, {
    cwd: tempDir,
    stdio: 'inherit',
    timeout: 300000,
  });

  let devServer: ChildProcess | undefined;
  if (!skipDevServer) {
    devServer = await startDevServer(projectDir, projectName, githubPages);
  }

  const cleanup = async () => {
    if (devServer) {
      devServer.kill('SIGTERM');
    }
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  };

  const basePath = githubPages ? `/${projectName}/` : '/';

  return { tempDir, projectDir, devServer, cleanup, basePath };
}

async function isPortAvailable(port: number): Promise<boolean> {
  const net = await import('net');
  return new Promise(resolve => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

async function startDevServer(
  projectDir: string,
  projectName: string,
  githubPages: boolean
): Promise<ChildProcess> {
  if (!(await isPortAvailable(5173))) {
    throw new Error(
      'Port 5173 is already in use. Cannot start dev server. Ensure no other test process is running.'
    );
  }

  const devServer = spawn('npm', ['run', 'dev'], {
    cwd: projectDir,
    stdio: 'pipe',
    shell: true,
  });

  const basePath = githubPages ? `/${projectName}/` : '/';
  await waitForServer(`http://localhost:5173${basePath}`);

  return devServer;
}

async function waitForServer(serverUrl: string): Promise<void> {
  const maxAttempts = 100;
  const retryDelay = 50;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(serverUrl);
      if (response.ok) {
        return;
      }
    } catch {
      if (attempt === maxAttempts) {
        throw new Error(`Dev server failed to start within ${maxAttempts * retryDelay}ms`);
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

export async function assertChatFlow(page: Page, baseUrl: string): Promise<void> {
  const { AppPage } = await import('./pages/index.js');
  const BODHI_USERNAME = process.env.TEST_BODHI_USERNAME!;
  const BODHI_PASSWORD = process.env.TEST_BODHI_PASSWORD!;

  const app = new AppPage(page);

  await app.goto(baseUrl);

  const setupModal = await app.waitForSetupModal();
  await setupModal.setupDirectConnection('http://localhost:1135');

  await app.connection.expectClientReady();
  await app.connection.expectServerReady();

  await app.auth.loginWithAccessRequest(BODHI_USERNAME, BODHI_PASSWORD);
  await app.auth.expectAuthenticated();

  await app.chat.expectModelsLoaded();
  await app.chat.selectModel('bartowski/google_gemma-3-1b-it-GGUF:Q4_K_M');
  await app.chat.sendMessageAndWaitForResponse('What day comes after Monday?');
  await app.chat.expectAssistantResponseContains(/tuesday/i);
}

export function verifyProjectStructure(
  projectDir: string,
  devClientId: string,
  options?: { noInstall?: boolean; githubPages?: boolean }
): void {
  const { noInstall = false, githubPages = true } = options ?? {};

  const checks = [
    { file: 'package.json', exists: true, committed: true },
    { file: '.env.local', exists: true, committed: false },
  ];

  if (!noInstall) {
    checks.push({ file: 'package-lock.json', exists: true, committed: true });
  }

  for (const check of checks) {
    const filePath = path.join(projectDir, check.file);
    const exists = fs.existsSync(filePath);
    if (exists !== check.exists) {
      throw new Error(`Expected ${check.file} to ${check.exists ? 'exist' : 'not exist'}`);
    }
  }

  const gitLog = execSync('git log --name-only -1', {
    cwd: projectDir,
    encoding: 'utf-8',
  });

  const committedFiles = gitLog
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  for (const check of checks) {
    if (!check.exists) continue;

    const isInGit = committedFiles.includes(check.file);
    if (check.committed && !isInGit) {
      throw new Error(`Expected ${check.file} to be committed in git`);
    }
    if (!check.committed && isInGit) {
      throw new Error(`Expected ${check.file} to NOT be committed in git`);
    }
  }

  const envContent = fs.readFileSync(path.join(projectDir, '.env.local'), 'utf-8');
  if (!envContent.includes(`VITE_BODHI_APP_CLIENT_ID=${devClientId}`)) {
    throw new Error(`Expected .env.local to contain dev client ID`);
  }

  if (!noInstall) {
    execSync('npm run lint:fix', { cwd: projectDir, stdio: 'inherit' });

    const gitStatus = execSync('git status --porcelain', {
      cwd: projectDir,
      encoding: 'utf-8',
    });

    if (gitStatus.trim()) {
      throw new Error(`Expected no local changes after lint:fix, but found:\n${gitStatus}`);
    }
  }

  if (!githubPages) {
    const absentFiles = ['.github/workflows/deploy-pages.yml', 'public/404.html'];
    for (const file of absentFiles) {
      const filePath = path.join(projectDir, file);
      if (fs.existsSync(filePath)) {
        throw new Error(`Expected ${file} to NOT exist when githubPages=false`);
      }
    }
  }
}
