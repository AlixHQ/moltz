# Streaming UX Performance Profile

## Optimization Goals

### Frame Rate Targets
- **Idle:** 60 FPS (consistent)
- **Streaming:** 60 FPS (no drops)
- **Scroll during streaming:** 60 FPS
- **Animation transitions:** 60 FPS

### Timing Targets
- **Input to render:** <16ms (1 frame)
- **Button click to feedback:** <100ms (perceived instant)
- **Scroll response:** <16ms (1 frame)
- **Animation start:** <50ms

---

## Performance Optimizations Applied

### 1. **GPU Acceleration**

#### What:
Added `will-change` hints for animations that benefit from GPU compositing.

#### Where:
```css
/* Streaming cursor */
.animate-cursor-blink {
  will-change: opacity;
}

/* Typing indicator dots */
.typing-dot {
  will-change: transform;
}

/* Message fade-in */
.animate-message-in {
  will-change: opacity, transform;
}

/* Streaming message border */
.animate-streaming-pulse {
  will-change: border-color;
}
```

#### Impact:
- Offloads animations from CPU to GPU
- Reduces main thread blocking
- Smoother 60 FPS animations
- Lower CPU usage

#### Measurement:
Check Chrome DevTools Layers panel - animated elements should have their own layers.

---

### 2. **CSS Containment**

#### What:
Tells browser that element's layout/paint is isolated from rest of page.

#### Where:
```jsx
// Streaming message content
<div style={{ contain: 'layout style paint' }}>

// Markdown container
<div style={{ contain: 'content' }}>

// Code blocks
pre {
  contain: layout style;
}
```

#### Impact:
- Prevents layout thrashing
- Isolates reflows to contained element
- Reduces scope of style recalculation
- Faster paint operations

#### Measurement:
Look for reduced "Recalculate Style" and "Layout" time in Performance timeline.

---

### 3. **Scroll Throttling**

#### What:
Limit scroll event processing to match display refresh rate.

#### Before:
```javascript
if (now - lastScrollTime.current < 100) return; // 10 FPS
```

#### After:
```javascript
if (now - lastScrollTime.current < 16) return; // 60 FPS
```

#### Impact:
- 6x more responsive scroll tracking
- Smoother near-bottom detection
- Better auto-scroll triggering
- No perceived lag

#### Measurement:
Scroll while streaming - should feel buttery smooth with no lag.

---

### 4. **Instant Scroll During Streaming**

#### What:
Eliminate smooth-scroll animation jank during streaming.

#### Before:
```javascript
messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
```

#### After:
```javascript
const behavior = currentStreamingMessageId ? "instant" : "smooth";
messagesEndRef.current?.scrollIntoView({ behavior });
```

#### Impact:
- Zero scroll animation overhead during streaming
- Page stays perfectly pinned to bottom
- No visible "catching up" motion
- Eliminates major jank source

#### Measurement:
Send long message - page should never scroll visibly, just stay pinned.

---

### 5. **Animation Timing Optimization**

#### Strategy:
All animations tuned for sub-second responsiveness.

#### Timings:
```
Cursor blink:        900ms
Border pulse:        800ms  
Typing bounce:       500ms
Message fade-in:     200ms
Button transitions:  150ms
```

#### Easing:
- All use `cubic-bezier(0.4, 0, 0.6, 1)` for consistent feel
- Spring curve for message fade-in: `cubic-bezier(0.34, 1.56, 0.64, 1)`

#### Impact:
- Consistent rhythm across UI
- Everything feels "snappy"
- No animation longer than 1s
- Natural, not mechanical

---

### 6. **State Update Batching**

#### What:
Ensure Zustand state updates are optimized.

#### Implementation:
```javascript
set((state) => {
  const updatedConversations = state.conversations.map(...);
  return { conversations: updatedConversations };
});
```

#### Impact:
- Single state update per append
- Reduces re-render cycles
- Better React reconciliation
- Lower CPU during streaming

---

### 7. **Memoization**

#### React.memo on components:
- `MessageBubble` - prevents unnecessary re-renders
- `MarkdownRenderer` - heavy component, only re-render when content changes

#### useMemo/useCallback:
- Markdown components object
- Markdown plugins array
- Scroll handler
- Stop handler

#### Impact:
- Reduces re-render overhead
- Prevents object recreation
- Stable references for React
- Lower memory churn

---

## Performance Measurements

### How to Profile

#### 1. Chrome DevTools Performance Tab

**Steps:**
1. Open DevTools (F12)
2. Go to Performance tab
3. Click Record (or Cmd/Ctrl + E)
4. Send a message and let it stream
5. Stop recording
6. Analyze

**What to look for:**

✅ **Good:**
- FPS: Consistent 60 (green line)
- Frames: All green bars
- Main thread: Minimal blocking
- GPU: Composite layers used

❌ **Bad:**
- FPS: Drops below 55 (yellow/red)
- Frames: Red bars (dropped frames)
- Main thread: Long tasks >50ms
- Layout: Excessive recalculations

**Key Metrics:**
```
FPS:              60 (target)
Frame time:       ~16ms (target)
Long tasks:       0 (target)
Scripting time:   <10% of frame time
Rendering time:   <30% of frame time
Painting time:    <20% of frame time
```

#### 2. React DevTools Profiler

**Steps:**
1. Install React DevTools extension
2. Open Profiler tab
3. Click Record
4. Send message
5. Stop recording

