use std::sync::Arc;

use object_store::path::Path;
use serde_json::{Map, Value};
use tracing::{debug, error, info, warn};

use crate::{
    content::{Content, Contents},
    errors::Error,
    events::{self, buffer, Events},
    messages::Messages,
    query::Query,
    state::{
        store::{get_home_dir, Metadata},
        table::Table,
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
        .ok_or(Error::NotFound(format!("object store with id {}", id)));

    let store = match store {
        Ok(store) => store,
        Err(e) => {
            warn!(?e, "Failed to get store");
            return Err(e);
        }
    };

    let prefix = {
        if prefix.len() == 0 {
            store.metadata.prefix
        } else {
            prefix
        }
    };
    let path = Path::parse(&prefix)?;

    let list = store.client.list_with_delimiter(Some(&path)).await;

    let list = match list {
        Ok(list) => list,
        Err(e) => {
            error!(?e, path=?path, "Failed to list contents");
            return Err(Error::ObjectStore(e));
        }
    };

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
        debug!("no items found at this path, checking if it is a file");
        let object = store.client.get(&path).await;

        let object = match object {
            Ok(object) => object,
            Err(e) => {
                error!(path=%path, "failed to get item at path");
                return Err(Error::ObjectStore(e));
            }
        };

        todo!(); // Support displaying file contents
                 // let meta = object.meta;
                 // let schema = app.infer_schema(&store.client, &[meta]).await;
                 // debug!("Found Schema {:?}", schema);
                 // dbg!(schema);
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
    let result = app.save(&event).await;

    if let Err(ref e) = result {
        error!(?e, "failed to save event");
    }

    result
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
    let mut metadata: Vec<Metadata> = stores.iter().map(|store| store.metadata.clone()).collect();
    metadata.sort();
    metadata.reverse();

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
    let results = app.query(&query).await;

    match results {
        Ok(results) => {
            info!(num_rows = results.len(), "Completed query");
            Ok(results)
        }
        Err(e) => {
            error!(?e, "Failed to complete query");
            Err(e)
        }
    }
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
    let mut buffers = app.list_buffers().await;

    buffers.sort();
    buffers.reverse();
    Ok(buffers)
}

#[tauri::command]
#[tracing::instrument(
    name="Command: get table",
    skip(app),
    fields(
        request=%Uuid::new_v4()
    )
)]
pub async fn get_table(app: tauri::State<'_, Arc<App>>, id: usize) -> Result<Table, Error> {
    let table = app.get_table(&id).await;

    if let Err(e) = &table {
        error!(?e, table = id, "failed to get table");
    }

    table
}
