# ShelfMD

**A beautiful Markdown book reader for Windows 11.**

ShelfMD reads multi-file Markdown books — generated books, documentation sets, AI-written reports — as first-class citizens. It resolves cross-file links, remembers exactly where you stopped, and keeps a library of book folders you switch between in one keystroke.

---

## Why ShelfMD?

Single-file Markdown viewers fail at reading books in three ways:

| Problem | ShelfMD fix |
|---------|------------|
| Links to other `.md` files do nothing | Full cross-file link resolution (LNK-01…LNK-23) |
| Reopening starts from the top | Reading memory per file and per book (MEM-01…MEM-13) |
| Only one folder in play | Library of books with session restore (LIB-01…LIB-15) |

---

## Features

- **Cross-file links** — Relative, root-relative, extensionless, wiki `[[links]]`, anchors
- **Reading memory** — Top-of-viewport line, heading, percent read; survives restarts
- **Library** — Manage multiple book folders; switch with Ctrl+Shift+O
- **Beautiful typography** — Light, Dark, Sepia themes; font and width controls
- **Syntax highlighting** — 25+ languages via highlight.js
- **Math** — KaTeX inline and block
- **Diagrams** — Mermaid flowcharts, sequences, and more
- **Find** — In-file find with highlighting; book-wide full-text search
- **Tabs** — Multiple files open, history per tab, restored on restart
- **Editor** — Lightweight in-app editing with CodeMirror 6
- **Vim keys** — j/k, gg/G, d/u, [ ], /

---

## Installation

### Microsoft Store (recommended)

*Coming soon — [Store page](https://apps.microsoft.com)*

### GitHub Releases (NSIS installer)

Download the latest `.exe` from [Releases](https://github.com/idawud/ShelfMD/releases).

---

## Building from Source

**Prerequisites:** Node 22+, pnpm 10+, Rust stable, Windows 11 with WebView2

```bash
git clone https://github.com/idawud/ShelfMD.git
cd ShelfMD
pnpm install
pnpm tauri dev        # development mode
pnpm tauri build      # production build
```

**Lint and test:**
```bash
pnpm check            # TypeScript + Svelte type check
pnpm test             # Vitest frontend tests
cd src-tauri && cargo test --workspace   # Rust tests
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). All contributions welcome — bug fixes, features, docs.

---

## License

MIT — see [LICENSE](LICENSE).
