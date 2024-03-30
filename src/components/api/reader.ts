import {FileEntry, Scheme} from "@/type.ts";
import {convertFileSrc, invoke} from "@tauri-apps/api/tauri";
import {type} from "@tauri-apps/api/os";

export async function openReader(fileEntry: FileEntry) {
    console.log(fileEntry)
    const separate = (await type()).startsWith("Windows") ? "\\" : "/"
    const data = {
        url: convertFileSrc(fileEntry.root + separate + fileEntry.path),
        name: fileEntry.name,
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
