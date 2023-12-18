use directories::UserDirs;

use crate::errors::Error;

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub enum StorageKind {
    Local,
    ObjectStore,
    Arweave,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct StorageMessage {
    pub name: String,
    pub path: String,
    pub kind: StorageKind,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct Storage {
    pub id: usize,
    pub name: String,
    pub path: String,
    pub kind: StorageKind,
}

impl Storage {
    pub fn with_path(&self, path: String) -> Self {
        Storage {
            id: self.id,
            name: self.name.to_owned(),
            path,
            kind: self.kind.to_owned(),
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct LocalConnection {}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct ObjectStoreConnection {
    region: String,
    bucket: String,
    access_key: String,
    access_key_secret: String,
    endpoint: String,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct ArweaveConnection {}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub enum StorageConnection {
    Local(LocalConnection),
    ObjectStore(ObjectStoreConnection),
    Arweave(ArweaveConnection),
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
