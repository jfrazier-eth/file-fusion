export interface FileSystemBufferMetadata {
  store: number;
  prefixes: string[];
}

export interface RegisterBuffer {
  file_systems: FileSystemBufferMetadata[];
}
