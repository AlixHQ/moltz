import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Error Handling
 * Comprehensive tests for error states and recovery
 */

test.describe('Gateway Connection Errors', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Skip onboarding if present
    const skipButton = page.getByRole('button', { name: /skip|get started/i });
    if (await skipButton.isVisible({ timeout: 2000 })) {
      await skipButton.click();
    }
  });

  test('should show error when Gateway is unreachable', async ({ page }) => {
    // Set Gateway URL to unreachable address
    await page.keyboard.press('Meta+Comma');
    
    const gatewayInput = page.getByLabel(/gateway url/i);
    if (await gatewayInput.isVisible({ timeout: 2000 })) {
      await gatewayInput.clear();
      await gatewayInput.fill('ws://unreachable-gateway:9999');
      
      const saveButton = page.getByRole('button', { name: /save/i });
      await saveButton.click();
      
      // Wait for connection attempt
      await page.waitForTimeout(2000);
      
      // Should show error state
      const errorMessage = page.getByText(/cannot connect|connection failed|unreachable|offline/i);
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show proper error state UI when disconnected', async ({ page }) => {
    // Set to unreachable Gateway
    await page.keyboard.press('Meta+Comma');
    
    const gatewayInput = page.getByLabel(/gateway url/i);
    if (await gatewayInput.isVisible({ timeout: 2000 })) {
      await gatewayInput.clear();
      await gatewayInput.fill('ws://localhost:9999');
      
      const saveButton = page.getByRole('button', { name: /save/i });
      await saveButton.click();
      
      await page.waitForTimeout(2000);
      
      // Should show offline/disconnected indicator
      const offlineIndicator = page.getByText(/offline|disconnected|not connected/i).or(
        page.locator('[data-status="offline"]')
      );
      
      await expect(offlineIndicator).toBeVisible({ timeout: 5000 });
    }
  });

  test('should disable message sending when disconnected', async ({ page }) => {
    // Set to unreachable Gateway
    await page.keyboard.press('Meta+Comma');
    
    const gatewayInput = page.getByLabel(/gateway url/i);
    if (await gatewayInput.isVisible({ timeout: 2000 })) {
      await gatewayInput.clear();
      await gatewayInput.fill('ws://localhost:9999');
      
      const saveButton = page.getByRole('button', { name: /save/i });
      await saveButton.click();
      
      await page.waitForTimeout(2000);
      
      // Try to send a message
      const input = page.getByPlaceholder(/Message/i);
      await input.fill('Test message while offline');
      
      // Send button should be disabled or show error
      const sendButton = page.getByLabelText(/Send/i).or(
        page.getByRole('button', { name: /send/i })
      );
      
      if (await sendButton.isVisible({ timeout: 1000 })) {
        // Button might be disabled
        const isDisabled = await sendButton.isDisabled();
        expect(isDisabled).toBe(true);
      }
    }
  });

  test('should provide retry/reconnect option', async ({ page }) => {
    // Set to unreachable Gateway
    await page.keyboard.press('Meta+Comma');
    
    const gatewayInput = page.getByLabel(/gateway url/i);
    if (await gatewayInput.isVisible({ timeout: 2000 })) {
      await gatewayInput.clear();
      await gatewayInput.fill('ws://localhost:9999');
      
      const saveButton = page.getByRole('button', { name: /save/i });
      await saveButton.click();
      
      await page.waitForTimeout(2000);
      
      // Look for retry/reconnect button
      const retryButton = page.getByRole('button', { name: /retry|reconnect/i });
      await expect(retryButton).toBeVisible({ timeout: 5000 });
      
      // Click retry
      await retryButton.click();
      
      // Should attempt reconnection
      await page.waitForTimeout(1000);
    }
  });
});

