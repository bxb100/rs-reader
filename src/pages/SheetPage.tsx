import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import _ from "lodash";
import {MinusIcon, PlusIcon} from "@radix-ui/react-icons";
import {useState} from "react";
import {useScheme} from "@/components/api/reader.ts";
import {ScrollArea} from "@/components/ui/scroll-area.tsx";

export function SheetDemo() {
    interface Option {
        key: string,
        value: string
    }

    const [options, setOptions] = useState<Option[]>([{key: "", value: ""}])

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline">Edit Provider {_.capitalize(useScheme)}</Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Edit Provider</SheetTitle>
                    <SheetDescription>
                        Edit the provider details.
                    </SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="scheme" className="text-right">
                            Scheme
                        </Label>
                        <Select defaultValue="fs">
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a OpenDAL scheme"/>
                            </SelectTrigger>
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
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="root" className="text-right">
                            Root Path
                        </Label>
                        <Input id="root" placeholder="/" className="col-span-3"/>
                    </div>

                    <label className="m-auto">Provider Options</label>
                    <ScrollArea className="max-h-[220px]">
                        <div className="grid gap-4">
                            {
                                options.map((option, index) => (
                                    <div key={index} className="grid grid-cols-4 items-center gap-4">
                                        <Input placeholder="key" className="col-span-2"/>
                                        <Input placeholder="value" className="col-span-2"/>
                                    </div>
                                ))
                            }
                        </div>
                    </ScrollArea>
                    <div className="inline-block">
                        <button className="float-right "
                                onClick={() => setOptions([...options.slice(0, options.length - 1)])}>
                            <MinusIcon/>
                        </button>
                        <button className="float-right" onClick={() => setOptions(p => [...p, {key: "", value: ""}])}>
                            <PlusIcon/>
                        </button>

                    </div>

                </div>
                <SheetFooter className="fixed bottom-6 right-4">
                    <SheetClose asChild>
                        <Button type="submit" variant="outline">Save changes</Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
