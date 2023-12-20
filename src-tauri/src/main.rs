// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{
    path::{Path, PathBuf},
    sync::Mutex,
};

use app::{
    content::{get_contents, Contents},
    errors::Error,
    events,
    messages::Messages,
    state::{App, Config},
    storage::{get_home_dir, Metadata},
};
use tauri::Manager;

#[tauri::command]
fn home_dir() -> Result<String, Error> {
    get_home_dir()
}

#[tauri::command]
fn contents<'a>(
    state: tauri::State<'a, Mutex<App>>,
    id: usize,
    path: String,
) -> Result<Contents, Error> {
    let state = state.lock().map_err(|_| Error::FailedToGetStateLock)?;
    let storage = state.get_metadata(id)?.ok_or(Error::NotFound)?;

    storage.with_prefix(path);
    get_contents(storage)
}

#[tauri::command]
fn update<'a>(state: tauri::State<'a, Mutex<App>>, message: Messages) -> Result<(), Error> {
    let mut state = state.lock().map_err(|_| Error::FailedToGetStateLock)?;

    let event_id = state.next_event_id();
    let event: events::Events = match message {
        Messages::CreateObjectStore(message) => {
            let store_id = state.create_store_id()?;
            let event = events::Events::CreateObjectStore(events::store::Create::from_msg(
                event_id, store_id, message,
            ));
            event
        }
    };
    state.save(&event)
}

#[tauri::command]
fn storages<'a>(state: tauri::State<'a, Mutex<App>>) -> Result<Vec<Metadata>, Error> {
    let manager = state.lock().map_err(|_| Error::FailedToGetStateLock)?;
    manager.list_stores()
}

#[tauri::command]
async fn storage<'a>(
    state: tauri::State<'a, Mutex<App>>,
    id: Option<usize>,
    path: Option<String>,
) -> Result<Metadata, Error> {
    let manager = state.lock().map_err(|_| Error::FailedToGetStateLock)?;

    let storage = match id {
        Some(id) => {
            let storage = manager.get_metadata(id)?;
            match storage {
                Some(storage) => Some(storage),
                None => None,
            }
        }
        None => {
            let storages = manager.list_stores()?;
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
        Some(path) => Ok(storage.with_prefix(path)),
        None => Ok(storage),
    }
}

fn main() {
    let base = get_home_dir().unwrap();
    let base = PathBuf::try_from(base).unwrap();
    let events_file = base.join(Path::new(".config/filrs/events.json"));
    let config = Config { events_file };
    let mut state = App::new(config);
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
