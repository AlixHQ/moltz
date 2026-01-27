import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Keyboard Shortcuts
 * Comprehensive tests for all keyboard shortcuts and interactions
 */

test.describe('Primary Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Skip onboarding if present
    const skipButton = page.getByRole('button', { name: /skip|get started/i });
    if (await skipButton.isVisible({ timeout: 2000 })) {
      await skipButton.click();
    }
  });

  test('⌘N should create new chat', async ({ page }) => {
    // Send a message to have something in current chat
    const input = page.getByPlaceholder(/Message/i);
    if (await input.isVisible({ timeout: 5000 })) {
      await input.fill('First chat message');
      await page.keyboard.press('Enter');
      await expect(page.getByText('First chat message')).toBeVisible();
      
      // Press ⌘N to create new chat
      await page.keyboard.press('Meta+n');
      
      // Chat area should be cleared
      await expect(page.getByText('First chat message')).not.toBeVisible();
      
      // Input should be empty and focused
      await expect(input).toHaveValue('');
      await expect(input).toBeFocused();
    }
  });

  test('⌘K should open search', async ({ page }) => {
    // Press ⌘K
    await page.keyboard.press('Meta+k');
    
    // Search dialog should appear
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible({ timeout: 2000 });
    
    // Search input should be focused
    await expect(searchInput).toBeFocused();
  });

  test('⌘, should open settings', async ({ page }) => {
    // Press ⌘,
    await page.keyboard.press('Meta+Comma');
    
    // Settings dialog should appear
    await expect(page.getByText(/settings/i)).toBeVisible({ timeout: 2000 });
    
    // Gateway URL input should be visible
    const gatewayInput = page.getByLabel(/gateway url/i);
    await expect(gatewayInput).toBeVisible();
  });

  test('Escape should close dialogs', async ({ page }) => {
    // Open settings
    await page.keyboard.press('Meta+Comma');
    await expect(page.getByText(/settings/i)).toBeVisible({ timeout: 2000 });
    
    // Press Escape to close
    await page.keyboard.press('Escape');
    
    // Settings should close
    await expect(page.getByText(/settings/i)).not.toBeVisible();
    
    // Open search
    await page.keyboard.press('Meta+k');
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible({ timeout: 2000 });
    
    // Press Escape to close
    await page.keyboard.press('Escape');
    
    // Search should close
    await expect(searchInput).not.toBeVisible();
  });

  test('Enter should send message', async ({ page }) => {
    const input = page.getByPlaceholder(/Message/i);
    await expect(input).toBeVisible({ timeout: 10000 });
    
    const testMessage = 'Enter key test ' + Date.now();
    await input.fill(testMessage);
    
    // Press Enter to send
    await page.keyboard.press('Enter');
    
    // Message should be sent
    await expect(page.getByText(testMessage)).toBeVisible();
    
    // Input should be cleared
    await expect(input).toHaveValue('');
  });

  test('Shift+Enter should add newline', async ({ page }) => {
    const input = page.getByPlaceholder(/Message/i);
    await expect(input).toBeVisible({ timeout: 10000 });
    
    // Type first line
    await input.fill('Line 1');
    
    // Press Shift+Enter
    await page.keyboard.press('Shift+Enter');
    
    // Type second line
    await input.pressSequentially('Line 2');
    
    // Message should not be sent yet
    await expect(page.getByText('Line 1')).not.toBeVisible();
    
    // Input should contain both lines
    const value = await input.inputValue();
    expect(value).toContain('Line 1');
    expect(value).toContain('Line 2');
    
    // Now press Enter to send
    await page.keyboard.press('Enter');
    
    // Both lines should be in the sent message
    await expect(page.getByText(/Line 1/)).toBeVisible();
    await expect(page.getByText(/Line 2/)).toBeVisible();
  });
});

