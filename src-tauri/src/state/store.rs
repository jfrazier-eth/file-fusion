use crate::errors::Error;
use object_store::{
    aws::AmazonS3Builder, local::LocalFileSystem, ObjectStore as ObjectStoreClient,
};
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
    pub region: String,
    pub bucket: String,
    pub access_key: String,
    pub access_key_secret: String,
    pub endpoint: String,
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
        let client: Arc<dyn ObjectStoreClient> = match connection.clone() {
            Connection::Local(_) => Arc::new(LocalFileSystem::new()),
            Connection::Remote(connection) => {
                let s3 = AmazonS3Builder::new()
                    .with_bucket_name(connection.bucket)
                    .with_region(connection.region)
                    .with_access_key_id(connection.access_key)
                    .with_secret_access_key(connection.access_key_secret)
                    .with_endpoint(connection.endpoint)
                    .build()?;

                Arc::new(s3)
            }
        };

        Ok(Self {
            metadata,
            connection,
            client,
        })
    }
}
