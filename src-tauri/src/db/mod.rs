pub mod bookmarks;
pub mod library;
pub mod progress;
mod schema;

use anyhow::Result;
use rusqlite::Connection;
use std::path::Path;
use std::sync::Mutex;

pub static DB: once_cell::sync::OnceCell<Mutex<Connection>> = once_cell::sync::OnceCell::new();

pub fn init(path: &Path) -> Result<()> {
    let conn = Connection::open(path)?;

    // WAL mode for concurrent reads
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;")?;

    schema::run_migrations(&conn)?;

    DB.set(Mutex::new(conn))
        .map_err(|_| anyhow::anyhow!("DB already initialized"))?;
    Ok(())
}

pub fn with_conn<F, T>(f: F) -> Result<T>
where
    F: FnOnce(&Connection) -> Result<T>,
{
    let db = DB
        .get()
        .ok_or_else(|| anyhow::anyhow!("DB not initialized"))?;
    let conn = db.lock().map_err(|_| anyhow::anyhow!("DB lock poisoned"))?;
    f(&conn)
}
