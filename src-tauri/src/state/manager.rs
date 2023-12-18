use crate::{
    errors::Error,
    storage::{Storage, StorageConnection},
};
use std::{
    collections::HashMap,
    fs::{create_dir_all, File, OpenOptions},
    io::{prelude::*, BufReader},
    path::PathBuf,
    sync::{Arc, Mutex},
};

use super::{Event, Events};

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct State {
    storage: HashMap<usize, Storage>,
    connections: HashMap<usize, StorageConnection>,
}

impl State {
    pub fn new() -> Self {
        Self {
            storage: HashMap::new(),
            connections: HashMap::new(),
        }
    }
}

pub struct Config {
    pub events_file: PathBuf,
}

pub struct StateManager {
    config: Config,
    event_id: usize,
    state: Arc<Mutex<State>>,
}

impl StateManager {
    pub fn new(config: Config) -> Self {
        Self {
            config,
            event_id: 0,
            state: Arc::new(Mutex::new(State::new())),
        }
    }

    pub fn list_storages(&self) -> Result<Vec<Storage>, Error> {
        let state = self.state.lock().map_err(|_| Error::FailedToGetStateLock)?;

        let storages: Vec<Storage> = state
            .storage
            .iter()
            .map(|(_, storage)| storage.clone())
            .collect();

        Ok(storages)
    }

    pub fn get_storage(&self, id: usize) -> Result<Option<Storage>, Error> {
        let state = self.state.lock().map_err(|_| Error::FailedToGetStateLock)?;
        let storage = state.storage.get(&id).map(|storage| storage.clone());
        Ok(storage)
    }

    pub fn next_event_id(&self) -> usize {
        self.event_id + 1
    }

    pub fn get_storage_id(&self) -> Result<usize, Error> {
        let state = self.state.lock().map_err(|_| Error::FailedToGetStateLock)?;
        let max = state.storage.keys().max();
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
            Events::CreateStorage(event) => {
                let id = event.storage.id;
                let storage = event.storage.clone();
                let connection = event.connection.clone();

                self.event_id = event.get_id();
                state.storage.insert(id, storage);
                state.connections.insert(id, connection);
            }
        }

        Ok(())
    }
}
