use std::path::Path;

const MARKDOWN_EXTS: [&str; 4] = ["md", "markdown", "mdown", "mkd"];

/// Pick the Markdown files out of command-line arguments (skipping the executable name).
/// The OS passes the file path as an argument when a file is opened with ShelfMD.
pub fn markdown_args<I, S>(args: I) -> Vec<String>
where
    I: IntoIterator<Item = S>,
    S: AsRef<str>,
{
    args.into_iter()
        .skip(1)
        .map(|a| a.as_ref().to_string())
        .filter(|a| {
            Path::new(a)
                .extension()
                .and_then(|e| e.to_str())
                .map(|e| MARKDOWN_EXTS.contains(&e.to_ascii_lowercase().as_str()))
                .unwrap_or(false)
                && Path::new(a).is_file()
        })
        .collect()
}

/// Markdown files this process was launched with (double-click / "Open with").
#[tauri::command]
pub fn get_launch_files() -> Vec<String> {
    markdown_args(std::env::args())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn keeps_existing_markdown_files_and_skips_exe_and_others() {
        let dir = std::env::temp_dir().join("shelfmd-launch-test");
        std::fs::create_dir_all(&dir).unwrap();
        let md = dir.join("Book.MD");
        let txt = dir.join("notes.txt");
        std::fs::write(&md, "# hi").unwrap();
        std::fs::write(&txt, "x").unwrap();
        let missing = dir.join("missing.md");

        let args = vec![
            "shelfmd.exe".to_string(),
            md.to_string_lossy().into_owned(),
            txt.to_string_lossy().into_owned(),
            missing.to_string_lossy().into_owned(),
        ];
        assert_eq!(markdown_args(args), vec![md.to_string_lossy().into_owned()]);
    }
}
