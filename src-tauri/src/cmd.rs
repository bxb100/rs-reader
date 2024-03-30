use std::collections::HashMap;
use std::fmt::Debug;
use std::path::Path;
use std::str::FromStr;
use std::{fs, thread};

use base64::prelude::BASE64_STANDARD;
use base64::Engine;
use log::info;
use opendal::{EntryMode, Operator};
use serde::{Deserialize, Serialize};
use tauri::{Manager, State, WindowBuilder, WindowUrl};
use uuid::Uuid;

use crate::{APP, CacheWrapper};

#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
pub fn open_reader(pass: String) -> Result<(), String> {
    let handler = APP.get().unwrap();
    let win_len = handler.windows().keys().len();

    WindowBuilder::new(
        handler,
        format!("reader-{win_len}"),
        WindowUrl::App("nested/reader.html".into()),
    )
    .title("Reader")
    .hidden_title(true)
    .additional_browser_args("--disable-web-security")
    .visible(true)
    .resizable(true)
    .focused(true)
    .skip_taskbar(true)
    // .min_inner_size(820f64, 500f64)
    .initialization_script(&format!("window.__DATA__ = JSON.parse(`{pass}`)"))
    .build()
    .unwrap();

    Ok(())
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct ReaderPayload {
    name: String,
    scheme: String,
    options: Option<HashMap<String, String>>,
}

#[tauri::command]
pub fn check_file(
    path: String,
    scheme: String,
    options: Option<HashMap<String, String>>,
) -> Result<bool, String> {
    let op = init_operator(scheme, options).map_err(|e| format!("{e}"))?;
    op.blocking().is_exist(&path).map_err(|e| format!("{e}"))
}

/// `readBinaryFile` super slow
#[tauri::command]
pub fn reade_file(
    path: String,
    scheme: String,
    options: Option<HashMap<String, String>>,
) -> Result<String, String> {
    let operator = init_operator(scheme.to_string(), options).map_err(|e| e.to_string())?;
    let data = operator.blocking().read(&path).map_err(|e| e.to_string())?;

    Ok(BASE64_STANDARD.encode(data))
}


fn init_operator(
    scheme: String,
    options: Option<HashMap<String, String>>,
) -> opendal::Result<Operator> {
    let scheme = opendal::Scheme::from_str(&scheme)?;
    let mut option = options.unwrap_or_default();
    if option.get("root").is_none() {
        option.insert("root".to_string(), "/".to_string());
    }

    Operator::via_map(scheme, option)
}

#[tauri::command]
pub fn get_status(id: String, cache: State<CacheWrapper>) -> i8 {
    let mut cache = cache.0.lock().unwrap();
    *cache.get(&id).unwrap()
}

#[tauri::command]
pub fn write_file(
    read_path: String,
    save_path: String,
    scheme: String,
    options: Option<HashMap<String, String>>,
    cache: State<CacheWrapper>
) -> Result<String, String> {
    info!(
        "write_file: read_path: {}, save_path: {}, scheme: {:?}, options: {:?}",
        read_path, save_path, scheme, options
    );

    let uuid = Uuid::new_v4();
    let uuid = uuid.to_string();
    let id = uuid.clone();

    {
        let mut cache = cache.0.lock().unwrap();
        cache.put(uuid.clone(), 0);
    }

    thread::spawn(move || {
        let local_file_path = Path::new(&read_path);
        let bytes = fs::read(local_file_path).unwrap();

        let operator = init_operator(scheme.clone(), options).unwrap().blocking();

        let default_fs_separate = "/";
        #[cfg(target_os = "windows")]
        let default_fs_separate = "\\";

        let separate = if matches!(scheme.as_str(), "fs") {
            default_fs_separate
        } else {
            "/"
        };
        let save_path = format!(
            "{}{}{}",
            save_path,
            separate,
            local_file_path.file_name().unwrap().to_str().unwrap()
        );
        let local_save_path = Path::new(&save_path);
        let cs = local_save_path.parent().unwrap();
        if !operator.is_exist(cs.to_str().unwrap()).map_err(|e| e.to_string()).unwrap() {
            operator.create_dir(&format!("{}/", cs.to_str().unwrap())).map_err(|e| e.to_string()).unwrap();
        }

        let result = operator.write(&save_path, bytes);
        {
            info!("write_file: result: {:?}", result);
            let cache = APP.get().unwrap().state::<CacheWrapper>();
            let mut cache = cache.0.lock().unwrap();
            cache.put(id, result.map_or(-1, |_| 1));
        }
    });

    Ok(uuid)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct FileEntry {
    name: String,
    path: String,
    scheme: String,
    root: String,
}

#[tauri::command]
pub fn list_files(
    path: String,
    scheme: String,
    options: Option<HashMap<String, String>>,
) -> Result<Vec<FileEntry>, String> {
    let op = init_operator(scheme.clone(), options).map_err(|e| e.to_string())?;

    let root_path = op.info().root().to_string();

    let entries = op.blocking().list(&path).map_err(|e| format!("{e}"))?;

    let mut results: Vec<FileEntry> = vec![];

    for entry in entries {
        match entry.metadata().mode() {
            EntryMode::FILE => {
                let name = entry.name();
                if ![".mobi", ".epub", ".pdf"]
                    .iter()
                    .any(|&x| name.ends_with(x))
                {
                    continue;
                }
                results.push(FileEntry {
                    name: entry.name().to_string(),
                    path: entry.path().to_string(),
                    scheme: scheme.clone(),
                    root: root_path.clone(),
                });
            }
            EntryMode::DIR => continue,
            EntryMode::Unknown => continue,
        }
    }
    Ok(results)
}

#[tauri::command]
pub fn delete_file(
    path: String,
    scheme: String,
    options: Option<HashMap<String, String>>,
) -> Result<(), String> {
    info!("delete_file: path: {}, scheme: {:?}, options: {:?}", path, scheme, options);
    let op = init_operator(scheme, options).map_err(|e| e.to_string())?;
    op.blocking().delete(&path).map_err(|e| e.to_string())
}