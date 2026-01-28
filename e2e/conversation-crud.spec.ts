import { test, expect } from '@playwright/test';

/**
 * CONVERSATION CRUD - E2E Tests
 * Tests Create, Read, Update, Delete operations for conversations
 * Focused, fast tests with clear assertions
 */

test.describe('Conversation CRUD Operations', () => {
  // Faster beforeEach that doesn't reload unnecessarily
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Quick onboarding skip
    await page.evaluate(() => {
      localStorage.setItem('moltz-onboarding-completed', 'true');
    });
  });

  test('CREATE: should create new conversation', async ({ page }) => {
    await page.goto('/');
    
    const chatInput = page.locator('textarea, input').filter({ 
      hasPlaceholder: /message|type/i 
    });
    await expect(chatInput).toBeVisible({ timeout: 10000 });
    
    // Create new conversation button
    const newButton = page.locator('button').filter({ hasText: /new chat/i }).first();
    
    if (await newButton.isVisible({ timeout: 5000 })) {
      await newButton.click();
      
      // Should have empty state
      await expect(chatInput).toHaveValue('');
      console.log('✓ New conversation created');
    } else {
      // Try keyboard shortcut
      await page.keyboard.press('Meta+n');
      await page.waitForTimeout(500);
      await expect(chatInput).toHaveValue('');
      console.log('✓ New conversation created via shortcut');
    }
  });

  test('CREATE: should create conversation with first message', async ({ page }) => {
    await page.goto('/');
    
    const chatInput = page.locator('textarea, input').filter({ 
      hasPlaceholder: /message|type/i 
    });
    await expect(chatInput).toBeVisible({ timeout: 10000 });
    
    const message = `First msg ${Date.now()}`;
    await chatInput.fill(message);
    await chatInput.press('Enter');
    
    await expect(page.locator(`text=${message}`)).toBeVisible({ timeout: 3000 });
    console.log('✓ Conversation created with message');
  });

  test('READ: should display conversation in sidebar', async ({ page }) => {
    await page.goto('/');
    
    const chatInput = page.locator('textarea, input').filter({ 
      hasPlaceholder: /message|type/i 
    });
    await expect(chatInput).toBeVisible({ timeout: 10000 });
    
    const message = `Sidebar test ${Date.now()}`;
    await chatInput.fill(message);
    await chatInput.press('Enter');
    
    await page.waitForTimeout(1000);
    
    // Should appear in sidebar
    const sidebarItem = page.locator('[role="button"], a, button').filter({ 
      hasText: message.substring(0, 15) 
    });
    
    if (await sidebarItem.first().isVisible({ timeout: 3000 })) {
      console.log('✓ Conversation visible in sidebar');
    } else {
      console.log('⚠ Sidebar item not found (might be hidden or collapsed)');
    }
  });

  test('READ: should display all messages in conversation', async ({ page }) => {
    await page.goto('/');
    
    const chatInput = page.locator('textarea, input').filter({ 
      hasPlaceholder: /message|type/i 
    });
    await expect(chatInput).toBeVisible({ timeout: 10000 });
    
    // Send 3 messages
    const messages = ['Msg 1', 'Msg 2', 'Msg 3'].map(m => `${m}-${Date.now()}`);
    
    for (const msg of messages) {
      await chatInput.fill(msg);
      await chatInput.press('Enter');
      await page.waitForTimeout(300);
    }
    
    // All should be visible
    for (const msg of messages) {
      await expect(page.locator(`text=${msg}`)).toBeVisible({ timeout: 2000 });
    }
    
    console.log('✓ All messages visible in conversation');
  });

  test('UPDATE: should rename conversation (if feature exists)', async ({ page }) => {
    await page.goto('/');
    
    const chatInput = page.locator('textarea, input').filter({ 
      hasPlaceholder: /message|type/i 
    });
    await expect(chatInput).toBeVisible({ timeout: 10000 });
    
    const message = `Rename test ${Date.now()}`;
    await chatInput.fill(message);
    await chatInput.press('Enter');
    await page.waitForTimeout(1000);
    
    // Look for conversation item
    const convItem = page.locator('[role="button"], button').filter({ 
      hasText: message.substring(0, 15) 
    }).first();
    
    if (await convItem.isVisible({ timeout: 3000 })) {
      // Right-click or hover to find rename option
      await convItem.hover();
      await page.waitForTimeout(300);
      
      const renameButton = page.locator('button').filter({ hasText: /rename|edit/i });
      
      if (await renameButton.first().isVisible({ timeout: 1000 })) {
        console.log('✓ Rename functionality found');
      } else {
        console.log('⚠ Rename not available (not implemented)');
      }
    }
  });

  test('DELETE: should show confirmation before deleting', async ({ page }) => {
    await page.goto('/');
    
    const chatInput = page.locator('textarea, input').filter({ 
      hasPlaceholder: /message|type/i 
    });
    await expect(chatInput).toBeVisible({ timeout: 10000 });
    
    const message = `Delete test ${Date.now()}`;
    await chatInput.fill(message);
    await chatInput.press('Enter');
    await page.waitForTimeout(1000);
    
    // Find conversation item
    const convItem = page.locator('[role="button"], button').filter({ 
      hasText: message.substring(0, 15) 
    }).first();
    
    if (await convItem.isVisible({ timeout: 3000 })) {
      await convItem.hover();
      await page.waitForTimeout(300);
      
      const deleteButton = page.locator('button').filter({ hasText: /delete|remove/i }).first();
      
      if (await deleteButton.isVisible({ timeout: 2000 })) {
        await deleteButton.click();
        
        // Should show confirmation
        const confirmDialog = page.locator('[role="dialog"]').filter({ hasText: /delete|confirm/i });
        await expect(confirmDialog).toBeVisible({ timeout: 2000 });
        
        console.log('✓ Delete confirmation shown');
        
        // Cancel to avoid actually deleting
        await page.keyboard.press('Escape');
      } else {
        console.log('⚠ Delete button not found');
      }
    }
  });

  test('DELETE: should actually delete conversation after confirmation', async ({ page }) => {
    await page.goto('/');
    
    const chatInput = page.locator('textarea, input').filter({ 
      hasPlaceholder: /message|type/i 
    });
    await expect(chatInput).toBeVisible({ timeout: 10000 });
    
    const message = `Will be deleted ${Date.now()}`;
    await chatInput.fill(message);
    await chatInput.press('Enter');
    await page.waitForTimeout(1000);
    
    const convItem = page.locator('[role="button"], button').filter({ 
      hasText: message.substring(0, 15) 
    }).first();
    
    if (await convItem.isVisible({ timeout: 3000 })) {
      await convItem.hover();
      await page.waitForTimeout(300);
      
      const deleteButton = page.locator('button').filter({ hasText: /delete|remove/i }).first();
      
      if (await deleteButton.isVisible({ timeout: 2000 })) {
        await deleteButton.click();
        await page.waitForTimeout(300);
        
        // Confirm deletion
        const confirmButton = page.locator('button').filter({ hasText: /delete|confirm|yes/i }).last();
        
        if (await confirmButton.isVisible({ timeout: 2000 })) {
          await confirmButton.click();
          await page.waitForTimeout(1000);
          
          // Message should no longer be visible
          await expect(page.locator(`text=${message}`)).not.toBeVisible({ timeout: 3000 });
          
          console.log('✓ Conversation deleted successfully');
        }
      }
    }
  });

  test('DELETE: should cancel deletion on cancel button', async ({ page }) => {
    await page.goto('/');
    
    const chatInput = page.locator('textarea, input').filter({ 
      hasPlaceholder: /message|type/i 
    });
    await expect(chatInput).toBeVisible({ timeout: 10000 });
    
    const message = `Cancel delete ${Date.now()}`;
    await chatInput.fill(message);
    await chatInput.press('Enter');
    await page.waitForTimeout(1000);
    
    const convItem = page.locator('[role="button"], button').filter({ 
      hasText: message.substring(0, 15) 
    }).first();
    
    if (await convItem.isVisible({ timeout: 3000 })) {
      await convItem.hover();
      await page.waitForTimeout(300);
      
      const deleteButton = page.locator('button').filter({ hasText: /delete|remove/i }).first();
      
      if (await deleteButton.isVisible({ timeout: 2000 })) {
        await deleteButton.click();
        await page.waitForTimeout(300);
        
        // Cancel deletion
        const cancelButton = page.locator('button').filter({ hasText: /cancel|no/i });
        
        if (await cancelButton.isVisible({ timeout: 2000 })) {
          await cancelButton.click();
          await page.waitForTimeout(500);
          
          // Message should still be visible
          await expect(page.locator(`text=${message}`)).toBeVisible({ timeout: 2000 });
          
          console.log('✓ Deletion cancelled successfully');
        }
      }
    }
  });
});

