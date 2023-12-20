use crate::{
    messages,
    storage::{Connection, Metadata},
};

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct Create {
    pub id: usize,
    pub metadata: Metadata,
    pub connection: Connection,
}

impl Create {
    pub fn from_msg(event_id: usize, store_id: usize, message: messages::store::Create) -> Self {
        let metadata = message.metadata;
        Self {
            id: event_id,
            metadata: Metadata {
                id: store_id,
                name: metadata.name,
                prefix: metadata.prefix,
                kind: metadata.kind,
            },
            connection: message.connection,
        }
    }
}
