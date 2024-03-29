// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use once_cell::sync::OnceCell;
use tauri_plugin_log::LogTarget;

use crate::cmd::*;

mod cmd;

pub static APP: OnceCell<tauri::AppHandle> = OnceCell::new();

fn main() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::default()
                .targets([LogTarget::LogDir, LogTarget::Stdout])
                .build(),
        )
        .setup(|app| {
            APP.get_or_init(|| app.handle());
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
            delete_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
