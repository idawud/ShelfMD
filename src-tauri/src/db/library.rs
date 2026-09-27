use super::with_conn;
use anyhow::Result;
use rusqlite::params;
use serde::{Deserialize, Serialize};

#[expect(dead_code, reason = "library view not wired up yet")]
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

#[expect(dead_code, reason = "library view not wired up yet")]
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

#[expect(dead_code, reason = "library view not wired up yet")]
pub fn add_book(root_path: &str, name: &str) -> Result<Book> {
    with_conn(|conn| {
        conn.execute(
            "INSERT OR IGNORE INTO books (name, root_path) VALUES (?1, ?2)",
            params![name, root_path],
        )?;
        let book = conn.query_row(
            "SELECT id, name, root_path, tags, pinned, cover, added_at, last_opened_at, settings_json FROM books WHERE root_path = ?1",
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
