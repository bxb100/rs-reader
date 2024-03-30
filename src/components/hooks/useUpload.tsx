import {useCallback, useEffect, useMemo, useState} from "react";
import {invoke} from "@tauri-apps/api/tauri";
import {open} from "@tauri-apps/api/dialog";
import {downloadDir} from "@tauri-apps/api/path";
import {Scheme} from "@/type.ts";
import {toast} from "@/components/ui/use-toast.ts";

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
                        toast({
                            title: "Uploading",
                            description: "Please wait",
                        })
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
                extensions: ['mobi', 'epub', 'pdf']
            }],
            defaultPath: await downloadDir(),
        }) as string;

        console.log(selected)

        const taskId = await invoke<string>("write_file", {readPath: selected, savePath, scheme, options})
        setTaskId(taskId)
    }, [])

    return useMemo(() => ({
        uploadDialog, status
    }), [uploadDialog, status])
}
