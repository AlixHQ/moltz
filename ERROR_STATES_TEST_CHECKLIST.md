# Error States & Edge Cases - Test Checklist ✅

## Manual Testing Guide
Use this checklist to verify all error states and edge cases are handled correctly.

---

## 🔌 Connection Errors

### Initial Connection
- [ ] Start app with Gateway offline → Shows friendly connection error overlay with "Try Again" and "Browse Offline"
- [ ] Error message uses friendly translation (not raw "ECONNREFUSED")
- [ ] "Browse Offline" button works → dismisses overlay, can view saved conversations
- [ ] Shows retry countdown when auto-retrying
- [ ] "Retry Now" button interrupts countdown and retries immediately

### Mid-Session Disconnection
- [ ] Disconnect Gateway while using app → Yellow banner appears at top
- [ ] Banner shows "Offline Mode" with clear explanation
- [ ] Auto-retry countdown appears in status bar
- [ ] Retry button works in status bar
- [ ] Reconnection shows success toast (not first connection)

### Settings Connection Test
- [ ] Wrong URL in Settings → Shows "Can't reach Gateway" with suggestion
- [ ] Invalid URL format → Shows "URL must start with ws:// or wss://"
- [ ] Non-localhost with ws:// → Shows warning suggestion for wss://
- [ ] Wrong token → Shows "Authentication failed" with suggestion to check token
- [ ] Successful connection → Shows green checkmark + success message

---

## 💬 Message Sending Errors

### Offline Send Attempts
- [ ] Try to send while offline → Clear error: "Cannot send messages while offline"
- [ ] Message is saved for retry (Retry button appears)
- [ ] Retry button works after reconnecting
- [ ] Error auto-dismisses after 10 seconds

### Network Errors During Send
- [ ] Disconnect during message send → Shows friendly error with retry option
- [ ] Error displays title + message + suggestion (not raw error)
- [ ] Retry button sends the same message + attachments
- [ ] Error has dismiss (X) button that works

### Edit Message Offline
- [ ] Try to edit message while offline → Error: "Cannot edit messages while offline"
- [ ] Edit dialog doesn't open
- [ ] Clear guidance to wait for reconnection

### Regenerate Response Offline
- [ ] Try to regenerate while offline → Error: "Cannot regenerate responses while offline"
- [ ] Clear guidance to wait for reconnection

---

## 📎 File Attachment Errors

### File Size Errors
- [ ] Attach file >10MB → Shows size in error: "Too large (15.2MB). Maximum file size is 10MB."
- [ ] Error auto-dismisses after 5 seconds
- [ ] Error has dismiss button

### Unsupported File Types
- [ ] Try to attach .exe or other unsupported type → "Unsupported file type. Try images, PDFs, or code files."
- [ ] Clear guidance on what IS supported

### File Permission Errors
- [ ] Try to attach file without read permissions → "Unable to read file. Check file permissions."

### File Picker Errors
- [ ] File picker fails to open → "Unable to open file picker. Try restarting the app if this persists."

---

## 🤖 Model & API Errors

