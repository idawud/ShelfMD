use crate::db::bookmarks::{
    add_bookmark as db_add, list_bookmarks_for_book, list_bookmarks_for_file as db_list,
    remove_bookmark as db_remove, Bookmark,
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct BookmarkWithPath {
    pub bookmark: Bookmark,
    pub rel_path: String,
}

/// MEM-10: Add a bookmark at the given line in a file
#[tauri::command]
pub fn add_bookmark(
    file_id: i64,
    line: i64,
    heading_text: Option<String>,
    label: Option<String>,
    note: Option<String>,
) -> Result<i64, String> {
    db_add(
        file_id,
        line,
        heading_text.as_deref(),
        label.as_deref(),
        note.as_deref(),
    )
    .map_err(|e| e.to_string())
}

/// MEM-10: List bookmarks for a single file
#[tauri::command]
pub fn list_bookmarks(file_id: i64) -> Result<Vec<Bookmark>, String> {
    db_list(file_id).map_err(|e| e.to_string())
}

/// MEM-10: List all bookmarks for a book (sidebar panel)
#[tauri::command]
pub fn list_book_bookmarks(book_id: i64) -> Result<Vec<BookmarkWithPath>, String> {
    list_bookmarks_for_book(book_id)
        .map(|rows| {
            rows.into_iter()
                .map(|(bookmark, rel_path)| BookmarkWithPath { bookmark, rel_path })
                .collect()
        })
        .map_err(|e| e.to_string())
}

/// MEM-10: Remove a bookmark by id
#[tauri::command]
pub fn remove_bookmark(id: i64) -> Result<(), String> {
    db_remove(id).map_err(|e| e.to_string())
}
