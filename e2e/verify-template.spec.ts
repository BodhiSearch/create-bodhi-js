import { test, expect } from '@playwright/test';
import { scaffoldProject, type ScaffoldResult } from './test-utils.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_PATH = path.resolve(__dirname, '../../template-bodhi-react-vite');

function assertNoRawHandlebars(content: string, filename: string): void {
  expect(content, `${filename} should not contain escaped \\{{`).not.toContain('\\{{');
  expect(content, `${filename} should not contain raw Handlebars {{#if`).not.toContain('{{#if');
  expect(content, `${filename} should not contain raw Handlebars {{else}}`).not.toContain(
    '{{else}}'
  );
  expect(content, `${filename} should not contain raw Handlebars {{/if}}`).not.toContain('{{/if}}');
}

test.describe('Template Processing', () => {
  test.describe('with client IDs provided', () => {
    let scaffold: ScaffoldResult;
    const DEV_CLIENT_ID = 'test-dev-client-123';
    const PROD_CLIENT_ID = 'test-prod-client-456';

    test.beforeAll(async () => {
      scaffold = await scaffoldProject({
        projectName: 'test-with-ids',
        template: TEMPLATE_PATH,
        devClientId: DEV_CLIENT_ID,
        prodClientId: PROD_CLIENT_ID,
        githubPages: true,
        githubOrg: 'testorg',
        noInstall: true,
        skipDevServer: true,
      });
    });

    test.afterAll(async () => {
      await scaffold.cleanup();
    });

    test('ci.yml should have devClientId and all GitHub Actions syntax', () => {
      const ciYmlPath = path.join(scaffold.projectDir, '.github/workflows/ci.yml');
      const content = fs.readFileSync(ciYmlPath, 'utf-8');

      assertNoRawHandlebars(content, 'ci.yml');

      expect(content).toContain(`VITE_BODHI_APP_CLIENT_ID: ${DEV_CLIENT_ID}`);
      expect(content).toContain('group: ci-${{ github.ref }}');
      expect(content).toContain("ref: ${{ github.event.inputs.ref || '' }}");
      expect(content).toContain('key: ${{ runner.os }}-playwright-1.57.0');
      expect(content).toContain('client-payload: \'{"sha": "${{ github.sha }}"}\'');
    });

    test('deploy-pages.yml should have prodClientId and all GitHub Actions syntax', () => {
      const deployYmlPath = path.join(scaffold.projectDir, '.github/workflows/deploy-pages.yml');
      const content = fs.readFileSync(deployYmlPath, 'utf-8');

      assertNoRawHandlebars(content, 'deploy-pages.yml');

      expect(content).toContain(`VITE_BODHI_APP_CLIENT_ID: ${PROD_CLIENT_ID}`);
      expect(content).toContain(
        "ref: ${{ github.event.inputs.ref || github.event.client_payload.sha || 'main' }}"
      );
      expect(content).toContain('url: ${{ steps.deployment.outputs.page_url }}');
    });
  });

  test.describe('without client IDs', () => {
    let scaffold: ScaffoldResult;

    test.beforeAll(async () => {
      scaffold = await scaffoldProject({
        projectName: 'test-no-ids',
        template: TEMPLATE_PATH,
        githubPages: true,
        githubOrg: 'testorg',
        noInstall: true,
        skipDevServer: true,
      });
    });

    test.afterAll(async () => {
      await scaffold.cleanup();
    });

    test('ci.yml should have fallback test-client-id and all GitHub Actions syntax', () => {
      const ciYmlPath = path.join(scaffold.projectDir, '.github/workflows/ci.yml');
      const content = fs.readFileSync(ciYmlPath, 'utf-8');

      assertNoRawHandlebars(content, 'ci.yml');

      expect(content).toContain('VITE_BODHI_APP_CLIENT_ID: test-client-id');
      expect(content).toContain('group: ci-${{ github.ref }}');
      expect(content).toContain("ref: ${{ github.event.inputs.ref || '' }}");
      expect(content).toContain('key: ${{ runner.os }}-playwright-1.57.0');
      expect(content).toContain('client-payload: \'{"sha": "${{ github.sha }}"}\'');
    });

    test('deploy-pages.yml should have fallback GitHub vars and all GitHub Actions syntax', () => {
      const deployYmlPath = path.join(scaffold.projectDir, '.github/workflows/deploy-pages.yml');
      const content = fs.readFileSync(deployYmlPath, 'utf-8');

      assertNoRawHandlebars(content, 'deploy-pages.yml');

      expect(content).toContain('VITE_BODHI_APP_CLIENT_ID: ${{ vars.VITE_BODHI_APP_CLIENT_ID }}');
      expect(content).toContain(
        "ref: ${{ github.event.inputs.ref || github.event.client_payload.sha || 'main' }}"
      );
      expect(content).toContain('url: ${{ steps.deployment.outputs.page_url }}');
    });
  });
});
