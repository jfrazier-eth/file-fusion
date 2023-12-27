// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use app::{
    commands,
    errors::Error,
    state::{store::get_home_dir, App, Config},
    tracing::{get_subscriber, init_subscriber},
};
use std::{
    path::{Path as StdPath, PathBuf},
    sync::Arc,
};

use tauri::Manager;

#[tokio::main]
async fn main() -> Result<(), Error> {
    let subscriber = get_subscriber("file_fusion".into(), "info".into());
    init_subscriber(subscriber).expect("failed to init subscriber");

    let base = get_home_dir().expect("failed to get home dir");
    let base = PathBuf::try_from(base).expect("failed to parse home dir");
    let events_file = base.join(StdPath::new(".config/file-fusion/events"));

    let config = Config { events_file };
    let app = App::new(config);
    app.sync().await?;

    let app = Arc::new(app);

    tauri::Builder::default()
        .manage(app)
        .invoke_handler(tauri::generate_handler![
            commands::home_dir,
            commands::contents,
            commands::storage,
            commands::storages,
            commands::update,
            commands::query,
            commands::get_buffers,
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

    Ok(())
}
