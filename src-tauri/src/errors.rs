#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("home dir not found")]
    HomeDirNotFound,

    #[error("failed to deserialize events")]
    FailedToDeserializeEvents,

    #[error("failed to serialize events")]
    FailedToSerializeEvents,

    #[error("failed to write to events file")]
    FailedToWriteToEventsFile,

    #[error("failed to get state lock")]
    FailedToGetStateLock,

    #[error("not found `{0}`")]
    NotFound(String),

    #[error(transparent)]
    Serde(#[from] serde_json::Error),

    #[error(transparent)]
    Io(#[from] std::io::Error),

    #[error(transparent)]
    Path(#[from] object_store::path::Error),

    #[error(transparent)]
    ObjectStore(#[from] object_store::Error),

    #[error(transparent)]
    UrlParseError(#[from] url::ParseError),

    #[error(transparent)]
    DataFusionError(#[from] datafusion::error::DataFusionError),

    #[error(transparent)]
    ArrowError(#[from] datafusion::arrow::error::ArrowError),
}

impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}
