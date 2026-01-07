import { test, expect } from '@playwright/test';
import { scaffoldProject, verifyProjectStructure, type ScaffoldResult } from './test-utils.js';

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
    const baseUrl = `http://localhost:5173/${PROJECT_NAME}/`;
    await page.goto(baseUrl);

    // Step 1: Wait for app to load, verify client not ready initially
    await expect(page.getByTestId('badge-client-status')).toHaveAttribute('data-teststate', 'not-ready');

    // Step 2: Open setup modal
    await page.getByTestId('btn-settings').click();

    // Step 3: Interact with setup modal iframe
    const modalFrame = page.frameLocator('iframe[data-testid="iframe-setup"]');
    await modalFrame.getByTestId('div-setup-modal').waitFor({ state: 'attached' });

    // Step 4: Server setup - check "I have installed" checkbox
    await modalFrame.getByTestId('server-confirm-checkbox').click();

    // Step 5: Direct/LNA setup - enter URL and connect
    await modalFrame.getByTestId('lna-url-input').waitFor({ state: 'visible' });
    await modalFrame.getByTestId('lna-url-input').fill('http://localhost:1135');
    await modalFrame.getByTestId('lna-connect-button').click();

    // Step 6: Success state - click continue
    await modalFrame.getByTestId('continue-button').waitFor({ state: 'visible' });
    await modalFrame.getByTestId('continue-button').click();

    // Step 7: Verify client and server ready
    await expect(page.getByTestId('badge-client-status')).toHaveAttribute('data-teststate', 'ready');
    await expect(page.getByTestId('badge-server-status')).toHaveAttribute('data-teststate', 'ready');

    // Step 8: Login
    await page.getByTestId('btn-auth-login').click();

    // Step 9: Handle Keycloak login (redirects to external page)
    await page.waitForURL(/main-id\.getbodhi\.app/, { timeout: 30000 });
    await page.locator('#username').fill(BODHI_USERNAME);
    await page.locator('#password').fill(BODHI_PASSWORD);
    await page.locator('#kc-login').click();

    // Step 10: Verify redirect back and authenticated
    await page.waitForURL(new RegExp(PROJECT_NAME), { timeout: 30000 });
    await expect(page.getByTestId('section-auth')).toHaveAttribute('data-teststate', 'authenticated');
    await expect(page.getByTestId('span-auth-name')).toBeVisible();
    await expect(page.getByTestId('btn-auth-logout')).toBeVisible();

    // Step 11: Verify models loaded (auto-loads after auth)
    await expect(page.getByTestId('model-selector')).not.toHaveText('No models loaded', { timeout: 30000 });

    // Step 12: Send chat message
    await page.getByTestId('chat-input').fill('What day comes after Monday?');
    await page.getByTestId('send-button').click();

    // Step 13: Verify user message appears
    await expect(page.getByTestId('message-user')).toBeVisible({ timeout: 10000 });

    // Step 14: Wait for streaming to start then complete
    await expect(page.getByTestId('chat-area')).toHaveAttribute('data-teststate', 'streaming', { timeout: 30000 });
    await expect(page.getByTestId('chat-area')).toHaveAttribute('data-teststate', 'idle', { timeout: 60000 });

    // Step 15: Verify assistant response contains expected answer
    await expect(page.getByTestId('message-assistant')).toBeVisible();
    await expect(page.getByTestId('message-assistant')).toContainText(/tuesday/i);
  });
});