**What to look for:**
- `MessageBubble` should only re-render when content changes
- `ChatView` should re-render on state updates
- No cascading re-renders
- Minimal "committed" time per update

#### 3. Lighthouse Performance Audit

**Steps:**
1. Open DevTools
2. Go to Lighthouse tab
3. Select "Performance" category
4. Generate report

**Target Scores:**
- Performance: >90
- First Contentful Paint: <1.8s
- Time to Interactive: <3.8s
- Total Blocking Time: <200ms

---

## Performance Benchmarks

### Test 1: Idle State
```
Action: None (just viewing chat)
Expected FPS: 60 (consistent)
CPU Usage: Minimal (<5%)
Memory: Stable (no leaks)
```

### Test 2: Streaming Short Message (100 chars)
```
Action: Send "Explain React hooks"
Duration: ~2-3 seconds
Expected FPS: 60 (consistent)
Frame drops: 0
Jank: None
```

### Test 3: Streaming Long Message (5000+ chars)
```
Action: Send "Write a complete React app"
Duration: ~30-60 seconds
Expected FPS: 60 (consistent)
Frame drops: <5 over entire duration
Jank: None or imperceptible
Memory: No significant growth
```

### Test 4: Streaming with Code Blocks
```
Action: Request code with multiple blocks
Expected: No layout shift when code blocks appear
Syntax highlighting: Applied without flicker
Copy buttons: Appear instantly on hover
```

### Test 5: Rapid Message Succession
```
Action: Send 3 messages quickly
Expected: Each streams smoothly
No cumulative lag
Memory cleanup after each
```

### Test 6: Scroll During Streaming
```
Action: Scroll up/down while streaming
Expected: Butter smooth scrolling
No lag or stutter
Auto-scroll resumes when at bottom
```

### Test 7: Stop Generation
```
Action: Click stop or press Esc
Expected: <100ms response time
Immediate stop (no delay)
Clean animation exit
```

---

## Performance Regression Tests

### Things to Watch For

#### 1. Memory Leaks
```javascript
// Before each test
const initialMemory = performance.memory.usedJSHeapSize;

// After test
const finalMemory = performance.memory.usedJSHeapSize;
const growth = finalMemory - initialMemory;

// Should be minimal (<5MB for normal usage)
```

#### 2. Animation Frame Rate
```javascript
let frameCount = 0;
let lastTime = performance.now();

function measureFPS() {
  frameCount++;
  const currentTime = performance.now();
  if (currentTime >= lastTime + 1000) {
    console.log(`FPS: ${frameCount}`);
    frameCount = 0;
    lastTime = currentTime;
  }
  requestAnimationFrame(measureFPS);
}

measureFPS();
// Should consistently show ~60 FPS
```

#### 3. Layout Thrashing
```javascript
// In Chrome DevTools Performance:
// Look for "Recalculate Style" and "Layout" events
// Should be minimal during streaming
// Large clusters indicate thrashing
```

---

## Platform-Specific Considerations

### Windows
- Hardware acceleration: Enabled (check chrome://gpu)
- DPI scaling: Test at 100%, 125%, 150%
- Battery mode: Performance should be consistent

### macOS
- Retina display: Test on 1x and 2x
- Trackpad smooth scrolling: Should feel native
- Fullscreen mode: No performance hit

### Linux
- Wayland vs X11: Test both
- Different DEs: May have different compositing
- Hardware acceleration: Verify enabled

---

## Known Performance Bottlenecks

### 1. Markdown Parsing
- **Issue:** ReactMarkdown re-parses entire content on each update
- **Mitigation:** Memoization helps, but still re-parses
- **Future:** Consider incremental parsing or debouncing

### 2. Syntax Highlighting
- **Issue:** rehype-highlight can be expensive for large code blocks
- **Mitigation:** CSS containment isolates the impact
- **Future:** Consider lazy highlighting (on-demand)

### 3. Virtual Scrolling Threshold
- **Issue:** Only kicks in at 50+ messages
- **Mitigation:** Most conversations are <50 messages
- **Future:** Could lower threshold to 30

### 4. IndexedDB Writes
- **Issue:** Debounced at 1s during streaming
- **Mitigation:** Doesn't block UI (async)
- **Future:** Could use Web Workers

---

## Continuous Monitoring

### Key Metrics to Track

```javascript
// Add to production for telemetry
window.performance.mark('stream-start');
window.performance.mark('stream-end');
window.performance.measure('stream-duration', 'stream-start', 'stream-end');

const metrics = {
  streamDuration: /* measure above */,
  avgFPS: /* calculated from RAF */,
  droppedFrames: /* count */,
  jankEvents: /* long tasks >50ms */,
};

// Report to analytics
```

### Alerts/Thresholds
- FPS < 55 for >1s: Warning
- Frame drops > 10 in one stream: Warning
- Long task > 100ms: Error
- Memory growth > 50MB: Error

---

## Optimization Checklist for Future Changes

When adding new features to streaming UI:

- [ ] Will it run every frame? → Use requestAnimationFrame
- [ ] Will it animate? → Add will-change if appropriate
- [ ] Will it cause layout? → Use CSS containment
- [ ] Is it expensive? → Memoize with React.memo
- [ ] Does it read/write DOM? → Batch with RAF
- [ ] Will it scroll? → Throttle or debounce
- [ ] Does it affect existing animations? → Test FPS
- [ ] Does it add to bundle? → Consider lazy loading

---

## Resources

- [CSS Containment](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Containment)
- [will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change)
- [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [React Profiler](https://react.dev/reference/react/Profiler)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
