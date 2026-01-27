# Visual E2E Test Screenshots

This directory contains screenshots captured during visual E2E testing.

## Directory Structure

```
screenshots/
├── onboarding/       # Onboarding flow screenshots
│   ├── 01-welcome_*.png
│   ├── 02-detection_*.png
│   └── ...
├── chat/             # Main chat interface screenshots
│   ├── 01-main-interface_*.png
│   ├── 02-new-chat_*.png
│   └── ...
├── settings/         # Settings dialog screenshots
│   ├── 01-settings-dialog_*.png
│   ├── 02-theme-light_*.png
│   └── ...
└── report.json       # Test run report
```

## Running Visual Tests

```bash
# Run visual tests (headless)
npm run test:e2e:visual

# Run visual tests with browser visible
npm run test:e2e:visual:headed

# Run with Playwright UI
npm run test:e2e:ui -- e2e/visual-flows.spec.ts
```

## Test Report

After each run, a `report.json` file is generated with:
- Timestamp of the test run
- Summary of passed/failed steps
- Details of each captured step

## Screenshot Naming

Screenshots follow the pattern:
`{step-number}-{step-name}_{timestamp}.png`

Example: `01-welcome_2024-01-15T10-30-00-000Z.png`

## Cleaning Up

Screenshots are not tracked in git (see .gitignore). To clean up:

```bash
# Remove all screenshots
rm -rf e2e/screenshots/*/*.png
rm -f e2e/screenshots/report.json
```

## Visual Comparison

For visual regression testing, you can compare screenshots between runs:
1. Save baseline screenshots to a separate folder
2. Run tests to generate new screenshots
3. Use image diff tools to compare

Recommended tools:
- `pixelmatch` (npm package)
- `reg-cli` (npm package for visual regression)
- Playwright's built-in `toHaveScreenshot()` (for assertions)
