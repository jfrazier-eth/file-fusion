use std::sync::Arc;

use futures::lock::Mutex;
use object_store::path::Path;
use serde_json::{Map, Value};

use crate::{
    content::{Content, Contents},
    errors::Error,
    events::{self, buffer, Events},
    messages::Messages,
    query::Query,
    state::{
        store::{get_home_dir, Metadata},
        App, BufferState,
    },
};

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
    let state = app.get_state().await;
    let store = app.get_store(&id, &state)?;

    let store = match store {
        None => return Err(Error::NotFound(format!("store with id {}", &id))),
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

    if items.len() == 0 {
        let object = store.client.get(&path).await?;
        let meta = object.meta;
        let schema = app.infer_schema(&store.client, &[meta]).await?;
        println!("Found Schema {:?}", schema);
        dbg!(schema);
    }

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
    let app = app.lock().await;
    let mut state = app.get_state().await;
    let event: events::Events = match message {
        Messages::CreateObjectStore(message) => {
            let store_id = App::create_store_id(&state)?;
            let event_id = App::next_event_id(&state);
            let event = events::Events::CreateObjectStore(events::store::Create::from_msg(
                event_id, store_id, message,
            ));
            event
        }
        Messages::CreateBuffer(message) => {
            let event_id = App::next_event_id(&state);
            let event = Events::CreateBuffer(buffer::Create {
                id: event_id,
                metadata: message.metadata,
            });
            event
        }
    };
    app.save(&event, &mut state).await
}

#[tauri::command]
pub async fn storages<'a>(
    state: tauri::State<'_, Arc<Mutex<App>>>,
) -> Result<Vec<Metadata>, Error> {
    let app = state.lock().await;
    let state = app.get_state().await;
    app.list_stores(&state)
}

#[tauri::command]
pub async fn storage<'a>(
    app: tauri::State<'_, Arc<Mutex<App>>>,
    id: Option<usize>,
    prefix: Option<String>,
) -> Result<Metadata, Error> {
    let app = app.lock().await;
    let state = app.get_state().await;

    let storage = match id {
        Some(id) => {
            let storage = app.get_metadata(&id, &state)?;
            match storage {
                Some(storage) => Some(storage),
                None => None,
            }
        }
        None => {
            let storages = app.list_stores(&state)?;
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
            return Err(Error::NotFound(format!("no storage with id {:?}", id)));
        }
    };

    match prefix {
        Some(path) => Ok(storage.with_prefix(path)),
        None => Ok(storage),
    }
}

#[tauri::command]
pub async fn query(
    app: tauri::State<'_, Arc<Mutex<App>>>,
    query: Query,
) -> Result<Vec<Map<String, Value>>, Error> {
    let app = app.lock().await;
    let state = app.get_state().await;

    let results = app.query(&query, &state).await?;
    Ok(results)
}

#[tauri::command]
pub async fn get_buffers(
    app: tauri::State<'_, Arc<Mutex<App>>>,
) -> Result<Vec<BufferState>, Error> {
    let app = app.lock().await;
    let state = app.get_state().await;

    app.list_buffers(&state)
}
