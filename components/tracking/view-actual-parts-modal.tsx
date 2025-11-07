"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ProjectTracking,
  Project,
  useAuthStore,
  BomMaterial,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { ActualPartsDataTable } from "./actual-parts-data-table";
import { getActualPartsColumns } from "./actual-parts-columns";
import { Pencil, Trash2, ScanEye } from "lucide-react";
import { EditTrackingModal } from "./edit-tracking-modal";
import { DeleteTrackingAlert } from "./delete-tracking-alert";
import { AlertDialog } from "../ui/alert-dialog";

interface ViewActualPartsModalProps {
  trackingData: ProjectTracking;
  setIsOpen: (open: boolean) => void;
  projects: Project[];
  bomMaterials: BomMaterial[];
  onTrackingUpdated: () => void;
  onTrackingDeleted: (trackingId: number) => void;
}

export function ViewActualPartsModal({
  trackingData,
  setIsOpen,
  projects,
  bomMaterials,
  onTrackingUpdated,
  onTrackingDeleted,
}: ViewActualPartsModalProps) {
  const data = useMemo(
    () => trackingData.actualParts || [],
    [trackingData.actualParts]
  );
  const columns = useMemo(() => getActualPartsColumns(), []);
  const router = useRouter();
  const role = useAuthStore((state) => state.role);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const canEdit = role === "Admin" || role === "PIC";
  const canDelete = role === "Admin";

  const handleGoToScan = () => {
    router.push(`/tracking/${trackingData.id}`);
    setIsOpen(false);
  };

  const handleEdit = () => {
    setIsEditOpen(true);
  };

  const handleDelete = () => {
    setIsDeleteOpen(true);
  };

  const handleChildModalClose = () => {
    setIsEditOpen(false);
    setIsDeleteOpen(false);
    onTrackingUpdated();
    setIsOpen(false); 
  };

  const handleChildDelete = (id: number) => {
    setIsDeleteOpen(false);
    onTrackingDeleted(id);
    setIsOpen(false); 
  };

  return (
    <>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Actual Parts: {trackingData.compartmentNumber}
          </DialogTitle>
          <DialogDescription>
            Daftar material yang di-scan untuk {trackingData.switchboardName} /{" "}
            {trackingData.compartmentNumber}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-4 pb-2 border-b">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Aksi Cepat:</span>
          </div>
          <div className="flex gap-2">
            {canEdit && (
              <Button variant="outline" size="sm" onClick={handleGoToScan}>
                <ScanEye className="mr-2 h-4 w-4" />
                Scan Parts
              </Button>
            )}
            {canEdit && (
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Details
              </Button>
            )}
            {canDelete && (
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus Tracking Ini
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pt-4">
          <ActualPartsDataTable columns={columns} data={data} />
        </div>

        <DialogFooter className="mt-4 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>

      {canEdit && (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          {isEditOpen && (
            <EditTrackingModal
              tracking={trackingData}
              setIsOpen={setIsEditOpen}
              onTrackingUpdated={handleChildModalClose}
              projects={projects}
            />
          )}
        </Dialog>
      )}

      {canDelete && (
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          {isDeleteOpen && (
            <DeleteTrackingAlert
              tracking={trackingData}
              setIsOpen={setIsDeleteOpen}
              onTrackingDeleted={handleChildDelete} 
            />
          )}
        </AlertDialog>
      )}
    </>
  );
}