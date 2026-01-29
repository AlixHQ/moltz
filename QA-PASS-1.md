# Pass 1 - QA Report

**Date:** 2025-01-30  
**Tester:** QA Subagent  
**Scope:** Onboarding Flow Code Review

---

## Critical Issues (blocks release)

### 1. LocalStorage Key Case Mismatch - Token/Progress Never Restored
- **Steps:** Complete onboarding → Close app → Reopen
- **Expected:** Progress/URL should be restored
- **Actual:** Progress is never restored due to case mismatch
- **File:** `src/components/onboarding/steps/GatewaySetupStep.tsx` line 286
- **Details:** Saves to `"Moltz-onboarding-progress"` (capital M) but `OnboardingFlow.tsx` reads from `"moltz-onboarding-progress"` (lowercase m)
- **Fix:** Change line 286 to use lowercase `"moltz-onboarding-progress"`

### 2. Back Button Goes to Non-Existent Step
- **Steps:** Welcome → Get Started → Setup → Click "← Back"
- **Expected:** Return to Welcome step
- **Actual:** Goes to "no-gateway" step which is now orphaned since detection is skipped
- **File:** `src/components/onboarding/OnboardingFlow.tsx` line 121
- **Details:** `handleBackToNoGateway` is passed as `onBack` to GatewaySetupStep, but detection step is skipped (line 107-110)
- **Fix:** Change `onBack={handleBackToNoGateway}` to `onBack={handleBackToWelcome}` on line 145

### 3. Timeout Error Message Shows Wrong Duration
- **Steps:** Enter invalid remote URL → Test Connection → Wait for timeout
- **Expected:** Error shows actual timeout (15s local, 120s Tailscale)
- **Actual:** Error says "Connection timed out after 8 seconds" (hardcoded in line 330)
- **File:** `src/components/onboarding/steps/GatewaySetupStep.tsx` line 330
- **Fix:** Use dynamic timeout value from `CONNECT_TIMEOUT_MS`

---

## Major Issues (poor UX)

### 1. Escape Key Cancels Onboarding During Active Connection Test
- **Steps:** Enter URL → Test Connection → Press Escape during "Testing..."
- **Expected:** Either cancel the test, or block Escape during test
- **Actual:** Skips onboarding entirely while connection test continues in background
- **File:** `src/components/onboarding/OnboardingFlow.tsx` lines 130-135
- **Impact:** User might skip setup while a connection is being established, causing race conditions
- **Fix:** Disable Escape handler when `connectionState === "testing"`

### 2. Double-Click Prevention Missing on Test Button
- **Steps:** Click "Test Connection" rapidly multiple times
- **Expected:** Button disabled after first click, single test runs
- **Actual:** Multiple click handlers can fire before state updates
- **File:** `src/components/onboarding/steps/GatewaySetupStep.tsx` line 343
- **Fix:** Add `disabled={connectionState === "testing" || connectionState === "verifying"}` and debounce