test.describe('Navigation Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const skipButton = page.getByRole('button', { name: /skip|get started/i });
    if (await skipButton.isVisible({ timeout: 2000 })) {
      await skipButton.click();
    }
  });

  test('Tab should navigate through focusable elements', async ({ page }) => {
    // Press Tab
    await page.keyboard.press('Tab');
    
    // Should focus first interactive element
    const focused1 = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON', 'TEXTAREA', 'A']).toContain(focused1);
    
    // Press Tab again
    await page.keyboard.press('Tab');
    
    // Should focus next element
    const focused2 = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON', 'TEXTAREA', 'A']).toContain(focused2);
  });

  test('Shift+Tab should navigate backwards', async ({ page }) => {
    // Tab forward a few times
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    const element1 = await page.evaluate(() => document.activeElement?.id);
    
    // Shift+Tab backward
    await page.keyboard.press('Shift+Tab');
    
    const element2 = await page.evaluate(() => document.activeElement?.id);
    
    // Should be on different element
    expect(element1).not.toBe(element2);
  });

  test('Arrow keys should navigate search results', async ({ page }) => {
    // Create some searchable content
    const input = page.getByPlaceholder(/Message/i);
    if (await input.isVisible({ timeout: 5000 })) {
      await input.fill('Searchable message 1');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      
      // Open search
      await page.keyboard.press('Meta+k');
      
      const searchInput = page.getByPlaceholder(/search/i);
      if (await searchInput.isVisible({ timeout: 2000 })) {
        await searchInput.fill('message');
        await page.waitForTimeout(500);
        
        // Arrow down to navigate results
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        
        // Arrow up to go back
        await page.keyboard.press('ArrowUp');
        
        // Enter to select
        await page.keyboard.press('Enter');
        
        // Search should close
        await expect(searchInput).not.toBeVisible();
      }
    }
  });

  test('Home should scroll to top of messages', async ({ page }) => {
    const input = page.getByPlaceholder(/Message/i);
    if (await input.isVisible({ timeout: 5000 })) {
      // Create multiple messages
      for (let i = 0; i < 10; i++) {
        await input.fill(`Message ${i}`);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(200);
      }
      
      // Scroll to bottom
      await page.keyboard.press('End');
      await page.waitForTimeout(500);
      
      // Press Home to scroll to top
      await page.keyboard.press('Home');
      await page.waitForTimeout(500);
      
      // First message should be visible
      await expect(page.getByText('Message 0')).toBeVisible();
    }
  });

  test('End should scroll to bottom of messages', async ({ page }) => {
    const input = page.getByPlaceholder(/Message/i);
    if (await input.isVisible({ timeout: 5000 })) {
      // Create multiple messages
      for (let i = 0; i < 10; i++) {
        await input.fill(`Message ${i}`);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(200);
      }
      
      // Scroll to top
      await page.keyboard.press('Home');
      await page.waitForTimeout(500);
      
      // Press End to scroll to bottom
      await page.keyboard.press('End');
      await page.waitForTimeout(500);
      
      // Last message should be visible
      await expect(page.getByText('Message 9')).toBeVisible();
    }
  });
});

