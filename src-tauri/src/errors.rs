use thiserror::Error;

#[derive(Debug, Error)]
pub enum Error {
    #[error("home dir not found")]
    HomeDirNotFound,

    #[error("cannot list contents of a file")]
    CannotListContentsOfAFile,

    #[error("failed to deserialize events")]
    FailedToDeserializeEvents,

    #[error("failed to serialize events")]
    FailedToSerializeEvents,

    #[error("failed to write to events file")]
    FailedToWriteToEventsFile,

    #[error("failed to get state lock")]
    FailedToGetStateLock,

    #[error("failed to parse path")]
    ParsePath,

    #[error("not found")]
    NotFound,

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
}

impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}
