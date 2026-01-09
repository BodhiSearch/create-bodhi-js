import { Page } from '@playwright/test';
import { BasePage } from './BasePage.js';
import { ConnectionSection } from './ConnectionSection.js';
import { AuthSection } from './AuthSection.js';
import { ChatSection } from './ChatSection.js';
import { SetupModal } from './SetupModal.js';

export class AppPage extends BasePage {
  readonly connection: ConnectionSection;
  readonly auth: AuthSection;
  readonly chat: ChatSection;

  constructor(page: Page) {
    super(page);
    this.connection = new ConnectionSection(page);
    this.auth = new AuthSection(page);
    this.chat = new ChatSection(page);
  }

  async goto(url: string): Promise<void> {
    await this.page.goto(url);
  }

  async openSetupModal(): Promise<SetupModal> {
    await this.page.getByTestId('btn-settings').click();
    const modal = new SetupModal(this.page);
    await modal.waitForReady();
    return modal;
  }

  async waitForSetupModal(): Promise<SetupModal> {
    const modal = new SetupModal(this.page);
    await modal.waitForReady();
    return modal;
  }

  async waitForRedirectBack(urlPattern: RegExp): Promise<void> {
    await this.page.waitForURL(urlPattern, { timeout: 30000 });
  }
}
