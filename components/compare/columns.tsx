"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ComparisonView, CompareItemDetail } from "@/lib/types";
import { DataTableColumnHeader } from "../reusable-datatable/column-header";
import { CompareDataTableRowActions } from "./row-actions";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "../ui/button";

type ComparisonDeleteHandler = (comparisonId: number) => void;

const formatNullString = (ns: { String: string; Valid: boolean } | null) => {
  return ns && ns.Valid ? (
    ns.String
  ) : (
    <span className="text-muted-foreground">-</span>
  );
};

const renderItemList = (
  items: CompareItemDetail[],
  variant: "destructive" | "default" | "outline"
) => {
  if (!items || items.length === 0) {
    return <Badge variant="secondary">0</Badge>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={variant} size="sm" className="h-7">
          {items.length} Item
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-2">
          <h4 className="font-medium leading-none">Detail Items</h4>
          <div className="space-y-1 text-sm">
            {items.map((item) => (
              <div
                key={item.material}
                className="flex justify-between items-center"
              >
                <span className="truncate max-w-[180px]">
                  {item.material}
                </span>
                <span className="font-light text-muted-foreground">
                  (BOM: {item.bomQty}, Actual: {item.actualQty})
                </span>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export const getCompareColumns = (
  onComparisonDeleted: ComparisonDeleteHandler
): ColumnDef<ComparisonView>[] => {
  const getStatusBadge = (status: string | undefined) => {
    if (!status || status === "Belum Ada Status") {
      return <Badge variant="secondary">Belum Ada</Badge>;
    }
    if (status === "Follow Up") {
      return <Badge className="bg-blue-600">Follow Up</Badge>;
    }
    if (status === "Done") {
      return <Badge className="bg-green-600 text-white hover:bg-green-700">Done</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  return [
    {
      id: "no",
      header: "No.",
      cell: ({ row }) => <span>{row.index + 1}</span>,
      enableSorting: false,
      enableHiding: false,
      size: 10,
    },
    {
      accessorKey: "bomCode",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="BOM Code" />
      ),
      cell: ({ row }) => <span>{row.getValue("bomCode")}</span>,
    },
    {
      accessorKey: "wbsNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="WBS Number" />
      ),
      cell: ({ row }) => formatNullString(row.original.wbsNumber),
    },
    {
      id: "compartment",
      header: "Compartment",
      cell: ({ row }) => (
        <div>
          {row.original.switchboardName} / {row.original.compartmentNumber}
        </div>
      ),
    },
    {
      accessorKey: "shortageItems",
      header: "Shortage",
      cell: ({ row }) =>
        renderItemList(row.original.shortageItems, "destructive"),
    },
    {
      accessorKey: "excessItems",
      header: "Excess",
      cell: ({ row }) =>
        renderItemList(row.original.excessItems, "default"),
    },
    {
      accessorKey: "unlistedItems",
      header: "Unlisted (in BOM)",
      cell: ({ row }) =>
        renderItemList(row.original.unlistedItems, "outline"),
    },
    {
      id: "status_se",
      header: "Status S/E",
      cell: ({ row }) => {
        const item =
          row.original.shortageItems?.[0] || row.original.excessItems?.[0];
        return getStatusBadge(item?.status);
      },
    },
    {
      id: "pic_se",
      header: "PIC S/E",
      cell: ({ row }) => {
        const item =
          row.original.shortageItems?.[0] || row.original.excessItems?.[0];
        return <span>{item?.pic || "-"}</span>;
      },
    },
    {
      id: "status_unlisted",
      header: "Status Unlisted",
      cell: ({ row }) => {
        const item = row.original.unlistedItems?.[0];
        return getStatusBadge(item?.status);
      },
    },
    {
      id: "pic_unlisted",
      header: "PIC Unlisted",
      cell: ({ row }) => {
        const item = row.original.unlistedItems?.[0];
        return <span>{item?.pic || "-"}</span>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <CompareDataTableRowActions
          comparison={row.original}
          onComparisonDeleted={onComparisonDeleted}
        />
      ),
    },
  ];
};