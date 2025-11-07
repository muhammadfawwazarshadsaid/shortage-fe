"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { ComparisonView, useAuthStore } from "@/lib/types";
import { DeleteCompareAlert } from "./delete-compare-alert";
import { toast } from "sonner";

const GO_API_URL = process.env.NEXT_PUBLIC_API_URL;

interface DataTableRowActionsProps {
  comparison: ComparisonView;
  onComparisonDeleted: (comparisonId: number) => void;
}

export function CompareDataTableRowActions({
  comparison,
  onComparisonDeleted,
}: DataTableRowActionsProps) {
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const role = useAuthStore((state) => state.role);
  const router = useRouter();

  const handleViewDetails = () => {
    router.push(`/compare/${comparison.id}`);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(
        `${GO_API_URL}/api/comparisons/${comparison.id}`,
        {
          method: "DELETE",
          headers: { "X-User-Role": role || "" },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal menghapus perbandingan.");
      }
      toast.success("Perbandingan berhasil dihapus.");
      onComparisonDeleted(comparison.id);
      setIsDeleteAlertOpen(false);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Buka menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Aksi</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleViewDetails}>
            <Eye className="mr-2 h-4 w-4" />
            Lihat Detail
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-600"
            onSelect={() => setIsDeleteAlertOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus Perbandingan
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={isDeleteAlertOpen}
        onOpenChange={setIsDeleteAlertOpen}
      >
        <DeleteCompareAlert
          comparison={comparison}
          setIsOpen={setIsDeleteAlertOpen}
          onComparisonDeleted={onComparisonDeleted}
        />
      </AlertDialog>
    </>
  );
}