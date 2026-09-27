## Summary

<!-- Describe what this PR does and why. Link to the relevant issue if applicable. Closes #XXX -->

## Type of Change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Refactor (no functional change)
- [ ] Documentation update
- [ ] Chore / dependency update

## Test Plan

<!-- Describe how you tested this change. -->

- [ ] Ran `pnpm test` — all Vitest tests pass
- [ ] Ran `cargo test` in `src-tauri/` — all Rust tests pass
- [ ] Ran `cargo clippy -- -D warnings` — no warnings
- [ ] Ran `cargo fmt --check` — no formatting issues
- [ ] Ran `pnpm check` — no TypeScript errors
- [ ] Manually tested on Windows 11 (if applicable)

## Checklist

- [ ] My code follows the project's style guidelines
- [ ] I have added/updated tests for new behaviour
- [ ] I have updated documentation if needed (ARCHITECTURE.md, inline comments)
- [ ] Version numbers in `package.json`, `Cargo.toml`, and `tauri.conf.json` are consistent (if bumping version)
- [ ] I have read and agree to the [CONTRIBUTING.md](../CONTRIBUTING.md) guidelines
