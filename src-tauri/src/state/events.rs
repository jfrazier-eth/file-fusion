use crate::storage::{Storage, StorageConnection, StorageMessage};

pub trait Event {
    fn get_id(&self) -> usize;
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct CreateStorageMessage {
    pub storage: StorageMessage,
    pub connection: StorageConnection,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub enum Messages {
    CreateStorage(CreateStorageMessage),
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct CreateStorage {
    pub id: usize,
    pub storage: Storage,
    pub connection: StorageConnection,
}

impl Event for CreateStorage {
    fn get_id(&self) -> usize {
        self.id
    }
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub enum Events {
    CreateStorage(CreateStorage),
}