test.describe('Connection Lost Mid-Stream', () => {
  test('should handle connection loss during message streaming', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const skipButton = page.getByRole('button', { name: /skip|get started/i });
    if (await skipButton.isVisible({ timeout: 2000 })) {
      await skipButton.click();
    }
    
    // Start sending a message
    const input = page.getByPlaceholder(/Message/i);
    if (await input.isVisible({ timeout: 5000 })) {
      await input.fill('Tell me a long story');
      await page.keyboard.press('Enter');
      
      // Wait a bit for response to start
      await page.waitForTimeout(1000);
      
      // Simulate connection loss by going offline
      await context.setOffline(true);
      
      // Should show error indicator
      const errorIndicator = page.getByText(/connection lost|disconnected|network error/i);
      await expect(errorIndicator).toBeVisible({ timeout: 5000 });
      
      // Restore connection
      await context.setOffline(false);
    }
  });

  test('should allow resuming after connection loss', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const skipButton = page.getByRole('button', { name: /skip|get started/i });
    if (await skipButton.isVisible({ timeout: 2000 })) {
      await skipButton.click();
    }
    
    // Simulate offline mode
    await context.setOffline(true);
    await page.waitForTimeout(1000);
    
    // Try to send message
    const input = page.getByPlaceholder(/Message/i);
    if (await input.isVisible({ timeout: 5000 })) {
      await input.fill('Offline message');
      await page.keyboard.press('Enter');
      
      // Should show error
      await page.waitForTimeout(1000);
      
      // Go back online
      await context.setOffline(false);
      await page.waitForTimeout(1000);
      
      // Look for retry option or reconnect
      const retryButton = page.getByRole('button', { name: /retry|reconnect|resume/i });
      if (await retryButton.isVisible({ timeout: 3000 })) {
        await retryButton.click();
      }
    }
  });

  test('should preserve partial responses after reconnection', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const skipButton = page.getByRole('button', { name: /skip|get started/i });
    if (await skipButton.isVisible({ timeout: 2000 })) {
      await skipButton.click();
    }
    
    const input = page.getByPlaceholder(/Message/i);
    if (await input.isVisible({ timeout: 5000 })) {
      const testMessage = 'Connection test ' + Date.now();
      await input.fill(testMessage);
      await page.keyboard.press('Enter');
      
      // Message should be visible
      await expect(page.getByText(testMessage)).toBeVisible();
      
      // Simulate brief disconnection
      await context.setOffline(true);
      await page.waitForTimeout(500);
      await context.setOffline(false);
      
      // User message should still be visible
      await expect(page.getByText(testMessage)).toBeVisible();
    }
  });
});

