import {useCallback, useEffect, useState} from "react"
import {CaretSortIcon, DotsHorizontalIcon, UploadIcon,} from "@radix-ui/react-icons"
import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
    VisibilityState,
} from "@tanstack/react-table"

import {Button} from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {Input} from "@/components/ui/input"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table"
import {FileEntry} from "@/type.ts";
import _ from "lodash";
import {useToast} from "@/components/ui/use-toast.ts";
import {checkFile, deleteFile, listFiles, openReader} from "@/components/api/reader.ts";
import {useUpload} from "@/components/hooks/useUpload.tsx";
import {ScrollArea, ScrollBar} from "@/components/ui/scroll-area.tsx";
import {SheetDemo} from "@/pages/SheetPage.tsx";
import {ModeToggle} from "@/components/mode-toggle.tsx";
import {appLocalDataDir} from "@tauri-apps/api/path";
import {StoreContext, useStore} from "@/components/hooks/useStore.tsx";
import {convert} from "@/lib/utils.ts";
import {path} from "@tauri-apps/api";
import {listen} from "@tauri-apps/api/event";

export const columns:
    (view: (fileEntry: FileEntry) => void, deleteFile: (fileEntry: FileEntry) => void) => ColumnDef<FileEntry>[] = (view, deleteFile) => [
    {
        accessorKey: "scheme",
        header: "Scheme",
        cell: ({row}) => <div className="capitalize">{row.getValue("scheme")}</div>,
    },
    {
        accessorKey: "name",
        header: ({column}) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Name
                    <CaretSortIcon className="ml-2 h-4 w-4"/>
                </Button>
            )
        },
    },
    {
        accessorKey: "root",
        header: "Root Path",
    },
    {
        accessorKey: "path",
        header: "Path",
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({row}) => {
            const fileEntry = row.original

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <DotsHorizontalIcon className="h-4 w-4"/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={async () => {
                                await navigator.clipboard.writeText(await path.join(fileEntry.root, fileEntry.path))
                            }}
                        >
                            Copy Path
                        </DropdownMenuItem>
                        <DropdownMenuSeparator/>
                        <DropdownMenuItem onClick={async () => view(fileEntry)}>View</DropdownMenuItem>
                        <DropdownMenuItem onClick={async () => deleteFile(fileEntry)}>
                            <label className="text-red-600">
                                Delete
                            </label>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]

export function DataTableDemo() {
    const storeHook = useStore()
    const {scheme, provider} = storeHook

    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
        []
    )
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = useState({})

    const [path, setPath] = useState<string>("/");
    const [data, setData] = useState<FileEntry[]>([])
    const {uploadDialog, status, uploadFile} = useUpload();

    useEffect(() => {
        console.log(status)
        if (status !== 0) {
            search(path)
        }
    }, [status])

    const {toast} = useToast()

    const view = useCallback((fileEntry: FileEntry) => {
        checkFile(fileEntry, convert(provider!))
            .then(bool => {
                if (bool) {
                    openReader(fileEntry, convert(provider!))
                } else {
                    toast({
                        title: "Error",
                        description: "File not found",
                    })
                }
            })
    }, [provider])

    const deleteE = useCallback((fileEntry: FileEntry) => {
        deleteFile(fileEntry, convert(provider!)).then(() => {
            toast({
                title: "Success",
                description: "File deleted",
            })
        }).finally(() => {
            search(path)
        })
    }, [provider])

    const search = useCallback(
        (path: string) => {
            if (!scheme || !provider) {
                return
            }
            if (scheme != provider.scheme) {
                return
            }
            console.log(path, scheme, provider)
            listFiles(scheme, path, convert(provider))
                .then((files: any) => {

                    console.log(files as FileEntry[])
                    setData(files as FileEntry[])
                })
                .catch((e) => {
                    console.error(e)
                    toast({
                        variant: "destructive",
                        title: "Error",
                        description: e,
                    })
                })
        },
        [setData, scheme, provider]
    )

    const [sheetRootDir, setSheetRootDir] = useState("")
    const [sheetDisable, setSheetDisable] = useState(true)

    useEffect(() => {
        if (path && (path.endsWith("/") || path.endsWith("\\"))) {
            search(path)
        }
        (async () => {
            setSheetRootDir(await appLocalDataDir())
            setSheetDisable(false)

            const unListen = await listen('tauri://file-drop', (event: {payload: string[]}) => {
                if (event.payload.length > 1) {
                    toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Only one file can upload"
                    })
                    return
                }
                uploadFile(event.payload[0].toString(), path, scheme, convert(provider!))
            })
            return () => unListen()
        })()
    }, [path, scheme, provider])

    const columns_ = columns(view, deleteE)
    const table = useReactTable({
        data,
        columns: columns_,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    })

    const [seed, setSeed] = useState(1);
    const reset = () => {
        setSeed(Math.random());
    }

    return (
        <div className="w-full select-none">
            <div className="flex items-center py-4">
                <Input
                    placeholder="Load file path"
                    value={path}
                    onChange={(event) => {
                        const val = event.target.value
                        setPath(val)
                        if (val.endsWith("/")) {
                            _.debounce(() => search(val), 600)
                        }
                    }
                    }
                    className="max-w-sm mr-2"
                />
                {
                    sheetDisable ?
                        <Button variant="outline" disabled>Edit Provider {_.capitalize(scheme)}</Button> :
                        <StoreContext.Provider value={storeHook}>
                            <SheetDemo appLocalDataDir={sheetRootDir} key={seed} reset={reset}/>
                        </StoreContext.Provider>
                }

                <Button variant="outline" size="icon" className="ml-auto mr-2" onClick={() => {
                    uploadDialog(path, scheme, convert(provider!))
                }}>
                    <UploadIcon className="h-4 w-4"/>
                </Button>
                <ModeToggle/>
            </div>
            <ScrollArea className="rounded-md border h-[424px] w-full">
                <Table className="border-b">
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    onDoubleClick={() => view(row.original)}
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns_.length}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>

        </div>
    );
}
