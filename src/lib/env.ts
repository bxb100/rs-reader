import {appConfigDir, appLocalDataDir} from "@tauri-apps/api/path";

export let appConfigDirPath: string;
export let appLocalDataDirPath: string;

export async function initEnv() {
    appConfigDirPath = await appConfigDir();
    appLocalDataDirPath = await appLocalDataDir()
}
