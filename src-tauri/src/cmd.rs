use std::collections::HashMap;
use std::str::FromStr;

use base64::Engine;
use base64::prelude::BASE64_STANDARD;
use opendal::Operator;
use serde::{Deserialize, Serialize};
use tauri::{Manager, WindowBuilder, WindowUrl};

use crate::APP;

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
    .min_inner_size(820f64, 500f64)
    .initialization_script(&format!("window.__DATA__ = {pass}"))
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

/// `readBinaryFile` super slow
#[tauri::command]
pub fn reade_file(
    name: String,
    scheme: String,
    options: Option<HashMap<String, String>>,
) -> Result<String, String> {
    let scheme = opendal::Scheme::from_str(&scheme).map_err(|e| e.to_string())?;
    let mut option = options.unwrap_or_default();
    if option.get("root").is_none() {
        option.insert("root".to_string(), "/".to_string());
    }

    let operator = Operator::via_map(scheme, option).map_err(|e| e.to_string())?;
    let data = operator.blocking().read(&name).map_err(|e| e.to_string())?;

    Ok(BASE64_STANDARD.encode(data))
}