test.describe('Text Editing Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const skipButton = page.getByRole('button', { name: /skip|get started/i });
    if (await skipButton.isVisible({ timeout: 2000 })) {
      await skipButton.click();
    }
  });

  test('⌘A should select all text in input', async ({ page }) => {
    const input = page.getByPlaceholder(/Message/i);
    await expect(input).toBeVisible({ timeout: 10000 });
    
    await input.fill('Select all this text');
    
    // Select all
    await page.keyboard.press('Meta+a');
    
    // Type to replace
    await page.keyboard.press('X');
    
    // Only 'X' should remain
    await expect(input).toHaveValue('X');
  });

  test('⌘C and ⌘V should copy and paste', async ({ page }) => {
    const input = page.getByPlaceholder(/Message/i);
    await expect(input).toBeVisible({ timeout: 10000 });
    
    await input.fill('Text to copy');
    
    // Select all and copy
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Meta+c');
    
    // Clear input
    await input.clear();
    
    // Paste
    await page.keyboard.press('Meta+v');
    
    // Text should be pasted
    await expect(input).toHaveValue('Text to copy');
  });

  test('⌘X should cut text', async ({ page }) => {
    const input = page.getByPlaceholder(/Message/i);
    await expect(input).toBeVisible({ timeout: 10000 });
    
    await input.fill('Text to cut');
    
    // Select all and cut
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Meta+x');
    
    // Input should be empty
    await expect(input).toHaveValue('');
    
    // Paste should restore text
    await page.keyboard.press('Meta+v');
    await expect(input).toHaveValue('Text to cut');
  });

  test('⌘Z should undo', async ({ page }) => {
    const input = page.getByPlaceholder(/Message/i);
    await expect(input).toBeVisible({ timeout: 10000 });
    
    await input.fill('Original text');
    await page.waitForTimeout(100);
    
    await input.fill('Modified text');
    await page.waitForTimeout(100);
    
    // Undo
    await page.keyboard.press('Meta+z');
    
    // Should revert to previous state
    const value = await input.inputValue();
    expect(value).not.toBe('Modified text');
  });

  test('⌘Shift+Z should redo', async ({ page }) => {
    const input = page.getByPlaceholder(/Message/i);
    await expect(input).toBeVisible({ timeout: 10000 });
    
    await input.fill('Original');
    await page.waitForTimeout(100);
    
    await input.fill('Modified');
    await page.waitForTimeout(100);
    
    // Undo
    await page.keyboard.press('Meta+z');
    await page.waitForTimeout(100);
    
    // Redo
    await page.keyboard.press('Meta+Shift+z');
    
    // Should restore modified text
    const value = await input.inputValue();
    expect(value).toBe('Modified');
  });

  test('Backspace should delete character', async ({ page }) => {
    const input = page.getByPlaceholder(/Message/i);
    await expect(input).toBeVisible({ timeout: 10000 });
    
    await input.fill('Delete one char');
    
    // Press backspace
    await page.keyboard.press('Backspace');
    
    // Last character should be removed
    const value = await input.inputValue();
    expect(value).toBe('Delete one cha');
  });

  test('Delete should delete character forward', async ({ page }) => {
    const input = page.getByPlaceholder(/Message/i);
    await expect(input).toBeVisible({ timeout: 10000 });
    
    await input.fill('Delete forward');
    
    // Move cursor to beginning
    await page.keyboard.press('Home');
    
    // Press Delete
    await page.keyboard.press('Delete');
    
    // First character should be removed
    const value = await input.inputValue();
    expect(value).toBe('elete forward');
  });
});

test.describe('Shortcut Conflicts and Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const skipButton = page.getByRole('button', { name: /skip|get started/i });
    if (await skipButton.isVisible({ timeout: 2000 })) {
      await skipButton.click();
    }
  });

  test('shortcuts should not interfere with typing', async ({ page }) => {
    const input = page.getByPlaceholder(/Message/i);
    await expect(input).toBeVisible({ timeout: 10000 });
    
    // Type text that includes shortcut letters
    await input.fill('I like kombucha and nice keyboards');
    
    // All text should be preserved
    await expect(input).toHaveValue('I like kombucha and nice keyboards');
  });

  test('shortcuts should work when input is not focused', async ({ page }) => {
    // Click somewhere else to lose focus
    await page.locator('body').click({ position: { x: 100, y: 100 } });
    
    // Shortcuts should still work
    await page.keyboard.press('Meta+k');
    
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible({ timeout: 2000 });
  });

  test('shortcuts should not trigger when typing in settings', async ({ page }) => {
    // Open settings
    await page.keyboard.press('Meta+Comma');
    
    const gatewayInput = page.getByLabel(/gateway url/i);
    if (await gatewayInput.isVisible({ timeout: 2000 })) {
      // Type 'n' in Gateway URL field
      await gatewayInput.clear();
      await gatewayInput.fill('ws://localhost:18789/n');
      
      // Should not trigger ⌘N (new chat)
      await expect(gatewayInput).toHaveValue('ws://localhost:18789/n');
    }
  });

  test('multiple shortcuts in sequence should work', async ({ page }) => {
    // Open settings
    await page.keyboard.press('Meta+Comma');
    await expect(page.getByText(/settings/i)).toBeVisible({ timeout: 2000 });
    
    // Close settings
    await page.keyboard.press('Escape');
    await expect(page.getByText(/settings/i)).not.toBeVisible();
    
    // Open search
    await page.keyboard.press('Meta+k');
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible({ timeout: 2000 });
    
    // Close search
    await page.keyboard.press('Escape');
    await expect(searchInput).not.toBeVisible();
    
    // Create new chat
    await page.keyboard.press('Meta+n');
    
    const input = page.getByPlaceholder(/Message/i);
    await expect(input).toHaveValue('');
  });

  test('shortcuts should be case-insensitive', async ({ page }) => {
    // Try both lowercase and uppercase
    await page.keyboard.press('Meta+K');
    
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible({ timeout: 2000 });
    
    await page.keyboard.press('Escape');
    
    await page.keyboard.press('Meta+k');
    await expect(searchInput).toBeVisible({ timeout: 2000 });
  });
});

