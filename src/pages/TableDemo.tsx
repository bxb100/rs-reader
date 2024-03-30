import * as React from "react"
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
import {ScrollArea} from "@/components/ui/scroll-area.tsx";
import {SheetDemo} from "@/pages/SheetPage.tsx";
import {ModeToggle} from "@/components/mode-toggle.tsx";
import {appLocalDataDir} from "@tauri-apps/api/path";
import {useStore} from "@/components/hooks/useStore.tsx";
import {convert} from "@/lib/utils.ts";

export const columns: (setRefresh: React.Dispatch<boolean>, useOptions: Record<string, string>) => ColumnDef<FileEntry>[] = (setRefresh, useOptions) => [
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
        }
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
            const {toast} = useToast();

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
                            onClick={() => navigator.clipboard.writeText(fileEntry.path)}
                        >
                            Copy Path
                        </DropdownMenuItem>
                        <DropdownMenuSeparator/>
                        <DropdownMenuItem onClick={async () => {
                            checkFile(fileEntry, useOptions)
                                .then(bool => {
                                    if (bool) {
                                        openReader(fileEntry)
                                    } else {
                                        toast({
                                            title: "Error",
                                            description: "File not found",
                                        })
                                    }
                                })

                        }}>View</DropdownMenuItem>
                        <DropdownMenuItem onClick={async () => {
                            await deleteFile(fileEntry, useOptions).then(() => {
                                toast({
                                    title: "Success",
                                    description: "File deleted",
                                })
                            }).finally(() => {
                                setRefresh(true)
                            })
                        }}>
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
    const {scheme, provider} = useStore()

    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
        []
    )
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = useState({})

    const [path, setPath] = useState<string>("");
    const [data, setData] = useState<FileEntry[]>([])
    const [refresh, setRefresh] = useState<boolean>(false)
    const {uploadDialog, status, setStatus} = useUpload();

    useEffect(() => {
        if (status != null) {
            if (status == 0) {
                toast({
                    title: "Uploading",
                    description: "Please wait",
                })
                return
            } else if (status == 1) {
                toast({
                    title: "Success",
                    description: "File uploaded",
                })
                setRefresh(true);
                setStatus(null)
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "File upload failed",
                })
                setRefresh(true);
                setStatus(null)
            }

            return () => setStatus(null)
        }
    }, [status])

    useEffect(() => {
        if (refresh) {
            setRefresh(false)
            search(path)
        }
    }, [refresh])

    const {toast} = useToast()

    const search = useCallback(
        _.debounce((path) => {
            console.log(path)
            listFiles(scheme, path, convert(provider))
                .then((files: any) => {
                    console.log(files as FileEntry[])
                    setData(files as FileEntry[])
                })
                .catch((e) => {
                    toast({
                        variant: "destructive",
                        title: "Error",
                        description: e,
                    })
                })
        }, 600),
        [setData, scheme, provider]
    )

    const [sheetRootDir, setSheetRootDir] = useState("")
    const [sheetDisable, setSheetDisable] = useState(true)

    useEffect(() => {
        if (scheme === 'fs') {
            setPath("file/")
            search("file/")
        } else {
            search(path)
        }

        (async () => {
            setSheetRootDir(await appLocalDataDir())
            setSheetDisable(false)
        })()

    }, [scheme, provider])

    const columns_ = columns(setRefresh, convert(provider))
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


    return (
        <div className="w-full">
            <div className="flex items-center py-4">
                <Input
                    placeholder="Load file path"
                    value={path}
                    onChange={(event) => {
                        const val = event.target.value
                        setPath(val)
                        if (val.endsWith("/")) {
                            search(val)
                        }
                    }
                    }
                    className="max-w-sm mr-2"
                />
                {
                    sheetDisable ?
                        <Button variant="outline" disabled>Edit Provider {_.capitalize(scheme)}</Button> :
                        <SheetDemo appLocalDataDir={sheetRootDir}/>
                }


                <Button variant="outline" size="icon" className="ml-auto mr-2" onClick={() => {
                    uploadDialog(path, scheme, convert(provider))
                }}>
                    <UploadIcon className="h-4 w-4"/>
                </Button>
                <ModeToggle/>
            </div>
            <ScrollArea className="rounded-md border max-h-[420px]">
                <Table>
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
            </ScrollArea>

        </div>
    );
}
