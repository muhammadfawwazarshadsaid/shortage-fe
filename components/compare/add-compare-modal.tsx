"use client";

import { useEffect, useState, useMemo } from "react";
import {
  useAuthStore,
  ProjectTrackingView,
  BOM,
  BomVersionGroup,
  BomMaterialItem,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Scale } from "lucide-react";
import { toast } from "sonner";
import { SelectionTable } from "./selection-table";
import {
  getBomCodeSummaryColumns,
  getMiniTrackingColumns,
} from "./selection-columns";

const GO_API_URL = process.env.NEXT_PUBLIC_API_URL;

interface AddCompareModalProps {
  setIsOpen: (open: boolean) => void;
  onComparisonAdded: () => void;
}

export type BomSummary = {
  id: string;
  bomCode: string;
  activeVersion: string;
  materialPreview: BomMaterialItem[];
  totalQty: number;
  fullBomGroup: BomVersionGroup;
};

export function AddCompareModal({
  setIsOpen,
  onComparisonAdded,
}: AddCompareModalProps) {
  const [bomList, setBomList] = useState<BOM[]>([]);
  const [trackingList, setTrackingList] = useState<ProjectTrackingView[]>([]);
  const [activeVersions, setActiveVersions] = useState<Map<string, string>>(
    new Map()
  );
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [selectedBomCode, setSelectedBomCode] = useState<string | null>(null);
  const [selectedTracking, setSelectedTracking] =
    useState<ProjectTrackingView | null>(null);

  const role = useAuthStore((state) => state.role);

  const getTableData = async () => {
    if (!role) return;
    setIsLoadingData(true);
    try {
      const headers = { "X-User-Role": role };
      const [bomRes, trackingRes] = await Promise.all([
        fetch(`${GO_API_URL}/api/boms/`, { headers }),
        fetch(`${GO_API_URL}/api/tracking/`, { headers }),
      ]);

      if (!bomRes.ok) throw new Error("Gagal mengambil data BOM");
      if (!trackingRes.ok) throw new Error("Gagal mengambil data tracking");

      const boms: BOM[] = await bomRes.json();
      setBomList(boms);
      setTrackingList(await trackingRes.json());

      const uniqueBomCodes = [...new Set(boms.map((b) => b.bomCode))];
      const activeVersionPromises = uniqueBomCodes.map((code) =>
        fetch(`${GO_API_URL}/api/boms/active-version/${code}`, { headers })
          .then((res) => res.json())
          .catch(() => null)
      );

      const activeVersionResults = await Promise.all(activeVersionPromises);

      const newActiveVersions = new Map<string, string>();
      for (const result of activeVersionResults) {
        if (result && result.bomCode && result.activeVersion) {
          newActiveVersions.set(result.bomCode, result.activeVersion);
        }
      }
      setActiveVersions(newActiveVersions);
    } catch (error) {
      toast.error("Gagal memuat data: " + (error as Error).message);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (role) {
      getTableData();
    }
  }, [role]);

  const bomCodeSummaryList = useMemo(() => {
    const groups = new Map<string, BomVersionGroup>();
    for (const item of bomList) {
      const bomCode = item.bomCode;
      const versionTag = item.versionTag || "default";

      if (!groups.has(bomCode)) {
        const activeVersion = activeVersions.get(bomCode) || "default";
        groups.set(bomCode, {
          bomCode: bomCode,
          activeVersion: activeVersion,
          versions: new Map(),
        });
      }
      const bomGroup = groups.get(bomCode)!;

      if (!bomGroup.versions.has(versionTag)) {
        bomGroup.versions.set(versionTag, []);
      }
      const materialList = bomGroup.versions.get(versionTag)!;

      materialList.push({
        id: item.id,
        material: item.material,
        materialDescription: item.materialDescription,
        partReference: item.partReference,
        qty: item.qty,
      });
    }

    return Array.from(groups.values()).map((group) => {
      const defaultMaterials = group.versions.get("default") || [];
      const totalQty = defaultMaterials.reduce(
        (sum, item) => sum + item.qty,
        0
      );

      return {
        id: group.bomCode,
        bomCode: group.bomCode,
        activeVersion: group.activeVersion,
        materialPreview: defaultMaterials,
        totalQty: totalQty,
        fullBomGroup: group,
      };
    });
  }, [bomList, activeVersions]);

  const handleSubmit = async () => {
    if (!selectedBomCode || !selectedTracking) {
      toast.warning("Harap pilih BOM dan Actual Compartment.");
      return;
    }
    setIsSaving(true);
    try {
      const activeVersionForSelectedBom =
        activeVersions.get(selectedBomCode) || "default";

      const payload = {
        bomCode: selectedBomCode,
        versionTag: activeVersionForSelectedBom,
        trackingId: selectedTracking.id,
      };

      const response = await fetch(`${GO_API_URL}/api/comparisons/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Role": role as string,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal menyimpan perbandingan");
      }

      toast.success("Perbandingan berhasil dibuat/diperbarui.");
      onComparisonAdded();
      setIsOpen(false);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const bomColumns = useMemo(
    () => getBomCodeSummaryColumns(getTableData),
    []
  );
  const trackingColumns = useMemo(() => getMiniTrackingColumns(), []);

  const selectedBomName =
    selectedBomCode
      ? `${selectedBomCode} (v: ${
          activeVersions.get(selectedBomCode) || "default"
        })`
      : "Belum Dipilih";
  const selectedTrackingName = selectedTracking
    ? `${selectedTracking.switchboardName} / ${selectedTracking.compartmentNumber}`
    : "Belum Dipilih";

  return (
    <DialogContent className="sm:max-w-6xl">
      <DialogHeader>
        <DialogTitle>Buat Perbandingan Baru</DialogTitle>
        <DialogDescription>
          Pilih BOM (berdasarkan versi aktifnya) dan Actual Compartment yang ingin
          Anda pasangkan.
        </DialogDescription>
      </DialogHeader>

      {isLoadingData ? (
        <div className="flex justify-center items-center h-80">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 py-4">
          <div>
            <h4 className="font-medium mb-2">1. Pilih BOM</h4>
            <SelectionTable
              data={bomCodeSummaryList}
              columns={bomColumns}
              searchKey="bomCode"
              searchPlaceholder="Cari BOM code atau material..."
              selectedId={selectedBomCode}
              onRowSelect={(row) =>
                setSelectedBomCode(row ? (row as BomSummary).bomCode : null)
              }
            />
          </div>
          <div>
            <h4 className="font-medium mb-2">2. Pilih Actual Compartment</h4>
            <SelectionTable
              data={trackingList}
              columns={trackingColumns}
              searchKey="compartmentNumber"
              searchPlaceholder="Cari kompartemen atau project..."
              selectedId={selectedTracking?.id || null}
              onRowSelect={(row) =>
                setSelectedTracking(row as ProjectTrackingView | null)
              }
              rowDisabledKey="actualParts"
            />
          </div>
        </div>
      )}

      <DialogFooter className="sm:justify-between">
        <div className="text-sm text-muted-foreground hidden sm:block">
          <p>
            <strong>BOM:</strong> {selectedBomName}
          </p>
          <p>
            <strong>Actual:</strong> {selectedTrackingName}
          </p>
        </div>
        <div>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="mr-2"
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isLoadingData ||
              isSaving ||
              !selectedBomCode ||
              !selectedTracking
            }
          >
            {isSaving ? (
              "Memproses..."
            ) : (
              <>
                <Scale className="mr-2 h-4 w-4" />
                Simpan & Bandingkan
              </>
            )}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}