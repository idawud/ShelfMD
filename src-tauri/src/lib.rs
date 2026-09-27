mod commands;
mod db;
mod search;
mod watcher;

use tauri::Manager;

pub fn run() {
    env_logger::init();

    tauri::Builder::default()
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
            commands::library::search_book,
            commands::library::touch_book,
            commands::library::get_reading_order,
            commands::jumplist::update_jump_list,
        ])
        .setup(|app| {
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
