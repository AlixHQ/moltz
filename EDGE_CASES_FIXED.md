# Edge Cases & Robustness Improvements

## Completed Fixes

### 1. ✅ Double Submit Prevention
- **Issue:** Rapid clicking "Send" could submit duplicate messages
- **Fix:** Added `isSending` check in `handleSend()` and `canSend` logic
- **Files:** `ChatInput.tsx`
- **Commit:** `fix: prevent double-submit in ChatInput`

### 2. ✅ Message Length Validation
- **Issue:** Very long messages (>100k chars) could crash UI or cause DB issues
- **Fix:** Added MAX_MESSAGE_LENGTH (100k) validation with character counter
- **Files:** `ChatInput.tsx`
- **Commit:** `fix: add max message length validation (100k chars) with counter`

### 3. ✅ Conversation Title Length Limits
- **Issue:** Very long conversation titles could overflow UI
- **Fix:** Enforced 60 char limit for auto-generated titles, 100 for manual, with whitespace normalization
- **Files:** `stores/store.ts`
- **Commit:** `fix: enforce conversation title length limits (60 auto, 100 manual)`

### 4. ✅ File Attachment Edge Cases
- **Issue:** Empty files (0 bytes) could be attached; no limit on attachment count
- **Fix:** Reject empty files, enforce max 10 attachments per message
- **Files:** `ChatInput.tsx`
- **Commit:** `fix: add file attachment validation (empty files, max 10 attachments)`

### 5. ✅ Database Corruption Detection
- **Issue:** Corrupted messages silently skipped, confusing users
- **Fix:** Track corrupted data count, notify user on load with stats
- **Files:** `lib/persistence.ts`, `App.tsx`
- **Commit:** `fix: detect and report corrupted data on load with user notification`

### 6. ✅ Network Request Timeouts
- **Issue:** `invoke()` calls could hang indefinitely if backend doesn't respond
- **Fix:** Created `invokeWithTimeout()` wrapper with 60s timeout for all `send_message` calls
- **Files:** `lib/invoke-with-timeout.ts`, `ChatView.tsx`
- **Commit:** `fix: add 60s timeout to all send_message requests to prevent indefinite hangs`

### 7. ✅ Long/Invalid Filename Handling
- **Issue:** Very long filenames (>100 chars) could cause UI issues
- **Fix:** Validate and truncate filenames to max 100 chars (preserving extension)
- **Files:** `ChatInput.tsx`
- **Commit:** `fix: validate and truncate long filenames (max 100 chars)`

### 8. ✅ Search Query & Result Limits
- **Issue:** Excessively long search queries or unlimited results could cause performance issues
- **Fix:** Limit search queries to 500 chars, results to 100 (show total count)
- **Files:** `SearchDialog.tsx`
- **Commit:** `fix: add search query length validation (max 500) and result limit (100)`

### 9. ✅ Invalid/Corrupted Timestamp Handling
- **Issue:** Invalid dates could crash `formatDistanceToNow()` or show garbage
- **Fix:** Created `safeFormatDistanceToNow()` with validation (rejects invalid, far-future, ancient dates)
- **Files:** `lib/safe-date.ts`, `MessageBubble.tsx`, `SearchDialog.tsx`, `Sidebar.tsx`
- **Commit:** `fix: add safe date formatting to handle invalid/corrupted timestamps`

### 10. ✅ Storage Quota Monitoring
- **Issue:** Users could hit storage limits without warning, app could stop working
- **Fix:** Added storage monitoring, warn at 80% usage, critical at 95%
- **Files:** `lib/storage-monitor.ts`, `App.tsx`
- **Commit:** `fix: add storage quota monitoring and warn when running low`

### 11. ✅ Gateway Token Validation
- **Issue:** Excessively long tokens (>500 chars) might indicate copy error
- **Fix:** Validate token length with user-friendly error message
- **Files:** `SettingsDialog.tsx`
- **Commit:** `fix: add Gateway token length validation (max 500 chars)`

## Already Handled (Built-in)

### ✅ Empty Conversation State
- `EmptyConversation` component shows helpful UI with suggestions
- Already implemented

### ✅ Virtual Scrolling for Large Message Lists
- Virtual scrolling activates at >50 messages to prevent DOM overload
- Already implemented with @tanstack/react-virtual

### ✅ Markdown Sanitization
- Using `rehype-sanitize` to prevent XSS attacks from malicious markdown
- Already implemented

### ✅ Persistence Queue
- Serializes write operations per conversation to avoid race conditions
- Already implemented with `enqueuePersistence()`

### ✅ Debounced Streaming Persistence
- Prevents excessive DB writes during streaming (1s debounce)
- Already implemented

### ✅ Offline State Handling
- Connection status banners and disabled inputs when offline
- Already implemented

## Additional Considerations (Future Improvements)

### Potential Improvements:
1. **Rate Limiting:** Add client-side rate limiting for API calls (e.g., max 10 req/sec)
2. **Message Retry Queue:** Persist failed messages and auto-retry on reconnect
3. **Export Size Limits:** Warn when exporting very large conversations (>100MB)
4. **Connection Recovery:** Auto-reconnect with exponential backoff (partially implemented)
5. **Optimistic UI Recovery:** Better rollback for failed optimistic updates
6. **Memory Leak Detection:** Add dev-mode memory profiling

## Testing Checklist

### Manual Testing Scenarios:
- [ ] Paste 100k+ character message → Should show validation error
- [ ] Rapid click Send button 10 times → Should only send once
- [ ] Attach 15 files → Should reject after 10
- [ ] Attach 0-byte file → Should show error
- [ ] Search with 1000-char query → Should truncate to 500
- [ ] Disconnect mid-stream → Should timeout after 60s
- [ ] Corrupt IndexedDB data → Should show user-friendly warning
- [ ] Use all available storage → Should warn before full
- [ ] Enter token >500 chars → Should show validation error
- [ ] Switch conversations rapidly → Should handle gracefully with loading state
- [ ] Very long filename (200 chars) → Should truncate to 100

### Edge Case Regression Tests:
All the above scenarios should be included in automated tests (Playwright/Vitest).

## Performance Optimizations Applied

1. **Virtual Scrolling:** Render only visible messages (>50 messages)
2. **Debounced Scroll Handler:** 60 FPS throttling
3. **Memoized Components:** MessageBubble, MarkdownRenderer
4. **Lazy Loading:** Heavy dialogs, markdown renderer
5. **Search Result Pagination:** Max 100 results shown
6. **Debounced Persistence:** 1s delay for streaming messages

## Security Hardening

1. **XSS Prevention:** rehype-sanitize for markdown
2. **Secure Token Storage:** OS keychain via Tauri plugin
3. **Input Validation:** All user inputs validated and sanitized
4. **Safe URL Parsing:** try/catch around URL construction
5. **Length Limits:** All strings have reasonable max lengths

---

**Total Fixes Applied:** 11 edge cases addressed
**Commits Pushed:** 11 commits
**Lines Changed:** ~300+ LOC (improvements + new utilities)
