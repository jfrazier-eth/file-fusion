use directories::UserDirs;

use crate::errors::Error;

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

pub fn get_home_dir() -> Result<String, Error> {
    let user_dirs = UserDirs::new().ok_or(Error::HomeDirNotFound)?;
    let home_dir = user_dirs.home_dir();
    let home_dir = home_dir
        .as_os_str()
        .to_str()
        .ok_or(Error::HomeDirNotFound)?;
    Ok(String::from(home_dir))
}
