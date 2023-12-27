use std::{collections::HashMap, ops::DerefMut, sync::Arc};

use tokio::sync::{Mutex, MutexGuard};

#[derive(Debug, Clone)]
pub struct Id {
    inner: Arc<Mutex<usize>>,
}

impl Id {
    pub fn new() -> Self {
        Self {
            inner: Arc::new(Mutex::new(0)),
        }
    }

    async fn get_lock(&self) -> MutexGuard<usize> {
        self.inner.lock().await
    }

    pub async fn get_next(&self) -> usize {
        let next_id = {
            let mut lock = self.get_lock().await;
            let id = lock.deref_mut();
            *id += 1;
            id.clone()
        };

        next_id
    }

    pub async fn update(&self, new_id: usize) {
        let mut lock = self.get_lock().await;
        let id = lock.deref_mut();
        if new_id > *id {
            *id = new_id
        }
    }
}

#[derive(Debug, Clone)]
pub struct MutexMap<T> {
    id: Id,
    inner: Arc<Mutex<HashMap<usize, T>>>,
}

impl<T> MutexMap<T> {
    pub fn new() -> Self {
        Self {
            id: Id::new(),
            inner: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

impl<T> MutexMap<T> {
    async fn get_lock(&self) -> MutexGuard<HashMap<usize, T>> {
        self.inner.lock().await
    }
}

impl<T: Clone> MutexMap<T> {
    pub async fn get_id(&self) -> usize {
        self.id.get_next().await
    }

    pub async fn get(&self, id: &usize) -> Option<T> {
        let item = {
            let lock = self.get_lock().await;
            let item = lock.get(id).map(|item| item.clone());
            item
        };

        item
    }

    pub async fn list(&self) -> Vec<T> {
        let items = {
            let lock = self.get_lock().await;
            let items: Vec<T> = lock.iter().map(|(_key, store)| store.clone()).collect();
            items
        };

        items
    }

    pub async fn insert(&self, id: usize, item: T) -> Option<T> {
        let result = {
            let mut lock = self.get_lock().await;
            let res = lock.insert(id, item);
            self.id.update(id).await;
            res
        };

        result
    }

    pub async fn remove(&self, id: usize) -> Option<T> {
        let result = {
            let mut lock = self.get_lock().await;
            lock.remove(&id)
        };

        result
    }

    pub async fn len(&self) -> usize {
        let len = {
            let lock = self.get_lock().await;
            lock.len()
        };

        len
    }
}
