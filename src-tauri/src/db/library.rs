use super::with_conn;
use anyhow::Result;
use rusqlite::params;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Book {
    pub id: i64,
    pub name: String,
    pub root_path: String,
    pub tags: String,
    pub pinned: bool,
    pub cover: Option<String>,
    pub added_at: String,
    pub last_opened_at: Option<String>,
    pub settings_json: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Session {
    pub book_id: i64,
    pub tabs_json: String,
    pub active_tab: i64,
    pub sidebar_json: String,
    pub last_file_id: Option<i64>,
}

pub fn list_books() -> Result<Vec<Book>> {
    with_conn(|conn| {
        let mut stmt = conn.prepare(
            "SELECT id, name, root_path, tags, pinned, cover, added_at, last_opened_at, settings_json
             FROM books ORDER BY pinned DESC, last_opened_at DESC NULLS LAST"
        )?;
        let books = stmt
            .query_map([], |row| {
                Ok(Book {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    root_path: row.get(2)?,
                    tags: row.get(3)?,
                    pinned: row.get::<_, i64>(4)? != 0,
                    cover: row.get(5)?,
                    added_at: row.get(6)?,
                    last_opened_at: row.get(7)?,
                    settings_json: row.get(8)?,
                })
            })?
            .filter_map(|r| r.ok())
            .collect();
        Ok(books)
    })
}

pub fn add_book(root_path: &str, name: &str) -> Result<Book> {
    with_conn(|conn| {
        conn.execute(
            "INSERT OR IGNORE INTO books (name, root_path) VALUES (?1, ?2)",
            params![name, root_path],
        )?;
        let book = conn.query_row(
            "SELECT id, name, root_path, tags, pinned, cover, added_at, last_opened_at, settings_json
             FROM books WHERE root_path = ?1",
            params![root_path],
            |row| Ok(Book {
                id: row.get(0)?,
                name: row.get(1)?,
                root_path: row.get(2)?,
                tags: row.get(3)?,
                pinned: row.get::<_, i64>(4)? != 0,
                cover: row.get(5)?,
                added_at: row.get(6)?,
                last_opened_at: row.get(7)?,
                settings_json: row.get(8)?,
            })
        )?;
        Ok(book)
    })
}

/// MEM-02: Upsert a file record, storing content hash
pub fn upsert_file(
    book_id: i64,
    rel_path: &str,
    content_hash: &str,
    title: Option<&str>,
    word_count: i64,
) -> Result<i64> {
    with_conn(|conn| {
        conn.execute(
            "INSERT INTO files (book_id, rel_path, content_hash, title, word_count)
             VALUES (?1, ?2, ?3, ?4, ?5)
             ON CONFLICT(book_id, rel_path) DO UPDATE SET
               content_hash = excluded.content_hash,
               title = excluded.title,
               word_count = excluded.word_count",
            params![book_id, rel_path, content_hash, title, word_count],
        )?;
        let id: i64 = conn.query_row(
            "SELECT id FROM files WHERE book_id = ?1 AND rel_path = ?2",
            params![book_id, rel_path],
            |r| r.get(0),
        )?;
        Ok(id)
    })
}

pub fn get_file_by_path(book_id: i64, rel_path: &str) -> Result<Option<(i64, Option<String>)>> {
    // Returns (file_id, content_hash)
    with_conn(|conn| {
        let result = conn.query_row(
            "SELECT id, content_hash FROM files WHERE book_id = ?1 AND rel_path = ?2",
            params![book_id, rel_path],
            |r| Ok((r.get::<_, i64>(0)?, r.get::<_, Option<String>>(1)?)),
        );
        match result {
            Ok(v) => Ok(Some(v)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.into()),
        }
    })
}

pub fn get_session(book_id: i64) -> Result<Option<Session>> {
    with_conn(|conn| {
        let result = conn.query_row(
            "SELECT book_id, tabs_json, active_tab, sidebar_json, last_file_id
             FROM sessions WHERE book_id = ?1",
            params![book_id],
            |row| {
                Ok(Session {
                    book_id: row.get(0)?,
                    tabs_json: row.get(1)?,
                    active_tab: row.get(2)?,
                    sidebar_json: row.get(3)?,
                    last_file_id: row.get(4)?,
                })
            },
        );
        match result {
            Ok(s) => Ok(Some(s)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.into()),
        }
    })
}

pub fn set_session(s: &Session) -> Result<()> {
    with_conn(|conn| {
        conn.execute(
            "INSERT INTO sessions (book_id, tabs_json, active_tab, sidebar_json, last_file_id)
             VALUES (?1, ?2, ?3, ?4, ?5)
             ON CONFLICT(book_id) DO UPDATE SET
               tabs_json = excluded.tabs_json,
               active_tab = excluded.active_tab,
               sidebar_json = excluded.sidebar_json,
               last_file_id = excluded.last_file_id",
            params![
                s.book_id,
                s.tabs_json,
                s.active_tab,
                s.sidebar_json,
                s.last_file_id
            ],
        )?;
        Ok(())
    })
}

pub fn remove_book(book_id: i64) -> Result<()> {
    with_conn(|conn| {
        conn.execute("DELETE FROM books WHERE id = ?1", params![book_id])?;
        Ok(())
    })
}

pub fn update_book(book_id: i64, name: &str, tags: &str, settings_json: &str) -> Result<()> {
    with_conn(|conn| {
        conn.execute(
            "UPDATE books SET name = ?1, tags = ?2, settings_json = ?3 WHERE id = ?4",
            params![name, tags, settings_json, book_id],
        )?;
        Ok(())
    })
}

pub fn update_book_root(book_id: i64, new_root: &str) -> Result<()> {
    with_conn(|conn| {
        conn.execute(
            "UPDATE books SET root_path = ?1 WHERE id = ?2",
            params![new_root, book_id],
        )?;
        Ok(())
    })
}

pub fn touch_book_opened(book_id: i64) -> Result<()> {
    with_conn(|conn| {
        conn.execute(
            "UPDATE books SET last_opened_at = datetime('now') WHERE id = ?1",
            params![book_id],
        )?;
        Ok(())
    })
}

pub fn list_files_for_book(book_id: i64) -> Result<Vec<(i64, String, Option<String>)>> {
    // Returns (file_id, rel_path, title)
    with_conn(|conn| {
        let mut stmt = conn.prepare(
            "SELECT id, rel_path, title FROM files WHERE book_id = ?1 ORDER BY rel_path",
        )?;
        let rows = stmt
            .query_map(params![book_id], |r| {
                Ok((
                    r.get::<_, i64>(0)?,
                    r.get::<_, String>(1)?,
                    r.get::<_, Option<String>>(2)?,
                ))
            })?
            .filter_map(|r| r.ok())
            .collect();
        Ok(rows)
    })
}

#[expect(dead_code, reason = "watcher does not handle file removal yet")]
pub fn delete_file(file_id: i64) -> Result<()> {
    with_conn(|conn| {
        conn.execute("DELETE FROM files WHERE id = ?1", params![file_id])?;
        Ok(())
    })
}