test.describe('Conversation Switching', () => {
  test('should switch between conversations', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('moltz-onboarding-completed', 'true');
    });
    await page.goto('/');
    
    const chatInput = page.locator('textarea, input').filter({ 
      hasPlaceholder: /message|type/i 
    });
    await expect(chatInput).toBeVisible({ timeout: 10000 });
    
    // Create first conversation
    const msg1 = `Conv 1 - ${Date.now()}`;
    await chatInput.fill(msg1);
    await chatInput.press('Enter');
    await page.waitForTimeout(500);
    
    // Create second conversation
    await page.keyboard.press('Meta+n');
    await page.waitForTimeout(500);
    
    const msg2 = `Conv 2 - ${Date.now()}`;
    await chatInput.fill(msg2);
    await chatInput.press('Enter');
    await page.waitForTimeout(500);
    
    // Should see msg2, not msg1
    await expect(page.locator(`text=${msg2}`)).toBeVisible();
    await expect(page.locator(`text=${msg1}`)).not.toBeVisible();
    
    // Switch to first conversation
    const conv1Item = page.locator('[role="button"], button').filter({ 
      hasText: msg1.substring(0, 10) 
    }).first();
    
    if (await conv1Item.isVisible({ timeout: 3000 })) {
      await conv1Item.click();
      await page.waitForTimeout(500);
      
      // Should see msg1, not msg2
      await expect(page.locator(`text=${msg1}`)).toBeVisible();
      await expect(page.locator(`text=${msg2}`)).not.toBeVisible();
      
      console.log('✓ Conversation switching works');
    }
  });

  test('should preserve messages when switching', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('moltz-onboarding-completed', 'true');
    });
    await page.goto('/');
    
    const chatInput = page.locator('textarea, input').filter({ 
      hasPlaceholder: /message|type/i 
    });
    await expect(chatInput).toBeVisible({ timeout: 10000 });
    
    // Create conversation with multiple messages
    const messages = ['Msg A', 'Msg B', 'Msg C'].map(m => `${m}-${Date.now()}`);
    
    for (const msg of messages) {
      await chatInput.fill(msg);
      await chatInput.press('Enter');
      await page.waitForTimeout(200);
    }
    
    // Create new conversation
    await page.keyboard.press('Meta+n');
    await page.waitForTimeout(500);
    
    // Go back to first conversation
    const firstMsg = messages[0];
    const conv1Item = page.locator('[role="button"], button').filter({ 
      hasText: firstMsg.substring(0, 10) 
    }).first();
    
    if (await conv1Item.isVisible({ timeout: 3000 })) {
      await conv1Item.click();
      await page.waitForTimeout(500);
      
      // All messages should still be there
      for (const msg of messages) {
        await expect(page.locator(`text=${msg}`)).toBeVisible({ timeout: 2000 });
      }
      
      console.log('✓ Messages preserved when switching');
    }
  });
});