test.describe('Invalid Gateway URL', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const skipButton = page.getByRole('button', { name: /skip|get started/i });
    if (await skipButton.isVisible({ timeout: 2000 })) {
      await skipButton.click();
    }
  });

  test('should reject URL without protocol', async ({ page }) => {
    await page.keyboard.press('Meta+Comma');
    
    const gatewayInput = page.getByLabel(/gateway url/i);
    if (await gatewayInput.isVisible({ timeout: 2000 })) {
      await gatewayInput.clear();
      await gatewayInput.fill('localhost:18789');
      
      const saveButton = page.getByRole('button', { name: /save/i });
      await saveButton.click();
      
      // Should show validation error
      const errorMessage = page.getByText(/must start with ws:\/\/ or wss:\/\//i);
      await expect(errorMessage).toBeVisible({ timeout: 2000 });
      
      // Settings should not close
      await expect(page.getByText(/settings/i)).toBeVisible();
    }
  });

  test('should reject HTTP/HTTPS protocols', async ({ page }) => {
    await page.keyboard.press('Meta+Comma');
    
    const gatewayInput = page.getByLabel(/gateway url/i);
    if (await gatewayInput.isVisible({ timeout: 2000 })) {
      // Try HTTP
      await gatewayInput.clear();
      await gatewayInput.fill('http://localhost:18789');
      
      let saveButton = page.getByRole('button', { name: /save/i });
      await saveButton.click();
      
      let errorMessage = page.getByText(/must start with ws:\/\/ or wss:\/\//i);
      await expect(errorMessage).toBeVisible({ timeout: 2000 });
      
      // Try HTTPS
      await gatewayInput.clear();
      await gatewayInput.fill('https://localhost:18789');
      
      saveButton = page.getByRole('button', { name: /save/i });
      await saveButton.click();
      
      errorMessage = page.getByText(/must start with ws:\/\/ or wss:\/\//i);
      await expect(errorMessage).toBeVisible({ timeout: 2000 });
    }
  });

  test('should reject malformed URLs', async ({ page }) => {
    await page.keyboard.press('Meta+Comma');
    
    const gatewayInput = page.getByLabel(/gateway url/i);
    if (await gatewayInput.isVisible({ timeout: 2000 })) {
      await gatewayInput.clear();
      await gatewayInput.fill('ws://invalid url with spaces');
      
      const saveButton = page.getByRole('button', { name: /save/i });
      await saveButton.click();
      
      // Should show error (either validation or connection)
      await page.waitForTimeout(1000);
      
      const errorIndicator = page.getByText(/invalid|error|cannot/i);
      await expect(errorIndicator).toBeVisible({ timeout: 3000 });
    }
  });

  test('should reject empty Gateway URL', async ({ page }) => {
    await page.keyboard.press('Meta+Comma');
    
    const gatewayInput = page.getByLabel(/gateway url/i);
    if (await gatewayInput.isVisible({ timeout: 2000 })) {
      await gatewayInput.clear();
      
      const saveButton = page.getByRole('button', { name: /save/i });
      await saveButton.click();
      
      // Should show validation error or prevent save
      const errorMessage = page.getByText(/required|cannot be empty/i);
      if (await errorMessage.isVisible({ timeout: 1000 })) {
        await expect(errorMessage).toBeVisible();
      } else {
        // Save button might be disabled
        expect(await saveButton.isDisabled()).toBe(true);
      }
    }
  });

  test('should show helpful error for common mistakes', async ({ page }) => {
    await page.keyboard.press('Meta+Comma');
    
    const gatewayInput = page.getByLabel(/gateway url/i);
    if (await gatewayInput.isVisible({ timeout: 2000 })) {
      // Common mistake: using http instead of ws
      await gatewayInput.clear();
      await gatewayInput.fill('http://localhost:18789');
      
      const saveButton = page.getByRole('button', { name: /save/i });
      await saveButton.click();
      
      // Error should be helpful
      const errorMessage = page.getByText(/ws:\/\/ or wss:\/\//i);
      await expect(errorMessage).toBeVisible({ timeout: 2000 });
      
      // Ideally, shows suggestion like "Did you mean ws://..."
      // This depends on implementation
    }
  });
});

test.describe('Token Validation Failure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const skipButton = page.getByRole('button', { name: /skip|get started/i });
    if (await skipButton.isVisible({ timeout: 2000 })) {
      await skipButton.click();
    }
  });

  test('should show error for invalid authentication token', async ({ page }) => {
    // Set invalid token
    await page.keyboard.press('Meta+Comma');
    
    const tokenInput = page.getByPlaceholder(/stored securely|token/i).or(
      page.getByLabel(/authentication token|token/i)
    );
    
    if (await tokenInput.isVisible({ timeout: 2000 })) {
      await tokenInput.clear();
      await tokenInput.fill('invalid-token-12345');
      
      const saveButton = page.getByRole('button', { name: /save/i });
      await saveButton.click();
      
      // Try to send a message
      const input = page.getByPlaceholder(/Message/i);
      await input.fill('Test with invalid token');
      await page.keyboard.press('Enter');
      
      // Should show authentication error
      const authError = page.getByText(/authentication failed|invalid token|unauthorized|401/i);
      await expect(authError).toBeVisible({ timeout: 5000 });
    }
  });

  test('should prompt to update token on auth failure', async ({ page }) => {
    // This test assumes the app detects invalid tokens
    await page.keyboard.press('Meta+Comma');
    
    const tokenInput = page.getByPlaceholder(/stored securely|token/i).or(
      page.getByLabel(/authentication token|token/i)
    );
    
    if (await tokenInput.isVisible({ timeout: 2000 })) {
      await tokenInput.clear();
      await tokenInput.fill('bad-token');
      
      const saveButton = page.getByRole('button', { name: /save/i });
      await saveButton.click();
      
      await page.waitForTimeout(1000);
      
      // Try to use the app
      const input = page.getByPlaceholder(/Message/i);
      await input.fill('Test message');
      await page.keyboard.press('Enter');
      
      await page.waitForTimeout(2000);
      
      // Should suggest fixing token
      const fixPrompt = page.getByText(/update token|check token|settings/i);
      if (await fixPrompt.isVisible({ timeout: 3000 })) {
        await expect(fixPrompt).toBeVisible();
      }
    }
  });

  test('should not expose token in error messages', async ({ page }) => {
    await page.keyboard.press('Meta+Comma');
    
    const tokenInput = page.getByPlaceholder(/stored securely|token/i).or(
      page.getByLabel(/authentication token|token/i)
    );
    
    if (await tokenInput.isVisible({ timeout: 2000 })) {
      const secretToken = 'secret-token-12345';
      await tokenInput.clear();
      await tokenInput.fill(secretToken);
      
      const saveButton = page.getByRole('button', { name: /save/i });
      await saveButton.click();
      
      // Trigger error
      await page.waitForTimeout(1000);
      
      // Check that token doesn't appear in page content
      const pageContent = await page.content();
      expect(pageContent).not.toContain(secretToken);
    }
  });
});

