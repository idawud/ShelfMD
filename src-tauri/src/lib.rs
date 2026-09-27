mod commands;
mod db;
mod resolver;
mod slugs;

use tauri::Manager;

pub fn run() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::links::resolve_link,
            commands::state::get_progress,
            commands::state::set_progress,
            commands::files::open_file,
            commands::files::save_file,
            commands::files::open_path_externally,
            commands::files::open_url_externally,
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
