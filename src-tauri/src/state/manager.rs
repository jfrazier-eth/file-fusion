use object_store::{local::LocalFileSystem, ObjectStore as ObjectStoreClient};

use crate::{
    errors::Error,
    events::Events,
    storage::{Connection, Metadata, ObjectStoreKind},
};

use std::{
    collections::HashMap,
    fs::{create_dir_all, File, OpenOptions},
    io::{prelude::*, BufReader},
    path::PathBuf,
    sync::{Arc, Mutex},
};

#[derive(Debug, Clone)]
pub struct ObjectStore {
    metadata: Metadata,
    connection: Connection,
    client: Arc<dyn ObjectStoreClient>,
}

impl ObjectStore {
    pub fn new(metadata: Metadata, connection: Connection) -> Result<Self, Error> {
        let client = match metadata.kind {
            ObjectStoreKind::Local => LocalFileSystem::new_with_prefix(&metadata.prefix)?,

            ObjectStoreKind::Remote => {
                todo!();
            }
        };

        Ok(Self {
            metadata,
            connection,
            client: Arc::new(client),
        })
    }
}

#[derive(Debug, Clone)]
pub struct State {
    stores: HashMap<usize, ObjectStore>,
}

impl State {
    pub fn new() -> Self {
        Self {
            stores: HashMap::new(),
        }
    }
}

pub struct Config {
    pub events_file: PathBuf,
}

pub struct App {
    config: Config,
    event_id: usize,
    state: Arc<Mutex<State>>,
}

impl App {
    pub fn new(config: Config) -> Self {
        Self {
            config,
            event_id: 0,
            state: Arc::new(Mutex::new(State::new())),
        }
    }

    pub fn list_stores(&self) -> Result<Vec<Metadata>, Error> {
        let state = self.state.lock().map_err(|_| Error::FailedToGetStateLock)?;

        let stores: Vec<Metadata> = state
            .stores
            .iter()
            .map(|(_, item)| item.metadata.clone())
            .collect();

        Ok(stores)
    }

    pub fn get_metadata(&self, id: usize) -> Result<Option<Metadata>, Error> {
        let state = self.state.lock().map_err(|_| Error::FailedToGetStateLock)?;
        let metadata = state.stores.get(&id).map(|store| store.metadata.clone());

        Ok(metadata)
    }

    pub fn next_event_id(&self) -> usize {
        self.event_id + 1
    }

    pub fn create_store_id(&self) -> Result<usize, Error> {
        let state = self.state.lock().map_err(|_| Error::FailedToGetStateLock)?;
        let max = state.stores.keys().max();
        let id = match max {
            Some(value) => value + 1,
            None => 1,
        };

        Ok(id)
    }

    pub fn sync(&mut self) -> Result<(), Error> {
        let events_file = self.config.events_file.clone();
        let events_file = File::open(events_file)?;

        let reader = BufReader::new(events_file);
        for line in reader.lines() {
            let line = line?;
            let event = serde_json::from_str::<Events>(&line);
            match event {
                Ok(event) => self.update(&event)?,
                Err(_) => return Err(Error::FailedToDeserializeEvents),
            }
        }

        Ok(())
    }

    pub fn save(&mut self, event: &Events) -> Result<(), Error> {
        self.update(event)?;

        let events_file = self.config.events_file.clone();
        if let Some(dir) = events_file.parent() {
            if !dir.exists() {
                create_dir_all(dir)?;
            }
        }

        let mut file = OpenOptions::new()
            .write(true)
            .append(true)
            .create(true)
            .open(events_file)?;

        let event = match serde_json::to_string(&event) {
            Ok(event) => event,
            Err(_) => return Err(Error::FailedToSerializeEvents),
        };
        writeln!(file, "{}", event).map_err(|_| Error::FailedToWriteToEventsFile)
    }

    fn update(&mut self, event: &Events) -> Result<(), Error> {
        let mut state = self.state.lock().map_err(|_| Error::FailedToGetStateLock)?;

        match event {
            Events::CreateObjectStore(event) => {
                let id = event.id;
                let metadata = event.metadata.clone();
                let connection = event.connection.clone();

                let store = ObjectStore::new(metadata, connection)?;
                self.event_id = event.id;
                state.stores.insert(id, store);
            }
        }

        Ok(())
    }
}
