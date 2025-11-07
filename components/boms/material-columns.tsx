"use client";

import { ColumnDef } from "@tanstack/react-table";
import { BomMaterialItem } from "@/lib/types";
import { DataTableColumnHeader } from "../reusable-datatable/column-header";

export const getMaterialColumns = (): ColumnDef<BomMaterialItem>[] => [
  {
    id: "no",
    header: "No.",
    cell: ({ row }) => <span>{row.index + 1}</span>,
    enableSorting: false,
    enableHiding: false,
    size: 10,
  },
  {
    accessorKey: "material",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Material" />
    ),
    cell: ({ row }) => <span>{row.getValue("material")}</span>,
  },
  {
    accessorKey: "materialDescription",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Deskripsi" />
    ),
    cell: ({ row }) => (
      <span>{row.getValue("materialDescription") || "-"}</span>
    ),
  },
  {
    accessorKey: "partReference",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Part Ref." />
    ),
    cell: ({ row }) => <span>{row.getValue("partReference") || "-"}</span>,
  },
  {
    accessorKey: "qty",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Qty" />,
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("qty")}</span>
    ),
  },
];