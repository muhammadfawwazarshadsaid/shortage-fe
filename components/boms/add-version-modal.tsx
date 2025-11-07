"use client";

import { useState } from "react";
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
import { toast } from "sonner";

interface AddVersionModalProps {
  bomCode: string;
  existingVersions: string[];
  setIsOpen: (open: boolean) => void;
  onVersionAdded: (versionTag: string) => void;
}

export function AddVersionModal({
  bomCode,
  existingVersions,
  setIsOpen,
  onVersionAdded,
}: AddVersionModalProps) {
  const [versionTag, setVersionTag] = useState("");

  const handleSubmit = () => {
    const newTag = versionTag.trim() || "default";

    if (existingVersions.includes(newTag)) {
      toast.error(
        `Versi '${newTag}' sudah ada untuk BOM ${bomCode}. Harap gunakan nama lain.`
      );
      return;
    }

    if (newTag.length > 100) {
      toast.error("Nama versi tidak boleh lebih dari 100 karakter.");
      return;
    }

    onVersionAdded(newTag);
    setIsOpen(false);
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Buat Versi Baru untuk {bomCode}</DialogTitle>
        <DialogDescription>
          Masukkan nama unik untuk versi baru ini.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="versionTag" className="text-left">
            Nama Versi *
          </Label>
          <Input
            id="versionTag"
            value={versionTag}
            onChange={(e) => setVersionTag(e.target.value)}
            className="col-span-3"
            placeholder="Misal: v1.1-revised"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => setIsOpen(false)}>
          Batal
        </Button>
        <Button onClick={handleSubmit}>Lanjut</Button>
      </DialogFooter>
    </DialogContent>
  );
}