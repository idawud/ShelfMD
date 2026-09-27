use super::with_conn;
use anyhow::Result;
use rusqlite::params;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Progress {
    pub file_id: i64,
    pub top_line: i64,
    pub heading_slug: Option<String>,
    pub heading_text: Option<String>,
    pub percent: f64,
    pub finished: bool,
    pub view_mode: String,
    pub updated_at: String,
}

#[expect(dead_code, reason = "per-file progress listing not wired up yet")]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileProgress {
    pub file_id: i64,
    pub rel_path: String,
    pub content_hash: Option<String>,
    pub top_line: i64,
    pub heading_slug: Option<String>,
    pub heading_text: Option<String>,
    pub percent: f64,
    pub finished: bool,
    pub view_mode: String,
    pub updated_at: String,
}

pub fn get_progress(file_id: i64) -> Result<Option<Progress>> {
    with_conn(|conn| {
        let mut stmt = conn.prepare(
            "SELECT file_id, top_line, heading_slug, heading_text, percent, finished, view_mode, updated_at
             FROM progress WHERE file_id = ?1"
        )?;
        let result = stmt.query_row(params![file_id], |row| {
            Ok(Progress {
                file_id: row.get(0)?,
                top_line: row.get(1)?,
                heading_slug: row.get(2)?,
                heading_text: row.get(3)?,
                percent: row.get(4)?,
                finished: row.get::<_, i64>(5)? != 0,
                view_mode: row.get(6)?,
                updated_at: row.get(7)?,
            })
        });
        match result {
            Ok(p) => Ok(Some(p)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.into()),
        }
    })
}

pub fn set_progress(p: &Progress) -> Result<()> {
    with_conn(|conn| {
        conn.execute(
            "INSERT INTO progress (file_id, top_line, heading_slug, heading_text, percent, finished, view_mode, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, datetime('now'))
             ON CONFLICT(file_id) DO UPDATE SET
               top_line = excluded.top_line,
               heading_slug = excluded.heading_slug,
               heading_text = excluded.heading_text,
               percent = excluded.percent,
               finished = excluded.finished,
               view_mode = excluded.view_mode,
               updated_at = datetime('now')",
            params![p.file_id, p.top_line, p.heading_slug, p.heading_text, p.percent, p.finished as i64, p.view_mode]
        )?;
        Ok(())
    })
}

/// MEM-09: Mark file as finished or unread
pub fn mark_finished(file_id: i64, finished: bool) -> Result<()> {
    with_conn(|conn| {
        conn.execute(
            "INSERT INTO progress (file_id, top_line, percent, finished, view_mode, updated_at)
             VALUES (?1, 0, ?2, ?3, 'rendered', datetime('now'))
             ON CONFLICT(file_id) DO UPDATE SET
               finished = excluded.finished,
               percent = CASE WHEN ?3 THEN 1.0 ELSE 0.0 END,
               updated_at = datetime('now')",
            params![
                file_id,
                if finished { 1.0f64 } else { 0.0f64 },
                finished as i64
            ],
        )?;
        Ok(())
    })
}

/// Get book-level progress summary (MEM-08)
pub fn get_book_progress(book_id: i64) -> Result<(i64, i64)> {
    // Returns (files_finished, total_files)
    with_conn(|conn| {
        let total: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM files WHERE book_id = ?1",
                params![book_id],
                |r| r.get(0),
            )
            .unwrap_or(0);
        let finished: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM progress p
             JOIN files f ON f.id = p.file_id
             WHERE f.book_id = ?1 AND p.finished = 1",
                params![book_id],
                |r| r.get(0),
            )
            .unwrap_or(0);
        Ok((finished, total))
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db;

    fn setup_test_db() {
        let dir = std::env::temp_dir().join(format!("shelfmd_test_{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let db_path = dir.join("test.db");
        db::init(&db_path).ok(); // ok if already initialized
    }

    #[test]
    fn set_and_get_progress() {
        setup_test_db();
        // Insert a minimal book and file first
        with_conn(|conn| {
            conn.execute("INSERT OR IGNORE INTO books (id, name, root_path) VALUES (999, 'test', '/test')", [])?;
            conn.execute("INSERT OR IGNORE INTO files (id, book_id, rel_path) VALUES (999, 999, '/test/file.md')", [])?;
            Ok(())
        }).unwrap();

        let p = Progress {
            file_id: 999,
            top_line: 42,
            heading_slug: Some("setup".to_string()),
            heading_text: Some("Setup".to_string()),
            percent: 0.62,
            finished: false,
            view_mode: "rendered".to_string(),
            updated_at: String::new(),
        };
        set_progress(&p).unwrap();

        let got = get_progress(999).unwrap().unwrap();
        assert_eq!(got.top_line, 42);
        assert_eq!(got.heading_slug.as_deref(), Some("setup"));
        assert!((got.percent - 0.62).abs() < 0.001);
        assert!(!got.finished);
    }

    #[test]
    fn auto_finish_at_95_percent() {
        // This is enforced in the Tauri command layer, not DB layer
        // Just verify mark_finished works
        setup_test_db();
        with_conn(|conn| {
            conn.execute("INSERT OR IGNORE INTO books (id, name, root_path) VALUES (998, 'test2', '/test2')", [])?;
            conn.execute("INSERT OR IGNORE INTO files (id, book_id, rel_path) VALUES (998, 998, '/test2/file.md')", [])?;
            Ok(())
        }).unwrap();
        mark_finished(998, true).unwrap();
        let got = get_progress(998).unwrap().unwrap();
        assert!(got.finished);
    }
}
