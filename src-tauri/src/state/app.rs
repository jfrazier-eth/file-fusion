use datafusion::{
    arrow::{self, datatypes::Schema},
    datasource::file_format::{parquet, FileFormat},
    execution::context::SessionContext,
};
use object_store::{path::Path, ObjectMeta, ObjectStore as ObjectStoreClient};
use serde_json::{Map, Value};

use crate::{
    errors::Error,
    events::{store, Events},
    query::{Buffer, FileSystemBuffer, Query},
};

use std::{
    fs::{create_dir_all, OpenOptions},
    io::{prelude::*, BufReader},
    path::PathBuf,
    sync::Arc,
};

use super::{
    store::{get_home_dir, Connection, LocalConnection, Metadata, ObjectStore, ObjectStoreKind},
    Id, MutexMap,
};

#[derive(Debug, Clone)]
pub struct PrefixState {
    id: usize,
    file_system_buffer: usize,
    path: Path,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct FileSystemBufferState {
    id: usize,
    buffer: usize,
    store: usize,
    prefixes: Vec<usize>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct BufferState {
    id: usize,
    name: String,
    common_schema: bool,
    file_systems: Vec<usize>,
}

#[derive(Debug, Clone)]
pub struct State {
    event_id: Id,
    stores: MutexMap<ObjectStore>,
    buffers: MutexMap<BufferState>,
    file_system_buffers: MutexMap<FileSystemBufferState>,
    prefixes: MutexMap<PrefixState>,
}

impl State {
    pub fn new() -> Self {
        Self {
            event_id: Id::new(),
            stores: MutexMap::new(),
            buffers: MutexMap::new(),
            file_system_buffers: MutexMap::new(),
            prefixes: MutexMap::new(),
        }
    }
}

pub struct Config {
    pub events_file: PathBuf,
}

pub struct App {
    config: Config,
    state: State,
    session: SessionContext,
}

impl App {
    pub fn new(config: Config) -> Self {
        Self {
            config,
            state: State::new(),
            session: SessionContext::new(),
        }
    }

    pub async fn list_buffers(&self) -> Vec<BufferState> {
        let buffers: Vec<BufferState> = self.state.buffers.list().await;

        buffers
    }

    pub async fn next_event_id(&self) -> usize {
        self.state.event_id.get_next().await
    }

    pub async fn next_store_id(&self) -> usize {
        self.state.stores.get_id().await
    }

    pub async fn next_buffer_id(&self) -> usize {
        self.state.buffers.get_id().await
    }

    pub async fn next_file_system_byffer_id(&self) -> usize {
        self.state.file_system_buffers.get_id().await
    }

    pub async fn next_prefix_id(&self) -> usize {
        self.state.prefixes.get_id().await
    }

    pub async fn get_store(&self, id: &usize) -> Option<ObjectStore> {
        self.state.stores.get(id).await
    }

    pub async fn list_stores(&self) -> Vec<ObjectStore> {
        self.state.stores.list().await
    }

    pub async fn sync(&self) -> Result<(), Error> {
        let events_file = self.config.events_file.clone();
        if let Some(dir) = events_file.parent() {
            if !dir.exists() {
                create_dir_all(dir)?;
            }
        }

        let events_file = OpenOptions::new()
            .read(true)
            .create(true)
            .write(true)
            .open(events_file)?;

        let reader = BufReader::new(events_file);
        for line in reader.lines() {
            let line = line?;
            let event = serde_json::from_str::<Events>(&line);
            match event {
                Ok(event) => self.update(&event).await?,
                Err(_) => return Err(Error::FailedToDeserializeEvents),
            }
        }

        let num_stores = self.state.stores.len().await;

        if num_stores == 0 {
            let id = self.next_store_id().await;
            let event_id = self.next_event_id().await;
            let default_store_event = Events::CreateObjectStore(store::Create {
                id: event_id,
                metadata: Metadata {
                    id,
                    name: String::from("Local"),
                    prefix: get_home_dir()?,
                    kind: ObjectStoreKind::Local,
                },
                connection: Connection::Local(LocalConnection {}),
            });
            self.save(&default_store_event).await?;
        }

        Ok(())
    }

    pub async fn save(&self, event: &Events) -> Result<(), Error> {
        self.update(event).await?;

        let events_file = self.config.events_file.clone();

        let mut file = OpenOptions::new()
            .write(true)
            .append(true)
            .create(true)
            .open(events_file)?;

        let event = match serde_json::to_string(&event) {
            Ok(event) => event,
            Err(_) => return Err(Error::FailedToSerializeEvents),
        };
        writeln!(file, "{}", event).map_err(|err| err.into())
    }

    async fn update(&self, event: &Events) -> Result<(), Error> {
        match event {
            Events::CreateObjectStore(event) => {
                let id = event.id;
                let metadata = event.metadata.clone();
                let connection = event.connection.clone();

                let mut store = ObjectStore::new(metadata, connection)?;
                store.register(&self.session)?;
                self.state.event_id.update(event.id).await;
                self.state.stores.insert(id, store).await;
            }
            Events::CreateBuffer(event) => {
                self.state.event_id.update(event.id).await;

                let buffer_id = self.next_buffer_id().await;
                let metadata = event.metadata.clone();
                let mut buffer_state = BufferState {
                    id: buffer_id,
                    name: metadata.name.clone(),
                    common_schema: metadata.common_schema,
                    file_systems: Vec::new(),
                };

                for item in metadata.file_systems.into_iter() {
                    let file_system_buffer_id: usize =
                        self.state.file_system_buffers.get_id().await;

                    let mut prefix_ids = Vec::new();
                    for prefix in item.prefixes {
                        let path = Path::parse(prefix)?;
                        let prefix_id = self.state.prefixes.get_id().await;
                        let prefix_state = PrefixState {
                            id: prefix_id,
                            file_system_buffer: file_system_buffer_id,
                            path,
                        };
                        prefix_ids.push(prefix_state.id);
                        self.state
                            .prefixes
                            .insert(prefix_state.id, prefix_state)
                            .await;
                    }

                    let file_system_buffer = FileSystemBufferState {
                        id: file_system_buffer_id,
                        buffer: buffer_state.id,
                        store: item.store,
                        prefixes: prefix_ids,
                    };

                    buffer_state.file_systems.push(file_system_buffer_id);

                    self.state
                        .file_system_buffers
                        .insert(file_system_buffer_id, file_system_buffer)
                        .await;
                }

                self.state
                    .buffers
                    .insert(buffer_state.id, buffer_state)
                    .await;
            }
        }

        Ok(())
    }

    async fn get_buffer(&self, buffer_id: &usize) -> Result<Buffer, Error> {
        let buffer_state = self
            .state
            .buffers
            .get(buffer_id)
            .await
            .ok_or(Error::NotFound(format!("buffer with id {}", &buffer_id)))?;

        let mut files_system_buffer_states = Vec::new();
        for file_system_id in buffer_state.file_systems {
            let file_system = self.state.file_system_buffers.get(&file_system_id).await;
            let file_system = file_system.ok_or(Error::NotFound(format!(
                "file system buffer with id {} for buffer {}",
                file_system_id, buffer_id
            )))?;

            files_system_buffer_states.push(file_system);
        }

        let mut buffer = Buffer::new(&buffer_state.id, &buffer_state.name);

        for file_system_buffer_state in files_system_buffer_states {
            let store = self
                .state
                .stores
                .get(&file_system_buffer_state.store)
                .await
                .ok_or(Error::NotFound(format!(
                    "store with id {}",
                    &file_system_buffer_state.store
                )))?;

            let mut paths = Vec::new();

            for prefix in file_system_buffer_state.prefixes {
                let prefix = self
                    .state
                    .prefixes
                    .get(&prefix)
                    .await
                    .ok_or(Error::NotFound(format!("prefix with id {}", prefix)))?;

                paths.push(prefix.path);
            }

            let file_system_buffer = FileSystemBuffer::new(store, &paths);

            buffer.insert(file_system_buffer);
        }

        Ok(buffer)
    }

    pub async fn query(&self, query: &Query) -> Result<Vec<Map<String, Value>>, Error> {
        let buffer = self.get_buffer(&query.buffer).await?;

        let result = buffer.register(buffer.get_name(), &self.session).await;
        match result {
            Ok(tables) => {
                println!("registered buffer! {} tables", tables.len());
            }
            Err(e) => {
                eprintln!("failed to register buffer. {:?}", e);
            }
        }

        let df = self
            .session
            .sql(&query.statement)
            .await
            .map_err(|e| Error::DataFusionError(e))?;

        let batches = df.collect().await?;
        let batches: Vec<_> = batches.iter().collect();

        let list = arrow::json::writer::record_batches_to_json_rows(&batches[..])?;
        Ok(list)
    }

    pub async fn infer_schema(
        &self,
        client: &Arc<dyn ObjectStoreClient>,
        objects: &[ObjectMeta],
    ) -> Result<Arc<Schema>, Error> {
        let format = parquet::ParquetFormat::default();
        let schema = format
            .infer_schema(&self.session.state(), client, objects)
            .await?;

        Ok(schema)
    }
}
