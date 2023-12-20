#[derive(serde::Serialize, serde::Deserialize, Debug, Clone, Copy)]
pub enum ContentKind {
    Directory,
    File,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct Content {
    pub prefix: String,
    pub kind: ContentKind,
}

impl Content {
    pub fn new(prefix: String, is_dir: bool) -> Self {
        if is_dir {
            return Self {
                prefix,
                kind: ContentKind::Directory,
            };
        }
        Self {
            prefix,
            kind: ContentKind::File,
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct Contents {
    pub prefix: String,
    pub items: Vec<Content>,
}
