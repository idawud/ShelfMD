use crate::db::library::{
    add_book, list_books, list_files_for_book, remove_book, touch_book_opened, update_book,
    update_book_root, Book,
};
use crate::search;
use crate::watcher;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

#[derive(Debug, Serialize, Deserialize)]
pub struct BookWithStatus {
    pub book: Book,
    pub exists: bool,
}

/// LIB-01: List all books with availability status
#[tauri::command]
pub fn list_books_cmd() -> Result<Vec<BookWithStatus>, String> {
    let books = list_books().map_err(|e| e.to_string())?;
    let result = books
        .into_iter()
        .map(|b| {
            let exists = std::path::Path::new(&b.root_path).exists();
            BookWithStatus { book: b, exists }
        })
        .collect();
    Ok(result)
}

/// LIB-02: Add a book folder
#[tauri::command]
pub fn add_book_cmd(root_path: String, app: tauri::AppHandle) -> Result<Book, String> {
    let p = PathBuf::from(&root_path);
    let canonical = dunce::canonicalize(&p).map_err(|e| e.to_string())?;
    let canonical_str = canonical.to_string_lossy().into_owned();

    // LIB-03: derive name from first H1 of README.md / index.md, else folder name
    let name = derive_book_name(&canonical);

    let book = add_book(&canonical_str, &name).map_err(|e| e.to_string())?;

    // Index files in background
    let book_id = book.id;
    let root_clone = canonical.clone();
    let app_clone = app.clone();
    std::thread::spawn(move || {
        if let Err(e) = index_book(book_id, &root_clone) {
            log::warn!("Failed to index book {}: {}", book_id, e);
        }
        if let Err(e) = watcher::start_watch(book_id, root_clone, app_clone) {
            log::warn!("Failed to start watcher for book {}: {}", book_id, e);
        }
    });

    Ok(book)
}

fn derive_book_name(root: &Path) -> String {
    for candidate in &["README.md", "index.md", "readme.md"] {
        let p = root.join(candidate);
        if let Ok(content) = std::fs::read_to_string(&p) {
            if let Some(line) = content.lines().find(|l| l.starts_with("# ")) {
                return line[2..].trim().to_string();
            }
        }
    }
    root.file_name()
        .map(|n| n.to_string_lossy().into_owned())
        .unwrap_or_else(|| "Untitled Book".to_string())
}

/// Index all markdown files in a book root
fn index_book(book_id: i64, root: &PathBuf) -> anyhow::Result<()> {
    let mut files: Vec<(PathBuf, Option<String>)> = Vec::new();
    collect_md_files(root, root, &mut files)?;
    search::build_index(book_id, files)?;
    Ok(())
}

fn collect_md_files(
    _root: &PathBuf,
    dir: &PathBuf,
    out: &mut Vec<(PathBuf, Option<String>)>,
) -> anyhow::Result<()> {
    for entry in std::fs::read_dir(dir)?.flatten() {
        let path = entry.path();
        if path.is_dir() {
            // Skip hidden dirs
            if path
                .file_name()
                .map(|n| n.to_string_lossy().starts_with('.'))
                .unwrap_or(false)
            {
                continue;
            }
            collect_md_files(_root, &path, out)?;
        } else if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
            if matches!(
                ext.to_lowercase().as_str(),
                "md" | "markdown" | "mdown" | "mkd"
            ) {
                out.push((path, None));
            }
        }
    }
    Ok(())
}

/// LIB-05: Update book metadata
#[tauri::command]
pub fn update_book_cmd(
    book_id: i64,
    name: String,
    tags: String,
    settings_json: String,
) -> Result<(), String> {
    update_book(book_id, &name, &tags, &settings_json).map_err(|e| e.to_string())
}

/// LIB-05: Re-point book root (after Locate...)
#[tauri::command]
pub fn relocate_book(book_id: i64, new_root: String) -> Result<(), String> {
    update_book_root(book_id, &new_root).map_err(|e| e.to_string())
}

/// LIB-05: Remove a book
#[tauri::command]
pub fn remove_book_cmd(book_id: i64, delete_progress: bool) -> Result<(), String> {
    let _ = delete_progress; // progress kept via FK cascade; parameter reserved for future use
    watcher::stop_watch(book_id);
    remove_book(book_id).map_err(|e| e.to_string())
}

