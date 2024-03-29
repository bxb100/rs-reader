import {BookInfo, FileEntry, Scheme} from "@/type.ts";
import {invoke} from "@tauri-apps/api/tauri";

export async function openReader(fileEntry: FileEntry, options?: Record<string, any>) {
    const data: BookInfo = {
        path: fileEntry.path,
        name: fileEntry.name,
        scheme: fileEntry.scheme,
        options
    }
    await invoke("open_reader", {pass: JSON.stringify(data)})
}

export async function checkFile(fileEntry: FileEntry, options?: Record<string, any>) {
    return invoke<boolean>("check_file", {
        path: fileEntry.path,
        scheme: fileEntry.scheme,
        options
    })
}

export async function deleteFile(fileEntry: FileEntry, options?: Record<string, any>) {
    return invoke<boolean>("delete_file", {path: fileEntry.path, scheme: fileEntry.scheme, options})
}

export async function listFiles(scheme: Scheme, path: string, options?: Record<string, any>) {
    return invoke<FileEntry[]>("list_files", {scheme, path: path.trim(), options})
}