### 3. URL Auto-Fix Happens Silently
- **Steps:** Enter "localhost:18789" (no ws://) → Test
- **Expected:** Show user that ws:// was added
- **Actual:** URL is silently modified, user doesn't see what was tested
- **File:** `src/components/onboarding/steps/GatewaySetupStep.tsx` lines 299-310
- **Fix:** Show a notice like "Added ws:// prefix automatically"

### 4. Orphaned Detection Flow Creates Dead Ends
- **Steps:** If user somehow reaches NoGatewayStep → Click "Check Again"
- **Expected:** Logical flow
- **Actual:** Goes to DetectionStep which then goes to NoGateway again (loop)
- **File:** `src/components/onboarding/OnboardingFlow.tsx`
- **Impact:** NoGatewayStep is unreachable but code still exists
- **Fix:** Remove NoGatewayStep and DetectionStep from codebase if not used

### 5. Skip Button Text Inconsistency
- **Steps:** Compare skip buttons across all onboarding steps
- **Expected:** Consistent messaging
- **Actual:** 
  - WelcomeStep: "Skip setup (I'll just look around)"
  - GatewaySetupStep: "Skip (you can browse, but won't be able to chat yet)"
  - SuccessStep: Primary button is "Start Using Moltz"
- **Fix:** Unify skip messaging across all steps

### 6. Settings Dialog Token Saved Before Connection Test
- **Steps:** Settings → Enter wrong token → Test → Fails → Close dialog
- **Expected:** Token not saved until successful test
- **Actual:** Token is saved even on failed connection (line 166-167 in SettingsDialog.tsx)
- **File:** `src/components/SettingsDialog.tsx` lines 166-167
- **Fix:** Only call updateSettings on successful connection

---

## Minor Issues (polish)

### 1. Progress Bar Includes Skipped Step
- **Steps:** Go through onboarding, watch progress bar
- **Expected:** Accurate progress
- **Actual:** Progress bar includes "detection" in stepOrder but detection is skipped
- **File:** `src/components/onboarding/OnboardingFlow.tsx` lines 177-178
- **Fix:** Remove "detection" from stepOrder array

### 2. Keyboard Shortcut Format Inconsistent
- **Steps:** View FeatureTourStep on Windows
- **Expected:** "Ctrl+N" style
- **Actual:** "Ctrl+N" but modKey is set to "Ctrl+" (with trailing +)
- **File:** `src/components/onboarding/steps/FeatureTourStep.tsx` line 17
- **Fix:** Change `const modKey = isMacOS ? "⌘" : "Ctrl+";` to `"Ctrl"`

### 3. WelcomeStep Feature Cards Promise Unavailable Features
- **Steps:** Read feature cards on Welcome screen
- **Expected:** Features that Moltz actually supports
- **Actual:** Shows "Reschedule my 3pm and notify them" and "What did John email me about?" but no calendar/email integration exists
- **File:** `src/components/onboarding/steps/WelcomeStep.tsx` lines 52-68
- **Fix:** Update to reflect actual capabilities

### 4. Border Radius Inconsistency Across Components
- **Observation:** Mixed usage of rounded-lg and rounded-xl
  - WelcomeStep: `rounded-xl` for cards
  - GatewaySetupStep: `rounded-lg` for inputs, `rounded-xl` for main button
  - SettingsDialog: `rounded-xl` for all buttons
- **Fix:** Standardize: `rounded-xl` for cards/dialogs, `rounded-lg` for inputs, `rounded-xl` for primary buttons

### 5. Auto-Detect Code Disabled But Still Present
- **Steps:** Check GatewaySetupStep useEffect
- **Observation:** Line 236-237 comments out `autoDetectGateway()` but the function still exists (80+ lines of code)
- **File:** `src/components/onboarding/steps/GatewaySetupStep.tsx` lines 178-235
- **Fix:** Remove dead code or re-enable with a feature flag

### 6. Connection State "cancelled" Exists But Never Transitions From
- **Steps:** Check ConnectionState type
- **Observation:** "cancelled" state exists but no transitions lead to it working correctly
- **File:** `src/components/onboarding/steps/GatewaySetupStep.tsx`
- **Fix:** Properly implement cancellation flow

### 7. SuccessStep Confetti Performance
- **Observation:** Generates 50 confetti particles with individual animations
- **Impact:** Could cause jank on lower-end devices
- **File:** `src/components/onboarding/steps/SuccessStep.tsx` line 30
- **Fix:** Reduce particle count to 25-30 or use CSS animations

---

## Brief for UX Designer

### Priority 1 - Must Fix Before Release
1. **Fix localStorage key case mismatch** (`GatewaySetupStep.tsx:286`) - Change "Moltz" to "moltz"
2. **Fix Back button destination** (`OnboardingFlow.tsx:145`) - Change `handleBackToNoGateway` to `handleBackToWelcome`  
3. **Fix timeout error message** (`GatewaySetupStep.tsx:330`) - Use actual timeout value

### Priority 2 - Should Fix Before Release
4. **Block Escape key during connection test** - Add condition in OnboardingFlow.tsx
5. **Prevent double-click on Test button** - Already mostly handled but needs debounce
6. **Show notice when URL auto-fixed** - Add visible feedback for ws:// prefix

### Priority 3 - Nice to Have
7. **Remove dead detection code** - NoGatewayStep, DetectionStep if not needed
8. **Unify skip button text** across all steps
9. **Fix progress bar** to not include detection step
10. **Update WelcomeStep feature cards** to show real capabilities
11. **Standardize border radius** across components

### Implementation Notes
- All fixes are surgical edits, no architectural changes needed
- Test thoroughly: Fresh install, reconnection, settings changes
- Verify dark mode appearance after changes
