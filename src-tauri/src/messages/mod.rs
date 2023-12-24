pub mod buffer;
pub mod store;

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub enum Messages {
    CreateObjectStore(store::Create),
    CreateBuffer(buffer::Create),
}
