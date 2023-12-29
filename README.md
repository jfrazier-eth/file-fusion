# File Fusion 
* A file explorer for data warehouses. ⚡️ Powered by [DataFusion](https://github.com/apache/arrow-datafusion).

## Features
* View/explore the structure of a file system (local or remote)
* Connect to remote file systems (S3 compatible object stores)
* Select files and dirs and create a table from them 
* View the schema of the table you created
* Query the tables you've created using SQL
* (Planned) View the schema of a file and its metadata
* (Planned) Save queries to be run again later
* (Planned) Export query results
* (Planned) View query progress

## Limitations
* When creating a table, all dirs/files should use a common schema

## Development
* This is a [tauri](https://tauri.app/) desktop application that utilizes Next.js for the UI
* Start the development application with `cargo tauri dev`
    * Assumes you have followed the [steps to get tauri configured on your machine](https://tauri.app/v1/guides/getting-started/prerequisites)

## Screenshots

### Explorer
<img width="1068" alt="Screenshot 2023-12-28 at 11 41 52 PM" src="https://github.com/jfrazier-eth/file-fusion/assets/54604023/b33aa278-7d00-4667-8011-490cbfa117c4">

### Editor
<img width="1024" alt="Screenshot 2023-12-28 at 11 39 49 PM" src="https://github.com/jfrazier-eth/file-fusion/assets/54604023/4e3393f7-5938-4e8f-bfcc-5ed5f60c6c13">
