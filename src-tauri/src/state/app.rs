use datafusion::execution::context::SessionContext;

use crate::{
    errors::Error,
    events::{store, Events},
    storage::get_home_dir,
};

use std::{
    collections::HashMap,
    fs::{create_dir_all, OpenOptions},
    io::{prelude::*, BufReader},
    path::PathBuf,
    sync::{Arc, Mutex},
};

use super::store::{Connection, LocalConnection, Metadata, ObjectStore, ObjectStoreKind};

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
    session: SessionContext,
}

impl App {
    pub fn new(config: Config) -> Self {
        Self {
            config,
            event_id: 0,
            state: Arc::new(Mutex::new(State::new())),
            session: SessionContext::new(),
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

    pub fn get_store(&self, id: &usize) -> Result<Option<ObjectStore>, Error> {
        let state = self.state.lock().map_err(|_| Error::FailedToGetStateLock)?;
        let store = state.stores.get(&id).map(|store| store.clone());
        Ok(store)
    }

    pub fn get_metadata(&self, id: &usize) -> Result<Option<Metadata>, Error> {
        self.get_store(id)
            .map(|store| store.map(|store| store.metadata))
    }

    pub fn next_event_id(&self) -> usize {
        self.event_id + 1
    }

    pub fn get_ctx(&self) -> &SessionContext {
        &self.session
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
                Ok(event) => self.update(&event)?,
                Err(_) => return Err(Error::FailedToDeserializeEvents),
            }
        }

        let num_stores = {
            let state = self.state.lock().map_err(|_| Error::FailedToGetStateLock)?;
            state.stores.len()
        };

        if num_stores == 0 {
            let default_store_event = Events::CreateObjectStore(store::Create {
                id: self.next_event_id(),
                metadata: Metadata {
                    id: self.create_store_id()?,
                    name: String::from("Local"),
                    prefix: get_home_dir()?,
                    kind: ObjectStoreKind::Local,
                },
                connection: Connection::Local(LocalConnection {}),
            });
            self.save(&default_store_event)?;
        }

        Ok(())
    }

    pub fn save(&mut self, event: &Events) -> Result<(), Error> {
        self.update(event)?;

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