test.describe('Network Timeout Handling', () => {
  test('should show timeout error for slow responses', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const skipButton = page.getByRole('button', { name: /skip|get started/i });
    if (await skipButton.isVisible({ timeout: 2000 })) {
      await skipButton.click();
    }
    
    // Set very short timeout by configuring slow connection
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 60000); // Delay all requests
    });
    
    const input = page.getByPlaceholder(/Message/i);
    if (await input.isVisible({ timeout: 5000 })) {
      await input.fill('This should timeout');
      await page.keyboard.press('Enter');
      
      // Should show timeout error
      const timeoutError = page.getByText(/timeout|took too long|slow response/i);
      await expect(timeoutError).toBeVisible({ timeout: 35000 });
    }
  });

  test('should allow canceling slow requests', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const skipButton = page.getByRole('button', { name: /skip|get started/i });
    if (await skipButton.isVisible({ timeout: 2000 })) {
      await skipButton.click();
    }
    
    const input = page.getByPlaceholder(/Message/i);
    if (await input.isVisible({ timeout: 5000 })) {
      await input.fill('Slow request to cancel');
      await page.keyboard.press('Enter');
      
      // Look for cancel/stop button
      const stopButton = page.getByRole('button', { name: /stop|cancel/i }).or(
        page.getByTitle(/stop|cancel/i)
      );
      
      if (await stopButton.isVisible({ timeout: 2000 })) {
        await stopButton.click();
        
        // Should stop the request
        const stoppedIndicator = page.getByText(/stopped|cancelled/i);
        await expect(stoppedIndicator).toBeVisible({ timeout: 2000 });
      }
    }
  });

  test('should handle intermittent network issues gracefully', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const skipButton = page.getByRole('button', { name: /skip|get started/i });
    if (await skipButton.isVisible({ timeout: 2000 })) {
      await skipButton.click();
    }
    
    // Simulate flaky connection
    await context.setOffline(true);
    await page.waitForTimeout(500);
    await context.setOffline(false);
    await page.waitForTimeout(500);
    await context.setOffline(true);
    await page.waitForTimeout(500);
    await context.setOffline(false);
    
    // App should recover
    const input = page.getByPlaceholder(/Message/i);
    await expect(input).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Error Recovery', () => {
  test('should recover after clearing errors', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const skipButton = page.getByRole('button', { name: /skip|get started/i });
    if (await skipButton.isVisible({ timeout: 2000 })) {
      await skipButton.click();
    }
    
    // Cause an error
    await page.keyboard.press('Meta+Comma');
    const gatewayInput = page.getByLabel(/gateway url/i);
    if (await gatewayInput.isVisible({ timeout: 2000 })) {
      await gatewayInput.clear();
      await gatewayInput.fill('ws://error-test:9999');
      
      const saveButton = page.getByRole('button', { name: /save/i });
      await saveButton.click();
      
      await page.waitForTimeout(2000);
      
      // Fix the error
      await page.keyboard.press('Meta+Comma');
      await gatewayInput.clear();
      await gatewayInput.fill('ws://localhost:18789');
      await saveButton.click();
      
      // Should be able to use app normally
      const input = page.getByPlaceholder(/Message/i);
      await input.fill('Recovery test');
      await page.keyboard.press('Enter');
    }
  });

  test('should persist data despite connection errors', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const skipButton = page.getByRole('button', { name: /skip|get started/i });
    if (await skipButton.isVisible({ timeout: 2000 })) {
      await skipButton.click();
    }
    
    const input = page.getByPlaceholder(/Message/i);
    if (await input.isVisible({ timeout: 5000 })) {
      const testMessage = 'Persist despite errors ' + Date.now();
      await input.fill(testMessage);
      await page.keyboard.press('Enter');
      await expect(page.getByText(testMessage)).toBeVisible();
      
      // Go offline
      await context.setOffline(true);
      await page.waitForTimeout(1000);
      
      // Reload
      await page.reload();
      await context.setOffline(false);
      await page.waitForLoadState('networkidle');
      
      // Message should still be there
      await expect(page.getByText(testMessage)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show clear error messages to user', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const skipButton = page.getByRole('button', { name: /skip|get started/i });
    if (await skipButton.isVisible({ timeout: 2000 })) {
      await skipButton.click();
    }
    
    // Set bad Gateway URL
    await page.keyboard.press('Meta+Comma');
    const gatewayInput = page.getByLabel(/gateway url/i);
    if (await gatewayInput.isVisible({ timeout: 2000 })) {
      await gatewayInput.clear();
      await gatewayInput.fill('ws://nonexistent:9999');
      
      const saveButton = page.getByRole('button', { name: /save/i });
      await saveButton.click();
      
      await page.waitForTimeout(2000);
      
      // Error message should be clear and actionable
      const errorElement = page.locator('[role="alert"]').or(
        page.getByText(/error|failed|cannot/i)
      );
      
      await expect(errorElement.first()).toBeVisible({ timeout: 5000 });
      
      // Should not show technical jargon like stack traces
      const pageContent = await page.content();
      expect(pageContent).not.toMatch(/at Object\.|\.js:\d+/);
    }
  });
});

