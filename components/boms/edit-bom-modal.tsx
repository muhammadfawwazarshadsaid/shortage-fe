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
  id: number | null;
  material: string;
  materialDescription: string;
  partReference: string;
  qty: number;
}

interface EditBomVersionModalProps {
  versionData: {
    bomCode: string;
    versionTag: string;
    materials: BomMaterialItem[];
  };
  setIsOpen: (open: boolean) => void;
  onBomGroupUpdated: () => void;
}

let materialKeyCounter = 0;

const mapToInputState = (materials: BomMaterialItem[]): MaterialInput[] => {
  return materials.map((m) => ({
    ...m,
    key: materialKeyCounter++,
    id: m.id,
  }));
};

export function EditBomModal({
  versionData,
  setIsOpen,
  onBomGroupUpdated,
}: EditBomVersionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const role = useAuthStore((state) => state.role);

  const bomCode = versionData.bomCode;
  const versionTag = versionData.versionTag;

  const [materials, setMaterials] = useState<MaterialInput[]>(
    mapToInputState(versionData.materials)
  );
  const [originalMaterials] = useState(versionData.materials);

  const handleAddMaterialRow = () => {
    setMaterials([
      ...materials,
      {
        key: materialKeyCounter++,
        id: null,
        material: "",
        materialDescription: "",
        partReference: "",
        qty: 1,
      },
    ]);
  };

  const handleRemoveMaterialRow = (key: number) => {
    setMaterials(materials.filter((m) => m.key !== key));
  };

  const handleMaterialChange = (
    key: number,
    field: keyof Omit<MaterialInput, "key" | "id">,
    value: string | number
  ) => {
    setMaterials(
      materials.map((m) => (m.key === key ? { ...m, [field]: value } : m))
    );
  };

  const handleSubmit = async () => {
    const validMaterials = materials
      .filter((m) => m.material.trim() !== "")
      .map((m) => ({
        ...m,
        bomCode: bomCode, 
        versionTag: versionTag,
        material: m.material.trim().toUpperCase(),
        partReference: m.partReference.trim(),
        materialDescription: m.materialDescription.trim(),
        qty: Number(m.qty) || 0,
      }));

    if (validMaterials.length === 0 && originalMaterials.length > 0) {
      toast.error(
        "Anda tidak bisa menghapus semua material. Hapus seluruh versi dari halaman detail."
      );
      return;
    }
    if (validMaterials.some((m) => m.qty <= 0)) {
      toast.error("Qty untuk setiap material harus lebih dari 0.");
      return;
    }

    setIsLoading(true);
    try {
      const promises: Promise<any>[] = [];
      const roleHeader = role || "";

      const itemsToAdd = validMaterials.filter((m) => m.id === null);
      for (const item of itemsToAdd) {
        const payload = { ...item };
        delete (payload as any).id;
        delete (payload as any).key;
        promises.push(
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/boms/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-User-Role": roleHeader,
            },
            body: JSON.stringify(payload),
          })
        );
      }

      const itemsToUpdate = validMaterials.filter((m) => m.id !== null);
      for (const item of itemsToUpdate) {
        const payload = { ...item };
        delete (payload as any).key;
        promises.push(
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/boms/${item.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "X-User-Role": roleHeader,
            },
            body: JSON.stringify(payload),
          })
        );
      }

      const updatedIds = new Set(itemsToUpdate.map((m) => m.id));
      const itemsToDelete = originalMaterials.filter(
        (m) => !updatedIds.has(m.id)
      );
      for (const item of itemsToDelete) {
        promises.push(
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/boms/${item.id}`, {
            method: "DELETE",
            headers: { "X-User-Role": roleHeader },
          })
        );
      }

      const responses = await Promise.all(promises);
      const failed = responses.filter((res) => !res.ok);

      if (failed.length > 0) {
        throw new Error(
          `Gagal memproses ${failed.length} dari ${promises.length} aksi.`
        );
      }

      toast.success(
        `Versi '${versionTag}' dari BOM ${bomCode} berhasil diupdate.`
      );
      onBomGroupUpdated();
      setIsOpen(false);
    } catch (error) {
      console.error("Error updating BOM version:", error);
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>Edit Versi BOM</DialogTitle>
        <DialogDescription>
          Edit material untuk <strong>{bomCode}</strong> (Versi:{" "}
          <strong>{versionTag}</strong>).
        </DialogDescription>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3 mt-4">
        <Label>Daftar Material</Label>
        {materials.map((material) => (
          <div
            key={material.key}
            className="grid grid-cols-12 gap-2 border p-3 rounded-md relative"
          >
            <button
              onClick={() => handleRemoveMaterialRow(material.key)}
              className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 hover:bg-destructive/80"
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
          {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}