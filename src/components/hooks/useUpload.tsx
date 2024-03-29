import {useCallback, useEffect, useMemo, useState} from "react";
import {invoke} from "@tauri-apps/api/tauri";
import {open} from "@tauri-apps/api/dialog";
import {downloadDir} from "@tauri-apps/api/path";
import {Scheme} from "@/type.ts";
import {useOptions} from "@/components/api/reader.ts";

export function useUpload() {
    const [taskId, setTaskId] = useState<string | null>(null)
    const [status, setStatus] = useState<number | null>(null)

    useEffect(() => {
        if (taskId) {
            setStatus(0)
            const intervalId = setInterval(() => {
                invoke("get_status", {id: taskId}).then((status) => {
                    console.log(status)
                    setStatus(status as number)
                }).finally(() => {
                    setTaskId(null)
                    clearInterval(intervalId)
                });
                return () => clearInterval(intervalId)
            }, 500)
        }
    }, [taskId])

    const uploadDialog = useCallback(async (savePath: string, scheme: Scheme) => {
        const selected = await open({
            multiple: false,
            filters: [{
                name: 'Books',
                extensions: ['mobi', 'epub', 'pdf']
            }],
            defaultPath: await downloadDir(),
        }) as string;

        console.log(selected)

        const taskId = await invoke<string>("write_file", {readPath: selected, savePath, scheme, options: useOptions})
        setTaskId(taskId)
    }, [])

    return useMemo(() => ({
        uploadDialog,
        status,
        setStatus
    }), [uploadDialog, status, setStatus])
}
