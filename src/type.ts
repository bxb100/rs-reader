export type Scheme = "atomicserver" |
    "azblob" |
    "azdls" | "azdfs" | "abfs" |
    "cacache" |
    "cos" |
    "dashmap" |
    "dropbox" |
    "etcd" |
    "fs" |
    "gcs" |
    "gdrive" |
    "ghac" |
    "hdfs" |
    "http" | "https" |
    "ftp" | "ftps" |
    "ipfs" | "ipns" |
    "ipmfs" |
    "memcached" |
    "memory" |
    "mini_moka" |
    "moka" |
    "obs" |
    "onedrive" |
    "persy" |
    "postgresql" |
    "redb" |
    "redis" |
    "rocksdb" |
    "s3" |
    "sftp" |
    "sled" |
    "supabase" |
    "oss" |
    "vercel_artifacts" |
    "wasabi" |
    "webdav" |
    "webhdfs" |
    "tikv";

export interface Option {
    key: string,
    value: string
}

export interface Provider {
    scheme: Scheme,
    rootPath: string,
    options?: Option[]
}

export interface BookInfo {
    name: string,
    path: string,
    options?: Record<string, any> | undefined,
    scheme: Scheme
}

export interface FileEntry {
    name: string,
    path: string,
    scheme: Scheme,
    root: string,
}
