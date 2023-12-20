use crate::errors::Error;
use object_store::{local::LocalFileSystem, ObjectStore as ObjectStoreClient};
use std::sync::Arc;

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub enum ObjectStoreKind {
    Local,
    Remote,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct Metadata {
    pub id: usize,
    pub name: String,
    pub prefix: String,
    pub kind: ObjectStoreKind,
}

impl Metadata {
    pub fn with_prefix(&self, prefix: String) -> Self {
        Metadata {
            id: self.id,
            name: self.name.to_owned(),
            prefix,
            kind: self.kind.to_owned(),
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct LocalConnection {}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct RemoteConnection {
    region: String,
    bucket: String,
    access_key: String,
    access_key_secret: String,
    endpoint: String,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub enum Connection {
    Local(LocalConnection),
    Remote(RemoteConnection),
}

#[derive(Debug, Clone)]
pub struct ObjectStore {
    pub metadata: Metadata,
    pub connection: Connection,
    pub client: Arc<dyn ObjectStoreClient>,
}

impl ObjectStore {
    pub fn new(metadata: Metadata, connection: Connection) -> Result<Self, Error> {
        let client = match metadata.kind {
            ObjectStoreKind::Local => LocalFileSystem::new(),
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
