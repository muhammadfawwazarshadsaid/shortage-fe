"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ActualPart } from "@/lib/types";
import { DataTableColumnHeader } from "../reusable-datatable/column-header";
import { Badge } from "@/components/ui/badge";

export const getActualPartsColumns = (): ColumnDef<ActualPart>[] => [
  {
    id: "no",
    header: "No.",
    cell: ({ row }) => <span>{row.index + 1}</span>,
    enableSorting: false,
  },
  {
    accessorKey: "material",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Material" />
    ),
    cell: ({ row }) => <span>{row.getValue("material")}</span>,
    filterFn: "arrIncludes",
  },
  {
    accessorKey: "qty",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Qty" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("qty")}</span>
    ),
    filterFn: "arrIncludes",
  },
  {
    accessorKey: "views",
    header: "Views",
    cell: ({ row }) => {
      const views = row.getValue("views") as string[];
      if (!views || views.length === 0)
        return <span className="text-muted-foreground">-</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {views.map((view) => (
            <Badge key={view} variant="secondary" className="capitalize">
              {view}
            </Badge>
          ))}
        </div>
      );
    },
    enableSorting: false,
  },
];