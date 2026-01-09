import { FrameLocator, Page } from '@playwright/test';

export class SetupModal {
  private readonly iframe: FrameLocator;

  constructor(private readonly page: Page) {
    this.iframe = page.frameLocator('iframe[data-testid="iframe-setup"]');
  }

  async waitForReady(): Promise<void> {
    await this.iframe.getByTestId('div-setup-modal').waitFor({ state: 'attached' });
  }

  async setupDirectConnection(url: string): Promise<void> {
    await this.iframe.getByTestId('server-confirm-checkbox').click();
    await this.iframe.getByTestId('lna-url-input').waitFor({ state: 'visible' });
    await this.iframe.getByTestId('lna-url-input').fill(url);
    await this.iframe.getByTestId('lna-connect-button').click();
    await this.iframe.getByTestId('continue-button').waitFor({ state: 'visible' });
    await this.iframe.getByTestId('continue-button').click();
  }
}
