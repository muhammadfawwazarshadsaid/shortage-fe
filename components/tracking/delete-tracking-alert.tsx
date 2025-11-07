"use client";

import { useState } from "react";
import { useAuthStore, ProjectTracking } from "@/lib/types";
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteTrackingAlertProps {
  tracking: ProjectTracking;
  setIsOpen: (open: boolean) => void;
  onTrackingDeleted: (trackingId: number) => void;
}

export function DeleteTrackingAlert({
  tracking,
  setIsOpen,
  onTrackingDeleted,
}: DeleteTrackingAlertProps) {
  const [isLoading, setIsLoading] = useState(false);
  const role = useAuthStore((state) => state.role);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/tracking/${tracking.id}`,
        {
          method: "DELETE",
          headers: {
            "X-User-Role": role || "",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal menghapus data tracking.");
      }
      onTrackingDeleted(tracking.id);
      setIsOpen(false);
    } catch (error) {
      console.error("Error deleting tracking:", error);
      alert(error instanceof Error ? error.message : "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>
        <AlertDialogDescription>
          Tindakan ini tidak dapat dibatalkan. Ini akan menghapus data tracking
          untuk{" "}
          <strong className="font-medium text-foreground">
            {tracking.switchboardName} / {tracking.compartmentNumber}
          </strong>{" "}
          secara permanen.
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
          {isLoading ? "Menghapus..." : "Ya, Hapus Tracking"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}