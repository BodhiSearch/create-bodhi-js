import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { scaffoldProject, type ScaffoldResult } from './test-utils.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_PATH = path.resolve(__dirname, '../templates/react');
const PROJECT_NAME = 'verify-template-app';
const DEV_CLIENT_ID = 'test-dev-client-123';
const PROD_CLIENT_ID = 'test-prod-client-456';
const MCP_URL_1 = 'https://mcp.exa.ai/mcp';
const MCP_URL_2 = 'https://mcp.deepwiki.com/mcp';

const HANDLEBARS_MARKERS = ['\\{{', '{{#if', '{{else}}', '{{/if}}', '{{#each', '{{/each}}'];
const SCANNED_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
  '.yml',
  '.yaml',
  '.md',
  '.html',
  '.css',
]);
const SKIPPED_DIRS = new Set(['node_modules', '.git', 'dist']);

function* walkFiles(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIPPED_DIRS.has(entry.name)) continue;
      yield* walkFiles(full);
    } else if (entry.isFile() && SCANNED_EXTENSIONS.has(path.extname(entry.name))) {
      yield full;
    }
  }
}

function assertNoRawHandlebars(content: string, relPath: string): void {
  for (const marker of HANDLEBARS_MARKERS) {
    expect(content, `${relPath} should not contain raw Handlebars ${marker}`).not.toContain(marker);
  }
}

describe('Template Processing', () => {
  let scaffold: ScaffoldResult;

  beforeAll(async () => {
    scaffold = await scaffoldProject({
      projectName: PROJECT_NAME,
      template: TEMPLATE_PATH,
      devClientId: DEV_CLIENT_ID,
      prodClientId: PROD_CLIENT_ID,
      githubPages: true,
      githubOrg: 'testorg',
      mcpServers: `${MCP_URL_1},${MCP_URL_2}`,
      noInstall: true,
    });
  });

  afterAll(async () => {
    await scaffold.cleanup();
  });

  test('no unrendered Handlebars in scaffolded files', () => {
    for (const filePath of walkFiles(scaffold.projectDir)) {
      const rel = path.relative(scaffold.projectDir, filePath);
      const content = fs.readFileSync(filePath, 'utf-8');
      assertNoRawHandlebars(content, rel);
    }
  });

  test('ci.yml uses GitHub Actions vars/secrets (no literal client IDs)', () => {
    const content = fs.readFileSync(
      path.join(scaffold.projectDir, '.github/workflows/ci.yml'),
      'utf-8'
    );
    expect(content).toContain('VITE_BODHI_APP_CLIENT_ID: ${{ vars.VITE_BODHI_APP_CLIENT_ID }}');
    expect(content).toContain('BODHIAPP_CLIENT_SECRET: ${{ secrets.BODHIAPP_CLIENT_SECRET }}');
    expect(content).toContain('OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}');
    expect(content).toContain('group: ci-${{ github.ref }}');
    expect(content).toContain('key: ${{ runner.os }}-playwright-1.57.0');
    expect(content).toContain('client-payload: \'{"sha": "${{ github.sha }}"}\'');
    expect(content).not.toContain(DEV_CLIENT_ID);
  });

  test('deploy-pages.yml embeds prodClientId and uses deployment URL substitution', () => {
    const content = fs.readFileSync(
      path.join(scaffold.projectDir, '.github/workflows/deploy-pages.yml'),
      'utf-8'
    );
    expect(content).toContain(`VITE_BODHI_APP_CLIENT_ID: ${PROD_CLIENT_ID}`);
    expect(content).toContain('url: ${{ steps.deployment.outputs.page_url }}');
    expect(content).toContain(
      "ref: ${{ github.event.inputs.ref || github.event.client_payload.sha || 'main' }}"
    );
  });

  test('.env.local contains dev client ID and auth server URL', () => {
    const content = fs.readFileSync(path.join(scaffold.projectDir, '.env.local'), 'utf-8');
    expect(content).toContain(`VITE_BODHI_APP_CLIENT_ID=${DEV_CLIENT_ID}`);
    expect(content).toContain('VITE_BODHI_AUTH_SERVER_URL=');
  });

  test('Header.tsx has addMcpServer calls for both MCPs and LoginOptionsBuilder', () => {
    const content = fs.readFileSync(
      path.join(scaffold.projectDir, 'src/components/Header.tsx'),
      'utf-8'
    );
    expect(content).toContain(`.addMcpServer('${MCP_URL_1}')`);
    expect(content).toContain(`.addMcpServer('${MCP_URL_2}')`);
    expect(content).toContain(".setRole('scope_user_user')");
    expect(content).toContain('LoginOptionsBuilder');
  });

  test('vite.config.ts has base path wired to projectName', () => {
    const content = fs.readFileSync(path.join(scaffold.projectDir, 'vite.config.ts'), 'utf-8');
    expect(content).toContain(`base: '/${PROJECT_NAME}/'`);
  });
});
