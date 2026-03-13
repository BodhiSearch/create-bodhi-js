import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class AuthSection extends BasePage {
  async clickLogin(): Promise<void> {
    await this.page.getByTestId('btn-auth-login').click();
  }

  async loginWithAccessRequest(username: string, password: string): Promise<void> {
    // Click login → popup opens with review/auth URL
    const reviewPopupPromise = this.page.context().waitForEvent('page');
    await this.page.getByTestId('btn-auth-login').click();
    const reviewPopup = await reviewPopupPromise;
    await reviewPopup.waitForLoadState('load');

    // BodhiApp login page → click Login → Keycloak form
    await reviewPopup.click('[data-testid="auth-card-action-0"]');
    await reviewPopup.waitForSelector('#username');
    await reviewPopup.fill('#username', username);
    await reviewPopup.fill('#password', password);
    await reviewPopup.click('#kc-login');

    // Wait for review page to load and approve
    const approveButton = reviewPopup.locator('[data-testid="review-approve-button"]');
    await approveButton.waitFor({ state: 'visible' });
    await approveButton.click();

    // SDK polls → approved → completes OAuth
    await this.expectAuthenticated();
  }

  async expectAuthenticated(): Promise<void> {
    await expect(this.page.getByTestId('section-auth')).toHaveAttribute(
      'data-teststate',
      'authenticated',
      { timeout: 30000 }
    );
    await expect(this.page.getByTestId('span-auth-name')).toBeVisible();
    await expect(this.page.getByTestId('btn-auth-logout')).toBeVisible();
  }
}
