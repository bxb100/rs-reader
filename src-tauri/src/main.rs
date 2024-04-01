// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use lru::LruCache;
use once_cell::sync::OnceCell;
use std::num::NonZeroUsize;
use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_log::LogTarget;

use crate::cmd::*;
use crate::config::init_config;

mod cmd;
mod config;

pub static APP: OnceCell<tauri::AppHandle> = OnceCell::new();

pub struct CacheWrapper(pub Mutex<LruCache<String, i8>>);

fn main() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::default()
                .targets([LogTarget::LogDir, LogTarget::Stdout])
                .build(),
        )
        .plugin(tauri_plugin_fs_watch::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            APP.get_or_init(|| app.handle());
            init_config(app)?;
            app.manage(CacheWrapper(Mutex::new(LruCache::new(
                NonZeroUsize::new(5).unwrap(),
            ))));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            open_reader,
            reade_file,
            write_file,
            get_status,
            list_files,
            check_file,
            delete_file,
            download_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
