import { execSync, spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ScaffoldResult {
  tempDir: string;
  projectDir: string;
  devServer: ChildProcess;
  cleanup: () => Promise<void>;
}

export interface ScaffoldOptions {
  projectName: string;
  devClientId: string;
  githubOrg?: string;
  githubPages?: boolean;
}

export async function scaffoldProject(options: ScaffoldOptions): Promise<ScaffoldResult> {
  const { projectName, devClientId, githubOrg = 'tempOrg', githubPages = true } = options;

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'create-bodhi-js-e2e-'));
  const projectDir = path.join(tempDir, projectName);

  console.log(`Temp directory: ${tempDir}`);
  console.log(`Project directory: ${projectDir}`);

  const cliPath = path.resolve(__dirname, '../src/index.ts');
  const command = [
    'npx',
    'tsx',
    cliPath,
    projectName,
    '--ci',
    githubPages ? '--github-pages' : '',
    githubPages ? '--github-org' : '',
    githubPages ? githubOrg : '',
    '--dev-client-id',
    devClientId,
  ]
    .filter(Boolean)
    .join(' ');

  console.log(`Running: ${command}`);
  execSync(command, {
    cwd: tempDir,
    stdio: 'inherit',
    timeout: 300000,
  });

  const devServer = await startDevServer(projectDir, projectName);

  const cleanup = async () => {
    if (devServer) {
      devServer.kill('SIGTERM');
    }
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  };

  return { tempDir, projectDir, devServer, cleanup };
}

async function startDevServer(projectDir: string, projectName: string): Promise<ChildProcess> {
  const devServer = spawn('npm', ['run', 'dev'], {
    cwd: projectDir,
    stdio: 'pipe',
    shell: true,
  });

  devServer.stdout?.on('data', (data: Buffer) => {
    console.log(`[dev server] ${data.toString()}`);
  });

  devServer.stderr?.on('data', (data: Buffer) => {
    console.error(`[dev server error] ${data.toString()}`);
  });

  await waitForServer(`http://localhost:5173/${projectName}/`);

  return devServer;
}

async function waitForServer(serverUrl: string): Promise<void> {
  const maxAttempts = 100;
  const retryDelay = 50;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(serverUrl);
      if (response.ok) {
        console.log(`Dev server ready at ${serverUrl} (attempt ${attempt}/${maxAttempts})`);
        return;
      }
    } catch (error) {
      if (attempt === maxAttempts) {
        throw new Error(`Dev server failed to start within ${maxAttempts * retryDelay}ms`);
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }
}

export function verifyProjectStructure(projectDir: string, devClientId: string): void {
  const checks = [
    { file: 'package.json', exists: true },
    { file: '.env.local', exists: true },
  ];

  for (const check of checks) {
    const filePath = path.join(projectDir, check.file);
    const exists = fs.existsSync(filePath);
    if (exists !== check.exists) {
      throw new Error(`Expected ${check.file} to ${check.exists ? 'exist' : 'not exist'}`);
    }
  }

  const envContent = fs.readFileSync(path.join(projectDir, '.env.local'), 'utf-8');
  if (!envContent.includes(`VITE_BODHI_APP_CLIENT_ID=${devClientId}`)) {
    throw new Error(`Expected .env.local to contain dev client ID`);
  }
}
