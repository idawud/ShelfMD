use anyhow::Result;
use notify::{RecommendedWatcher, RecursiveMode};
use notify_debouncer_mini::{new_debouncer, DebouncedEvent, Debouncer};
use once_cell::sync::Lazy;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

static WATCHERS: Lazy<Mutex<HashMap<i64, Debouncer<RecommendedWatcher>>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

/// Start watching a book's root directory.
/// Emits `file-changed` events to the frontend with payload `{book_id, path, kind}`.
pub fn start_watch(book_id: i64, root: PathBuf, app: AppHandle) -> Result<()> {
    let mut watchers = WATCHERS
        .lock()
        .map_err(|_| anyhow::anyhow!("lock poisoned"))?;

    // Don't double-watch
    if watchers.contains_key(&book_id) {
        return Ok(());
    }

    let app_clone = app.clone();
    let mut debouncer = new_debouncer(
        Duration::from_millis(300),
        move |result: Result<Vec<DebouncedEvent>, notify::Error>| {
            match result {
                Ok(events) => {
                    for event in events {
                        let path = event.path.to_string_lossy().into_owned();
                        let kind = format!("{:?}", event.kind);
                        // Only emit for .md files
                        if path.ends_with(".md")
                            || path.ends_with(".markdown")
                            || path.ends_with(".mdown")
                            || path.ends_with(".mkd")
                        {
                            let _ = app_clone.emit(
                                "file-changed",
                                serde_json::json!({
                                    "book_id": book_id,
                                    "path": path,
                                    "kind": kind,
                                }),
                            );
                        }
                    }
                }
                Err(e) => {
                    log::warn!("Watcher error: {:?}", e);
                }
            }
        },
    )?;

    debouncer.watcher().watch(&root, RecursiveMode::Recursive)?;
    watchers.insert(book_id, debouncer);

    Ok(())
}

pub fn stop_watch(book_id: i64) {
    if let Ok(mut watchers) = WATCHERS.lock() {
        watchers.remove(&book_id);
    }
}
