use std::sync::Arc;

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
use uuid::Uuid;

#[tauri::command]
pub fn home_dir() -> Result<String, Error> {
    get_home_dir()
}

#[tauri::command]
#[tracing::instrument(
    name="Command: get contents",
    skip(app),
    fields(
        request=%Uuid::new_v4()
    )
)]
pub async fn contents(
    app: tauri::State<'_, Arc<App>>,
    id: usize,
    prefix: String,
) -> Result<Contents, Error> {
    let store = app
        .get_store(&id)
        .await
        .ok_or(Error::NotFound(format!("object store with id {}", id)))?;

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
#[tracing::instrument(
    name="Command: update state",
    skip(app),
    fields(
        request=%Uuid::new_v4()
    )
)]
pub async fn update(app: tauri::State<'_, Arc<App>>, message: Messages) -> Result<(), Error> {
    let event: events::Events = match message {
        Messages::CreateObjectStore(message) => {
            let store_id = app.next_store_id().await;
            let event_id = app.next_event_id().await;
            let event = events::Events::CreateObjectStore(events::store::Create::from_msg(
                event_id, store_id, message,
            ));
            event
        }
        Messages::CreateBuffer(message) => {
            let event_id = app.next_event_id().await;
            let event = Events::CreateBuffer(buffer::Create {
                id: event_id,
                metadata: message.metadata,
            });
            event
        }
    };
    app.save(&event).await
}

#[tauri::command]
#[tracing::instrument(
    name="Command: get storages",
    skip(app),
    fields(
        request=%Uuid::new_v4()
    )
)]
pub async fn storages(app: tauri::State<'_, Arc<App>>) -> Result<Vec<Metadata>, Error> {
    let stores = app.list_stores().await;
    let metadata = stores.iter().map(|store| store.metadata.clone()).collect();
    Ok(metadata)
}

#[tauri::command]
#[tracing::instrument(
    name="Command: get storage",
    skip(app),
    fields(
        request=%Uuid::new_v4()
    )
)]
pub async fn storage<'a>(
    app: tauri::State<'_, Arc<App>>,
    id: Option<usize>,
    prefix: Option<String>,
) -> Result<Metadata, Error> {
    let storage = match id {
        Some(id) => {
            let storage = app.get_store(&id).await;
            match storage {
                Some(storage) => Some(storage),
                None => None,
            }
        }
        None => {
            let storages = app.list_stores().await;
            let storage = storages.get(0);
            match storage {
                Some(storage) => Some(storage.clone()),
                None => None,
            }
        }
    };

    let storage = match storage {
        Some(storage) => storage.metadata,
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
#[tracing::instrument(
    name="Command: execute query",
    skip(app),
    fields(
        request=%Uuid::new_v4()
    )
)]
pub async fn query(
    app: tauri::State<'_, Arc<App>>,
    query: Query,
) -> Result<Vec<Map<String, Value>>, Error> {
    let results = app.query(&query).await?;
    Ok(results)
}

#[tauri::command]
#[tracing::instrument(
    name="Command: get buffers",
    skip(app),
    fields(
        request=%Uuid::new_v4()
    )
)]
pub async fn get_buffers(app: tauri::State<'_, Arc<App>>) -> Result<Vec<BufferState>, Error> {
    let buffers = app.list_buffers().await;

    Ok(buffers)
}
