import { test, expect } from '@playwright/test';
import { scaffoldProject, verifyProjectStructure, type ScaffoldResult } from './test-utils.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_NAME = 'mcp-test-app';
const DEV_CLIENT_ID = process.env.TEST_DEV_CLIENT_ID!;
const TEMPLATE_PATH = path.resolve(__dirname, '../../template-bodhi-react-vite');
const EXA_MCP_URL = 'https://mcp.exa.ai/mcp';

test.describe('MCP Chat Flow E2E', () => {
  let scaffold: ScaffoldResult;

  test.beforeAll(async () => {
    scaffold = await scaffoldProject({
      projectName: PROJECT_NAME,
      template: TEMPLATE_PATH,
      devClientId: DEV_CLIENT_ID,
      githubPages: false,
      mcpServers: EXA_MCP_URL,
    });

    verifyProjectStructure(scaffold.projectDir, DEV_CLIENT_ID, { githubPages: false });
  });

  test.afterAll(async () => {
    await scaffold.cleanup();
  });

  test('agentic chat with Exa MCP executes tool and returns response', async ({ page }) => {
    const { AppPage } = await import('./pages/index.js');
    const BODHI_USERNAME = process.env.TEST_BODHI_USERNAME!;
    const BODHI_PASSWORD = process.env.TEST_BODHI_PASSWORD!;

    const app = new AppPage(page);

    await test.step('Navigate and setup connection', async () => {
      await app.goto('http://localhost:5173/');

      const setupModal = await app.waitForSetupModal();
      await setupModal.setupDirectConnection('http://localhost:1135');

      await app.connection.expectClientReady();
      await app.connection.expectServerReady();
    });

    await test.step('Login with access request for Exa MCP', async () => {
      await app.auth.loginWithMcpAccessRequest(BODHI_USERNAME, BODHI_PASSWORD, [EXA_MCP_URL]);
      await app.auth.expectAuthenticated();
    });

    await test.step('Select model gpt-4.1-nano', async () => {
      await app.chat.expectModelsLoaded();
      await app.chat.selectModel('gpt-4.1-nano');
    });

    await test.step('Enable Exa MCP in popover', async () => {
      await app.chat.openMcpsPopover();
      await app.chat.waitForMcpsToLoad();
      await app.chat.enableMcpBySlug('exa');
      await app.chat.closeMcpsPopover();
    });

    await test.step('Send message and wait for agentic response', async () => {
      await app.chat.sendMessageAndWaitForAgenticResponse(
        'what is the latest news in AI from San Francisco'
      );
    });

    await test.step('Verify response contains "francisco"', async () => {
      const response = await app.chat.getLastAssistantMessage();
      expect(response.toLowerCase()).toContain('francisco');
    });
  });
});
