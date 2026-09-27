use crate::db::library::{
    get_file_by_path, get_session as db_get_session, set_session as db_set_session, upsert_file,
    Session,
};
use crate::db::progress::{
    get_book_progress, get_progress as db_get, mark_finished as db_mark, set_progress as db_set,
    Progress,
};
use serde::{Deserialize, Serialize};
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

/// MEM-01: Simple hash of file content (FNV-style via std)
fn hash_content(content: &str) -> String {
    let mut hasher = DefaultHasher::new();
    content.hash(&mut hasher);
    format!("{:x}", hasher.finish())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OpenWithMemoryResult {
    pub content: String,
    pub canonical_path: String,
    pub file_name: String,
    pub file_id: i64,
    pub progress: Option<Progress>,
    pub content_changed: bool,
}

/// MEM-01/02: Open a file, register it in the DB, and return stored progress.
/// If content hash changed, sets content_changed=true so caller can decide restore strategy.
#[tauri::command]
pub fn open_file_with_memory(
    path: String,
    book_id: Option<i64>,
) -> Result<OpenWithMemoryResult, String> {
    use std::path::PathBuf;
    let p = PathBuf::from(&path);
    let canonical = dunce::canonicalize(&p).map_err(|e| e.to_string())?;
    let content = std::fs::read_to_string(&canonical).map_err(|e| e.to_string())?;
    let file_name = canonical
        .file_name()
        .map(|n| n.to_string_lossy().into_owned())
        .unwrap_or_else(|| path.clone());

    let new_hash = hash_content(&content);

    // MEM-01: extract title (first H1)
    let title = content
        .lines()
        .find(|l| l.starts_with("# "))
        .map(|l| l[2..].trim().to_string());

    // Word count (approximate)
    let word_count = content.split_whitespace().count() as i64;

    let effective_book_id = book_id.unwrap_or(1); // 1 = "Loose files" book

    // Resolve relative path within book
    let rel_path = canonical.to_string_lossy().into_owned();

    // Get old hash before upsert
    let old_hash = match get_file_by_path(effective_book_id, &rel_path) {
        Ok(Some((_, h))) => h,
        _ => None,
    };

    let file_id = upsert_file(
        effective_book_id,
        &rel_path,
        &new_hash,
        title.as_deref(),
        word_count,
    )
    .map_err(|e| e.to_string())?;

    let progress = db_get(file_id).ok().flatten();

    let content_changed = old_hash.as_deref() != Some(&new_hash) && old_hash.is_some();

    Ok(OpenWithMemoryResult {
        content,
        canonical_path: canonical.to_string_lossy().into_owned(),
        file_name,
        file_id,
        progress,
        content_changed,
    })
}

#[tauri::command]
pub fn get_progress(file_id: i64) -> Result<Option<Progress>, String> {
    db_get(file_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_progress(progress: Progress) -> Result<(), String> {
    // MEM-03: auto-mark finished at ≥95%
    let mut p = progress;
    if p.percent >= 0.95 {
        p.finished = true;
    }
    db_set(&p).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn mark_file_finished(file_id: i64, finished: bool) -> Result<(), String> {
    db_mark(file_id, finished).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_book_progress_cmd(book_id: i64) -> Result<(i64, i64), String> {
    get_book_progress(book_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_session(book_id: i64) -> Result<Option<Session>, String> {
    db_get_session(book_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_session(session: Session) -> Result<(), String> {
    db_set_session(&session).map_err(|e| e.to_string())
}
