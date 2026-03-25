import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class AuthSection extends BasePage {
  async clickLogin(): Promise<void> {
    await this.page.getByTestId('btn-auth-login').click();
  }

  async loginWithAccessRequest(username: string, password: string): Promise<void> {
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

    // After Keycloak login, redirects back to Bodhi review page
    const approveButton = this.page.locator('[data-testid="review-approve-button"]');
    await approveButton.waitFor({ state: 'visible' });
    await approveButton.click();

    // Multiple redirects happen automatically:
    // app callback → SDK checks access request → triggers OAuth → SSO → callback → app
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
}
