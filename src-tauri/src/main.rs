// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{fs, path::Path};

use directories::UserDirs;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

#[derive(Debug, thiserror::Error)]
enum Error {
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

// we must manually implement serde::Serialize
impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

#[tauri::command]
fn home_dir() -> Result<String, Error> {
    println!("Getting home dir",);
    let user_dirs = UserDirs::new().ok_or(Error::HomeDirNotFound)?;
    let home_dir = user_dirs.home_dir();
    let home_dir = home_dir
        .as_os_str()
        .to_str()
        .ok_or(Error::HomeDirNotFound)?;
    println!("home_dir test, {}", home_dir);
    Ok(String::from(home_dir))
}

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
struct Contents {
    path: String,
    items: Vec<Content>,
}

#[tauri::command]
async fn contents(path: String) -> Result<Contents, Error> {
    let dir_path = Path::new(&path);

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

        let item = Content::new(path, is_dir);
        items.push(item);
    }

    Ok(Contents { items, path })
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet, home_dir, contents])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
