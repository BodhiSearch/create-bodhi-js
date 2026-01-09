import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class ConnectionSection extends BasePage {
  async expectClientNotReady(): Promise<void> {
    await expect(this.page.getByTestId('badge-client-status')).toHaveAttribute(
      'data-teststate',
      'not-ready'
    );
  }

  async expectClientReady(): Promise<void> {
    await expect(this.page.getByTestId('badge-client-status')).toHaveAttribute(
      'data-teststate',
      'ready'
    );
  }

  async expectServerReady(): Promise<void> {
    await expect(this.page.getByTestId('badge-server-status')).toHaveAttribute(
      'data-teststate',
      'ready'
    );
  }
}
