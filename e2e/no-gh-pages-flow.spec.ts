import { test } from '@playwright/test';
import {
  scaffoldProject,
  verifyProjectStructure,
  assertChatFlow,
  type ScaffoldResult,
} from './test-utils.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_NAME = 'my-test-app';
const DEV_CLIENT_ID = process.env.TEST_DEV_CLIENT_ID!;
const TEMPLATE_PATH = path.resolve(__dirname, '../../template-bodhi-react-vite');

test.describe('no-github-pages-flow E2E', () => {
  let scaffold: ScaffoldResult;

  test.beforeAll(async () => {
    scaffold = await scaffoldProject({
      projectName: PROJECT_NAME,
      template: TEMPLATE_PATH,
      devClientId: DEV_CLIENT_ID,
      githubPages: false,
    });

    verifyProjectStructure(scaffold.projectDir, DEV_CLIENT_ID, { githubPages: false });
  });

  test.afterAll(async () => {
    await scaffold.cleanup();
  });

  test('full authentication and chat flow at root path', async ({ page }) => {
    await assertChatFlow(page, 'http://localhost:5173/', /localhost:5173\//);
  });
});
