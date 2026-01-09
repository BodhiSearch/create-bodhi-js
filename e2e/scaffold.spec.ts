import { test } from '@playwright/test';
import { scaffoldProject, verifyProjectStructure, type ScaffoldResult } from './test-utils.js';
import { AppPage, KeycloakPage } from './pages/index.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_NAME = 'my-test-app';
const DEV_CLIENT_ID = process.env.TEST_DEV_CLIENT_ID!;
const BODHI_USERNAME = process.env.TEST_BODHI_USERNAME!;
const BODHI_PASSWORD = process.env.TEST_BODHI_PASSWORD!;
const TEMPLATE_PATH = path.resolve(__dirname, '../../template-bodhi-react-vite');

test.describe('create-bodhi-js E2E', () => {
  let scaffold: ScaffoldResult;

  test.beforeAll(async () => {
    scaffold = await scaffoldProject({
      projectName: PROJECT_NAME,
      template: TEMPLATE_PATH,
      devClientId: DEV_CLIENT_ID,
      githubOrg: 'tempOrg',
      githubPages: true,
    });

    verifyProjectStructure(scaffold.projectDir, DEV_CLIENT_ID);
  });

  test.afterAll(async () => {
    await scaffold.cleanup();
  });

  test('full authentication and chat flow', async ({ page }) => {
    const app = new AppPage(page);
    const keycloak = new KeycloakPage(page);

    await app.goto(`http://localhost:5173/${PROJECT_NAME}/`);

    const setupModal = await app.waitForSetupModal();
    await setupModal.setupDirectConnection('http://localhost:1135');

    await app.connection.expectClientReady();
    await app.connection.expectServerReady();

    await app.auth.clickLogin();
    await keycloak.fillCredentialsAndSubmit(BODHI_USERNAME, BODHI_PASSWORD);
    await app.waitForRedirectBack(new RegExp(PROJECT_NAME));
    await app.auth.expectAuthenticated();

    await app.chat.expectModelsLoaded();
    await app.chat.selectModel('bartowski/google_gemma-3-1b-it-GGUF:Q4_K_M');
    await app.chat.sendMessageAndWaitForResponse('What day comes after Monday?');
    await app.chat.expectAssistantResponseContains(/tuesday/i);
  });
});
