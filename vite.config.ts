import path from 'path';
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import tailwindcss from '@tailwindcss/vite';

// apache-arrow 4.x declares "sideEffects": false in its package.json but
// relies on side-effect module patches (e.g. vector/index assigns
// AbstractVector.new). Rollup would prune those modules and Table.getColumn()
// breaks at runtime, so re-mark all apache-arrow modules as side-effectful.
function arrowSideEffects(): Plugin {
    return {
        name: 'apache-arrow-side-effects',
        enforce: 'pre',
        async resolveId(source, importer, options) {
            if (importer && !importer.includes('apache-arrow') && !source.includes('apache-arrow')) return null;
            const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
            if (resolved && resolved.id.includes('apache-arrow')) {
                return { ...resolved, moduleSideEffects: true };
            }
            return resolved;
        },
    };
}

// The wasm crate (crate/pkg, wasm-pack bundler target) and the TS worker
// (src/worker.ts) import each other, so the wasm plugin must be active for
// both the main build and the worker build.
export default defineConfig({
    base: '/heliostrace/',
    plugins: [arrowSideEffects(), react(), wasm(), tailwindcss()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    worker: {
        format: 'es',
        plugins: () => [wasm()],
    },
    build: {
        // wasm-bindgen module integration relies on top-level await
        target: 'esnext',
        outDir: 'build/release',
    },
    optimizeDeps: {
        esbuildOptions: {
            // same apache-arrow "sideEffects": false issue for the dev prebundle
            ignoreAnnotations: true,
        },
    },
    server: {
        port: 9002,
    },
});
