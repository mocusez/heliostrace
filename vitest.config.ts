import { defineConfig, mergeConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import viteConfig from './vite.config';

// Browser Mode is mandatory here: the app is a wasm + module-worker pipeline
// (Rust crate parses .heliostrace files inside a Web Worker), which jsdom
// cannot execute. Tests run in a real headless Chromium via Playwright.
export default mergeConfig(viteConfig, defineConfig({
    test: {
        include: ['tests/**/*.test.{ts,tsx}'],
        browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
            screenshotFailures: false,
        },
        // Visual tests initialize browser-heavy components such as Monaco.
        testTimeout: 60_000,
    },
}));
