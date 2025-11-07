"use client";

import { useState } from "react";
import { useAuthStore, BomVersionGroup } from "@/lib/types";
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
import { Button } from "../ui/button";

interface DeleteBomGroupAlertProps {
  bomGroup: BomVersionGroup;
  setIsOpen: (open: boolean) => void;
  onBomGroupUpdated: () => void; 
}

export function DeleteBomGroupAlert({
  bomGroup,
  setIsOpen,
  onBomGroupUpdated,
}: DeleteBomGroupAlertProps) {
  const [isLoading, setIsLoading] = useState(false);
  const authRole = useAuthStore((state) => state.role);

  const allMaterialIds: number[] = [];
  bomGroup.versions.forEach((materials) => {
    materials.forEach((material) => {
      allMaterialIds.push(material.id);
    });
  });

  const handleDelete = async () => {
    setIsLoading(true);

    if (allMaterialIds.length === 0) {
      toast.error("Grup BOM ini sudah kosong.");
      setIsLoading(false);
      setIsOpen(false);
      return;
    }

    try {
      const promises = allMaterialIds.map((id) =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/boms/${id}`, {
          method: "DELETE",
          headers: {
            "X-User-Role": authRole || "",
          },
        })
      );

      const responses = await Promise.all(promises);
      const failed = responses.filter((res) => !res.ok);

      if (failed.length > 0) {
        throw new Error(`Gagal menghapus ${failed.length} material.`);
      }

      toast.success(
        `Grup BOM ${bomGroup.bomCode} (${bomGroup.versions.size} versi, ${allMaterialIds.length} material) telah dihapus.`
      );
      onBomGroupUpdated(); 
      setIsOpen(false);
    } catch (error) {
      console.error("Error deleting BOM group:", error);
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Anda yakin ingin menghapus grup ini?</AlertDialogTitle>
        <AlertDialogDescription>
          Aksi ini akan menghapus <strong>SEMUA {bomGroup.versions.size} VERSI</strong>{" "}
          (total <strong>{allMaterialIds.length} material</strong>)
          yang terkait dengan BOM Code: <strong>{bomGroup.bomCode}</strong>.
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
          {isLoading ? "Menghapus..." : "Ya, Hapus Semua"}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}