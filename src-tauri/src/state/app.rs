use datafusion::{
    arrow::{self, datatypes::Schema},
    datasource::file_format::{parquet, FileFormat},
    execution::context::SessionContext,
};
use futures::lock::{Mutex, MutexGuard};
use object_store::{path::Path, ObjectMeta, ObjectStore as ObjectStoreClient};
use serde_json::{Map, Value};

use crate::{
    errors::Error,
    events::{store, Events},
    query::{Buffer, FileSystemBuffer, Query},
};

use std::{
    collections::HashMap,
    fs::{create_dir_all, OpenOptions},
    io::{prelude::*, BufReader},
    path::PathBuf,
    sync::Arc,
};

use super::store::{
    get_home_dir, Connection, LocalConnection, Metadata, ObjectStore, ObjectStoreKind,
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
    event_id: usize,
    stores: HashMap<usize, ObjectStore>,
    buffers: HashMap<usize, BufferState>,
    file_system_buffers: HashMap<usize, FileSystemBufferState>,
    prefixes: HashMap<usize, PrefixState>,
}

impl State {
    pub fn new() -> Self {
        Self {
            event_id: 0,
            stores: HashMap::new(),
            buffers: HashMap::new(),
            file_system_buffers: HashMap::new(),
            prefixes: HashMap::new(),
        }
    }
}

pub struct Config {
    pub events_file: PathBuf,
}

pub struct App {
    config: Config,
    state: Arc<Mutex<State>>,
    session: SessionContext,
}

impl App {
    pub fn new(config: Config) -> Self {
        Self {
            config,
            state: Arc::new(Mutex::new(State::new())),
            session: SessionContext::new(),
        }
    }

    pub fn list_stores(&self, state: &MutexGuard<'_, State>) -> Result<Vec<Metadata>, Error> {
        let stores: Vec<Metadata> = state
            .stores
            .iter()
            .map(|(_, item)| item.metadata.clone())
            .collect();

        Ok(stores)
    }

    pub fn list_buffers(&self, state: &MutexGuard<'_, State>) -> Result<Vec<BufferState>, Error> {
        let buffers: Vec<BufferState> =
            state.buffers.iter().map(|(_, item)| item.clone()).collect();

        Ok(buffers)
    }

    pub async fn get_state(&self) -> MutexGuard<'_, State> {
        let state = self.state.lock().await;

