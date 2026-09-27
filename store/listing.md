# Microsoft Store Listing — ShelfMD

## Short Description (≤ 200 characters)

ShelfMD — Read multi-file Markdown books on Windows. Cross-file links, reading memory, beautiful typography, dark/light/sepia themes.

## Long Description

ShelfMD is a beautiful, distraction-free Markdown book reader built for Windows 11. Whether you're reading technical documentation, a self-published novel written in Obsidian, a generated API reference, or a hand-crafted developer guide, ShelfMD turns a folder of Markdown files into a polished reading experience.

**Designed for multi-file books.** ShelfMD understands that real books span dozens or hundreds of files. Open a folder and instantly see a navigable file tree, jump between chapters, follow cross-file links — and always land back exactly where you left off.

**Smart link resolution.** Relative links, root-relative links, extensionless links (`[Next](chapter-02)`), and Obsidian-style wiki links (`[[Chapter Name]]`) all just work. Link resolution runs in Rust, so Windows path edge cases are handled correctly.

**Reading memory that never forgets.** Your scroll position, current file, and open tabs are saved automatically as you read — even across app restarts. Pick up exactly where you left off, every time.

**Beautiful typography.** Choose from serif, sans-serif, or monospace reading fonts. Adjust font size, line height, and column width. Dark, light, and warm sepia colour schemes, all with smooth transitions.

**Full Markdown support.** CommonMark + GitHub Flavored Markdown, task lists, footnotes, tables, code blocks with syntax highlighting (100+ languages via highlight.js), mathematical equations (KaTeX), and diagrams (Mermaid).

**Lightning fast.** Built on Tauri v2 and WebView2 — no bundled Chromium, just a ~4 MB installer. Starts in under a second on modern hardware.

**Privacy first.** No accounts. No telemetry. No analytics. No data leaves your device. All reading state is stored in a local SQLite database.

**Open source.** MIT licensed. Source code at github.com/idawud/ShelfMD.

## Feature Bullets

- Open any folder of Markdown files as a book — no conversion or import needed
- Cross-file link navigation with Rust-powered path resolution (handles wiki links, extensionless links, case-insensitive Windows paths)
- Reading memory: automatically saves your position, open tabs, and scroll state
- Dark, Light, and Sepia themes with smooth switching
- Adjustable font family, size, line height, and column width
- Full GFM support: tables, task lists, footnotes, fenced code blocks with syntax highlighting
- Mathematical equations rendered with KaTeX; diagrams with Mermaid
- Document outline sidebar with heading navigation
- Full-text search within a book
- Tabbed reading: open multiple files side by side
- Zero telemetry, no accounts, all data stored locally — complete privacy
