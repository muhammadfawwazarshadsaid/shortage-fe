"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog } from "@/components/ui/dialog";
import { AlertDialog } from "@/components/ui/alert-dialog";
import {
  ProjectTracking,
  Project,
  BomMaterial,
  useAuthStore,
} from "@/lib/types";
import { DeleteTrackingAlert } from "./delete-tracking-alert";
import { EditTrackingModal } from "./edit-tracking-modal";
import { ViewActualPartsModal } from "./view-actual-parts-modal";

interface DataTableRowActionsProps {
  tracking: ProjectTracking;
  projects: Project[];
  bomMaterials: BomMaterial[];
  onTrackingUpdated: () => void;
  onTrackingDeleted: (trackingId: number) => void;
}

export function TrackingDataTableRowActions({
  tracking,
  projects,
  bomMaterials,
  onTrackingUpdated,
  onTrackingDeleted,
}: DataTableRowActionsProps) {
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const role = useAuthStore((state) => state.role);
  const router = useRouter();

  const canEdit = role === "Admin" || role === "PIC";
  const canDelete = role === "Admin";

  const handleGoToDetail = () => {
    router.push(`/tracking/${tracking.id}`);
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

          <DropdownMenuItem onSelect={() => setIsViewModalOpen(true)}>
            Lihat Detail Parts
          </DropdownMenuItem>

          {canEdit && (
            <DropdownMenuItem onSelect={handleGoToDetail}>
              Scan Parts
            </DropdownMenuItem>
          )}

          {canEdit && (
            <DropdownMenuItem onSelect={() => setIsEditModalOpen(true)}>
              Edit Tracking
            </DropdownMenuItem>
          )}
          {canDelete && (
            <DropdownMenuItem
              className="text-red-600"
              onSelect={() => setIsDeleteAlertOpen(true)}
            >
              Hapus Tracking
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        {isViewModalOpen && (
          <ViewActualPartsModal
            trackingData={tracking}
            setIsOpen={setIsViewModalOpen}
            projects={projects}
            bomMaterials={bomMaterials}
            onTrackingUpdated={onTrackingUpdated}
            onTrackingDeleted={onTrackingDeleted}
          />
        )}
      </Dialog>

      {canEdit && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <EditTrackingModal
            tracking={tracking}
            setIsOpen={setIsEditModalOpen}
            onTrackingUpdated={onTrackingUpdated}
            projects={projects}
          />
        </Dialog>
      )}

      {canDelete && (
        <AlertDialog
          open={isDeleteAlertOpen}
          onOpenChange={setIsDeleteAlertOpen}
        >
          <DeleteTrackingAlert
            tracking={tracking}
            setIsOpen={setIsDeleteAlertOpen}
            onTrackingDeleted={onTrackingDeleted}
          />
        </AlertDialog>
      )}
    </>
  );
}