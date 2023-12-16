#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("home dir not found")]
    HomeDirNotFound,

    #[error("cannot list contents of a file")]
    CannotListContentsOfAFile,

    #[error("failed to parse path")]
    ParsePath,

    #[error("not found")]
    NotFound,

    #[error(transparent)]
    Io(#[from] std::io::Error),
}

impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}
