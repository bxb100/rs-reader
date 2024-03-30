import {FileEntry, Scheme} from "@/type.ts";
import {convertFileSrc, invoke} from "@tauri-apps/api/tauri";
import {type} from "@tauri-apps/api/os";

export async function openReader(fileEntry: FileEntry, options?: Record<string, any>) {
    console.log(fileEntry, options)
    const separate = (await type()).startsWith("Windows") ? "\\" : "/"
    let filePath = fileEntry.root + separate + fileEntry.path
    if (fileEntry.scheme !== "fs") {
        // need download local first
        filePath = await invoke("download_file", {
            scheme: fileEntry.scheme,
            path: fileEntry.path,
            options
        })
        console.log(filePath)
    }
    const data = {
        url: convertFileSrc(filePath),
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