### No Models Available
- [ ] Connect to Gateway with no models configured → Shows warning banner
- [ ] Banner message: "Connected to Gateway, but no AI models are configured."
- [ ] Suggests checking Gateway config or API keys
- [ ] Suggestions are still disabled (can't start chats)

### Context Length Errors
- [ ] Trigger context limit error → "Message too long" with suggestion to start new conversation
- [ ] Suggestion mentions larger context window models

### API Key Errors
- [ ] Invalid API key → "Invalid API credentials" with link to Settings
- [ ] Clear suggestion to check API key

### Rate Limiting
- [ ] Hit rate limit → "Slow down" message with wait time guidance
- [ ] Friendly, not scary

### Server Errors (500s)
- [ ] Trigger 500/502/503 → "Server error" with reassurance it's temporary
- [ ] Suggests waiting and trying again

---

## 🔍 Search & Empty States

### Search Dialog
- [ ] Open search with ⌘K → Dialog appears, input focused
- [ ] Type query with no results → "No results found" with query shown
- [ ] Empty search → Shows helpful instructions and keyboard shortcuts
- [ ] Privacy notice displayed (encrypted messages)

### Empty Conversation
- [ ] New conversation with no messages → "Ready to chat?" with 6 quick starters
- [ ] Click quick starter → Fills input and focuses it
- [ ] Message is friendly and welcoming

### No Conversations
- [ ] First time user (no conversations) → "Ready to chat?" with "Start Chatting" button
- [ ] Button works → creates new conversation

### Sidebar Filter
- [ ] Filter conversations with no matches → "No matches found. Try a different search term."

---

## ⚙️ Settings Errors

### URL Validation
- [ ] Empty URL → "Gateway URL is required"
- [ ] No ws:// or wss:// prefix → "URL must start with ws:// or wss://"
- [ ] Invalid URL format → "Invalid URL format"
- [ ] Valid but wrong URL → Connection error with friendly message

### Connection Test
- [ ] Test connection with wrong URL → Shows error box with title + message + suggestion
- [ ] Error box has visual hierarchy (icon, title, message, suggestion with 💡)
- [ ] "Try Again" button works

### Protocol Auto-Switch
- [ ] Test ws:// when only wss:// works → Auto-switches and shows notice: "Connected using wss:// (auto-detected)"
- [ ] URL updates in form to working protocol

---

## 💥 Catastrophic Errors

### Error Boundary
- [ ] Trigger React error → Error boundary catches it
- [ ] Shows friendly title: "Oops! Something broke"
- [ ] Reassurance: "Don't worry — your conversations are safe and encrypted"
- [ ] "Reload Application" button works
- [ ] Error details collapsible (not scary by default)

---

## 🎨 Visual Quality Checks

### Error Message Structure
All errors should have:
- [ ] **Title**: Non-technical, user-friendly
- [ ] **Message**: Plain language explanation
- [ ] **Suggestion**: Actionable next step (with 💡 emoji)
- [ ] **Action button**: When applicable (Retry, Settings, etc.)

### Error Styling
- [ ] Error banners use destructive/10 background (not scary red)
- [ ] Icons are appropriate (AlertTriangle, WifiOff, etc.)
- [ ] Text hierarchy is clear (title bold, suggestion lighter)
- [ ] Suggestions stand out with 💡 emoji
- [ ] Animations are smooth (fade-in, slide-in)

### Loading States
- [ ] All loading states show what's happening:
  - "Connecting to your Gateway"
  - "Loading conversations"
  - "Sending..."
  - "Reconnecting (2)..."
- [ ] Spinners visible and smooth
- [ ] Skeleton screens for long loads

---

## 🔄 State Transitions

### Connection State Changes
- [ ] Offline → Connecting → Online: Smooth transitions, clear feedback
- [ ] Online → Offline: Immediate feedback, no confusion
- [ ] Multiple rapid disconnects: Backoff delays work (5s → 10s → 30s → 60s)

### Message State Changes
- [ ] Pending → Sent: "Sending..." indicator disappears
- [ ] Pending → Error: Error banner appears with retry
- [ ] Streaming → Complete: Border animation stops

---

## 🧪 Integration Tests

### End-to-End Flows
- [ ] **Offline startup → Browse → Reconnect → Send**: All states correct
- [ ] **Send with attachment → Network error → Retry**: Message + attachment preserved
- [ ] **Edit message → Confirmation → Regenerate**: Flow works smoothly
- [ ] **Settings error → Fix → Test → Save**: Clear feedback at each step

---

## ✅ Accessibility

### ARIA Labels
- [ ] Error messages have `role="alert"` and `aria-live="assertive"`
- [ ] Loading states have `aria-live="polite"`
- [ ] Status changes are announced to screen readers

### Keyboard Navigation
- [ ] All error dialogs can be dismissed with Escape
- [ ] Retry buttons are keyboard accessible
- [ ] Focus management works correctly

---

## 📊 Success Metrics

After testing, all of these should be TRUE:
- [ ] **Zero raw error codes visible** (all translated to friendly messages)
- [ ] **Every error suggests next step** (no dead ends)
- [ ] **Retry mechanisms preserve user input** (never lose work)
- [ ] **Visual hierarchy clear** (titles, messages, suggestions distinct)
- [ ] **Tone is helpful, not scary** (reassuring language throughout)
- [ ] **Loading states explain what's happening** (no mystery spinners)

---

## 🚨 Known Issues / Future Improvements

**None identified** - All P1 error states and edge cases are handled!

---

**Testing Status**: Ready for QA
**Production Readiness**: ✅ All error states improved and user-friendly
