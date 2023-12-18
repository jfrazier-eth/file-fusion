// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{
    path::{Path, PathBuf},
    sync::Mutex,
};

use app::{
    content::{get_contents, Contents},
    errors::Error,
    state::{Config, CreateStorage, Events, Messages, StateManager},
    storage::{get_home_dir, Storage},
};
use tauri::Manager;

#[tauri::command]
fn home_dir() -> Result<String, Error> {
    get_home_dir()
}

#[tauri::command]
fn contents<'a>(
    state: tauri::State<'a, Mutex<StateManager>>,
    id: usize,
    path: String,
) -> Result<Contents, Error> {
    let state = state.lock().map_err(|_| Error::FailedToGetStateLock)?;
    let storage = state.get_storage(id)?.ok_or(Error::NotFound)?;

    storage.with_path(path);
    get_contents(storage)
}

#[tauri::command]
fn update<'a>(
    state: tauri::State<'a, Mutex<StateManager>>,
    message: Messages,
) -> Result<(), Error> {
    let mut state = state.lock().map_err(|_| Error::FailedToGetStateLock)?;

    let event_id = state.next_event_id();
    let event: Events = match message {
        Messages::CreateStorage(message) => {
            let storage_id = state.get_storage_id()?;
            Events::CreateStorage(CreateStorage {
                id: event_id,
                storage: Storage {
                    id: storage_id,
                    name: message.storage.name,
                    path: message.storage.path,
                    kind: message.storage.kind,
                },
                connection: message.connection,
            })
        }
    };
    state.save(&event)
}

#[tauri::command]
fn storages<'a>(state: tauri::State<'a, Mutex<StateManager>>) -> Result<Vec<Storage>, Error> {
    let manager = state.lock().map_err(|_| Error::FailedToGetStateLock)?;
    manager.list_storages()
}

#[tauri::command]
async fn storage<'a>(
    state: tauri::State<'a, Mutex<StateManager>>,
    id: Option<usize>,
    path: Option<String>,
) -> Result<Storage, Error> {
    let manager = state.lock().map_err(|_| Error::FailedToGetStateLock)?;

    let storage = match id {
        Some(id) => {
            let storage = manager.get_storage(id)?;
            match storage {
                Some(storage) => Some(storage),
                None => None,
            }
        }
        None => {
            let storages = manager.list_storages()?;
            let storage = storages.get(0);
            match storage {
                Some(storage) => Some(storage.clone()),
                None => None,
            }
        }
    };

    let storage = match storage {
        Some(storage) => storage,
        None => return Err(Error::NotFound),
    };

    match path {
        Some(path) => Ok(storage.with_path(path)),
        None => Ok(storage),
    }
}

fn main() {
    let base = get_home_dir().unwrap();
    let base = PathBuf::try_from(base).unwrap();
    let events_file = base.join(Path::new(".config/filrs/events.json"));
    let config = Config { events_file };
    let mut state = StateManager::new(config);
    println!("Syncing from persistent storage");
    state.sync().unwrap();
    let manager = Mutex::new(state);

    tauri::Builder::default()
        .manage(manager)
        .invoke_handler(tauri::generate_handler![
            home_dir, contents, storage, storages, update
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
