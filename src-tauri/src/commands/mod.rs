use std::sync::Arc;

use futures::lock::Mutex;
use object_store::path::Path;

use crate::{
    content::{Content, Contents},
    errors::Error,
    events,
    messages::Messages,
    state::{store::Metadata, App},
    storage::get_home_dir,
};

mod buffer;
pub use buffer::register_buffer;

#[tauri::command]
pub fn home_dir() -> Result<String, Error> {
    get_home_dir()
}

#[tauri::command]
pub async fn contents(
    app: tauri::State<'_, Arc<Mutex<App>>>,
    id: usize,
    prefix: String,
) -> Result<Contents, Error> {
    let app = app.lock().await;
    let store = app.get_store(&id)?;

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
pub async fn update<'a>(
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
pub async fn storages<'a>(
    state: tauri::State<'_, Arc<Mutex<App>>>,
) -> Result<Vec<Metadata>, Error> {
    let manager = state.lock().await;
    manager.list_stores()
}

#[tauri::command]
pub async fn storage<'a>(
    state: tauri::State<'_, Arc<Mutex<App>>>,
    id: Option<usize>,
    prefix: Option<String>,
) -> Result<Metadata, Error> {
    let app = state.lock().await;

    let storage = match id {
        Some(id) => {
            let storage = app.get_metadata(&id)?;
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
