import { test } from '@playwright/test';
import { scaffoldProject, verifyProjectStructure, type ScaffoldResult } from './test-utils.js';
import { AppPage, KeycloakPage } from './pages/index.js';

const PROJECT_NAME = 'my-test-app';
const DEV_CLIENT_ID = process.env.TEST_DEV_CLIENT_ID!;
const BODHI_USERNAME = process.env.TEST_BODHI_USERNAME!;
const BODHI_PASSWORD = process.env.TEST_BODHI_PASSWORD!;

test.describe('create-bodhi-js E2E', () => {
  let scaffold: ScaffoldResult;

  test.beforeAll(async () => {
    scaffold = await scaffoldProject({
      projectName: PROJECT_NAME,
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
    await app.connection.expectClientNotReady();

    const setupModal = await app.openSetupModal();
    await setupModal.setupDirectConnection('http://localhost:1135');

    await app.connection.expectClientReady();
    await app.connection.expectServerReady();

    await app.auth.clickLogin();
    await keycloak.fillCredentialsAndSubmit(BODHI_USERNAME, BODHI_PASSWORD);
    await app.waitForRedirectBack(new RegExp(PROJECT_NAME));
    await app.auth.expectAuthenticated();

    await app.chat.expectModelsLoaded();
    await app.chat.sendMessageAndWaitForResponse('What day comes after Monday?');
    await app.chat.expectAssistantResponseContains(/tuesday/i);
  });
});
