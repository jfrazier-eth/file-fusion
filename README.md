# File Fusion
* A file explorer for data lakes

Powered by [DataFusion](https://github.com/apache/arrow-datafusion).

## Features
* View/explore the structure of a file system (local or remote)
* Connect to remote file systems (S3 compatible object stores)
* (In Progress) Write SQL queries
* (In Progress) Execute SQL queries over selected files
* (Planned) Copy files across files systems
* (Planned) View files, schemas, and other metadata

## Development
* This is a [tauri](https://tauri.app/) desktop application that utilizes Next.js for the UI
* Start the development application with `cargo tauri dev`
    * Assumes you have followed the steps to get tauri configured on your machine
