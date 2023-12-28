use std::collections::{HashMap, HashSet};
use std::sync::Arc;

use datafusion::arrow::datatypes::Schema;
use datafusion::common::{FileType, GetExt};
use datafusion::datasource::file_format::FileFormat;
use datafusion::datasource::file_format::{parquet, parquet::ParquetFormat};
use datafusion::datasource::listing::ListingOptions;
use datafusion::execution::context::{SessionContext, SessionState};
use futures::lock::Mutex;
use object_store::path::Path;
use tracing::{debug, info, warn};

use futures::StreamExt;

use crate::errors::Error;
use crate::state::store::{Connection, ObjectStore};

use self::path_utils::dedup_paths;

mod path_utils;

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

    pub fn prefixes(&self) -> Vec<&Path> {
        self.prefixes.iter().collect()
    }
}

// A buffer represents a selection of paths to be queried and may be across multiple file systems
#[derive(Debug, Clone)]
pub struct Buffer {
    id: usize,
    name: String,
    file_systems: HashMap<usize, FileSystemBuffer>,
    schema: Arc<Mutex<Option<Arc<Schema>>>>,
}

impl Buffer {
    pub fn new(id: &usize, name: &str, schema: Arc<Mutex<Option<Arc<Schema>>>>) -> Self {
        Self {
            id: id.clone(),
            name: String::from(name),
            file_systems: HashMap::new(),
            schema: schema.clone(),
        }
    }

    pub fn get_name(&self) -> &str {
        &self.name
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
    #[tracing::instrument(
        name = "registering tables for buffer",
        skip(self, table, ctx),
        fields(
            table = %table,
            buffer_id = %self.id,
            buffer_name = %self.name
        )
    )]
    pub async fn register(&self, table: &str, ctx: &SessionContext) -> Result<Vec<String>, Error> {
        let mut tables = Vec::new();
        let state = ctx.state();
        let schema = self.get_schema(&state).await?;

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
                        let closure =
                            move |prefix: &str| -> String { format!("{}/{}", base_url, prefix) };
                        Box::new(closure)
                    }
                };

            for prefix in file_system.prefixes.iter() {
                let file_format = ParquetFormat::default().with_enable_pruning(Some(true));
                let file_type = FileType::PARQUET;
                let ext = file_type.get_ext();
                let options =
                    ListingOptions::new(Arc::new(file_format)).with_file_extension(ext.clone());

                let mut path = get_path(&prefix.to_string());

                let is_file = path.ends_with(&ext);
                if !is_file {
                    if !path.ends_with("/") {
                        // datafusion requires a `/` at the end of the path if it is a directory
                        path.push('/');
                    }
                }

                let file_system_name = file_system.store.metadata.name.clone();
                let table_prefix = prefix.to_string().replace("/", ".");
                let table = format!("{file_system_name}.{table_prefix}");
                ctx.register_listing_table(&table, &path, options, Some(schema.clone()), None)
                    .await?;
                tables.push(table);
            }
        }
        let table_names: Vec<String> = tables
            .iter()
            .map(|name| format!("SELECT * FROM '{}'", name))
            .collect();
        let table_names = table_names.join(" UNION ALL ");

        let create_table = format!("CREATE VIEW '{}' AS {};", table, table_names);
        debug!(table = %table, create_table = %create_table, "creating view from tables",);
        let create_table_result = ctx.sql(&create_table).await;

        match create_table_result {
            Ok(_) => {
                info!(table = %table, "created view table");
            }
            Err(e) => {
                warn!(?e, table = %table, "failed to create view table");
            }
        };

        Ok(tables)
    }

    #[tracing::instrument(
        name = "getting schema for buffer",
        skip(self, session_state),
        fields(
            buffer_id = %self.id,
            buffer_name = %self.name
        )
    )]
    pub async fn get_schema(&self, session_state: &SessionState) -> Result<Arc<Schema>, Error> {
        let schema = {
            let schema = self.schema.lock().await;
            schema.clone()
        };

        if let Some(schema) = schema {
            return Ok(schema.clone());
        }

        let (file_system, prefix) = self.get_sample_prefix()?;
        let mut stream = file_system.store.client.list(Some(prefix));

        for item in stream.next().await {
            match item {
                Ok(item) => {
                    let format = parquet::ParquetFormat::default();
                    let objects = &[item.clone()];
                    let schema = format
                        .infer_schema(session_state, &file_system.store.client, objects)
                        .await;

                    match schema {
                        Ok(schema) => {
                            info!(item=?item, "inferred schema for object");

                            {
                                let mut lock = self.schema.lock().await;
                                *lock = Some(schema.clone());
                            }
                            return Ok(schema);
                        }
                        Err(e) => {
                            warn!(
                                ?e,
                                store = file_system.store.metadata.id,
                                prefix = ?prefix,
                                item = ?item,
                                "failed to infer schema for object"
                            );
                            continue;
                        }
                    }
                }
                Err(e) => {
                    warn!(
                        ?e,
                        store = file_system.store.metadata.id,
                        prefix = ?prefix,
                        "failed to list items in store"
                    );
                    continue;
                }
            }
        }

        Err(Error::NotFound(format!(
            "failed to find schema for file system {} buffer {}",
            file_system.store.metadata.id, self.id
        )))
    }

    fn get_sample_prefix(&self) -> Result<(&FileSystemBuffer, &Path), Error> {
        let file_systems: Vec<(&usize, &FileSystemBuffer)> = self.file_systems.iter().collect();
        let (file_system_id, file_system) = file_systems.get(0).ok_or(Error::NotFound(format!(
            "no file systems in buffer {}",
            self.id
        )))?;

        let prefixes = file_system.prefixes();
        let prefix = prefixes.get(0).ok_or(Error::NotFound(format!(
            "no prefixes for file system {} in buffer {}",
            file_system_id, self.id
        )))?;

        Ok((file_system, prefix))
    }
}

#[derive(Debug, Clone, serde::Deserialize, serde::Serialize)]
pub struct Query {
    pub statement: String,
    pub buffer: usize,
}
