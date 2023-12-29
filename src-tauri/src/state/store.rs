use crate::errors::Error;
use datafusion::execution::context::SessionContext;
use directories::UserDirs;
use object_store::{
    aws::AmazonS3Builder, local::LocalFileSystem, ObjectStore as ObjectStoreClient,
};
use std::{cmp::Ordering, sync::Arc};
use tracing::{debug, info};
use url::Url;

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone, PartialEq, Eq)]
pub enum ObjectStoreKind {
    Local,
    Remote,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone, Eq)]
pub struct Metadata {
    pub id: usize,
    pub name: String,
    pub prefix: String,
    pub kind: ObjectStoreKind,
}

impl Ord for Metadata {
    fn cmp(&self, other: &Self) -> Ordering {
        self.id.cmp(&other.id)
    }
}

impl PartialOrd for Metadata {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl PartialEq for Metadata {
    fn eq(&self, other: &Self) -> bool {
        self.id == other.id
    }
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
    pub registered: bool,
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
            registered: false,
            metadata,
            connection,
            client,
        })
    }

    pub fn register(&mut self, ctx: &SessionContext) -> Result<(), Error> {
        debug!(object_store = self.metadata.id, "registering object store");
        if self.registered {
            debug!(
                object_store = self.metadata.id,
                "object store is already registered"
            );
            return Ok(());
        }
        match &self.connection {
            Connection::Local(_) => {
                self.registered = true;
                info!(
                    object_store = self.metadata.id,
                    "registered local object store"
                );
                return Ok(());
            }
            Connection::Remote(connection) => {
                let bucket_name = &connection.bucket;
                let base_url = format!("s3://{bucket_name}");
                let s3_url = Url::parse(&base_url)?;

                ctx.runtime_env()
                    .register_object_store(&s3_url, self.client.clone());
                self.registered = true;
                info!(
                    object_store = self.metadata.id,
                    url = s3_url.to_string(),
                    "registered remote object store"
                );
                return Ok(());
            }
        }
    }
}

pub fn get_home_dir() -> Result<String, Error> {
    let user_dirs = UserDirs::new().ok_or(Error::HomeDirNotFound)?;
    let home_dir = user_dirs.home_dir();
    let home_dir = home_dir
        .as_os_str()
        .to_str()
        .ok_or(Error::HomeDirNotFound)?;
    Ok(String::from(home_dir))
}
