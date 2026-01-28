# Screenshot Guide

Exactly what screenshots we need and where they go.

---

## Priority Order

### 🔴 Critical (Need These First)

These screenshots are essential for Getting-Started.md:

#### 1. Onboarding Welcome Screen
**Location:** Getting-Started.md, step 4  
**Filename:** `onboarding-welcome.png`

**What to capture:**
- Full Moltz window showing welcome screen
- "Welcome to Moltz" heading visible
- "Next" button visible
- Clean, uncluttered

**How to capture:**
1. Fresh install of Moltz
2. First launch
3. Screenshot the welcome screen
4. Crop to just the Moltz window (not entire desktop)

---

#### 2. Gateway Setup Screen
**Location:** Getting-Started.md, step 4  
**Filename:** `gateway-setup.png`

**What to capture:**
- Gateway URL field showing `ws://localhost:18789`
- Token field (can be blurred/empty)
- "Test Connection" button
- Any status indicators

**Annotations needed:**
- Arrow pointing to "Test Connection" button with text: "Click here"
- Circle around URL field with text: "This is already filled in for local setup"

---

#### 3. Empty Chat View
**Location:** Getting-Started.md, step 5  
**Filename:** `chat-empty.png`

**What to capture:**
- Main chat area (empty)
- Input field at bottom
- Send button visible
- Sidebar with "New Conversation" button

**Annotations needed:**
- Arrow pointing to input field: "Type your message here"
- Arrow pointing to Send button: "Or press Enter"

---

### 🟡 Important (Need These Soon)

#### 4. Chat with Streaming Response
**Location:** User-Guide.md, Messages section  
**Filename:** `chat-streaming.png`

**What to capture:**
- Conversation with at least 2-3 messages
- One message actively streaming (partial text + blinking cursor)
- Stop button visible

---

#### 5. Sidebar with Multiple Conversations
**Location:** User-Guide.md, Conversations section  
**Filename:** `sidebar-conversations.png`

**What to capture:**
- Sidebar open
- 5-6 conversations listed
- One conversation pinned (with 📌 icon)
- One conversation selected (highlighted)
- "New Conversation" button at top

---

#### 6. Settings Dialog
**Location:** Configuration.md, opening section  
**Filename:** `settings-general.png`

**What to capture:**
- Settings dialog open
- General tab selected
- Theme dropdown, font size slider visible
- Clear, readable

**Additional settings screenshots needed:**
- `settings-connection.png` - Connection tab
- `settings-shortcuts.png` - Keyboard shortcuts tab
- `settings-privacy.png` - Privacy tab

---

### 🟢 Nice to Have

#### 7. Search Dialog
**Location:** User-Guide.md, Search section  
**Filename:** `search-dialog.png`

**What to capture:**
- Search dialog open (Cmd+K)
- Search query entered
- Search results showing matched conversations
- Matched text highlighted

---

#### 8. Message Actions
**Location:** User-Guide.md, Message Actions  
**Filename:** `message-actions.png`

**What to capture:**
- Hover over a message
- Action buttons visible (Copy, Edit, Regenerate, Delete)

---

#### 9. File Attachment
**Location:** User-Guide.md, Attachments  
**Filename:** `attachment-preview.png`

**What to capture:**
- Input field with file attached
- Attachment preview showing (image thumbnail or file icon)
- Remove button (×) visible

---

#### 10. Code Block with Syntax Highlighting
**Location:** User-Guide.md, Viewing Messages  
**Filename:** `code-block.png`

**What to capture:**
- Code block in a message
- Syntax highlighting visible
- Copy button in top-right of code block

---

## Screenshot Standards

### Technical Requirements

- **Format:** PNG (lossless)
- **Resolution:** Retina/2x (for macOS screenshots)
- **Size:** Reasonable (< 500 KB per screenshot)
- **Background:** Use default theme (Light or Dark, your choice, but be consistent)

### Composition

