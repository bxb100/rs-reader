import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"

import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select"
import _ from "lodash";
import {useContext, useEffect, useMemo, useState} from "react";
import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form.tsx";
import {ScrollArea} from "@/components/ui/scroll-area.tsx";
import {Link2Icon, MinusIcon, PlusIcon} from "@radix-ui/react-icons";
import {open} from '@tauri-apps/api/shell';
import {Option, Provider, Scheme} from "@/type.ts";
import {toast} from "@/components/ui/use-toast.ts";
import {StoreContext} from "@/components/hooks/useStore.tsx";


const formSchema = z.object({
    scheme: z.string({
        required_error: "Please select a scheme."
    }),
    rootPath: z.string({
        required_error: "Please set a root path."
    }),
})

export function SheetDemo({appLocalDataDir, reset}: { appLocalDataDir: string, reset: () => void }) {
    const [options, setOptions] = useState<Option[]>([{key: "", value: ""}])
    const [sheetOpen, setSheetOpen] = useState(false)
    const {scheme, provider, updateProvider, getProvider} = useContext(StoreContext)
    const [formScheme, setFormScheme] = useState(scheme)


    // 1. Define your form.
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            scheme: scheme,
            rootPath: appLocalDataDir,
        },
    })

    useEffect(() => {
        if (provider) {
            form.setValue("rootPath", provider.rootPath)
            if (provider.options) {
                setOptions([...provider.options])
            }
        }
    }, [provider])

    useEffect(() => {
        getProvider(scheme).then((p) => {
            if (p) {
                const pro = p as Provider;
                form.setValue("rootPath", pro.rootPath)
                if (pro.options) {
                    setOptions([...pro.options])
                }
            } else {
                // if config not exist, set default value
                form.setValue("rootPath", formScheme === 'fs' ? appLocalDataDir : "/")
            }

        })
    }, [formScheme])

    // 2. Define a submit handler.
    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values)
        let needSaveOptions = options.filter(option => option.key && option.value)
        setOptions(needSaveOptions)
        updateProvider(values.scheme as Scheme, {rootPath: values.rootPath, options: needSaveOptions, scheme})
            .then(() => {
                toast({
                    title: "success",
                    description: "Provider updated."
                })
                setSheetOpen(false)
            })
    }

    const visibleOptions = useMemo(() => {
        if (options && options.length > 0) {
            return options
        }
        return [{key: "", value: ""}]
    }, [options])

    const changeOptions = (index: number, type: "key" | "value", value: string) => {
        const newOptions = [...visibleOptions]
        newOptions[index][type] = value
        setOptions(newOptions)
    }

    return (
        <Sheet open={sheetOpen} onOpenChange={e => {
            setSheetOpen(e)
            if (!e) reset()
        }} >
            <SheetTrigger asChild>
                <Button variant="outline">Edit Provider {_.capitalize(scheme as string)}</Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Edit Provider</SheetTitle>
                    <SheetDescription>
                        Edit the provider details.
                    </SheetDescription>
                </SheetHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2 mt-4">
                        <FormField
                            control={form.control}
                            name="scheme"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Scheme</FormLabel>
                                    <Select onValueChange={e => {
                                        field.onChange(e)
                                        setFormScheme(e as Scheme)
                                    }} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="col-span-3">
                                                <SelectValue placeholder="Select a OpenDAL scheme"/>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectGroup defaultValue="fs">
                                                {
                                                    ["atomicserver", "azblob", "azdls", "azdfs", "abfs",
                                                        "cacache",
                                                        "cos",
                                                        "dashmap",
                                                        "dropbox",
                                                        "etcd",
                                                        "fs",
                                                        "gcs",
                                                        "gdrive",
                                                        "ghac",
                                                        "hdfs",
                                                        "http", "https",
                                                        "ftp", "ftps",
                                                        "ipfs", "ipns",
                                                        "ipmfs",
                                                        "memcached",
                                                        "memory",
                                                        "mini_moka",
                                                        "moka",
                                                        "obs",
                                                        "onedrive",
                                                        "persy",
                                                        "postgresql",
                                                        "redb",
                                                        "redis",
                                                        "rocksdb",
                                                        "s3",
                                                        "sftp",
                                                        "sled",
                                                        "supabase",
                                                        "oss",
                                                        "vercel_artifacts",
                                                        "wasabi",
                                                        "webdav",
                                                        "webhdfs",
                                                        "tikv"].map((scheme) => (
                                                        <SelectItem key={scheme} value={scheme}>
                                                            {_.capitalize(scheme)}
                                                        </SelectItem>
                                                    ))
                                                }
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription className="select-none">
                                        This is your scheme of your provider.
                                    </FormDescription>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="rootPath"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Root Path</FormLabel>
                                    <FormControl>
                                        <Input {...field}  />
                                    </FormControl>
                                    <FormDescription className="select-none">
                                        All operator based on root path. <b>fs</b> only support
                                        <a href="#"
                                           onClick={() => open("https://tauri.app/v1/api/config/#allowlistconfig.path")}>
                                            <Link2Icon className="w-3.5 h-3.5 inline ml-1 mb-0.5"/></a>
                                    </FormDescription>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormItem>
                            <div className="flex items-center">
                                <FormLabel>
                                    Provider Options
                                </FormLabel>
                                <button
                                    className="ml-auto mr-2"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        setOptions([...options.slice(0, options.length - 1)]
                                        )
                                    }}>
                                    <MinusIcon/>
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault()
                                        setOptions(p => [...p, {key: "", value: ""}])
                                    }}>
                                    <PlusIcon/>
                                </button>
                            </div>

                            <ScrollArea className="h-[120px] w-full">
                                <div className="grid gap-4">
                                    {
                                        visibleOptions.map((option, index) => (
                                            <div key={index} className="grid grid-cols-4 items-center gap-4 p-0.5">
                                                <Input placeholder="key" value={option.key} className="col-span-2"
                                                       onChange={e => {
                                                           changeOptions(index, "key", e.target.value)
                                                       }}/>
                                                <Input placeholder="value" value={option.value} className="col-span-2"
                                                       onChange={e => {
                                                           changeOptions(index, "value", e.target.value)
                                                       }}/>
                                            </div>
                                        ))
                                    }
                                </div>
                            </ScrollArea>

                            <FormDescription className="select-none">
                                Set the provider options, see
                                <a href="#"
                                   onClick={() => open("https://opendal.apache.org/docs/category/services/")}> OpenDAL
                                    Docs
                                </a>.
                            </FormDescription>
                        </FormItem>


                        <SheetFooter className="fixed bottom-6 right-4">
                            <Button type="submit" variant="outline">Save changes</Button>
                        </SheetFooter>
                    </form>
                </Form>

            </SheetContent>
        </Sheet>
    )
}
