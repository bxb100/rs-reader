use log::{error, info};
use tauri::api::path::config_dir;
use tauri_plugin_store::StoreBuilder;

pub fn init_config(app: &mut tauri::App) {
    let config_path = config_dir().unwrap();
    let config_path = config_path.join(app.config().tauri.bundle.identifier.clone());
    let config_path = config_path.join("config.json");
    info!("Load config from: {:?}", config_path);
    let mut store = StoreBuilder::new(app.handle(), config_path).build();

    match store.load() {
        Ok(_) => info!("Config loaded"),
        Err(e) => {
            error!("Config load error: {:?}", e);
            info!("Config not found, creating new config");
        }
    }
}
