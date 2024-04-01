use log::{error, info};
use tauri::api::path::{app_local_data_dir, config_dir};
use tauri_plugin_store::StoreBuilder;

pub fn init_config(app: &mut tauri::App) -> Result<(), String> {
    let config_path = config_dir().ok_or("None Path")?;
    let config_path = config_path.join(app.config().tauri.bundle.identifier.clone());
    let config_path = config_path.join("config.json");
    info!("Load config from: {:?}", config_path);
    let mut store = StoreBuilder::new(app.handle(), config_path).build();

    match store.load() {
        Ok(_) => info!("Config loaded"),
        Err(e) => {
            error!("Config load error: {:?}", e);
            // build default config
            let app_local_data_dir = app_local_data_dir(&app.config())
                .unwrap()
                .to_string_lossy()
                .to_string();
            store
                .insert("enable".to_string(), serde_json::json!("fs"))
                .map_err(|e| e.to_string())?;
            store
                .insert(
                    "fs".to_string(),
                    serde_json::json!({
                        "scheme": "fs",
                        "rootPath": app_local_data_dir
                    }),
                )
                .map_err(|e| e.to_string())?;
            store.save().map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}
