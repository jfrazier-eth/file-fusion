use std::{fs, path::Path};

use crate::{errors::Error, storage::Metadata};

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone, Copy)]
enum ContentKind {
    Directory,
    File,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
struct Content {
    pub path: String,
    pub kind: ContentKind,
}

impl Content {
    pub fn new(path: String, is_dir: bool) -> Self {
        if is_dir {
            return Self {
                path,
                kind: ContentKind::Directory,
            };
        }
        Self {
            path,
            kind: ContentKind::File,
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct Contents {
    path: String,
    items: Vec<Content>,
}

pub fn get_contents(metadata: Metadata) -> Result<Contents, Error> {
    let dir_path = Path::new(&metadata.prefix);

    if !dir_path.is_dir() {
        return Err(Error::CannotListContentsOfAFile);
    }
    let dir = fs::read_dir(dir_path)?;

    let mut items = Vec::new();

    for entry in dir {
        let entry = entry?;
        let path = entry.path();
        let is_dir = path.is_dir();
        let path = path.as_os_str().to_str().ok_or(Error::ParsePath)?;
        let path = String::from(path);

        println!("Path {} Is Dir {}", path, is_dir);

        let item = Content::new(path, is_dir);
        items.push(item);
    }

    Ok(Contents {
        items,
        path: metadata.prefix,
    })
}
