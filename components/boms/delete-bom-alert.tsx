"use client";

import { useState } from "react";
import { useAuthStore, BomMaterialItem } from "@/lib/types";
import {
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { AlertDialogCancel } from "@radix-ui/react-alert-dialog";

interface DeleteBomVersionAlertProps {
  versionData: {
    bomCode: string;
    versionTag: string;
    materials: BomMaterialItem[];
  };
  setIsOpen: (open: boolean) => void;
  onBomGroupUpdated: () => void; 
}

export function DeleteBomAlert({
  versionData,
  setIsOpen,
  onBomGroupUpdated,
}: DeleteBomVersionAlertProps) {
  const [isLoading, setIsLoading] = useState(false);
  const authRole = useAuthStore((state) => state.role);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const promises = versionData.materials.map((material) =>
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/boms/${material.id}`,
          {
            method: "DELETE",
            headers: {
              "X-User-Role": authRole || "",
            },
          }
        )
      );

      const responses = await Promise.all(promises);
      const failed = responses.filter((res) => !res.ok);

      if (failed.length > 0) {
        throw new Error(`Gagal menghapus ${failed.length} material.`);
      }

      toast.success(
        `Versi '${versionData.versionTag}' dari BOM ${versionData.bomCode} (${versionData.materials.length} material) telah dihapus.`
      );
      onBomGroupUpdated(); 
      setIsOpen(false);
    } catch (error) {
      console.error("Error deleting BOM version:", error);
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
        <AlertDialogDescription>
          Aksi ini akan menghapus semua{" "}
          <strong>{versionData.materials.length} material </strong>
          yang terkait dengan Versi:{" "}
          <strong>{versionData.versionTag}</strong> (BOM Code:{" "}
          {versionData.bomCode}).
          <br />
          Data yang sudah dihapus tidak dapat dikembalikan.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={() => setIsOpen(false)} disabled={isLoading}>
          Batal
        </AlertDialogCancel>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={isLoading}
        >
          {isLoading ? "Menghapus..." : "Ya, Hapus Versi Ini"}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}