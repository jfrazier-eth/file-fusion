use std::sync::Arc;

use futures::lock::Mutex;
use object_store::path::Path;

use crate::{
    errors::Error,
    query::{Buffer, FileSystemBuffer},
    state::App,
};

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct FileSystemBufferMetadata {
    pub store: usize,
    pub prefixes: Vec<String>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct RegisterBuffer {
    pub file_systems: Vec<FileSystemBufferMetadata>,
}

#[tauri::command]
pub async fn register_buffer(
    app: tauri::State<'_, Arc<Mutex<App>>>,
    request: RegisterBuffer,
) -> Result<(), Error> {
    let app = app.lock().await;
    let ctx = app.get_ctx();

    let mut buffer = Buffer::new();

    for file_system in request.file_systems {
        let store = app.get_store(&file_system.store)?.ok_or(Error::NotFound)?;
        let paths: Result<Vec<Path>, object_store::path::Error> = file_system
            .prefixes
            .iter()
            .map(|prefix| Path::parse(prefix))
            .collect();

        let paths = paths.map_err(|_| Error::NotFound)?;

        let file_system_buffer = FileSystemBuffer::new(store, &paths);
        buffer.insert(file_system_buffer);
    }

    buffer.register(ctx).await?;
    Ok(())
}
