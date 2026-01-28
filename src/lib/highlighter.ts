/**
 * Custom syntax highlighter configuration
 * 
 * PERF: Load only common languages to reduce bundle size.
 * Full highlight.js with all languages is ~500KB. By loading only common ones,
 * we can reduce this to ~150KB.
 */

import { common, createLowlight } from 'lowlight';

// Create lowlight instance with only common languages
// Common includes: bash, c, cpp, csharp, css, diff, go, ini, java, javascript,
// json, kotlin, less, lua, makefile, markdown, objectivec, perl, php, python,
// python-repl, r, ruby, rust, scss, shell, sql, swift, typescript, vbnet, xml, yaml
export const lowlight = createLowlight(common);

// If you need to add specific languages, import them individually:
// import langHaskell from 'highlight.js/lib/languages/haskell';
// lowlight.register('haskell', langHaskell);

export default lowlight;
