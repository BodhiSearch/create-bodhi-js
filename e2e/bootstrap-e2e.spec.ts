import { beforeAll, describe, expect, test } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { scaffoldProject, type ScaffoldResult } from './test-utils.js';
import { requireEnv, validateEnv } from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_PATH = path.resolve(__dirname, '../templates/react');
const PROJECT_NAME = 'my-test-app';

describe('Bootstrapped project e2e', () => {
  let scaffold: ScaffoldResult;
  let devClientId: string;

  beforeAll(async () => {
    validateEnv();
    devClientId = requireEnv('DEV_CLIENT_ID');
    scaffold = await scaffoldProject({
      projectName: PROJECT_NAME,
      template: TEMPLATE_PATH,
      devClientId,
      githubPages: true,
      githubOrg: 'tempOrg',
      noInstall: false,
    });
    console.log(`[bootstrap-e2e] Project dir: ${scaffold.projectDir}`);
  });

  test('npm run check passes on scaffold with no local changes', () => {
    const { projectDir } = scaffold;
    execSync('npm run check', { cwd: projectDir, stdio: 'inherit', timeout: 120_000 });
    const diff = execSync('git diff', { cwd: projectDir, encoding: 'utf-8' });
    expect(
      diff,
      `npm run check left local changes in the scaffolded project; regenerate template with lint-clean output:\n${diff}`
    ).toBe('');
  });

  test('scaffolded project passes its own ci:test:e2e', () => {
    const { projectDir } = scaffold;
    execSync('npx playwright install chromium', {
      cwd: projectDir,
      stdio: 'inherit',
      timeout: 300_000,
    });

    const authUrl = requireEnv('BODHIAPP_AUTH_URL');
    const authRealm = requireEnv('BODHIAPP_AUTH_REALM');
    const envLines = [
      `BODHIAPP_CLIENT_ID=${requireEnv('BODHIAPP_CLIENT_ID')}`,
      `BODHIAPP_CLIENT_SECRET=${requireEnv('BODHIAPP_CLIENT_SECRET')}`,
      `BODHIAPP_USERNAME=${requireEnv('BODHIAPP_USERNAME')}`,
      `BODHIAPP_USERID=${requireEnv('BODHIAPP_USERID')}`,
      `BODHIAPP_PASSWORD=${requireEnv('BODHIAPP_PASSWORD')}`,
      `BODHIAPP_AUTH_URL=${authUrl}`,
      `BODHIAPP_AUTH_REALM=${authRealm}`,
      `OPENAI_API_KEY=${requireEnv('OPENAI_API_KEY')}`,
      `VITE_BODHI_APP_CLIENT_ID=${devClientId}`,
      `VITE_BODHI_AUTH_SERVER_URL=${authUrl}/realms/${authRealm}`,
      '',
    ];
    const envTestPath = path.join(projectDir, 'e2e/.env.test');
    fs.mkdirSync(path.dirname(envTestPath), { recursive: true });
    fs.writeFileSync(envTestPath, envLines.join('\n'), { mode: 0o600 });

    execSync('npm run ci:test:e2e', {
      cwd: projectDir,
      stdio: 'inherit',
      timeout: 540_000,
    });
  });
});
