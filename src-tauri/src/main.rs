// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{WindowBuilder, WindowUrl};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .setup(|app| {
            let settings_window = WindowBuilder::new(
                &app.handle(),
                "reader",
                WindowUrl::App("nested/reader.html".into()),
            )
            .title("Settings")
            .visible(false)
            .resizable(false)
            .inner_size(350., 315.)
            .focused(true)
            .skip_taskbar(true)
            .build()?;
            settings_window.show()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
