use std::sync::Arc;

use datafusion::arrow::datatypes::Schema;

#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct Table {
    name: String,
    schema: Arc<Schema>,
}

impl Table {
    pub fn new(name: &str, schema: Arc<Schema>) -> Self {
        Self {
            name: name.into(),
            schema,
        }
    }
}
