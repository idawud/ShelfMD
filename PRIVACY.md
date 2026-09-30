# Privacy Policy

**ShelfMD collects no personal data and has no telemetry.**

## What we do not collect

- No usage analytics
- No crash reports sent to any server
- No account creation or authentication
- No device identifiers
- No reading history sent anywhere
- No file contents transmitted outside your device

## Network access

ShelfMD accesses the network only in the following user-initiated scenarios:

1. **Open URL**: When you click an external link in a Markdown document, ShelfMD calls the OS default browser via Tauri's `opener` plugin. ShelfMD itself makes no HTTP request; the browser does.

2. **Update check (NSIS build only, opt-in)**: The GitHub Releases NSIS installer may include an opt-in update notification. This is implemented as a simple HTTPS request to the GitHub Releases API. No personal data is sent; the request includes only the current version number and the user's IP address (as with any HTTPS request). This feature is **disabled by default** and only enabled if you consent during installation.

## Local storage

All application state (reading progress, bookmarks, library, settings) is stored in a SQLite database at:

```
%LOCALAPPDATA%\io.github.idawud.shelfmd\shelfmd.db
```

This file never leaves your device except through your own backup/sync tools (e.g., OneDrive).

## Third-party dependencies

ShelfMD bundles open-source libraries (see `package.json` and `Cargo.toml`). None of these libraries make network requests at runtime except as described above.

## Changes to this policy

Any change to this policy will be documented in [CHANGELOG.md](CHANGELOG.md) and noted in the GitHub release notes.

---

*Last updated: 2026-09-27*
