# Contributing to ShelfMD

Thank you for your interest in contributing to ShelfMD! This document describes the process for contributing code, documentation, and bug reports.

## Getting Started

### Prerequisites

- **Node.js** 22+ and **pnpm** 10+ (`npm install -g pnpm`)
- **Rust** stable toolchain (`rustup install stable`)
- **Windows 11** with WebView2 (pre-installed on Windows 11) for full testing; Linux/macOS work for unit tests
- Optional: `cargo install tauri-cli` for faster `tauri` CLI

### Setup

```bash
git clone https://github.com/idawud/ShelfMD.git
cd ShelfMD
pnpm install
```

Run the dev server (Windows only for full Tauri):

```bash
pnpm tauri dev
```

Run unit tests (all platforms):

```bash
pnpm test          # Vitest (frontend)
cd src-tauri && cargo test  # Rust unit tests
```

## Fork and Pull Request Workflow

1. Fork the repository on GitHub.
2. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```
3. Make your changes.
4. Ensure all tests pass and lints are clean (see below).
5. Push to your fork and open a Pull Request against `main`.
6. Fill in the PR template completely.

## Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Use for |
|--------|---------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `chore:` | Build/tooling/config change |
| `docs:` | Documentation only |
| `test:` | Adding or fixing tests |
| `refactor:` | Code change with no feature or fix |
| `perf:` | Performance improvement |
| `ci:` | CI/CD changes |

Examples:
```
feat: add keyboard shortcut for next/previous file
fix: resolve wiki links on case-sensitive filesystems
docs: update ARCHITECTURE.md with watcher module
```

Breaking changes: add `!` after the type, e.g. `feat!: change IPC schema for resolve_link`.

## Code Style

### Frontend (TypeScript / Svelte)

- ESLint + Prettier are configured; run `pnpm lint` before committing.
- Use Svelte 5 runes (`$state`, `$derived`, `$effect`); avoid legacy Svelte 4 stores for new code.
- Type everything; avoid `any`.

### Rust

- Run `cargo fmt` before committing.
- Run `cargo clippy -- -D warnings` and fix all warnings.
- Write unit tests for pure functions in the same file (`#[cfg(test)] mod tests`).

### Running all checks

```bash
# Frontend
pnpm check        # svelte-check + tsc
pnpm test         # vitest

# Rust
cd src-tauri
cargo fmt --check
cargo clippy -- -D warnings
cargo test
```

## Issue Templates

Please use the provided issue templates:
- **Bug Report** — for something that is broken
- **Feature Request** — for new ideas

For security vulnerabilities, see [SECURITY.md](SECURITY.md) — do not open a public issue.

## DCO / Licensing

No DCO sign-off required. By submitting a pull request you agree to license your contribution under the MIT License.

## Questions?

Open a [Discussion](https://github.com/idawud/ShelfMD/discussions) for questions that are not bugs or feature requests.