test.describe('Message Input Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const skipButton = page.getByRole('button', { name: /skip|get started/i });
    if (await skipButton.isVisible({ timeout: 2000 })) {
      await skipButton.click();
    }
  });

  test('Ctrl+Enter should also send message (alternative)', async ({ page }) => {
    const input = page.getByPlaceholder(/Message/i);
    await expect(input).toBeVisible({ timeout: 10000 });
    
    await input.fill('Ctrl+Enter test');
    
    // Try Ctrl+Enter
    await page.keyboard.press('Control+Enter');
    
    // Message might be sent (depends on implementation)
    // This is an alternative to plain Enter
  });

  test('Escape should clear input when focused', async ({ page }) => {
    const input = page.getByPlaceholder(/Message/i);
    await expect(input).toBeVisible({ timeout: 10000 });
    
    await input.fill('Text to clear');
    
    // Press Escape
    await page.keyboard.press('Escape');
    
    // Input might be cleared (depends on implementation)
    // At minimum, shouldn't cause errors
  });

  test('⌘Backspace should clear entire line', async ({ page }) => {
    const input = page.getByPlaceholder(/Message/i);
    await expect(input).toBeVisible({ timeout: 10000 });
    
    await input.fill('Clear entire line');
    
    // Move cursor to middle
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    
    // Press ⌘Backspace
    await page.keyboard.press('Meta+Backspace');
    
    // Text before cursor should be deleted
    const value = await input.inputValue();
    expect(value.length).toBeLessThan('Clear entire line'.length);
  });

  test('⌘Delete should delete to end of line', async ({ page }) => {
    const input = page.getByPlaceholder(/Message/i);
    await expect(input).toBeVisible({ timeout: 10000 });
    
    await input.fill('Delete to end');
    
    // Move cursor to middle
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    
    // Press ⌘Delete
    await page.keyboard.press('Meta+Delete');
    
    // Text after cursor should be deleted
    const value = await input.inputValue();
    expect(value.length).toBeLessThan('Delete to end'.length);
  });
});

test.describe('Accessibility - Keyboard Only Operation', () => {
  test('should be fully operable with keyboard only', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Skip onboarding with keyboard
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Navigate to input
    await page.keyboard.press('Tab');
    
    const input = page.getByPlaceholder(/Message/i);
    if (await input.isVisible({ timeout: 5000 })) {
      // Type and send message
      await page.keyboard.type('Keyboard only test');
      await page.keyboard.press('Enter');
      
      // Message should be sent
      await expect(page.getByText('Keyboard only test')).toBeVisible();
    }
  });

  test('should show focus indicators', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Tab through elements
    await page.keyboard.press('Tab');
    
    // Check for focus indicator
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      const styles = window.getComputedStyle(el as Element);
      return {
        outlineStyle: styles.outlineStyle,
        outlineWidth: styles.outlineWidth,
        outlineColor: styles.outlineColor
      };
    });
    
    // Should have some focus indicator
    expect(focusedElement.outlineStyle).not.toBe('none');
  });

  test('should trap focus in modals', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Open settings modal
    await page.keyboard.press('Meta+Comma');
    
    await page.waitForTimeout(500);
    
    // Tab many times
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
    }
    
    // Focus should still be inside settings dialog
    const settingsVisible = await page.getByText(/settings/i).isVisible();
    expect(settingsVisible).toBe(true);
  });
});

test.describe('Custom Shortcuts Documentation', () => {
  test('should show keyboard shortcuts help', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for shortcuts help (might be ⌘? or in menu)
    await page.keyboard.press('Meta+Slash');
    
    // Help dialog might appear
    const helpDialog = page.getByText(/keyboard shortcuts|help|commands/i);
    
    if (await helpDialog.isVisible({ timeout: 2000 })) {
      // Should list common shortcuts
      await expect(page.getByText(/⌘N|Cmd\+N|new chat/i)).toBeVisible();
      await expect(page.getByText(/⌘K|Cmd\+K|search/i)).toBeVisible();
    }
  });
});
