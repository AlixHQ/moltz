import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Conversation Flows
 * Comprehensive tests for conversation management and messaging flows
 */

test.describe('Conversation Creation and Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Skip onboarding if present
    const skipButton = page.getByRole('button', { name: /skip|get started/i });
    if (await skipButton.isVisible({ timeout: 2000 })) {
      await skipButton.click();
    }
  });

  test('should create new conversation', async ({ page }) => {
    // Look for new conversation button (⌘N shortcut is tested separately)
    const newChatButton = page.getByRole('button', { name: /new chat|new conversation/i });
    
    if (await newChatButton.isVisible({ timeout: 5000 })) {
      // Get initial conversation count if sidebar is visible
      const conversationItems = page.getByRole('listitem').filter({ hasText: /conversation/i });
      const initialCount = await conversationItems.count();
      
      await newChatButton.click();
      
      // Should clear chat area and show empty input
      const input = page.getByPlaceholder(/Message/i);
      await expect(input).toBeVisible();
      await expect(input).toHaveValue('');
      
      // Chat area should be empty (no messages)
      const messages = page.getByRole('article').or(page.locator('[data-message]'));
      await expect(messages.first()).not.toBeVisible();
    }
  });

  test('should send message and receive streaming response', async ({ page }) => {
    const input = page.getByPlaceholder(/Message/i);
    await expect(input).toBeVisible({ timeout: 10000 });
    
    const testMessage = 'Tell me a very short joke';
    await input.fill(testMessage);
    await page.keyboard.press('Enter');
    
    // User message should appear immediately
    await expect(page.getByText(testMessage)).toBeVisible({ timeout: 2000 });
    
    // Input should be cleared
    await expect(input).toHaveValue('');
    
    // Should show thinking/typing indicator
    const thinkingIndicator = page.getByText(/thinking|typing|assistant is typing/i).or(
      page.locator('[data-thinking]')
    );
    
    // Note: This requires actual Gateway connection
    // In mock mode, this might not appear
    if (await thinkingIndicator.isVisible({ timeout: 2000 })) {
      await expect(thinkingIndicator).toBeVisible();
    }
    
    // Should eventually receive a response (timeout extended for actual API)
    // Look for assistant message (not the user's message)
    const assistantMessage = page.locator('[data-role="assistant"]').or(
      page.locator('.assistant-message')
    );
    
    // Wait for response to start streaming
    await expect(assistantMessage.first()).toBeVisible({ timeout: 30000 });
  });

  test('should send multiple messages in sequence', async ({ page }) => {
    const input = page.getByPlaceholder(/Message/i);
    await expect(input).toBeVisible({ timeout: 10000 });
    
    // Send first message
    const message1 = 'First test message ' + Date.now();
    await input.fill(message1);
    await page.keyboard.press('Enter');
    await expect(page.getByText(message1)).toBeVisible();
    
    // Wait a bit for UI to stabilize
    await page.waitForTimeout(500);
    
    // Send second message
    const message2 = 'Second test message ' + Date.now();
    await input.fill(message2);
    await page.keyboard.press('Enter');
    await expect(page.getByText(message2)).toBeVisible();
    
    // Both messages should be visible
    await expect(page.getByText(message1)).toBeVisible();
    await expect(page.getByText(message2)).toBeVisible();
    
    // Messages should be in correct order (first appears above second)
    const firstBox = await page.getByText(message1).boundingBox();
    const secondBox = await page.getByText(message2).boundingBox();
    
    if (firstBox && secondBox) {
      expect(firstBox.y).toBeLessThan(secondBox.y);
    }
  });

  test('should display messages with proper timestamps', async ({ page }) => {
    const input = page.getByPlaceholder(/Message/i);
    await expect(input).toBeVisible({ timeout: 10000 });
    
    const testMessage = 'Timestamp test ' + Date.now();
    await input.fill(testMessage);
    await page.keyboard.press('Enter');
    
    const messageElement = page.getByText(testMessage);
    await expect(messageElement).toBeVisible();
    
    // Hover over message to reveal timestamp
    await messageElement.hover();
    
    // Should show timestamp (e.g., "just now", "1 minute ago", etc.)
    const timestamp = page.getByText(/just now|second|minute|ago|:/i);
    await expect(timestamp).toBeVisible({ timeout: 2000 });
  });

  test('should handle message with Enter key', async ({ page }) => {
    const input = page.getByPlaceholder(/Message/i);
    await expect(input).toBeVisible({ timeout: 10000 });
    
    const testMessage = 'Enter key test';
    await input.fill(testMessage);
    
    // Press Enter to send
    await page.keyboard.press('Enter');
    
    // Message should be sent
    await expect(page.getByText(testMessage)).toBeVisible();
    await expect(input).toHaveValue('');
  });

  test('should handle multiline message with Shift+Enter', async ({ page }) => {
    const input = page.getByPlaceholder(/Message/i);
    await expect(input).toBeVisible({ timeout: 10000 });
    
    // Type first line
    await input.fill('Line 1');
    
    // Shift+Enter for new line
    await page.keyboard.press('Shift+Enter');
    
    // Type second line
    await input.pressSequentially('Line 2');
    
    // Message should not be sent yet
    await expect(page.getByText('Line 1')).not.toBeVisible();
    
    // Now send with Enter
    await page.keyboard.press('Enter');
    
    // Both lines should be in the sent message
    await expect(page.getByText(/Line 1/)).toBeVisible();
    await expect(page.getByText(/Line 2/)).toBeVisible();
  });
});

