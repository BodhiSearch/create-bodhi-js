import { Page } from '@playwright/test';

export class KeycloakPage {
  constructor(private readonly page: Page) {}

  async fillCredentialsAndSubmit(
    username: string,
    password: string,
    targetPage?: Page
  ): Promise<void> {
    const p = targetPage ?? this.page;
    await p.waitForSelector('#username', { timeout: 30000 });
    await p.locator('#username').fill(username);
    await p.locator('#password').fill(password);
    await p.locator('#kc-login').click();
  }
}
