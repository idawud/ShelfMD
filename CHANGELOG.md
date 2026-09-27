# Changelog

All notable changes to ShelfMD will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added (M0 — Reader Foundation)

- **Project scaffold**: Tauri v2 + SvelteKit + Svelte 5 + TypeScript + Tailwind v4
- **Markdown rendering**: `markdown-it` with syntax highlighting (highlight.js), task lists, source-position tracking
- **Reader component**: Scrollable article view with document outline sidebar
- **Link resolution engine** (`resolver.rs`): Resolves relative, root-relative, extensionless, and wiki-style links; case-insensitive on Windows
- **GitHub slug algorithm** (`slugs.rs`): Correct heading anchor generation with duplicate deduplication
- **SQLite persistence** (`db/`): WAL-mode SQLite for progress, sessions, library, bookmarks, settings; full migration system
- **IPC commands**: `resolve_link`, `get_progress`, `set_progress`
- **Architecture documentation**: `docs/ARCHITECTURE.md`, `docs/DECISIONS.md` (ADR-001 through ADR-005)
- **CI/CD**: GitHub Actions workflows for check/test (`ci.yml`) and release (`release.yml`)
- **Community files**: LICENSE (MIT), CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md, PRIVACY.md
- **Store listing**: `store/listing.md`, `docs/STORE_RELEASE.md`
- **App icon**: SVG book-on-shelf icon
- **Dependabot**: Weekly updates for npm, Cargo, and GitHub Actions
- **Issue templates**: Bug report, feature request
- **PR template**

[Unreleased]: https://github.com/idawud/ShelfMD/compare/HEAD...HEAD
