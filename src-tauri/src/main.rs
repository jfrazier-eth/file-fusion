// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use app::{
    content::{Content, Contents},
    errors::Error,
    events,
    messages::Messages,
    state::{store::Metadata, App, Config},
    storage::get_home_dir,
};
use futures::lock::Mutex;
use std::{
    path::{Path as StdPath, PathBuf},
    sync::Arc,
};

use object_store::path::Path;
use tauri::Manager;

#[tauri::command]
fn home_dir() -> Result<String, Error> {
    get_home_dir()
}

#[tauri::command]
async fn contents(
    app: tauri::State<'_, Arc<Mutex<App>>>,
    id: usize,
    prefix: String,
) -> Result<Contents, Error> {
    let app = app.lock().await;
    let store = app.get_store(id)?;

    let store = match store {
        None => return Err(Error::NotFound),
        Some(store) => store,
    };

    let prefix = {
        if prefix.len() == 0 {
            store.metadata.prefix
        } else {
            prefix
        }
    };
    let path = Path::parse(&prefix)?;

    let list = store.client.list_with_delimiter(Some(&path)).await?;

    let files: Vec<Content> = list
        .objects
        .iter()
        .map(|file| Content::new(file.location.to_string(), false))
        .collect();
    let dirs: Vec<Content> = list
        .common_prefixes
        .iter()
        .map(|dir| Content::new(dir.to_string(), true))
        .collect();

    let mut items = [files, dirs].concat();
    items.sort_by(|a, b| a.prefix.cmp(&b.prefix));

    let contents = Contents {
        prefix: prefix.clone(),
        items,
    };

    return Ok(contents);
}

#[tauri::command]
async fn update<'a>(
    app: tauri::State<'_, Arc<Mutex<App>>>,
    message: Messages,
) -> Result<(), Error> {
    let mut app = app.lock().await;

    let event_id = app.next_event_id();
    let event: events::Events = match message {
        Messages::CreateObjectStore(message) => {
            let store_id = app.create_store_id()?;
            let event = events::Events::CreateObjectStore(events::store::Create::from_msg(
                event_id, store_id, message,
            ));
            event
        }
    };
    app.save(&event)
}

#[tauri::command]
async fn storages<'a>(state: tauri::State<'_, Arc<Mutex<App>>>) -> Result<Vec<Metadata>, Error> {
    let manager = state.lock().await;
    manager.list_stores()
}

#[tauri::command]
async fn storage<'a>(
    state: tauri::State<'_, Arc<Mutex<App>>>,
    id: Option<usize>,
    prefix: Option<String>,
) -> Result<Metadata, Error> {
    let app = state.lock().await;

    let storage = match id {
        Some(id) => {
            let storage = app.get_metadata(id)?;
            match storage {
                Some(storage) => Some(storage),
                None => None,
            }
        }
        None => {
            let storages = app.list_stores()?;
            let storage = storages.get(0);
            match storage {
                Some(storage) => Some(storage.clone()),
                None => None,
            }
        }
    };

    let storage = match storage {
        Some(storage) => storage,
        None => {
            return Err(Error::NotFound);
        }
    };

    match prefix {
        Some(path) => Ok(storage.with_prefix(path)),
        None => Ok(storage),
    }
}

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
