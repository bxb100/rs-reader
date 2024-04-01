import {useCallback, useEffect, useMemo, useState} from "react";
import {invoke} from "@tauri-apps/api/tauri";
import {open} from "@tauri-apps/api/dialog";
import {downloadDir} from "@tauri-apps/api/path";
import {Scheme} from "@/type.ts";
import {toast} from "@/components/ui/use-toast.ts";
import {supportFileType} from "@/lib/utils.ts";

export function useUpload() {
    const [taskId, setTaskId] = useState<string | null>(null)
    const [status, setStatus] = useState(0)

    useEffect(() => {
        let intervalId: NodeJS.Timeout
        if (taskId) {
            setStatus(0)
            toast({
                title: "Uploading",
                description: "Please wait",
            })
            intervalId = setInterval(() => {
                invoke("get_status", {id: taskId}).then((status) => {
                    if (status == 0) {
                        return
                    }
                    if (status == 1) {
                        toast({
                            title: "Success",
                            description: "File uploaded",
                        })
                    } else if (status == -1) {
                        toast({
                            variant: "destructive",
                            title: "Error",
                            description: "File upload failed",
                        })
                    }
                    setTaskId(null)
                    clearInterval(intervalId)
                    setStatus(status as number)
                }).catch((e) => {
                    toast({
                        variant: "destructive",
                        title: "Error",
                        description: e,
                    })
                    setTaskId(null)
                    clearInterval(intervalId)
                });
            }, 1000)
        }
        return () => clearInterval(intervalId)
    }, [taskId])

    const uploadDialog = useCallback(async (savePath: string, scheme: Scheme, options: Record<string, string>) => {
        const selected = await open({
            multiple: false,
            filters: [{
                name: 'Books',
                extensions: supportFileType()
            }],
            defaultPath: await downloadDir(),
        }) as string;

        console.log(selected)

        const taskId = await invoke<string>("write_file", {readPath: selected, savePath, scheme, options})
        setTaskId(taskId)
    }, [])

    const uploadFile = useCallback(async (readPath: string, savePath: string, scheme: Scheme, options: Record<string, string>) => {
        if (taskId) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Please wait for the current task to complete",
            })
            return
        }
        let exist = false
        for (let type of supportFileType()) {
            if (readPath.endsWith(type)) {
                exist = true
                break
            }
        }
        if (!exist) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Unsupported file type",
            })
            return
        }
        const $taskId = await invoke<string>("write_file", {readPath, savePath, scheme, options})
        setTaskId($taskId)
    }, [taskId])

    return useMemo(() => ({
        uploadDialog, status, uploadFile
    }), [uploadDialog, status])
}
