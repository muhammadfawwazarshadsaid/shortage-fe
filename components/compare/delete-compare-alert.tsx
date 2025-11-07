"use client";

import { useState } from "react";
import { useAuthStore, ComparisonView } from "@/lib/types";
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface DeleteCompareAlertProps {
  comparison: ComparisonView;
  setIsOpen: (open: boolean) => void;
  onComparisonDeleted: (comparisonId: number) => void;
}

export function DeleteCompareAlert({
  comparison,
  setIsOpen,
  onComparisonDeleted,
}: DeleteCompareAlertProps) {
  const [isLoading, setIsLoading] = useState(false);
  const role = useAuthStore((state) => state.role);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/comparisons/${comparison.id}`,
        {
          method: "DELETE",
          headers: {
            "X-User-Role": role || "",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal menghapus perbandingan.");
      }
      toast.success("Perbandingan berhasil dihapus.");
      onComparisonDeleted(comparison.id);
      setIsOpen(false);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>
        <AlertDialogDescription>
          Tindakan ini tidak dapat dibatalkan. Ini akan menghapus perbandingan
          untuk{" "}
          <strong className="font-medium text-foreground">
            {comparison.bomCode}
          </strong>{" "}
          vs{" "}
          <strong className="font-medium text-foreground">
            {comparison.compartmentNumber}
          </strong>
          .
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={() => setIsOpen(false)} disabled={isLoading}>
          Batal
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={handleDelete}
          disabled={isLoading}
          className="bg-red-600 hover:bg-red-700"
        >
          {isLoading ? "Menghapus..." : "Ya, Hapus"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}