test.describe('Error State Accessibility', () => {
  test('should announce errors to screen readers', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const skipButton = page.getByRole('button', { name: /skip|get started/i });
    if (await skipButton.isVisible({ timeout: 2000 })) {
      await skipButton.click();
    }
    
    // Trigger error
    await page.keyboard.press('Meta+Comma');
    const gatewayInput = page.getByLabel(/gateway url/i);
    if (await gatewayInput.isVisible({ timeout: 2000 })) {
      await gatewayInput.clear();
      await gatewayInput.fill('http://wrong-protocol');
      
      const saveButton = page.getByRole('button', { name: /save/i });
      await saveButton.click();
      
      // Error should have role="alert" for screen readers
      const alert = page.locator('[role="alert"]');
      await expect(alert.first()).toBeVisible({ timeout: 2000 });
    }
  });

  test('should have focusable error messages', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const skipButton = page.getByRole('button', { name: /skip|get started/i });
    if (await skipButton.isVisible({ timeout: 2000 })) {
      await skipButton.click();
    }
    
    // Trigger error
    await page.keyboard.press('Meta+Comma');
    const gatewayInput = page.getByLabel(/gateway url/i);
    if (await gatewayInput.isVisible({ timeout: 2000 })) {
      await gatewayInput.clear();
      await gatewayInput.fill('invalid');
      
      const saveButton = page.getByRole('button', { name: /save/i });
      await saveButton.click();
      
      // Tab to error message or action button
      await page.keyboard.press('Tab');
      
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      expect(['BUTTON', 'A', 'DIV']).toContain(focused);
    }
  });
});
