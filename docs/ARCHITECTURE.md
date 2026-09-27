# ShelfMD Architecture

## Overview
ShelfMD is a Tauri v2 desktop app for reading multi-file Markdown books on Windows 11. Rust backend handles path logic, state, and file I/O; SvelteKit frontend renders Markdown and drives the UI.

## Module Map

### Rust (src-tauri/src/)
- `main.rs` — App entry, single-instance lock, window setup, menu, jump list
- `lib.rs` — Tauri builder, plugin registration, state injection
- `commands/mod.rs` — All IPC command registrations
- `commands/links.rs` — `resolve_link(current_file, href)` → resolved canonical path or error; uses `dunce` + `path-clean`; case-insensitive on Windows
- `commands/state.rs` — `get_progress`, `set_progress`, `get_session`, `set_session`, `list_books`, `add_book`, `remove_book`
- `commands/search.rs` — `search_book(book_id, query)` via tantivy
- `commands/watcher.rs` — `start_watch(book_id)`, `stop_watch(book_id)`; emits `file-changed` events
- `db/mod.rs` — SQLite init, WAL mode, migrations
- `db/schema.rs` — Table definitions; migration runner
- `db/progress.rs` — CRUD for `progress`, `sessions`, `history`
- `db/library.rs` — CRUD for `books`, `files`
- `db/bookmarks.rs` — CRUD for `bookmarks`
- `resolver.rs` — Core link-resolution logic (pure fn, unit-tested); handles relative, root-relative, extensionless, wiki links
- `slugs.rs` — GitHub heading-slug algorithm (pure fn, unit-tested)
- `watcher.rs` — `notify` debouncer; emits Tauri events; detects self-writes

### Frontend (src/)
- `lib/stores/` — Svelte 5 rune-based stores: `book.svelte.ts`, `tabs.svelte.ts`, `progress.svelte.ts`, `settings.svelte.ts`
- `lib/components/` — `Sidebar.svelte`, `TabBar.svelte`, `Reader.svelte`, `Outline.svelte`, `FindBar.svelte`, `LibraryHome.svelte`, `BookSwitcher.svelte`
- `lib/markdown.ts` — markdown-it setup: GFM, footnotes, front-matter, admonitions, source-pos, data-internal link marking, image path rewriting, KaTeX, Mermaid, highlight.js
- `lib/links.ts` — Delegated click handler; calls `resolve_link`; handles Ctrl+Click
- `lib/scroll.ts` — Source-line ↔ pixel scroll mapping; reading-memory debouncer
- `lib/shortcuts.ts` — Keyboard shortcut dispatcher (vim keys, all remappable)
- `routes/+layout.svelte` — Window chrome, single-instance routing
- `routes/+page.svelte` — Main reader layout

## IPC Command Reference
| Command | Args | Returns |
|---|---|---|
| `resolve_link` | `{current_file, href}` | `{resolved: string, type: "md"\|"asset"\|"external"\|"broken"}` |
| `get_progress` | `{file_id}` | `Progress` |
| `set_progress` | `Progress` | `void` |
| `get_session` | `{book_id}` | `Session` |
| `set_session` | `Session` | `void` |
| `list_books` | — | `Book[]` |
| `add_book` | `{path}` | `Book` |
| `open_file` | `{path}` | `{content, canonical_path, book_id}` |
| `search_book` | `{book_id, query}` | `SearchResult[]` |
| `start_watch` | `{book_id}` | `void` |

## Data Flow
1. User opens a book → `add_book` → DB insert → watcher started → tree populated
2. User clicks a file → `open_file` → Rust reads file, returns content + canonical path → frontend renders → `set_progress` debounced
3. User clicks a link → delegated handler intercepts → `resolve_link` → if MD: navigate tab; if external: `open_url`; if broken: toast
4. Scroll event → debounced `set_progress` (≤ 2 s)
5. App close → final `set_session` flush → app exits

## State Location
All persistent state in SQLite at `app_data_dir()/shelfmd.db`. Never hardcode `%APPDATA%`. Reading memory survives MSIX redirected paths.

## Security
- Strict CSP: no `unsafe-inline` scripts, no `unsafe-eval`
- All Markdown sanitised via `ammonia` before rendering
- File access scoped to opened paths only (Tauri v2 `fs` scope)
- No telemetry, no analytics
