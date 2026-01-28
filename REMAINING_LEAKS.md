# Remaining Memory Leaks - Analysis

**Status:** Phase 2 Progress Report  
**Date:** 2025-01-28  
**Time:** 3:47am

---

## ✅ Fixed (High Priority)
1. **ChatView Error Timeouts** - 6 timer leaks ✅  
   - Created `useErrorTimeout` hook with proper cleanup
   - Replaced all manual setTimeout calls
   
2. **Toast Dismiss Timer** - 1 timer leak ✅  
   - Added ref tracking for dismiss timeout
   - Cleanup in useEffect

---

## 🔍 Remaining Issues (Lower Priority)

### LEAK #3: DetectionStep Promise Delays (LOW)
**File:** `src/components/onboarding/steps/DetectionStep.tsx`  
**Lines:** 101, 114  
**Current Code:**
```typescript
await new Promise((resolve) => setTimeout(resolve, 300));
```

**Analysis:**
- These are delays inside async functions
- If component unmounts during delay, Promise still resolves
- Continuation code checks `isMountedRef.current` so STATE updates are guarded ✅
- But the Promise resolve callback still fires (minor memory overhead)

**Priority:** LOW  
**Reason:**  
- Onboarding only (not main app flow)
- Short delays (300ms, 500ms)
- State updates already guarded with `isMountedRef.current`
- No React warnings expected

**Fix if needed:**
```typescript
const timeoutId = setTimeout(resolve, 300);
// Track timeoutId and clear in cleanup if needed
```

**Decision:** **DEFER** - Minimal impact, well-guarded continuation

---

### LEAK #4: SearchDialog Scroll Timeouts (LOW)
**File:** `src/components/SearchDialog.tsx`  
**Lines:** 174, 188  
**Current Code:**
```typescript
setTimeout(() => {
  resultsRef.current[newIndex]?.scrollIntoView({...});
}, 0);
```

**Analysis:**
- 0ms delay (next tick)
- DOM operation (scrollIntoView) won't cause React warning
- Only fires during keyboard navigation
- Component must be mounted for keyboard event to fire

**Priority:** VERY LOW  
**Reason:**
- Essentially immediate execution (0ms)
- DOM operation is safe
- Component mounted when event fires

**Fix if needed:**
```typescript
const scrollTimeoutRef = useRef<number>();
// Track and clear in useEffect cleanup
```

**Decision:** **DEFER** - Negligible impact, use requestAnimationFrame if optimizing

---

### LEAK #5: Store Debounced Persist (MEDIUM)
**File:** `src/stores/store.ts`  
**Lines:** 168-175  
**Current Code:**
```typescript
let persistTimer: number | undefined;
const debouncedPersist = (fn: () => void, delay = 500) => {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = window.setTimeout(() => {
    persistTimer = undefined;
    fn();
  }, delay);
};
```

**Analysis:**
- Global timer for debouncing IndexedDB writes
- `beforeunload` listener clears timer (line 181) ✅
- BUT: If page unloads mid-persist, data might be lost
- Debounced persists during streaming could be interrupted

**Priority:** MEDIUM  
**Reason:**
- Data integrity concern (not just memory)
- Streaming messages might not persist if interrupted
- beforeunload is not guaranteed to fire (crash, force-quit)

**Better Fix:**
```typescript
// Use visibilitychange for more reliable cleanup
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    // Flush any pending persist
    if (persistTimer) {
      clearTimeout(persistTimer);
      // Execute pending persist immediately
    }
  }
});
```

**Decision:** **IMPROVE** - Add flush on visibility change for data safety

---

## 🔬 Deep Dive: Store Subscription Patterns

### Zustand Usage Analysis
✅ **All safe** - Using `useStore()` hook, no manual subscriptions  
✅ **Automatic cleanup** - React handles unsubscribe on unmount  
✅ **No custom selectors with issues** - Simple property access

**Files checked:**
- ChatView.tsx
- SearchDialog.tsx
- SettingsDialog.tsx
- Sidebar.tsx
- WelcomeView.tsx

**Pattern:**
```typescript
const { prop1, prop2 } = useStore();  // ✅ Safe, auto-cleanup
```

---

## 🔍 Additional Checks Completed

### Event Listeners
✅ All addEventListener have matching removeEventListener  
✅ All cleanup in useEffect return functions  
✅ No orphaned listeners found

### Timers
✅ High-priority timers fixed (ChatView, Toast)  
⚠️ Low-priority timers acceptable (DetectionStep, SearchDialog)  
⚠️ Store persist timer needs improvement (data integrity)

### Observers
✅ ResizeObserver properly disconnected (scroll-shadow.tsx)  
✅ No IntersectionObserver found  
✅ No MutationObserver found

### Network
✅ No fetch/axios calls (all Tauri invoke)  
✅ No need for AbortControllers  
✅ WebSocket managed by Tauri backend

---

## 📊 Impact Summary

| Issue | Priority | Fixed | Impact |
|-------|----------|-------|--------|
| ChatView Timers | HIGH | ✅ | Memory + React warnings |
| Toast Timer | MEDIUM | ✅ | Memory on dismiss |
| Store Persist | MEDIUM | ⚠️ | Data integrity |
| DetectionStep | LOW | ❌ | Minimal (onboarding) |
| SearchDialog | VERY LOW | ❌ | Negligible (0ms) |

---

## 🎯 Next Actions

1. **✅ DONE:** High-priority timer leaks (ChatView, Toast)
2. **TODO:** Improve store persist with visibility change handler
3. **DEFER:** DetectionStep promise delays (minimal impact)
4. **DEFER:** SearchDialog scroll timeouts (0ms, safe)

---

## ⏰ Time Check: 3:47am

**Completed:**
- Comprehensive audit
- High-priority fixes
- Build verification
- Git commit

**Remaining work:**
- Store persist improvement (10-15 min)
- Final testing
- Documentation

**Target:** 6am completion on track ✅
