import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import * as path from "node:path";

// https://vitejs.dev/config/
export default defineConfig(async () => ({
    plugins: [react()],
    define: {
        __ROOT_PATH: JSON.stringify(path.resolve(__dirname, 'test'))
    },
    resolve: {
        alias: {
            // https://github.com/vitejs/vite/issues/15412
            'foliate-js': path.resolve(__dirname, 'foliate-js'),
        }
    },
    build: {
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'index.html'),
                reader: path.resolve(__dirname, 'nested/reader.html'),
            },
            output: {
                manualChunks(id: string) {
                    // split pdf.worker.js into a separate chunk
                    if (id.includes('pdf.worker.js')) {
                        return 'pdf.worker';
                    }
                }
            }
        }
    },
    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    //
    // 1. prevent vite from obscuring rust errors
    clearScreen: false,
    // 2. tauri expects a fixed port, fail if that port is not available
    server: {
        port: 1420,
        strictPort: true,
        watch: {
            // 3. tell vite to ignore watching `src-tauri`
            ignored: ["**/src-tauri/**"],
        },
    },
}));
