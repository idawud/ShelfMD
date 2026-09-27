use crate::db::progress::{
    get_progress as db_get_progress, set_progress as db_set_progress, Progress,
};

#[tauri::command]
pub fn get_progress(file_id: i64) -> Result<Option<Progress>, String> {
    db_get_progress(file_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_progress(progress: Progress) -> Result<(), String> {
    db_set_progress(&progress).map_err(|e| e.to_string())
}
