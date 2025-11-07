"use client";

import { useState } from "react"; // 1. Import useState
import { ColumnDef } from "@tanstack/react-table";
import {
  ProjectTracking,
  Project,
  BomMaterial,
  ActualPart,
  NullTime,
} from "@/lib/types";
import { DataTableColumnHeader } from "../reusable-datatable/column-header";
import { TrackingDataTableRowActions } from "./row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// 2. Import Dialog dan DialogTrigger
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
// 3. Import Modal yang akan dibuka
import { ViewActualPartsModal } from "./view-actual-parts-modal";

type TrackingUpdateHandler = () => void;
type TrackingDeleteHandler = (trackingId: number) => void;

const formatNullString = (ns: { String: string; Valid: boolean } | null) => {
  return ns && ns.Valid ? (
    ns.String
  ) : (
    <span className="text-muted-foreground">-</span>
  );
};

const formatDate = (dateObj: NullTime | null) => {
  if (!dateObj || !dateObj.Valid)
    return <span className="text-muted-foreground">-</span>;
  try {
    return new Date(dateObj.Time).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch (e) {
    return <span className="text-muted-foreground">-</span>;
  }
};

// 4. Hapus komponen wrapper 'ActualPartsModalTrigger' dan 'ActualPartsCell'
// ... (KODE LAMA DIHAPUS) ...

export const getTrackingColumns = (
  projects: Project[],
  bomMaterials: BomMaterial[],
  onTrackingUpdated: TrackingUpdateHandler,
  onTrackingDeleted: TrackingDeleteHandler
): ColumnDef<ProjectTracking>[] => [
  {
    id: "no",
    header: "No.",
    cell: ({ row }) => <span>{row.index + 1}</span>,
    enableSorting: false,
    enableHiding: false,
    size: 10,
  },
  {
    accessorKey: "projectName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Project Name" />
    ),
    cell: ({ row }) => formatNullString(row.original.projectName),
  },
  {
    accessorKey: "wbsNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="WBS Number" />
    ),
    cell: ({ row }) => formatNullString(row.original.wbsNumber),
  },
  {
    accessorKey: "switchboardName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Switchboard Name" />
    ),
    cell: ({ row }) => row.getValue("switchboardName"),
  },
  {
    accessorKey: "compartmentNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Compartment No." />
    ),
    cell: ({ row }) => row.getValue("compartmentNumber"),
  },
  {
    accessorKey: "mechAssemblyBy",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Mech. Assembly By" />
    ),
    cell: ({ row }) => formatNullString(row.original.mechAssemblyBy),
  },
  {
    accessorKey: "wiringType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Wiring Type" />
    ),
    cell: ({ row }) => formatNullString(row.original.wiringType),
  },
  {
    accessorKey: "wiringBy",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Wiring By" />
    ),
    cell: ({ row }) => formatNullString(row.original.wiringBy),
  },
  {
    accessorKey: "statusTest",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status Test" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("statusTest") as string;
      let variant: "default" | "secondary" | "destructive" | "outline" =
        "secondary";
      if (status === "Tested") variant = "default";
      if (status === "Already Compared with BOM") variant = "outline";

      return <Badge variant={variant}>{status}</Badge>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  
  // --- 5. PERBAIKAN LENGKAP UNTUK KEDUA MASALAH ---
  {
    accessorKey: "actualParts",
    header: "Actual Parts (Qty & Views)",
    cell: ({ row }) => {
      // State modal sekarang lokal di dalam sel
      const [isViewOpen, setIsViewOpen] = useState(false);
      const parts = row.original.actualParts;

      if (!parts || parts.length === 0) {
        return <span className="text-muted-foreground">-</span>;
      }

      const MAX_BADGES_TO_SHOW = 3;
      const partsToShow = parts.slice(0, MAX_BADGES_TO_SHOW);
      const remainingCount = parts.length - partsToShow.length;

      return (
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogTrigger asChild>
            {/* Trigger sekarang membungkus <div> secara langsung (memperbaiki klik) */}
            <div className="flex flex-wrap gap-1 max-w-xs cursor-pointer">
              {partsToShow.map((part) => (
                <Badge
                  key={part.material}
                  variant="secondary"
                  className="font-light"
                >
                  {part.material} (Qty: {part.qty})
                </Badge>
              ))}
              {remainingCount > 0 && (
                <Badge variant="outline" className="font-light">
                  ...{remainingCount} lainnya
                </Badge>
              )}
            </div>
          </DialogTrigger>
          
          {isViewOpen && (
            <ViewActualPartsModal
              trackingData={row.original}
              setIsOpen={setIsViewOpen}
              // Semua props yang diperlukan sekarang diteruskan (memperbaiki "Edit Details")
              projects={projects}
              bomMaterials={bomMaterials}
              onTrackingUpdated={onTrackingUpdated}
              onTrackingDeleted={onTrackingDeleted}
            />
          )}
        </Dialog>
      );
    },
    enableSorting: false,
  },
  // --- AKHIR PERBAIKAN ---

  {
    accessorKey: "testedBy",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tested By" />
    ),
    cell: ({ row }) => formatNullString(row.original.testedBy),
  },
  {
    accessorKey: "dateTested",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date Tested" />
    ),
    cell: ({ row }) => formatDate(row.original.dateTested),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <TrackingDataTableRowActions
        tracking={row.original}
        projects={projects}
        bomMaterials={bomMaterials}
        onTrackingUpdated={onTrackingUpdated}
        onTrackingDeleted={onTrackingDeleted}
      />
    ),
  },
];