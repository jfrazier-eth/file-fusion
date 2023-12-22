use std::collections::{HashMap, HashSet};
use std::sync::Arc;

use datafusion::common::{FileType, GetExt};
use datafusion::datasource::file_format::parquet::ParquetFormat;
use datafusion::datasource::listing::ListingOptions;
use datafusion::execution::context::SessionContext;
use object_store::path::Path;
use url::Url;

use crate::errors::Error;
use crate::state::store::{Connection, ObjectStore};

use self::path_utils::dedup_paths;

mod path_utils;

// the FileSystemBuffer represents a set of paths within a single file system
#[derive(Debug, Clone)]
pub struct FileSystemBuffer {
    store: ObjectStore,
    prefixes: HashSet<Path>,
}

impl FileSystemBuffer {
    pub fn new(store: ObjectStore, prefixes: &Vec<Path>) -> Self {
        let paths = dedup_paths(prefixes);

        FileSystemBuffer {
            store,
            prefixes: paths,
        }
    }

    pub fn merge(&mut self, other: FileSystemBuffer) {
        let paths = self.prefixes.union(&other.prefixes);
        let paths: Vec<Path> = paths.into_iter().map(|path| path.clone()).collect();

        let prefixes = dedup_paths(&paths);

        self.prefixes = prefixes;
    }
}

// A buffer represents a selection of paths to be queried and may be across multiple file systems
#[derive(Debug, Clone)]
pub struct Buffer {
    file_systems: HashMap<usize, FileSystemBuffer>,
}

impl Buffer {
    pub fn new() -> Self {
        Self {
            file_systems: HashMap::new(),
        }
    }

    pub fn insert(&mut self, item: FileSystemBuffer) {
        let id = item.store.metadata.id;
        let existing = self.file_systems.get_mut(&id);

        match existing {
            Some(existing) => existing.merge(item),
            None => {
                let _ = self.file_systems.insert(id, item);
            }
        }
    }
}

impl Buffer {
    pub async fn register(&self, ctx: &SessionContext) -> Result<Vec<String>, Error> {
        let mut tables = Vec::new();
        for (_, file_system) in self.file_systems.iter() {
            let get_path: Box<dyn Fn(&str) -> String + Send + Sync> =
                match file_system.store.connection.clone() {
                    Connection::Local(_) => {
                        let closure = |prefix: &str| -> String { format!("{}", prefix) };
                        Box::new(closure)
                    }
                    Connection::Remote(connection) => {
                        let bucket_name = connection.bucket;
                        let base_url = format!("s3://{bucket_name}");
                        let s3_url = Url::parse(&base_url)?;
                        ctx.runtime_env()
                            .register_object_store(&s3_url, file_system.store.client.clone());

                        let closure =
                            move |prefix: &str| -> String { format!("{}/{}", base_url, prefix) };
                        Box::new(closure)
                    }
                };

            for prefix in file_system.prefixes.iter() {
                let file_format = ParquetFormat::default().with_enable_pruning(Some(true));

                let options = ListingOptions::new(Arc::new(file_format))
                    .with_file_extension(FileType::PARQUET.get_ext());

                let path = get_path(&prefix.to_string());
                let file_system_name = file_system.store.metadata.name.clone();
                let table_prefix = prefix.to_string().replace("/", ".");
                let table = format!("{file_system_name}.{table_prefix}");
                println!("Registering remote table {} for path {}", table, path);
                ctx.register_listing_table(&table, &path, options, None, None)
                    .await?;
                println!("Registered remote table {} for path {}", table, path);
                tables.push(table);
            }
        }

        Ok(tables)
    }
}
