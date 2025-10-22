"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronRight, ChevronDown, History, RotateCcw, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BOMEntry } from "@/lib/models";
import { DataTableColumnHeader } from "../reusable-datatable/data-table-column-header";
import { useRouter } from "next/navigation";

interface BOMEntryWithStatus extends BOMEntry {
  hasDetectionResult: boolean;
  isFinalized: boolean;
}

const MAX_VISIBLE_CHIPS = 2;
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081" || "http://localhost:8080";

export const columns: ColumnDef<BOMEntryWithStatus>[] = [
   {
    id: "no",
    header: "No.",
    cell: ({ row }) => {
        return <div style={{ paddingLeft: `${row.depth * 2}rem` }}>{row.depth === 0 ? row.index + 1 : ''}</div>;
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "expander",
    header: () => null, 
    cell: ({ row }) => {
      if (row.getCanExpand()) {
        return (
          <div
            onClick={row.getToggleExpandedHandler()}
            className="cursor-pointer"
            style={{ paddingLeft: `${row.depth * 2}rem` }}
          >
            {row.getIsExpanded() ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>
        );
      }
      return null; 
    },
  },
  {
    accessorKey: "bomCode",
    header: "BOM Code",
    cell: ({ row, getValue }) => {
      if (!row.getCanExpand()) {
          return <div className="pl-8">{getValue() as string}</div>
      }
      return (
        <span>
          {getValue() as string} ({row.subRows.length})
        </span>
      );
    },
    enableColumnFilter: false,
  },
  {
    accessorKey: "partReference",
    header: ({ column }) => ( 
      <DataTableColumnHeader column={column} title="Part Reference (ID)" />
    ),
    cell: ({ row }) => {
      if (row.getCanExpand() && !row.getIsExpanded()) {
        const subRows = row.subRows.slice(0, MAX_VISIBLE_CHIPS);
        const remainingCount = row.subRows.length - subRows.length;
        return (
          <div className="flex items-center gap-1 flex-wrap">
            {subRows.map((subRow) => (
              <Badge key={subRow.id} variant="secondary" className="font-normal">
                {(subRow.original as BOMEntry).partReference}
              </Badge>
            ))}
            {remainingCount > 0 && (
              <Badge variant="outline" className="font-normal">
                +{remainingCount}
              </Badge>
            )}
          </div>
        );
      }
      if (!row.getCanExpand()) {
        return <div className="pl-8">{row.getValue("partReference")}</div>;
      }
      return null;
    },
    filterFn: "arrIncludes",
  },
  {
    accessorKey: "partName",
    header: ({ column }) => ( 
      <DataTableColumnHeader column={column} title="Part Name" />
    ),
    cell: ({ row }) => {
      if (row.getCanExpand() && !row.getIsExpanded()) {
        const subRows = row.subRows.slice(0, MAX_VISIBLE_CHIPS);
        const remainingCount = row.subRows.length - subRows.length;
        return (
          <div className="flex items-center gap-1 flex-wrap">
            {subRows.map((subRow) => (
              <Badge key={subRow.id} variant="secondary" className="font-normal">
                {(subRow.original as BOMEntry).partName}
              </Badge>
            ))}
            {remainingCount > 0 && (
              <Badge variant="outline" className="font-normal">
                +{remainingCount}
              </Badge>
            )}
          </div>
        );
      }
      if (!row.getCanExpand()) {
        const entry = row.original as BOMEntry;
        return (
          <div>
            <div>{entry.partName}</div>
            <div className="text-xs text-muted-foreground truncate max-w-xs">{entry.partDescription}</div>
          </div>
        );
      }
      return null;
    },
    filterFn: "arrIncludes",
  },
  {
    accessorKey: "quantity",
    header: ({ column }) => ( 
        <div className="text-center">
            <DataTableColumnHeader column={column} title="Quantity" />
        </div>
    ),
    cell: ({ row }) => {
       if (row.getCanExpand() && !row.getIsExpanded()) {
        const totalQuantity = row.subRows.reduce((sum, subRow) => sum + (subRow.original as BOMEntry).quantity, 0);
        return (
            <div className="text-center">
                <Badge variant="secondary">Total: {totalQuantity}</Badge>
            </div>
        );
      }
      if (!row.getCanExpand()) {
        return <div className="text-center font-medium">{row.getValue("quantity")}</div>;
      }
      return null;
    },
    filterFn: "arrIncludes", 
  },
  {
    id: "actions",
    header: () => <div className="text-right pr-2">Action</div>,
    cell: function Cell({ row }) {
      if (row.getCanExpand()) { 
        const router = useRouter();
        const [isResetting, setIsResetting] = useState(false);

        const entry = row.original as BOMEntryWithStatus;
        const bomCode = entry?.bomCode;
        const hasDetectionResult = entry?.hasDetectionResult ?? false;
        const isFinalized = entry?.isFinalized ?? false;

        if (!bomCode) return null; 

        const handleReset = async () => {
           if (!window.confirm(`Are you sure you want to reset all detection data for ${bomCode}? This action cannot be undone.`)) {
            return;
          }
          setIsResetting(true);
          try {
            const response = await fetch(`${API_URL}/api/detect/${bomCode}`, {
              method: 'DELETE',
            });
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to reset data.');
            }
            alert(`Detection data for ${bomCode} has been reset successfully.`);
            router.refresh();
          } catch (error: any) {
            console.error(error);
            alert(`An error occurred: ${error.message}`);
          } finally {
            setIsResetting(false);
          }
        };

        const renderMainButton = () => {
          if (isFinalized) {
            return (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => router.push(`/detector?bomCode=${bomCode}&view=result`)}
              >
                <History className="mr-2 h-4 w-4" />
                History
              </Button>
            );
          }
          if (hasDetectionResult) {
            return (
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/detector?bomCode=${bomCode}&view=result`)}
              >
                <Play className="mr-2 h-4 w-4" />
                Continue
              </Button>
            );
          }
          return (
            <Button
              size="sm"
              onClick={() => router.push(`/detector?bomCode=${bomCode}`)}
            >
              Detect
            </Button>
          );
        };

        return (
          <div className="text-right flex justify-end items-center gap-2">
            {hasDetectionResult && (
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleReset}
                disabled={isResetting}
                title="Reset Detection Data"
              >
                <RotateCcw className={`h-4 w-4 ${isResetting ? 'animate-spin' : ''}`} />
              </Button>
            )}
            {renderMainButton()}
          </div>
        );
      }
      return null; 
    },
  },
];