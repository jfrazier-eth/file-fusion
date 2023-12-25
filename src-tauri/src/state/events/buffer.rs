use crate::messages::buffer::BufferMetadata;

#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct Create {
    pub id: usize,
    pub metadata: BufferMetadata,
}
