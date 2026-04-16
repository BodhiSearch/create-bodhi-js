import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ScaffoldResult {
  tempDir: string;
  projectDir: string;
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

  const keepTestDir = process.env.KEEP_TEST_DIR === '1';
  const cleanup = async () => {
    if (keepTestDir) {
      console.log(`[test-utils] KEEP_TEST_DIR=1 set; leaving ${tempDir} on disk for inspection`);
      return;
    }
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  };

  const basePath = githubPages ? `/${projectName}/` : '/';

  return { tempDir, projectDir, cleanup, basePath };
}

export function verifyProjectStructure(
  projectDir: string,
  devClientId: string,
  options?: { noInstall?: boolean; githubPages?: boolean }
): void {
  const { noInstall = false, githubPages = true } = options ?? {};

  const checks: Array<{ file: string; exists: boolean; committed: boolean }> = [
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
