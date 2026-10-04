mod commands;
mod db;
mod search;
mod watcher;

use tauri::{Emitter, Manager};

pub fn run() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            // A second launch (e.g. double-clicking another .md) hands its files to this window.
            let files = commands::launch::markdown_args(&args);
            if !files.is_empty() {
                if let Err(error) = app.emit("open-files", files) {
                    log::warn!("Failed to forward files to the main window: {error}");
                }
            }
            if let Some(window) = app.get_webview_window("main") {
                if let Err(error) = window.unminimize() {
                    log::warn!("Failed to restore the existing window: {error}");
                }
                if let Err(error) = window.show() {
                    log::warn!("Failed to show the existing window: {error}");
                }
                if let Err(error) = window.set_focus() {
                    log::warn!("Failed to focus the existing window: {error}");
                }
            } else {
                log::warn!("Could not find the existing main window");
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::bookmarks::add_bookmark,
            commands::bookmarks::list_bookmarks,
            commands::bookmarks::list_book_bookmarks,
            commands::bookmarks::remove_bookmark,
            commands::links::resolve_link,
            commands::links::check_anchor_exists,
            commands::links::scan_links,
            commands::state::get_progress,
            commands::state::set_progress,
            commands::state::open_file_with_memory,
            commands::state::mark_file_finished,
            commands::state::get_book_progress_cmd,
            commands::state::get_session,
            commands::state::set_session,
            commands::state::export_progress,
            commands::state::import_progress,
            commands::files::open_file,
            commands::files::save_file,
            commands::files::open_path_externally,
            commands::files::open_url_externally,
            commands::library::list_books_cmd,
            commands::library::add_book_cmd,
            commands::library::update_book_cmd,
            commands::library::relocate_book,
            commands::library::remove_book_cmd,
            commands::library::list_book_files,
            commands::library::list_book_directory,
            commands::library::search_book,
            commands::library::touch_book,
            commands::library::get_reading_order,
            commands::jumplist::update_jump_list,
            commands::launch::get_launch_files,
        ])
        .setup(|app| {
            let window_icon = app
                .default_window_icon()
                .cloned()
                .ok_or("default application icon is not configured")?;
            app.get_webview_window("main")
                .ok_or("main window was not created")?
                .set_icon(window_icon)?;

            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("failed to get app data dir");
            std::fs::create_dir_all(&app_data_dir)?;
            db::init(&app_data_dir.join("shelfmd.db"))?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