/// LIB-07/LIB-13: List files for quick-open palette
#[tauri::command]
pub fn list_book_files(book_id: i64) -> Result<Vec<(i64, String, Option<String>)>, String> {
    list_files_for_book(book_id).map_err(|e| e.to_string())
}

/// LIB-14: Full-text search
#[tauri::command]
pub fn search_book(book_id: i64, query: String) -> Result<Vec<search::SearchResult>, String> {
    search::search(book_id, &query).map_err(|e| e.to_string())
}

/// Touch last-opened timestamp
#[tauri::command]
pub fn touch_book(book_id: i64) -> Result<(), String> {
    touch_book_opened(book_id).map_err(|e| e.to_string())
}

/// LIB-11: Parse reading order from SUMMARY.md or _toc.md
#[tauri::command]
pub fn get_reading_order(book_root: String) -> Result<Vec<String>, String> {
    let root = PathBuf::from(&book_root);
    parse_reading_order(&root).map_err(|e| e.to_string())
}

fn parse_reading_order(root: &PathBuf) -> anyhow::Result<Vec<String>> {
    // Try SUMMARY.md first (mdBook / GitBook format)
    for name in &["SUMMARY.md", "summary.md", "_toc.md", "toc.yml"] {
        let p = root.join(name);
        if p.exists() {
            let content = std::fs::read_to_string(&p)?;
            let mut order = Vec::new();
            for line in content.lines() {
                // Match `- [Title](path.md)` or `  - [Title](path.md)`
                if let Some(start) = line.find("](") {
                    if let Some(end) = line[start + 2..].find(')') {
                        let rel = &line[start + 2..start + 2 + end];
                        // Only .md links, strip anchor
                        let path_part = rel.split('#').next().unwrap_or(rel);
                        if path_part.ends_with(".md") || path_part.ends_with(".markdown") {
                            let abs = root.join(path_part);
                            if abs.exists() {
                                order.push(abs.to_string_lossy().into_owned());
                            }
                        }
                    }
                }
            }
            if !order.is_empty() {
                return Ok(order);
            }
        }
    }

    // Fall back: collect all .md files, natural sort
    let mut files: Vec<PathBuf> = Vec::new();
    collect_md_files_sorted(root, &mut files)?;
    Ok(files
        .into_iter()
        .map(|p| p.to_string_lossy().into_owned())
        .collect())
}

fn collect_md_files_sorted(dir: &PathBuf, out: &mut Vec<PathBuf>) -> anyhow::Result<()> {
    let mut entries: Vec<PathBuf> = std::fs::read_dir(dir)?
        .flatten()
        .map(|e| e.path())
        .collect();
    // Natural sort: numeric prefixes first
    entries.sort_by(|a, b| {
        natural_sort_key(a.file_name().unwrap_or_default().to_string_lossy().as_ref()).cmp(
            &natural_sort_key(b.file_name().unwrap_or_default().to_string_lossy().as_ref()),
        )
    });
    for path in entries {
        if path.is_dir()
            && !path
                .file_name()
                .map(|n| n.to_string_lossy().starts_with('.'))
                .unwrap_or(false)
        {
            collect_md_files_sorted(&path, out)?;
        } else if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
            if matches!(
                ext.to_lowercase().as_str(),
                "md" | "markdown" | "mdown" | "mkd"
            ) {
                out.push(path);
            }
        }
    }
    Ok(())
}

fn natural_sort_key(s: &str) -> Vec<u64> {
    let mut key = Vec::new();
    let mut buf = String::new();
    let mut in_num = false;
    for c in s.chars() {
        if c.is_ascii_digit() {
            if !in_num {
                if !buf.is_empty() {
                    key.push(0);
                    buf.clear();
                }
                in_num = true;
            }
            buf.push(c);
        } else {
            if in_num {
                key.push(buf.parse().unwrap_or(0));
                buf.clear();
                in_num = false;
            }
            buf.push(c);
        }
    }
    if in_num {
        key.push(buf.parse().unwrap_or(0));
    }
    key
}
