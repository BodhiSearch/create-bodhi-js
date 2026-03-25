import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class ChatSection extends BasePage {
  async expectModelsLoaded(): Promise<void> {
    await expect(this.page.getByTestId('model-selector')).not.toHaveText('No models loaded');
  }

  async selectModel(modelName: string): Promise<void> {
    await this.page.getByTestId('model-selector').click();
    await this.page.getByRole('option', { name: modelName }).click();
  }

  async sendMessageAndWaitForResponse(message: string): Promise<void> {
    await this.page.getByTestId('chat-input').fill(message);
    await this.page.getByTestId('send-button').click();
    await expect(this.page.getByTestId('message-user')).toBeVisible();
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

  // --- MCP Popover methods ---

  async openMcpsPopover(): Promise<void> {
    await this.page.getByTestId('mcps-popover-trigger').click();
    await expect(this.page.getByTestId('mcps-popover-content')).toBeVisible();
  }

  async closeMcpsPopover(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }

  async waitForMcpsToLoad(): Promise<void> {
    // Wait for either MCP rows to appear or empty state
    await expect(
      this.page.getByTestId('mcps-popover-content').locator('[data-testid^="mcp-row-"]').first()
    ).toBeVisible({ timeout: 15000 });
  }

  async enableMcpBySlug(slug: string): Promise<void> {
    // Find the MCP row containing the slug text and click its checkbox
    const mcpRows = this.page
      .getByTestId('mcps-popover-content')
      .locator('[data-testid^="mcp-row-"]');
    const count = await mcpRows.count();
    for (let i = 0; i < count; i++) {
      const text = await mcpRows.nth(i).textContent();
      if (text?.includes(slug)) {
        const checkbox = mcpRows.nth(i).locator('[data-testid^="mcp-checkbox-"]');
        await checkbox.click();
        return;
      }
    }
    throw new Error(`MCP with slug "${slug}" not found in popover`);
  }

  // --- Agentic chat methods ---

  async sendMessageAndWaitForAgenticResponse(message: string): Promise<void> {
    await this.page.getByTestId('chat-input').fill(message);
    await this.page.getByTestId('send-button').click();
    await expect(this.page.getByTestId('message-user')).toBeVisible();

    // Wait for tool call to appear
    await expect(this.page.getByTestId('tool-call-message')).toBeVisible({ timeout: 60000 });

    // Wait for tool call to complete (status shows "completed")
    await expect(this.page.getByTestId('tool-call-status').first()).toHaveText('completed', {
      timeout: 60000,
    });

    // Wait for final response to complete (streaming ends)
    await expect(this.page.getByTestId('chat-area')).toHaveAttribute('data-teststate', 'idle', {
      timeout: 120000,
    });
  }

  async getLastAssistantMessage(): Promise<string> {
    const messages = this.page.getByTestId('message-assistant');
    const count = await messages.count();
    return (await messages.nth(count - 1).textContent()) ?? '';
  }
}
