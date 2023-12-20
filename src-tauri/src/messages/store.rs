use crate::state::store::{Connection, ObjectStoreKind};

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct Metadata {
    pub name: String,
    pub prefix: String,
    pub kind: ObjectStoreKind,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct Create {
    pub metadata: Metadata,
    pub connection: Connection,
}
