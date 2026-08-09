#!/usr/bin/env bash
# HeliosTrace frontend build wrapper.
#
# The frontend is built with Vite; the wasm crate is built by wasm-pack as a
# pre-step of each pnpm script (see package.json). Since the wasm-bindgen
# upgrade (0.2.74 -> 0.2.126) the crate compiles on any modern stable rustc,
# so no pinned toolchain is needed anymore. wasm-pack downloads the matching
# wasm-bindgen-cli by itself.
#
# Usage:
#   scripts/build.sh              # pnpm build:release (production bundle)
#   scripts/build.sh debug        # pnpm build:debug
#   scripts/build.sh start        # pnpm start (dev server, foreground)
#   scripts/build.sh <any pnpm script name>
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

fail() {
    echo "error: $1" >&2
    exit 1
}

info() {
    echo "==> $1"
}

# --- tool presence -----------------------------------------------------

command -v node >/dev/null 2>&1 || fail "node not found on PATH. Install Node >= 20."
command -v pnpm >/dev/null 2>&1 || fail "pnpm not found on PATH. Install with 'npm i -g pnpm' or 'corepack enable'."
command -v cargo >/dev/null 2>&1 || fail "cargo not found on PATH. Install Rust via https://rustup.rs first."

if command -v rustup >/dev/null 2>&1; then
    if ! rustup target list --installed | grep -q '^wasm32-unknown-unknown$'; then
        fail "wasm32-unknown-unknown target missing.
  Fix:  rustup target add wasm32-unknown-unknown"
    fi
fi

# --- wasm-pack (native binary; the npm 'wasm-pack' wrapper package does not
#     support Darwin arm64 and is intentionally NOT a package.json dependency
#     here) -------------------------------------------------------------

if ! command -v wasm-pack >/dev/null 2>&1 && [ ! -x "$HOME/.cargo/bin/wasm-pack" ]; then
    fail "wasm-pack binary not found on PATH.
  Fix:  cargo install wasm-pack"
fi

# --- node_modules ---------------------------------------------------------

if [ ! -d "$REPO_ROOT/node_modules" ]; then
    info "node_modules missing, running pnpm install..."
    pnpm install
fi

# --- run the requested pnpm script ----------------------------------------

TARGET="${1:-build:release}"
case "$TARGET" in
    debug) TARGET="build:debug" ;;
    release) TARGET="build:release" ;;
esac

info "Running 'pnpm ${TARGET}'"
exec pnpm run "$TARGET"
