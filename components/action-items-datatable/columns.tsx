"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTableColumnHeader } from "../reusable-datatable/data-table-column-header";
import React from "react";
import { ActionItem } from "@/lib/models";
import { AlertDialogHeader, AlertDialogFooter, AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081" || "http://localhost:8080";

// --- TAMBAHKAN KONSTANTA INI ---
const MAX_VISIBLE_CHIPS = 2;
// ---

const StatusSelector = ({ item, refreshData }: { item: ActionItem, refreshData: () => void }) => {
    // ... (kode tidak berubah)
    const [isUpdating, setIsUpdating] = React.useState(false);

    const handleStatusChange = async (newStatus: string) => {
        setIsUpdating(true);
        try {
            await fetch(`${API_URL}/api/action-items/${item.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            refreshData();
        } catch (error) {
            console.error("Failed to update status", error);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Select defaultValue={item.status} onValueChange={handleStatusChange} disabled={isUpdating}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Set status" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="BARU_MASUK">Baru Masuk</SelectItem>
                <SelectItem value="DITINDAKLANJUTI">Ditindaklanjuti</SelectItem>
                <SelectItem value="SELESAI">Selesai</SelectItem>
            </SelectContent>
        </Select>
    );
};

const ResetAction = ({ bomCode, refreshData }: { bomCode: string, refreshData: () => void }) => {
    // ... (kode tidak berubah)
     const handleReset = async () => {
        try {
            const response = await fetch(`${API_URL}/api/detect/${bomCode}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error("Failed to reset detection.");
            }
            refreshData();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">Reset</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will delete the detection result and all related action items for <strong>{bomCode}</strong>. You will need to perform the detection again. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset}>Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export const getActionItemColumns = (refreshData: () => void): ColumnDef<ActionItem>[] => [
    {
        id: "no",
        header: "No.",
        cell: ({ row }) => row.depth === 0 ? row.index + 1 : '',
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
        header: ({ column }) => <DataTableColumnHeader column={column} title="BOM Code" />,
        cell: ({ row, getValue }) => {
            if (row.getIsGrouped()) {
                 return (
                    <div className="flex items-center gap-2">
                        <span>{getValue() as string} ({row.subRows.length})</span>
                    </div>
                );
            }
            return <div style={{ paddingLeft: `${row.depth * 2}rem` }}>{getValue() as string}</div>;
        }
    },
    {
        id: "shortageItem",
        header: "Shortage Item",
        cell: ({ row }) => {
            // --- TAMBAHKAN LOGIKA CHIPS DI SINI ---
            if (row.getIsGrouped() && !row.getIsExpanded()) {
                // Filter sub-rows yang merupakan shortage
                const shortageSubRows = row.subRows.filter(subRow => subRow.original.itemType === 'SHORTAGE');
                if (shortageSubRows.length === 0) return <span className="text-muted-foreground">-</span>;

                const visibleRows = shortageSubRows.slice(0, MAX_VISIBLE_CHIPS);
                const remainingCount = shortageSubRows.length - visibleRows.length;

                return (
                  <div className="flex items-center gap-1 flex-wrap">
                    {visibleRows.map((subRow) => (
                      <Badge key={subRow.id} variant="destructive" className="font-normal">
                        {subRow.original.partName} ({subRow.original.quantityDiff})
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
            // --- BATAS LOGIKA CHIPS ---

            // Logika untuk baris detail (sub-row)
            if (!row.getIsGrouped()) {
                const item = row.original;
                if (item.itemType === 'SHORTAGE') {
                    return (
                        <Badge variant="destructive">
                            {item.partName} ({item.quantityDiff})
                        </Badge>
                    );
                }
                return <span className="text-muted-foreground">-</span>;
            }

            // Jika baris grup tapi diekspansi, jangan tampilkan apa-apa di kolom ini
            return null;
        }
    },
    {
        id: "unlistedItem",
        header: "Not Found in BOM",
        cell: ({ row }) => {
             // --- TAMBAHKAN LOGIKA CHIPS DI SINI ---
             if (row.getIsGrouped() && !row.getIsExpanded()) {
                // Filter sub-rows yang merupakan unlisted
                const unlistedSubRows = row.subRows.filter(subRow => subRow.original.itemType === 'UNLISTED');
                 if (unlistedSubRows.length === 0) return <span className="text-muted-foreground">-</span>;

                const visibleRows = unlistedSubRows.slice(0, MAX_VISIBLE_CHIPS);
                const remainingCount = unlistedSubRows.length - visibleRows.length;

                return (
                  <div className="flex items-center gap-1 flex-wrap">
                    {visibleRows.map((subRow) => (
                      <Badge key={subRow.id} variant="secondary" className="font-normal">
                        {subRow.original.partName} (+{subRow.original.quantityDiff})
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
            // --- BATAS LOGIKA CHIPS ---

            // Logika untuk baris detail (sub-row)
            if (!row.getIsGrouped()) {
                const item = row.original;
                if (item.itemType === 'UNLISTED') {
                    return (
                        <Badge variant="secondary">
                            {item.partName} (+{item.quantityDiff})
                        </Badge>
                    );
                }
                return <span className="text-muted-foreground">-</span>;
            }

             // Jika baris grup tapi diekspansi, jangan tampilkan apa-apa di kolom ini
            return null;
        }
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            if (row.getIsGrouped()) return null;
            return <StatusSelector item={row.original} refreshData={refreshData} />;
        }
    },
    {
        accessorKey: "createdAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Logged At" />,
        cell: ({ row }) => {
            if (row.getIsGrouped()) return null;
            return new Date(row.original.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
        }
    },
    {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
            if (row.getIsGrouped()) {
                return (
                    <div className="text-right">
                        <ResetAction bomCode={row.original.bomCode} refreshData={refreshData} />
                    </div>
                );
            }
            return null;
        }
    }
];