        state
    }

    pub fn get_store(
        &self,
        id: &usize,
        state: &MutexGuard<'_, State>,
    ) -> Result<Option<ObjectStore>, Error> {
        let store = state.stores.get(&id).map(|store| store.clone());
        Ok(store)
    }

    pub fn get_metadata(
        &self,
        id: &usize,
        state: &MutexGuard<'_, State>,
    ) -> Result<Option<Metadata>, Error> {
        self.get_store(id, state)
            .map(|store| store.map(|store| store.metadata))
    }

    pub fn next_event_id(state: &MutexGuard<'_, State>) -> usize {
        state.event_id + 1
    }

    pub fn create_store_id(state: &MutexGuard<'_, State>) -> Result<usize, Error> {
        let max = state.stores.keys().max();
        let id = match max {
            Some(value) => value + 1,
            None => 1,
        };

        Ok(id)
    }

    pub fn create_buffer_id(state: &MutexGuard<'_, State>) -> Result<usize, Error> {
        let max = state.buffers.keys().max();
        let id = match max {
            Some(value) => value + 1,
            None => 1,
        };

        Ok(id)
    }

    pub fn create_file_system_buffer_id(state: &MutexGuard<'_, State>) -> Result<usize, Error> {
        let max = state.file_system_buffers.keys().max();
        let id = match max {
            Some(value) => value + 1,
            None => 1,
        };

        Ok(id)
    }

    pub fn create_prefix_id(state: &MutexGuard<'_, State>) -> Result<usize, Error> {
        let max = state.prefixes.keys().max();
        let id = match max {
            Some(value) => value + 1,
            None => 1,
        };

        Ok(id)
    }

    pub async fn sync(&self) -> Result<(), Error> {
        let events_file = self.config.events_file.clone();
        let mut state = self.get_state().await;
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
                Ok(event) => self.update(&event, &mut state)?,
                Err(_) => return Err(Error::FailedToDeserializeEvents),
            }
        }

        let num_stores = state.stores.len();

        if num_stores == 0 {
            let id = App::create_store_id(&state)?;

            let default_store_event = Events::CreateObjectStore(store::Create {
                id: App::next_event_id(&mut state),
                metadata: Metadata {
                    id,
                    name: String::from("Local"),
                    prefix: get_home_dir()?,
                    kind: ObjectStoreKind::Local,
                },
                connection: Connection::Local(LocalConnection {}),
            });
            self.save(&default_store_event, &mut state).await?;
        }

        Ok(())
    }

    pub async fn save(
        &self,
        event: &Events,
        state: &mut MutexGuard<'_, State>,
    ) -> Result<(), Error> {
        self.update(event, state)?;

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

    fn update(&self, event: &Events, state: &mut MutexGuard<'_, State>) -> Result<(), Error> {
        match event {
            Events::CreateObjectStore(event) => {
                let id = event.id;
                let metadata = event.metadata.clone();
                let connection = event.connection.clone();

                let mut store = ObjectStore::new(metadata, connection)?;
                store.register(&self.session)?;
                state.event_id = event.id;
                state.stores.insert(id, store);
            }
            Events::CreateBuffer(event) => {
                let id = event.id;
                state.event_id = id;

                let buffer_id = App::create_buffer_id(&state)?;
                let metadata = event.metadata.clone();
                let mut buffer_state = BufferState {
                    id: buffer_id,
                    name: metadata.name.clone(),
                    common_schema: metadata.common_schema,
                    file_systems: Vec::new(),
                };

                for item in metadata.file_systems.into_iter() {
                    let file_system_buffer_id: usize = App::create_file_system_buffer_id(&state)?;

                    let mut prefix_ids = Vec::new();
                    for prefix in item.prefixes {
                        let path = Path::parse(prefix)?;
                        let prefix_id = App::create_prefix_id(&state)?;
                        let prefix_state = PrefixState {
                            id: prefix_id,
                            file_system_buffer: file_system_buffer_id,
                            path,
                        };
                        prefix_ids.push(prefix_state.id);
                        state.prefixes.insert(prefix_state.id, prefix_state);
                    }

                    let file_system_buffer = FileSystemBufferState {
                        id: file_system_buffer_id,
                        buffer: buffer_state.id,
                        store: item.store,
                        prefixes: prefix_ids,
                    };

                    buffer_state.file_systems.push(file_system_buffer_id);

                    state
                        .file_system_buffers
                        .insert(file_system_buffer_id, file_system_buffer);
                }

                state.buffers.insert(buffer_state.id, buffer_state);
            }
        }

        Ok(())
    }

    fn get_buffer(&self, buffer_id: usize, state: &MutexGuard<'_, State>) -> Result<Buffer, Error> {
        let buffer_state = state
            .buffers
            .get(&buffer_id)
            .ok_or(Error::NotFound(format!("buffer with id {}", &buffer_id)))
            .cloned()?;

        let files_system_buffer_states: Result<Vec<&FileSystemBufferState>, Error> = buffer_state
            .file_systems
            .iter()
            .map(|id| {
                let item = state
                    .file_system_buffers
                    .get(id)
                    .to_owned()
                    .ok_or(Error::NotFound(format!(
                        "file system buffer with id {} for buffer {}",
                        id, buffer_id
                    )));
                item
            })
            .collect();

        let mut buffer = Buffer::new(&buffer_state.id, &buffer_state.name);

        let files_system_buffer_states = files_system_buffer_states?;

        for file_system_buffer_state in files_system_buffer_states {
            let store = self
                .get_store(&file_system_buffer_state.store, state)?
                .ok_or(Error::NotFound(format!(
                    "store with id {}",
                    &file_system_buffer_state.store
                )))?;

            let prefixes: Result<Vec<&PrefixState>, Error> = file_system_buffer_state
                .prefixes
                .iter()
                .map(|prefix| {
                    let prefix = state
                        .prefixes
                        .get(prefix)
                        .ok_or(Error::NotFound(format!("prefix with id {}", prefix)));
                    prefix
                })
                .collect();

            let prefixes: Vec<Path> = prefixes?.iter().map(|prefix| prefix.path.clone()).collect();

            let file_system_buffer = FileSystemBuffer::new(store, &prefixes);

            buffer.insert(file_system_buffer);
        }

        Ok(buffer)
    }

    pub async fn query(
        &self,
        query: &Query,
        state: &MutexGuard<'_, State>,
    ) -> Result<Vec<Map<String, Value>>, Error> {
        let buffer = self.get_buffer(query.buffer, state)?;

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
