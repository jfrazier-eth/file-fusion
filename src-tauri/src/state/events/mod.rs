pub mod buffer;
pub mod store;

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub enum Events {
    CreateObjectStore(store::Create),
    CreateBuffer(buffer::Create),
}
