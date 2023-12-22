#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct FileSystemBufferMetadata {
    pub store: usize,
    pub prefixes: Vec<String>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct RegisterBuffer {
    pub file_systems: Vec<FileSystemBufferMetadata>,
}
