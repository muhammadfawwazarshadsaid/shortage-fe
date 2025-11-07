"use client";

import { useState } from "react";
import { useAuthStore, BomMaterialItem } from "@/lib/types"; 
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface MaterialInput {
  key: number;
  material: string;
  materialDescription: string;
  partReference: string;
  qty: number;
}

interface AddBomModalProps {
  setIsOpen: (open: boolean) => void;
  onBomAdded: () => void;
  prefilledData?: {
    bomCode: string;
    versionTag: string;
    initialMaterials?: BomMaterialItem[];
  };
}

let materialKeyCounter = 0;

const getInitialState = (initialData?: BomMaterialItem[]): MaterialInput[] => {
  if (initialData && initialData.length > 0) {
    return initialData.map((m) => ({
      key: materialKeyCounter++,
      material: m.material,
      materialDescription: m.materialDescription,
      partReference: m.partReference,
      qty: m.qty,
    }));
  }
  return [
    {
      key: materialKeyCounter++,
      material: "",
      materialDescription: "",
      partReference: "",
      qty: 1,
    },
  ];
};

export function AddBomModal({
  setIsOpen,
  onBomAdded,
  prefilledData,
}: AddBomModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const role = useAuthStore((state) => state.role);

  const [bomCode, setBomCode] = useState(prefilledData?.bomCode || "");
  const [versionTag, setVersionTag] = useState(prefilledData?.versionTag || "");

  const [materials, setMaterials] = useState<MaterialInput[]>(
    getInitialState(prefilledData?.initialMaterials)
  );

  const handleAddMaterialRow = () => {
    setMaterials([
      ...materials,
      {
        key: materialKeyCounter++,
        material: "",
        materialDescription: "",
        partReference: "",
        qty: 1,
      },
    ]);
  };

  const handleRemoveMaterialRow = (key: number) => {
    if (materials.length <= 1) {
      toast.error("Setidaknya harus ada 1 material.");
      return;
    }
    setMaterials(materials.filter((m) => m.key !== key));
  };

  const handleMaterialChange = (
    key: number,
    field: keyof Omit<MaterialInput, "key">,
    value: string | number
  ) => {
    setMaterials(
      materials.map((m) => (m.key === key ? { ...m, [field]: value } : m))
    );
  };

  const handleSubmit = async () => {
    const finalBomCode = bomCode.trim().toUpperCase();
    const finalVersionTag = versionTag.trim() || "default";

    if (!finalBomCode) {
      toast.error("BOM Code wajib diisi.");
      return;
    }

    const validMaterials = materials
      .filter((m) => m.material.trim() !== "")
      .map((m) => ({
        bomCode: finalBomCode,
        versionTag: finalVersionTag,
        partReference: m.partReference.trim(),
        material: m.material.trim().toUpperCase(),
        materialDescription: m.materialDescription.trim(),
        qty: Number(m.qty) || 0,
      }));

    if (validMaterials.length === 0) {
      toast.error("Setidaknya 1 material (dengan kode material) wajib diisi.");
      return;
    }
    if (validMaterials.some((m) => m.qty <= 0)) {
      toast.error("Qty untuk setiap material harus lebih dari 0.");
      return;
    }

    setIsLoading(true);
    try {
      const promises = validMaterials.map((payload) =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/boms/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Role": role || "",
          },
          body: JSON.stringify(payload),
        })
      );

      const responses = await Promise.all(promises);
      const failedResponses = responses.filter((res) => !res.ok);
      if (failedResponses.length > 0) {
        throw new Error(
          `Gagal menambah ${failedResponses.length} dari ${validMaterials.length} material.`
        );
      }

      toast.success(
        `Berhasil menambah ${validMaterials.length} material ke ${finalBomCode} (Versi: ${finalVersionTag}).`
      );
      onBomAdded();
      setIsOpen(false);
    } catch (error) {
      console.error("Error adding BOM group:", error);
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>
          {prefilledData?.initialMaterials
            ? "Tambah Versi Baru (Copy)"
            : "Tambah Master BOM Baru"}
        </DialogTitle>
        <DialogDescription>
          {prefilledData?.initialMaterials
            ? `Anda membuat versi '${prefilledData.versionTag}' untuk BOM '${prefilledData.bomCode}', disalin dari versi aktif. Sesuaikan material di bawah ini.`
            : "Isi BOM Code, Versi, dan daftar material."}
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="bomCode">BOM Code *</Label>
          <Input
            id="bomCode"
            value={bomCode}
            onChange={(e) => setBomCode(e.target.value)}
            placeholder="Misal: BC-01"
            disabled={!!prefilledData}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="versionTag">Version Tag</Label>
          <Input
            id="versionTag"
            value={versionTag}
            onChange={(e) => setVersionTag(e.target.value)}
            placeholder="Misal: v1.0 (kosongkan untuk 'default')"
            disabled={!!prefilledData}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
        <Label>Daftar Material</Label>
        {materials.map((material) => (
          <div
            key={material.key}
            className="grid grid-cols-12 gap-2 border p-3 rounded-md relative"
          >
            <button
            onClick={() => handleRemoveMaterialRow(material.key)}
            className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 hover:bg-destructive/80"
            disabled={materials.length <= 1 && !prefilledData?.initialMaterials}
              title="Hapus material ini"
            >
              <Trash2 className="h-3 w-3 text-white" />
            </button>

            <div className="col-span-6 space-y-1">
              <Label htmlFor={`material-${material.key}`} className="text-xs">
                Material *
              </Label>
              <Input
                id={`material-${material.key}`}
                value={material.material}
                onChange={(e) =>
                  handleMaterialChange(material.key, "material", e.target.value)
                }
                placeholder="Kode Material"
              />
            </div>
            <div className="col-span-6 space-y-1">
              <Label htmlFor={`desc-${material.key}`} className="text-xs">
                Deskripsi
              </Label>
              <Input
                id={`desc-${material.key}`}
                value={material.materialDescription}
                onChange={(e) =>
                  handleMaterialChange(
                    material.key,
                    "materialDescription",
                    e.target.value
                  )
                }
                placeholder="Deskripsi Material"
              />
            </div>
            <div className="col-span-6 space-y-1">
              <Label htmlFor={`partref-${material.key}`} className="text-xs">
                Part Ref.
              </Label>
              <Input
                id={`partref-${material.key}`}
                value={material.partReference}
                onChange={(e) =>
                  handleMaterialChange(
                    material.key,
                    "partReference",
                    e.target.value
                  )
                }
                placeholder="Opsional"
              />
            </div>
            <div className="col-span-6 space-y-1">
              <Label htmlFor={`qty-${material.key}`} className="text-xs">
                Qty *
              </Label>
              <Input
                id={`qty-${material.key}`}
                type="number"
                min="1"
                value={material.qty}
                onChange={(e) =>
                  handleMaterialChange(
                    material.key,
                    "qty",
                    Number(e.target.value)
                  )
                }
              />
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleAddMaterialRow}
        className="mt-2"
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Tambah Baris Material
      </Button>

      <DialogFooter className="mt-4 pt-4 border-t">
        <Button variant="outline" onClick={() => setIsOpen(false)}>
          Batal
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? "Menyimpan..." : `Simpan ${materials.length} Material`}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}