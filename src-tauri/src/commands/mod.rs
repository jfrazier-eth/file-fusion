use std::sync::Arc;

use futures::lock::Mutex;
use object_store::path::Path;
use serde_json::{Map, Value};

use crate::{
    content::{Content, Contents},
    errors::Error,
    events,
    messages::Messages,
    query::{Buffer, FileSystemBuffer},
    state::{
        store::{get_home_dir, Metadata},
        App,
    },
};

use self::buffer::RegisterBuffer;

mod buffer;

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
pub async fn update(
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

#[tauri::command]
pub async fn register_buffer(
    app: tauri::State<'_, Arc<Mutex<App>>>,
    request: RegisterBuffer,
) -> Result<Vec<String>, Error> {
    let mut app = app.lock().await;

    let mut buffer = Buffer::new();

    for file_system in request.file_systems {
        let store = app.get_store(&file_system.store)?.ok_or(Error::NotFound)?;
        let paths: Result<Vec<Path>, object_store::path::Error> = file_system
            .prefixes
            .iter()
            .map(|prefix| Path::parse(prefix))
            .collect();

        let paths = paths.map_err(|_| Error::NotFound)?;

        let file_system_buffer = FileSystemBuffer::new(store, &paths);
        buffer.insert(file_system_buffer);
    }

    let tables = app.register(&buffer).await?;

    Ok(tables)
}

#[tauri::command]
pub async fn query(
    app: tauri::State<'_, Arc<Mutex<App>>>,
    statement: String,
) -> Result<Vec<Map<String, Value>>, Error> {
    let app = app.lock().await;

    let results = app.query(&statement).await?;
    Ok(results)
}
