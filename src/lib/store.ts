import {Store} from 'tauri-plugin-store-api';
import {join} from '@tauri-apps/api/path';
import {watch} from 'tauri-plugin-fs-watch-api';
import {getVersion} from "@tauri-apps/api/app";
import {appConfigDirPath, initEnv} from "@/lib/env.ts";

export let store: Store;

export async function initStore() {
    await initEnv();
    const appConfigPath = await join(appConfigDirPath, 'config.json');
    store = new Store(appConfigPath);

    // make config file exist and to be able to watch
    await store.set("version", await getVersion());
    await store.save();

    await watch(appConfigPath, async () => {
        await store.load();
    });
}
