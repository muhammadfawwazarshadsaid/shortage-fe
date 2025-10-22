"use client";

import * as React from "react";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  getGroupedRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"; 

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {

  const memoizedData = React.useMemo(() => data, [data]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');

  const table = useReactTable({
    data: memoizedData,
    columns,
    initialState: {
      grouping: ["bomCode"],
      pagination: {
        pageSize: 20, 
      },
    },
    groupedColumnMode: false,
    state: {
        sorting,
        globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="w-full">
       <div className="flex items-center py-4">
        <Input
          placeholder="Search..."
          value={globalFilter ?? ''}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
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
                    <TableCell key={cell.id}
                      style={{
                        background: row.getIsGrouped() ? '#f9fafb' : undefined,
                        // fontWeight: row.getIsGrouped() ? 'bold' : undefined,
                      }}
                    >
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
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
         <div className="flex items-center space-x-2">
           <Label htmlFor="rows-per-page" className="text-sm font-light whitespace-nowrap">Rows per page</Label>
           <Select
             value={`${table.getState().pagination.pageSize}`}
             onValueChange={(value) => {
               table.setPageSize(Number(value))
             }}
           >
             <SelectTrigger id="rows-per-page" className="h-8 w-[70px]">
               <SelectValue placeholder={table.getState().pagination.pageSize} />
             </SelectTrigger>
             <SelectContent side="top">
               {[10, 20, 30, 40, 50].map((pageSize) => (
                 <SelectItem key={pageSize} value={`${pageSize}`}>
                   {pageSize}
                 </SelectItem>
               ))}
             </SelectContent>
           </Select>
         </div>

        {/* Page information and buttons */}
        <div className="flex items-center space-x-6 lg:space-x-8">
           <div className="flex w-[100px] items-center justify-center text-sm font-medium">
             Page {table.getState().pagination.pageIndex + 1} of{" "}
             {table.getPageCount()}
           </div>
           <div className="space-x-2">
             <Button
               variant="outline"
               size="sm"
               onClick={() => table.previousPage()}
               disabled={!table.getCanPreviousPage()}
             >
               Previous
             </Button>
             <Button
               variant="outline"
               size="sm"
               onClick={() => table.nextPage()}
               disabled={!table.getCanNextPage()}
             >
               Next
             </Button>
           </div>
        </div>
      </div>
    </div>
  );
}