// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use app::{
    content::{get_contents, Contents},
    errors::Error,
    storage::{get_home_dir, Storage, StorageKind},
};
use tauri::Manager;

#[tauri::command]
fn home_dir() -> Result<String, Error> {
    get_home_dir()
}

#[tauri::command]
async fn contents(storage: Storage) -> Result<Contents, Error> {
    get_contents(storage).await
}

#[tauri::command]
async fn storage(id: Option<String>, path: Option<String>) -> Result<Storage, Error> {
    let id = match id {
        Some(id) => id,
        None => String::from("default"),
    };

    let path = match path {
        Some(path) => path,
        None => get_home_dir()?,
    };

    Ok(Storage {
        id,
        path,
        name: String::from("Local"),
        kind: StorageKind::Local,
    })
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![home_dir, contents, storage])
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
