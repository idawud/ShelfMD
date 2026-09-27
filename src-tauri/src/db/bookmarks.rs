use super::with_conn;
use anyhow::Result;
use rusqlite::params;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Bookmark {
    pub id: i64,
    pub file_id: i64,
    pub line: i64,
    pub heading_text: Option<String>,
    pub label: Option<String>,
    pub note: Option<String>,
    pub created_at: String,
}

pub fn add_bookmark(
    file_id: i64,
    line: i64,
    heading_text: Option<&str>,
    label: Option<&str>,
    note: Option<&str>,
) -> Result<i64> {
    with_conn(|conn| {
        conn.execute(
            "INSERT INTO bookmarks (file_id, line, heading_text, label, note) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![file_id, line, heading_text, label, note],
        )?;
        Ok(conn.last_insert_rowid())
    })
}

pub fn list_bookmarks_for_file(file_id: i64) -> Result<Vec<Bookmark>> {
    with_conn(|conn| {
        let mut stmt = conn.prepare(
            "SELECT id, file_id, line, heading_text, label, note, created_at
             FROM bookmarks WHERE file_id = ?1 ORDER BY line",
        )?;
        let rows = stmt
            .query_map(params![file_id], |r| {
                Ok(Bookmark {
                    id: r.get(0)?,
                    file_id: r.get(1)?,
                    line: r.get(2)?,
                    heading_text: r.get(3)?,
                    label: r.get(4)?,
                    note: r.get(5)?,
                    created_at: r.get(6)?,
                })
            })?
            .filter_map(|r| r.ok())
            .collect();
        Ok(rows)
    })
}

pub fn list_bookmarks_for_book(book_id: i64) -> Result<Vec<(Bookmark, String)>> {
    with_conn(|conn| {
        let mut stmt = conn.prepare(
            "SELECT b.id, b.file_id, b.line, b.heading_text, b.label, b.note, b.created_at, f.rel_path
             FROM bookmarks b JOIN files f ON f.id = b.file_id
             WHERE f.book_id = ?1 ORDER BY f.rel_path, b.line",
        )?;
        let rows = stmt
            .query_map(params![book_id], |r| {
                Ok((
                    Bookmark {
                        id: r.get(0)?,
                        file_id: r.get(1)?,
                        line: r.get(2)?,
                        heading_text: r.get(3)?,
                        label: r.get(4)?,
                        note: r.get(5)?,
                        created_at: r.get(6)?,
                    },
                    r.get::<_, String>(7)?,
                ))
            })?
            .filter_map(|r| r.ok())
            .collect();
        Ok(rows)
    })
}

pub fn remove_bookmark(id: i64) -> Result<()> {
    with_conn(|conn| {
        conn.execute("DELETE FROM bookmarks WHERE id = ?1", params![id])?;
        Ok(())
    })
}
