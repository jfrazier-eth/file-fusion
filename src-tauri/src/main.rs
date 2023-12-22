// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use app::{
    commands,
    state::{store::get_home_dir, App, Config},
};
use futures::lock::Mutex;
use std::{
    path::{Path as StdPath, PathBuf},
    sync::Arc,
};

use tauri::Manager;

fn main() {
    let base = get_home_dir().unwrap();
    let base = PathBuf::try_from(base).unwrap();
    let events_file = base.join(StdPath::new(".config/file-fusion/events"));
    let config = Config { events_file };
    let mut app = App::new(config);
    println!("Syncing from persistent storage");
    app.sync().unwrap();
    let app = Arc::new(Mutex::new(app));

    tauri::Builder::default()
        .manage(app)
        .invoke_handler(tauri::generate_handler![
            commands::home_dir,
            commands::contents,
            commands::storage,
            commands::storages,
            commands::update,
            commands::register_buffer,
            commands::query
        ])
        .setup(|app| {
            #[cfg(debug_assertions)] // only include this code on debug builds
            {
                let window = app.get_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
