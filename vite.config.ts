import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Prevent vite from obscuring Rust errors
  clearScreen: false,
  // Tauri expects a fixed port
  server: {
    port: 5173,
    strictPort: true,
  },
  // Env prefix for Tauri
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    // Tauri uses Chromium on Windows and WebKit on macOS/Linux
    target: process.env.TAURI_PLATFORM === "windows" ? "chrome105" : "safari13",
    // Don't minify for debug builds
    minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
    // Produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_DEBUG,
    // PERF: Remove console.log/warn/info in production builds
    ...(!process.env.TAURI_DEBUG && {
      esbuild: {
        drop: ['console', 'debugger'],
      },
    }),
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split React into its own chunk
          // NOTE: Trailing slash after 'react/' prevents matching 'react-markdown', 'react-virtual', etc.
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          // Split Radix UI primitives (dialog, dropdown, scroll-area) separately
          // These are used in dialogs which are lazy-loaded
          if (id.includes('node_modules/@radix-ui/react-dialog') ||
              id.includes('node_modules/@radix-ui/react-dropdown-menu') ||
              id.includes('node_modules/@radix-ui/react-scroll-area')) {
            return 'radix-dialogs';
          }
          // Other Radix UI components (tooltip, switch, separator, slot)
          if (id.includes('node_modules/@radix-ui')) {
            return 'radix-ui';
          }
          // Markdown rendering + syntax highlighting (heavy, lazy-loaded)
          // Includes: react-markdown, remark-gfm, rehype-highlight, rehype-sanitize,
          //           unified ecosystem (mdast, hast), lowlight, highlight.js languages
          if (id.includes('react-markdown') || id.includes('remark') || id.includes('rehype') || 
              id.includes('unified') || id.includes('mdast') || id.includes('hast') ||
              id.includes('lowlight') || id.includes('highlight.js')) {
            return 'markdown';
          }
          // Database (lazy-loaded via persistence.ts)
          if (id.includes('dexie')) {
            return 'dexie';
          }
          // Framer Motion (lazy-loaded via UpdateNotification)
          if (id.includes('node_modules/framer-motion')) {
            return 'framer-motion';
          }
        },
      },
    },
  },
});
