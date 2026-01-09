import { Page } from '@playwright/test';

export class KeycloakPage {
  constructor(private readonly page: Page) {}

  async fillCredentialsAndSubmit(username: string, password: string): Promise<void> {
    await this.page.waitForURL(/main-id\.getbodhi\.app/, { timeout: 30000 });
    await this.page.locator('#username').fill(username);
    await this.page.locator('#password').fill(password);
    await this.page.locator('#kc-login').click();
  }
}