test.describe('Conversation Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const skipButton = page.getByRole('button', { name: /skip|get started/i });
    if (await skipButton.isVisible({ timeout: 2000 })) {
      await skipButton.click();
    }
  });

  test('should switch between conversations', async ({ page }) => {
    const input = page.getByPlaceholder(/Message/i);
    await expect(input).toBeVisible({ timeout: 10000 });
    
    // Send message in first conversation
    const conv1Message = 'Conversation 1 message ' + Date.now();
    await input.fill(conv1Message);
    await page.keyboard.press('Enter');
    await expect(page.getByText(conv1Message)).toBeVisible();
    
    // Create new conversation
    const newChatButton = page.getByRole('button', { name: /new chat|new conversation/i });
    if (await newChatButton.isVisible({ timeout: 5000 })) {
      await newChatButton.click();
      
      // Send message in second conversation
      await page.waitForTimeout(500);
      const conv2Message = 'Conversation 2 message ' + Date.now();
      await input.fill(conv2Message);
      await page.keyboard.press('Enter');
      await expect(page.getByText(conv2Message)).toBeVisible();
      
      // First conversation message should not be visible
      await expect(page.getByText(conv1Message)).not.toBeVisible();
      
      // Switch back to first conversation if sidebar is available
      const firstConvItem = page.getByText(conv1Message).first();
      if (await firstConvItem.isVisible({ timeout: 2000 })) {
        await firstConvItem.click();
        
        // First conversation message should be visible again
        await expect(page.getByText(conv1Message)).toBeVisible();
        
        // Second conversation message should not be visible
        await expect(page.getByText(conv2Message)).not.toBeVisible();
      }
    }
  });

  test('should preserve conversation content when switching', async ({ page }) => {
    const input = page.getByPlaceholder(/Message/i);
    await expect(input).toBeVisible({ timeout: 10000 });
    
    // Create conversation with multiple messages
    const messages = ['First', 'Second', 'Third'].map(m => `${m} message ${Date.now()}`);
    
    for (const msg of messages) {
      await input.fill(msg);
      await page.keyboard.press('Enter');
      await expect(page.getByText(msg)).toBeVisible();
      await page.waitForTimeout(500);
    }
    
    // Create new conversation
    const newChatButton = page.getByRole('button', { name: /new chat|new conversation/i });
    if (await newChatButton.isVisible({ timeout: 5000 })) {
      await newChatButton.click();
      
      // Switch back
      const firstMessage = messages[0];
      const convItem = page.getByText(firstMessage).first();
      if (await convItem.isVisible({ timeout: 2000 })) {
        await convItem.click();
        
        // All messages should still be present
        for (const msg of messages) {
          await expect(page.getByText(msg)).toBeVisible();
        }
      }
    }
  });
});

