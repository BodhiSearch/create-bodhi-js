import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class AuthSection extends BasePage {
  async clickLogin(): Promise<void> {
    await this.page.getByTestId('btn-auth-login').click();
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