- **Clean:** No personal data, tokens, or sensitive info
- **Focused:** Crop to relevant area (don't include entire 4K desktop)
- **Readable:** Text must be legible at documentation display size
- **Realistic:** Use real example text, not "Lorem ipsum"

### Example Content

Use these for screenshots:

**User messages:**
- "Explain how React hooks work"
- "Write a Python function to find prime numbers"
- "What are the keyboard shortcuts?"

**AI responses:**
- Actual AI-generated text (run real queries)
- Don't fake it with placeholder text

**Conversation titles:**
- "React Hooks Explanation"
- "Python Prime Numbers"
- "Project Setup Help"
- "TypeScript Type Errors"

**Keep it professional** - No memes, jokes, or inappropriate content.

---

## Tools

### macOS
- Built-in: `Cmd + Shift + 4` → Drag to select area
- Or: `Cmd + Shift + 5` for advanced options
- Saves to Desktop by default

### Windows
- Built-in: `Windows + Shift + S` (Snip & Sketch)
- Or: Snipping Tool app

### Linux
- GNOME: `Print Screen` or `Shift + Print Screen`
- KDE: Spectacle app
- CLI: `gnome-screenshot --area`

### Annotations

Use macOS Preview, Windows Paint, or:
- [Skitch](https://evernote.com/products/skitch) (free)
- [Monosnap](https://monosnap.com/) (free)
- [CleanShot X](https://cleanshot.com/) (paid, but worth it)

---

## File Naming Convention

```
[section]-[description].png
```

**Examples:**
- `onboarding-welcome.png`
- `chat-streaming.png`
- `sidebar-conversations.png`
- `settings-general.png`

**Location:** `docs/wiki/images/`

---

## In-Document Usage

### Markdown Syntax

```markdown
![Alt text description](./images/screenshot-name.png)
```

### With Caption

```markdown
**Screenshot:** Gateway setup screen

![Gateway setup screen showing URL and token fields](./images/gateway-setup.png)
```

### Inline Annotations

If you add arrows/callouts in the screenshot editor, no need for extra markdown. If you want text annotations in markdown:

```markdown
**Steps:**
1. Click the Test Connection button (highlighted in red)
2. Wait for green checkmark
3. Click Next

![Gateway setup with annotations](./images/gateway-setup-annotated.png)
```

---

## Updating Screenshots

When UI changes:

1. Check if existing screenshots are outdated
2. Retake with same composition/angle
3. Update filename if needed (add version: `chat-v1.1.png`)
4. Update references in docs
5. Delete old screenshots

---

## Placeholder Text

Until screenshots are added, docs use:

```markdown
**📸 SCREENSHOT NEEDED: [Description]**
```

When adding screenshot, **replace placeholder entirely** with image:

```diff
- **📸 SCREENSHOT NEEDED: Gateway setup screen**
+ ![Gateway setup screen](./images/gateway-setup.png)
```

---

## Animated GIFs (Future)

For interactions that benefit from animation:

**Candidates:**
- Typing and getting streaming response
- Using global hotkey to summon app
- Search in action
- Editing a message

**Tools:**
- macOS: [Kap](https://getkap.co/) (free, excellent)
- Windows: [ScreenToGif](https://www.screentogif.com/) (free)
- Linux: [Peek](https://github.com/phw/peek) (free)

**Requirements:**
- Max 10 seconds per GIF
- Max 2 MB file size
- 30 FPS (smooth but not huge)
- 1280px width max

---

## Video Walkthroughs (Future)

For comprehensive tutorials:

**Needed:**
- 5-minute onboarding walkthrough
- 10-minute feature tour
- Troubleshooting common issues

**Platform:** YouTube (embedded in docs)

**Format:**
- 1080p or 1440p
- Clear narration
- On-screen annotations
- Chapters/timestamps

---

## Checklist for Screenshot Contributors

- [ ] Read this entire guide
- [ ] Use clean, default theme
- [ ] No personal data visible
- [ ] Realistic example content
- [ ] Proper file naming
- [ ] Saved to `docs/wiki/images/`
- [ ] Updated markdown to replace placeholder
- [ ] Tested that image displays correctly
- [ ] Committed with descriptive message: `docs: add [description] screenshot`

---

**Questions?** Ask in [GitHub Discussions](https://github.com/AlixHQ/moltz/discussions).

---

**Last updated:** January 2026