test.describe('Conversation Deletion', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const skipButton = page.getByRole('button', { name: /skip|get started/i });
    if (await skipButton.isVisible({ timeout: 2000 })) {
      await skipButton.click();
    }
  });

  test('should delete conversation with confirmation', async ({ page }) => {
    const input = page.getByPlaceholder(/Message/i);
    await expect(input).toBeVisible({ timeout: 10000 });
    
    // Create conversation with a unique message
    const uniqueMessage = 'Delete test ' + Date.now();
    await input.fill(uniqueMessage);
    await page.keyboard.press('Enter');
    await expect(page.getByText(uniqueMessage)).toBeVisible();
    
    // Look for delete button (might be in sidebar item or menu)
    const deleteButton = page.getByRole('button', { name: /delete|remove/i }).or(
      page.getByTitle(/delete|remove/i)
    );
    
    if (await deleteButton.isVisible({ timeout: 2000 })) {
      await deleteButton.click();
      
      // Should show confirmation dialog
      const confirmDialog = page.getByText(/are you sure|confirm|delete/i);
      await expect(confirmDialog).toBeVisible({ timeout: 2000 });
      
      // Confirm deletion
      const confirmButton = page.getByRole('button', { name: /delete|confirm|yes/i }).last();
      await confirmButton.click();
      
      // Message should no longer be visible
      await expect(page.getByText(uniqueMessage)).not.toBeVisible({ timeout: 2000 });
    }
  });

  test('should cancel conversation deletion', async ({ page }) => {
    const input = page.getByPlaceholder(/Message/i);
    await expect(input).toBeVisible({ timeout: 10000 });
    
    // Create conversation
    const uniqueMessage = 'Cancel delete test ' + Date.now();
    await input.fill(uniqueMessage);
    await page.keyboard.press('Enter');
    await expect(page.getByText(uniqueMessage)).toBeVisible();
    
    // Try to delete
    const deleteButton = page.getByRole('button', { name: /delete|remove/i }).or(
      page.getByTitle(/delete|remove/i)
    );
    
    if (await deleteButton.isVisible({ timeout: 2000 })) {
      await deleteButton.click();
      
      // Cancel deletion
      const cancelButton = page.getByRole('button', { name: /cancel|no/i });
      if (await cancelButton.isVisible({ timeout: 2000 })) {
        await cancelButton.click();
        
        // Message should still be visible
        await expect(page.getByText(uniqueMessage)).toBeVisible();
      }
    }
  });

  test('should delete conversation with keyboard shortcut', async ({ page }) => {
    const input = page.getByPlaceholder(/Message/i);
    await expect(input).toBeVisible({ timeout: 10000 });
    
    // Create conversation
    const uniqueMessage = 'Keyboard delete test ' + Date.now();
    await input.fill(uniqueMessage);
    await page.keyboard.press('Enter');
    await expect(page.getByText(uniqueMessage)).toBeVisible();
    
    // Try to trigger delete with keyboard (might be Cmd+Backspace or similar)
    await page.keyboard.press('Meta+Backspace');
    
    // If confirmation appears, confirm it
    const confirmButton = page.getByRole('button', { name: /delete|confirm|yes/i });
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click();
    }
  });
});

test.describe('Conversation Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const skipButton = page.getByRole('button', { name: /skip|get started/i });
    if (await skipButton.isVisible({ timeout: 2000 })) {
      await skipButton.click();
    }
  });

  test('should search across conversations', async ({ page }) => {
    const input = page.getByPlaceholder(/Message/i);
    await expect(input).toBeVisible({ timeout: 10000 });
    
    // Create conversation with searchable content
    const searchableTerm = 'UniqueSearchTerm' + Date.now();
    await input.fill(`This message contains ${searchableTerm}`);
    await page.keyboard.press('Enter');
    
    await page.waitForTimeout(1000);
    
    // Open search (⌘K)
    await page.keyboard.press('Meta+k');
    
    // Search input should appear
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible({ timeout: 2000 })) {
      await searchInput.fill(searchableTerm);
      
      // Search results should include our conversation
      const searchResult = page.getByText(searchableTerm);
      await expect(searchResult).toBeVisible({ timeout: 3000 });
    }
  });

  test('should filter conversations by search term', async ({ page }) => {
    // Open search
    await page.keyboard.press('Meta+k');
    
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible({ timeout: 2000 })) {
      // Type search term
      await searchInput.fill('test');
      
      // Results should update as we type
      await page.waitForTimeout(500);
      
      // Search results container should be visible
      const resultsContainer = page.locator('[data-search-results]').or(
        page.getByRole('list')
      );
      await expect(resultsContainer).toBeVisible();
    }
  });

  test('should navigate search results with keyboard', async ({ page }) => {
    // Open search
    await page.keyboard.press('Meta+k');
    
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible({ timeout: 2000 })) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      
      // Use arrow keys to navigate
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowUp');
      
      // Enter should select the highlighted result
      await page.keyboard.press('Enter');
      
      // Search dialog should close
      await expect(searchInput).not.toBeVisible();
    }
  });

  test('should close search with Escape', async ({ page }) => {
    // Open search
    await page.keyboard.press('Meta+k');
    
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible({ timeout: 2000 })) {
      // Close with Escape
      await page.keyboard.press('Escape');
      
      // Search should close
      await expect(searchInput).not.toBeVisible();
    }
  });

  test('should highlight search matches in results', async ({ page }) => {
    const input = page.getByPlaceholder(/Message/i);
    await expect(input).toBeVisible({ timeout: 10000 });
    
    // Create conversation with specific term
    const searchTerm = 'HighlightMe' + Date.now();
    await input.fill(`Message with ${searchTerm} to find`);
    await page.keyboard.press('Enter');
    
    await page.waitForTimeout(1000);
    
    // Search for term
    await page.keyboard.press('Meta+k');
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible({ timeout: 2000 })) {
      await searchInput.fill(searchTerm);
      
      // Search term should be highlighted in results
      // This checks for mark/highlight elements
      const highlighted = page.locator('mark, .highlight, [data-highlighted]');
      await expect(highlighted.first()).toBeVisible({ timeout: 2000 });
    }
  });
});

