use super::with_conn;
use anyhow::Result;
use rusqlite::params;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
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
