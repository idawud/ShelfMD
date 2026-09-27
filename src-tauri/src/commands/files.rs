use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub struct OpenFileResult {
    pub content: String,
    pub canonical_path: String,
    pub file_name: String,
}

#[tauri::command]
pub fn open_file(path: String) -> Result<OpenFileResult, String> {
    let p = PathBuf::from(&path);
    let canonical = dunce::canonicalize(&p).map_err(|e| e.to_string())?;
    let content = std::fs::read_to_string(&canonical).map_err(|e| e.to_string())?;
    let file_name = canonical
        .file_name()
        .map(|n| n.to_string_lossy().into_owned())
        .unwrap_or_else(|| path.clone());
    Ok(OpenFileResult {
        content,
        canonical_path: canonical.to_string_lossy().into_owned(),
        file_name,
    })
}

#[tauri::command]
pub fn save_file(path: String, content: String) -> Result<(), String> {
    std::fs::write(&path, content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn open_path_externally(path: String) -> Result<(), String> {
    // Validate path exists before opening
    let p = PathBuf::from(&path);
    if !p.exists() {
        return Err(format!("Path not found: {}", path));
    }
    Ok(())
}

#[tauri::command]
pub fn open_url_externally(url: String) -> Result<(), String> {
    // Validated: only http/https URLs
    if !url.starts_with("http://") && !url.starts_with("https://") {
        return Err("Only http/https URLs allowed".into());
    }
    Ok(())
}
