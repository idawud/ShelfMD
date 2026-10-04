use anyhow::Result;
use rusqlite::Connection;

pub fn run_migrations(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY);
        INSERT OR IGNORE INTO schema_version VALUES (0);
    ",
    )?;

    let version: i32 =
        conn.query_row("SELECT MAX(version) FROM schema_version", [], |r| r.get(0))?;
    conn.execute("DELETE FROM schema_version WHERE version != ?1", [version])?;

    if version < 1 {
        conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS books (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                root_path TEXT NOT NULL UNIQUE,
                tags TEXT NOT NULL DEFAULT '[]',
                pinned INTEGER NOT NULL DEFAULT 0,
                cover TEXT,
                added_at TEXT NOT NULL DEFAULT (datetime('now')),
                last_opened_at TEXT,
                settings_json TEXT NOT NULL DEFAULT '{}'
            );

            CREATE TABLE IF NOT EXISTS files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
                rel_path TEXT NOT NULL,
                content_hash TEXT,
                title TEXT,
                word_count INTEGER DEFAULT 0,
                UNIQUE(book_id, rel_path)
            );

            CREATE TABLE IF NOT EXISTS progress (
                file_id INTEGER PRIMARY KEY REFERENCES files(id) ON DELETE CASCADE,
                top_line INTEGER NOT NULL DEFAULT 0,
                heading_slug TEXT,
                heading_text TEXT,
                percent REAL NOT NULL DEFAULT 0,
                finished INTEGER NOT NULL DEFAULT 0,
                view_mode TEXT NOT NULL DEFAULT 'rendered',
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS sessions (
                book_id INTEGER PRIMARY KEY REFERENCES books(id) ON DELETE CASCADE,
                tabs_json TEXT NOT NULL DEFAULT '[]',
                active_tab INTEGER NOT NULL DEFAULT 0,
                sidebar_json TEXT NOT NULL DEFAULT '{}',
                last_file_id INTEGER REFERENCES files(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tab_id TEXT NOT NULL,
                seq INTEGER NOT NULL,
                file_id INTEGER REFERENCES files(id) ON DELETE CASCADE,
                anchor TEXT,
                top_line INTEGER NOT NULL DEFAULT 0,
                UNIQUE(tab_id, seq)
            );

            CREATE TABLE IF NOT EXISTS bookmarks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                file_id INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
                line INTEGER NOT NULL,
                heading_text TEXT,
                label TEXT,
                note TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );

            UPDATE schema_version SET version = 1;
        ",
        )?;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn repeated_migrations_keep_one_schema_version() {
        let conn = Connection::open_in_memory().unwrap();

        run_migrations(&conn).unwrap();
        run_migrations(&conn).unwrap();

        let version_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM schema_version", [], |row| row.get(0))
            .unwrap();
        let version: i32 = conn
            .query_row("SELECT version FROM schema_version", [], |row| row.get(0))
            .unwrap();

        assert_eq!(version_count, 1);
        assert_eq!(version, 1);
    }
}
