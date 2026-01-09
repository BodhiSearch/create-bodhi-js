import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class ChatSection extends BasePage {
  async expectModelsLoaded(): Promise<void> {
    await expect(this.page.getByTestId('model-selector')).not.toHaveText('No models loaded', {
      timeout: 30000,
    });
  }

  async selectModel(modelName: string): Promise<void> {
    await this.page.getByTestId('model-selector').click();
    await this.page.getByRole('option', { name: modelName }).click();
  }

  async sendMessageAndWaitForResponse(message: string): Promise<void> {
    await this.page.getByTestId('chat-input').fill(message);
    await this.page.getByTestId('send-button').click();
    await expect(this.page.getByTestId('message-user')).toBeVisible({ timeout: 10000 });
    await expect(this.page.getByTestId('chat-area')).toHaveAttribute(
      'data-teststate',
      'streaming',
      {
        timeout: 30000,
      }
    );
    await expect(this.page.getByTestId('chat-area')).toHaveAttribute('data-teststate', 'idle', {
      timeout: 60000,
    });
  }

  async expectAssistantResponseContains(pattern: RegExp): Promise<void> {
    await expect(this.page.getByTestId('message-assistant')).toBeVisible();
    await expect(this.page.getByTestId('message-assistant')).toContainText(pattern);
  }
}
