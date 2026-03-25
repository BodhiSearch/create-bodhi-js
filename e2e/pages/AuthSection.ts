import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class AuthSection extends BasePage {
  async clickLogin(): Promise<void> {
    await this.page.getByTestId('btn-auth-login').click();
  }

  async loginWithAccessRequest(username: string, password: string): Promise<void> {
    await this.performKeycloakLogin(username, password);

    // After Keycloak login, redirects back to Bodhi review page
    // No MCP servers requested — Approve All is immediately enabled
    const approveButton = this.page.locator('[data-testid="review-approve-button"]');
    await approveButton.waitFor({ state: 'visible' });
    await approveButton.click();

    // Multiple redirects happen automatically:
    // app callback → SDK checks access request → triggers OAuth → SSO → callback → app
    await this.expectAuthenticated();
  }

  async loginWithMcpAccessRequest(
    username: string,
    password: string,
    mcpServerUrls: string[]
  ): Promise<void> {
    await this.performKeycloakLogin(username, password);

    // After Keycloak login, redirects to Bodhi review page with MCP server selection
    // Approve All is disabled until MCP instances are selected for each requested server
    const approveButton = this.page.locator('[data-testid="review-approve-button"]');
    await approveButton.waitFor({ state: 'visible' });

    // Select an MCP instance for each requested MCP server
    for (const url of mcpServerUrls) {
      const selectTrigger = this.page.locator(`[data-testid="review-mcp-select-trigger-${url}"]`);
      await selectTrigger.waitFor({ state: 'visible' });
      await selectTrigger.click();

      // Select the first available option in the dropdown
      const option = this.page.getByRole('option').first();
      await option.waitFor({ state: 'visible' });
      await option.click();
    }

    // Now Approve All should be enabled
    await expect(approveButton).toBeEnabled();
    await approveButton.click();

    await this.expectAuthenticated();
  }

  async expectAuthenticated(): Promise<void> {
    await expect(this.page.getByTestId('section-auth')).toHaveAttribute(
      'data-teststate',
      'authenticated'
    );
    await expect(this.page.getByTestId('span-auth-name')).toBeVisible();
    await expect(this.page.getByTestId('btn-auth-logout')).toBeVisible();
  }

  private async performKeycloakLogin(username: string, password: string): Promise<void> {
    // Click login - SDK creates access request then redirects to Bodhi server
    await this.page.getByTestId('btn-auth-login').click();

    // Wait for navigation away from the app
    await this.page.waitForURL(url => !url.href.includes('localhost:5173'));

    // BodhiApp redirects to /ui/login/ in fresh browser context (no SSO)
    // Click "Login" button on Bodhi's login page → redirects to Keycloak
    await this.page.getByRole('button', { name: 'Login' }).click();

    // Keycloak login form
    await this.page.waitForSelector('#username');
    await this.page.fill('#username', username);
    await this.page.fill('#password', password);
    await this.page.click('#kc-login');
  }
}