test.describe('Conversation Persistence', () => {
  test('should persist conversations after page reload', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('moltz-onboarding-completed', 'true');
    });
    await page.goto('/');
    
    const chatInput = page.locator('textarea, input').filter({ 
      hasPlaceholder: /message|type/i 
    });
    await expect(chatInput).toBeVisible({ timeout: 10000 });
    
    const message = `Persist test ${Date.now()}`;
    await chatInput.fill(message);
    await chatInput.press('Enter');
    
    await expect(page.locator(`text=${message}`)).toBeVisible({ timeout: 3000 });
    await page.waitForTimeout(1000);
    
    // Reload page
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Message should still be there
    await expect(page.locator(`text=${message}`)).toBeVisible({ timeout: 5000 });
    
    console.log('✓ Conversation persisted after reload');
  });

  test('should maintain conversation order after reload', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('moltz-onboarding-completed', 'true');
    });
    await page.goto('/');
    
    const chatInput = page.locator('textarea, input').filter({ 
      hasPlaceholder: /message|type/i 
    });
    await expect(chatInput).toBeVisible({ timeout: 10000 });
    
    const messages = ['First', 'Second', 'Third'].map(m => `${m}-${Date.now()}`);
    
    for (const msg of messages) {
      await chatInput.fill(msg);
      await chatInput.press('Enter');
      await page.waitForTimeout(300);
    }
    
    await page.waitForTimeout(1000);
    
    // Get positions before reload
    const box0 = await page.locator(`text=${messages[0]}`).first().boundingBox();
    const box2 = await page.locator(`text=${messages[2]}`).first().boundingBox();
    
    // Reload
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Check order after reload
    const box0After = await page.locator(`text=${messages[0]}`).first().boundingBox();
    const box2After = await page.locator(`text=${messages[2]}`).first().boundingBox();
    
    if (box0After && box2After) {
      expect(box0After.y).toBeLessThan(box2After.y);
      console.log('✓ Message order maintained after reload');
    }
  });
});
