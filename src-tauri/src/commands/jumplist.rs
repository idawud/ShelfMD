/// Update the Windows taskbar Jump List with recently opened books.
///
/// Full Win32 ICustomDestinationList implementation is deferred to post-Store-approval;
/// this stub keeps the IPC surface stable so the frontend can call it unconditionally.
#[tauri::command]
pub fn update_jump_list(books: Vec<String>) -> Result<(), String> {
    let _ = books;
    Ok(())
}
