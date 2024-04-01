## Purpose

This project build on [foliate](https://github.com/johnfactotum/foliate/), [tauri](https://tauri.app), [OpenDAL](https://opendal.apache.org/)

It's a simple ebook reader, and build for learn how to interact with OpenDAL, and how to build a desktop app with tauri.

## Features

* EPUB, MOBI, KF8 (AZW3), FB2, CBZ, PDF
* Support remote storage (S3, WebDAV, FS, etc.)

## Attention

This project is experimental, and build for learning, so it logic so simple:

1. using `FS` save file to `$localDataDir/run.tomcat.reader/`[^1]
2. other provider will first save file to `$cacheDir/run.tomcat.reader/`[^2] and then open it.

---

<img width="1197" alt="image" src="./doc/img.png">


[^1]: https://tauri.app/v1/api/js/path/#applocaldatadir
[^2]: https://tauri.app/v1/api/js/path/#cachedir
