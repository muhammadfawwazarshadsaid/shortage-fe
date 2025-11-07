"use client";

import { useState } from "react";
import { BomVersionGroup, BomMaterialItem, useAuthStore } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MaterialDataTable } from "./material-data-table";
import { getMaterialColumns } from "./material-columns";
import { AddVersionModal } from "./add-version-modal";
import { AddBomModal } from "./add-bom-modal";
import { EditBomModal } from "./edit-bom-modal";
import { DeleteBomAlert } from "./delete-bom-alert";
import { PlusCircle, Pencil, Trash2, CheckCircle } from "lucide-react";
import { AlertDialog } from "../ui/alert-dialog";
import { toast } from "sonner"; 

interface ViewBomGroupModalProps {
  bomGroup: BomVersionGroup;
  setIsOpen: (open: boolean) => void;
  onGroupUpdated: () => void;
}

export function ViewBomModal({
  bomGroup,
  setIsOpen,
  onGroupUpdated,
}: ViewBomGroupModalProps) {
  const versionKeys = Array.from(bomGroup.versions.keys());
  const role = useAuthStore((state) => state.role);

  const [selectedVersion, setSelectedVersion] = useState(bomGroup.activeVersion);
  const [isSettingActive, setIsSettingActive] = useState(false); 

  const [isAddVersionOpen, setIsAddVersionOpen] = useState(false);
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [isEditVersionOpen, setIsEditVersionOpen] = useState(false);
  const [isDeleteVersionOpen, setIsDeleteVersionOpen] = useState(false);

  const [newVersionTag, setNewVersionTag] = useState("");

  const materials = bomGroup.versions.get(selectedVersion) || [];
  const columns = getMaterialColumns();

  const handleVersionTagAdded = (tag: string) => {
    setNewVersionTag(tag);
    setIsAddMaterialOpen(true);
  };

  const handleChildModalClose = () => {
    setIsAddMaterialOpen(false);
    setIsEditVersionOpen(false);
    setIsDeleteVersionOpen(false);
    onGroupUpdated(); 
  };

  const handleSetActiveVersion = async () => {
    if (selectedVersion === bomGroup.activeVersion) {
      toast.info("Versi ini sudah aktif.");
      return;
    }

    setIsSettingActive(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/boms/active-version`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-User-Role": role || "",
          },
          body: JSON.stringify({
            bomCode: bomGroup.bomCode,
            versionTag: selectedVersion,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Gagal menyimpan versi aktif.");
      }

      toast.success(`Versi '${selectedVersion}' telah diatur sebagai aktif.`);
      onGroupUpdated(); 
      setIsOpen(false); 
      
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message);
    } finally {
      setIsSettingActive(false);
    }
  };

  return (
    <>
      <DialogContent className="sm:max-w-6xl max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Detail BOM: {bomGroup.bomCode}</DialogTitle>
          <DialogDescription>
            Pilih versi untuk melihat, menambah, mengedit, atau menghapus material.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-4 pb-2 border-b">
          <div className="flex items-center gap-2">
            <Label htmlFor="versionSelect" className="text-nowrap">
              Pilih Versi:
            </Label>
            <Select value={selectedVersion} onValueChange={setSelectedVersion}>
              <SelectTrigger id="versionSelect" className="w-[180px]">
                <SelectValue placeholder="Pilih versi..." />
              </SelectTrigger>
              <SelectContent>
                {versionKeys.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}{" "}
                    {v === bomGroup.activeVersion && "(Aktif)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="default"
              size="sm"
              onClick={handleSetActiveVersion}
              disabled={isSettingActive || selectedVersion === bomGroup.activeVersion}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {isSettingActive ? "Menyimpan..." : "Setel sebagai Aktif"}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddVersionOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Tambah Versi Baru
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditVersionOpen(true)}
              disabled={materials.length === 0}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit Versi Ini
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteVersionOpen(true)}
              disabled={materials.length === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus Versi Ini
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pt-4">
          <MaterialDataTable columns={columns} data={materials} />
        </div>

        <DialogFooter className="mt-4 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>

      <Dialog open={isAddVersionOpen} onOpenChange={setIsAddVersionOpen}>
        {isAddVersionOpen && (
          <AddVersionModal
            bomCode={bomGroup.bomCode}
            existingVersions={versionKeys}
            setIsOpen={setIsAddVersionOpen}
            onVersionAdded={handleVersionTagAdded}
          />
        )}
      </Dialog>

      <Dialog open={isAddMaterialOpen} onOpenChange={setIsAddMaterialOpen}>
        {isAddMaterialOpen && (
          <AddBomModal
            setIsOpen={setIsAddMaterialOpen}
            onBomAdded={handleChildModalClose}
            prefilledData={{
              bomCode: bomGroup.bomCode,
              versionTag: newVersionTag,
              initialMaterials: materials,
            }}
          />
        )}
      </Dialog>

      <Dialog open={isEditVersionOpen} onOpenChange={setIsEditVersionOpen}>
        {isEditVersionOpen && (
          <EditBomModal
            setIsOpen={setIsEditVersionOpen}
            onBomGroupUpdated={handleChildModalClose}
            versionData={{
              bomCode: bomGroup.bomCode,
              versionTag: selectedVersion,
              materials: materials,
            }}
          />
        )}
      </Dialog>

      <AlertDialog
        open={isDeleteVersionOpen}
        onOpenChange={setIsDeleteVersionOpen}
      >
        {isDeleteVersionOpen && (
          <DeleteBomAlert
            setIsOpen={setIsDeleteVersionOpen}
            onBomGroupUpdated={handleChildModalClose}
            versionData={{
              bomCode: bomGroup.bomCode,
              versionTag: selectedVersion,
              materials: materials,
            }}
          />
        )}
      </AlertDialog>
    </>
  );
}