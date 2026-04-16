import { test } from '@playwright/test';
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

test.describe('Bootstrapped project e2e', () => {
  let scaffold: ScaffoldResult | undefined;

  test.beforeAll(async () => {
    validateEnv();
    const devClientId = requireEnv('DEV_CLIENT_ID');
    scaffold = await scaffoldProject({
      projectName: PROJECT_NAME,
      template: TEMPLATE_PATH,
      devClientId,
      githubPages: true,
      githubOrg: 'tempOrg',
      noInstall: true,
    });
  });

  test.afterAll(async () => {
    await scaffold?.cleanup();
  });

  test('scaffolded project passes its own ci:test:e2e', () => {
    if (!scaffold) throw new Error('beforeAll did not produce a scaffold');
    const { projectDir } = scaffold;

    execSync('npm install', { cwd: projectDir, stdio: 'inherit', timeout: 300_000 });
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
      `VITE_BODHI_APP_CLIENT_ID=${requireEnv('DEV_CLIENT_ID')}`,
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
