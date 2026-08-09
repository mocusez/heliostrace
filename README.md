# HeliosTrace

HeliosTrace is a browser-based offline profiler UI. Derived from the [umbraperf](https://github.com/umbraperf/umbraperf) project. all parsing, filtering, aggregation, and visualization run locally in the browser with no backend service.

## Build

Requirements:

- Node.js 20 or newer
- pnpm
- Rust stable with the `wasm32-unknown-unknown` target
- `wasm-pack`

One-time setup:

```sh
rustup target add wasm32-unknown-unknown
cargo install wasm-pack
pnpm install
```

Common commands:

```sh
pnpm dev            # dev server on http://localhost:9002/heliostrace/
pnpm build:release  # production bundle -> build/release/
pnpm build:debug    # debug bundle -> build/debug/
pnpm lint
pnpm test
```

The pnpm scripts build the Rust WebAssembly crate in `crate/` before starting
Vite or producing a bundle. `pnpm-lock.yaml` is the dependency lockfile of
record.

## Testing

Tests live in `tests/` and run with Vitest Browser Mode in headless Chromium.

After installing dependencies, install the browser once:

```sh
pnpm exec playwright install chromium
```

Then run:

```sh
pnpm test
```

## Notes

- `apache-arrow` 4.x declares `"sideEffects": false` but relies on side-effect
  module patches. `vite.config.ts` keeps those modules side-effectful for both
  production builds and the dev prebundle.
- The WebAssembly module imports callbacks from `src/worker_bindings.ts`.
  Keep that module separate from the worker entry `src/worker.ts` so Vite does
  not instantiate split worker state in development.
- Avoid running a manual `wasm-pack build` in `crate/` at the same time as a
  pnpm build because both write to `crate/pkg/`.
