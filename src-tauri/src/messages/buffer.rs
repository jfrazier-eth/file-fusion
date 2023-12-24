#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct FileSystemBufferMetadata {
    pub store: usize,
    pub prefixes: Vec<String>,
}

#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct BufferMetadata {
    pub name: String,
    pub common_schema: bool,
    pub file_systems: Vec<FileSystemBufferMetadata>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct Create {
    pub metadata: BufferMetadata,
}