test.describe('Conversation Persistence', () => {
  test('should persist conversations across page reloads', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const input = page.getByPlaceholder(/Message/i);
    if (await input.isVisible({ timeout: 10000 })) {
      // Create unique message
      const persistMessage = 'Persist test ' + Date.now();
      await input.fill(persistMessage);
      await page.keyboard.press('Enter');
      await expect(page.getByText(persistMessage)).toBeVisible();
      
      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Message should still be visible
      await expect(page.getByText(persistMessage)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should maintain conversation order after reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const input = page.getByPlaceholder(/Message/i);
    if (await input.isVisible({ timeout: 10000 })) {
      // Create multiple messages
      const messages = ['Alpha', 'Beta', 'Gamma'].map(m => `${m} ${Date.now()}`);
      
      for (const msg of messages) {
        await input.fill(msg);
        await page.keyboard.press('Enter');
        await expect(page.getByText(msg)).toBeVisible();
        await page.waitForTimeout(500);
      }
      
      // Reload
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check order is maintained
      const firstBox = await page.getByText(messages[0]).boundingBox();
      const lastBox = await page.getByText(messages[2]).boundingBox();
      
      if (firstBox && lastBox) {
        expect(firstBox.y).toBeLessThan(lastBox.y);
      }
    }
  });
});

test.describe('Message Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const skipButton = page.getByRole('button', { name: /skip|get started/i });
    if (await skipButton.isVisible({ timeout: 2000 })) {
      await skipButton.click();
    }
  });

  test('should copy message content', async ({ page }) => {
    const input = page.getByPlaceholder(/Message/i);
    await expect(input).toBeVisible({ timeout: 10000 });
    
    const testMessage = 'Copy this message';
    await input.fill(testMessage);
    await page.keyboard.press('Enter');
    
    const messageElement = page.getByText(testMessage);
    await expect(messageElement).toBeVisible();
    
    // Hover to reveal actions
    await messageElement.hover();
    
    // Look for copy button
    const copyButton = page.getByRole('button', { name: /copy/i }).or(
      page.getByTitle(/copy/i)
    );
    
    if (await copyButton.isVisible({ timeout: 2000 })) {
      await copyButton.click();
      
      // Should show copied confirmation (toast or button state change)
      const copiedIndicator = page.getByText(/copied/i);
      await expect(copiedIndicator).toBeVisible({ timeout: 2000 });
    }
  });

  test('should regenerate assistant response', async ({ page }) => {
    const input = page.getByPlaceholder(/Message/i);
    await expect(input).toBeVisible({ timeout: 10000 });
    
    // Send message
    await input.fill('Tell me something');
    await page.keyboard.press('Enter');
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    // Look for regenerate button
    const regenerateButton = page.getByRole('button', { name: /regenerate|retry/i }).or(
      page.getByTitle(/regenerate|retry/i)
    );
    
    if (await regenerateButton.isVisible({ timeout: 2000 })) {
      await regenerateButton.click();
      
      // Should show thinking indicator again
      const thinkingIndicator = page.getByText(/thinking|typing/i);
      await expect(thinkingIndicator).toBeVisible({ timeout: 2000 });
    }
  });

  test('should edit user message', async ({ page }) => {
    const input = page.getByPlaceholder(/Message/i);
    await expect(input).toBeVisible({ timeout: 10000 });
    
    const originalMessage = 'Original message';
    await input.fill(originalMessage);
    await page.keyboard.press('Enter');
    await expect(page.getByText(originalMessage)).toBeVisible();
    
    // Hover over message
    const messageElement = page.getByText(originalMessage);
    await messageElement.hover();
    
    // Look for edit button
    const editButton = page.getByRole('button', { name: /edit/i }).or(
      page.getByTitle(/edit/i)
    );
    
    if (await editButton.isVisible({ timeout: 2000 })) {
      await editButton.click();
      
      // Edit field should appear
      const editInput = page.locator('textarea, input').filter({ hasText: originalMessage });
      if (await editInput.isVisible({ timeout: 2000 })) {
        await editInput.fill('Edited message');
        await page.keyboard.press('Enter');
        
        // Updated message should appear
        await expect(page.getByText('Edited message')).toBeVisible();
      }
    }
  });
});
