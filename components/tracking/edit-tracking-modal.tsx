"use client";

import { useState } from "react";
import {
  useAuthStore,
  Project,
  ProjectTracking,
  ProjectTrackingPayload,
  ActualPart,
  SqlNullString,
  SqlNullTime,
} from "@/lib/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, PackagePlus, Loader2 } from "lucide-react";
import { DatePicker } from "../ui/date-picker";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface EditTrackingModalProps {
  tracking: ProjectTracking;
  setIsOpen: (open: boolean) => void;
  onTrackingUpdated: () => void;
  projects: Project[];
}

const VIEW_OPTIONS = ["top", "bottom", "side", "behind", "front", "other"];

const toNullString = (val: string | null | undefined): SqlNullString => ({
  String: val || "",
  Valid: !!val,
});

const toNullTime = (dateStr: string | null | undefined | Date): SqlNullTime => {
  if (!dateStr) {
    return { Time: "", Valid: false };
  }
  try {
    return { Time: new Date(dateStr).toISOString(), Valid: true };
  } catch (e) {
    return { Time: "", Valid: false };
  }
};

const toNullInt64 = (id: number | string | null | undefined) => {
  const numId = Number(id);
  return {
    Int64: numId || 0,
    Valid: !!numId && !isNaN(numId),
  };
};

const formatISODateToInput = (isoDate: string | null | undefined) => {
  if (!isoDate) return "";
  try {
    return new Date(isoDate).toISOString().split("T")[0];
  } catch (e) {
    return "";
  }
};

export function EditTrackingModal({
  tracking,
  setIsOpen,
  onTrackingUpdated,
  projects,
}: EditTrackingModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const role = useAuthStore((state) => state.role);
  const username = useAuthStore((state) => state.username);

  const [projectId, setProjectId] = useState<string>(
    tracking.projectId?.Valid ? String(tracking.projectId.Int64) : "NONE"
  );
  const [switchboardName, setSwitchboardName] = useState(
    tracking.switchboardName
  );
  const [compartmentNumber, setCompartmentNumber] = useState(
    tracking.compartmentNumber
  );
  const [mechAssemblyBy, setMechAssemblyBy] = useState(
    tracking.mechAssemblyBy?.String || ""
  );
  const [wiringType, setWiringType] = useState(
    tracking.wiringType?.String || ""
  );
  const [wiringBy, setWiringBy] = useState(tracking.wiringBy?.String || "");
  const [statusTest, setStatusTest] = useState(tracking.statusTest);
  const [testedBy, setTestedBy] = useState(tracking.testedBy?.String || "");

  const [dateTested, setDateTested] = useState<Date | undefined>(
    tracking.dateTested?.Valid ? new Date(tracking.dateTested.Time) : undefined
  );

  const [actualParts, setActualParts] = useState<ActualPart[]>(
    tracking.actualParts || []
  );
  const [newPartName, setNewPartName] = useState("");

  const handleAddPart = () => {
    const trimmedName = newPartName.trim();
    if (trimmedName === "") {
      toast.error("Nama part tidak boleh kosong.");
      return;
    }
    if (
      actualParts.some(
        (p) => p.material.toLowerCase() === trimmedName.toLowerCase()
      )
    ) {
      toast.warning("Part sudah ada di list.");
      return;
    }

    setActualParts((prev) => [
      ...prev,
      { material: trimmedName, qty: 1, views: [] },
    ]);
    setNewPartName("");
  };

  const handleRemovePart = (material: string) => {
    setActualParts((prev) =>
      prev.filter((p) => p.material !== material)
    );
  };

  const handlePartQtyChange = (material: string, qty: number) => {
    setActualParts((prev) =>
      prev.map((p) =>
        p.material === material ? { ...p, qty: qty > 0 ? qty : 1 } : p
      )
    );
  };

  const handlePartViewChange = (
    material: string,
    view: string,
    checked: boolean
  ) => {
    setActualParts((prev) =>
      prev.map((p) => {
        if (p.material !== material) return p;
        const newViews = new Set(p.views);
        if (checked) {
          newViews.add(view);
        } else {
          newViews.delete(view);
        }
        return { ...p, views: Array.from(newViews) };
      })
    );
  };

  const handleStatusChange = (
    value: "Waiting" | "Tested" | "Already Compared with BOM"
  ) => {
    setStatusTest(value);

    if (value === "Tested" || value === "Already Compared with BOM") {
      if (!testedBy) setTestedBy(username || "");
      if (!dateTested) setDateTested(new Date());
    }
    if (value === "Waiting") {
      setTestedBy("");
      setDateTested(undefined);
    }
  };

  const handleSubmit = async () => {
    if (!projectId || !switchboardName || !compartmentNumber) {
      toast.error("Project, Switchboard Name, dan Compartment No. wajib diisi.");
      return;
    }
    setIsLoading(true);

    try {
      const payload: ProjectTrackingPayload = {
        projectId: toNullInt64(projectId === "NONE" ? null : projectId),
        switchboardName,
        compartmentNumber,
        mechAssemblyBy: toNullString(mechAssemblyBy),
        wiringType: toNullString(wiringType),
        wiringBy: toNullString(wiringBy),
        statusTest,
        actualParts: actualParts.length > 0 ? actualParts : null,
        testedBy: toNullString(testedBy),
        dateTested: toNullTime(dateTested),
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/tracking/${tracking.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-User-Role": role || "",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal mengupdate data tracking.");
      }

      toast.success("Data tracking berhasil diupdate.");
      onTrackingUpdated();
      setIsOpen(false);
    } catch (error) {
      console.error("Error updating tracking:", error);
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-6xl max-h-[90vh]">
      <DialogHeader>
        <DialogTitle>
          Edit Tracking: {tracking.switchboardName} /{" "}
          {tracking.compartmentNumber}
        </DialogTitle>
        <DialogDescription>
          Ubah detail progress per kompartemen di bawah ini.
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
        <ScrollArea className="md:col-span-2 md:h-[65vh] pr-4">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">
                  Detail Project
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project">Project</Label>
                  <Select
                    onValueChange={setProjectId}
                    value={projectId}
                  >
                    <SelectTrigger id="project">
                      <SelectValue placeholder="Pilih WBS / Project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">- Tidak ada project -</SelectItem>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.projectName} ({p.wbsNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="switchboard">Switchboard Name</Label>
                  <Input
                    id="switchboard"
                    value={switchboardName}
                    onChange={(e) => setSwitchboardName(e.target.value)}
                    placeholder="Misal: SWB-01A"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compartment">Compartment No.</Label>
                  <Input
                    id="compartment"
                    value={compartmentNumber}
                    onChange={(e) => setCompartmentNumber(e.target.value)}
                    placeholder="Misal: C-01"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">
                  Progress Manufaktur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mechAssemblyBy">Mech. Assembly By</Label>
                  <Input
                    id="mechAssemblyBy"
                    value={mechAssemblyBy}
                    onChange={(e) => setMechAssemblyBy(e.target.value)}
                    placeholder="Nama PIC/Vendor"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wiringBy">Wiring By</Label>
                  <Input
                    id="wiringBy"
                    value={wiringBy}
                    onChange={(e) => setWiringBy(e.target.value)}
                    placeholder="Nama PIC/Vendor"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wiringType">Wiring Type</Label>
                  <Input
                    id="wiringType"
                    value={wiringType}
                    onChange={(e) => setWiringType(e.target.value)}
                    placeholder="Misal: Direct, Indirect"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">
                  Progress Test
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="statusTest">Status</Label>
                  <Select
                    onValueChange={(
                      val: "Waiting" | "Tested" | "Already Compared with BOM"
                    ) => handleStatusChange(val)}
                    value={statusTest}
                  >
                    <SelectTrigger id="statusTest">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Waiting">Waiting</SelectItem>
                      <SelectItem value="Tested">Tested</SelectItem>
                      <SelectItem value="Already Compared with BOM">
                        Already Compared
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="testedBy">Tested By</Label>
                  <Input
                    id="testedBy"
                    value={testedBy}
                    onChange={(e) => setTestedBy(e.target.value)}
                    placeholder="Nama PIC Tester"
                    disabled={statusTest === "Waiting"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateTested">Date Tested</Label>
                  <DatePicker
                    value={dateTested}
                    onValueChange={setDateTested}
                    disabled={statusTest === "Waiting"}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <div className="space-y-4 flex flex-col md:h-[65vh] overflow-y-auto">
          <h4 className="font-medium text-lg">List Part Detected (Actual)</h4>

          <ScrollArea className="flex-grow rounded-md ">
            <div className="space-y-4">
              {actualParts.map((part) => (
                <div
                  key={part.material}
                  className="p-3 border rounded-lg space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <Label className="font-medium pt-1.5">
                      {part.material}
                    </Label>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-600 flex-shrink-0"
                      onClick={() => handleRemovePart(part.material)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor={`qty-edit-${part.material}`}
                      className="text-xs"
                    >
                      Qty
                    </Label>
                    <Input
                      id={`qty-edit-${part.material}`}
                      type="number"
                      className="h-8 w-20"
                      min="1"
                      value={part.qty}
                      onChange={(e) =>
                        handlePartQtyChange(
                          part.material,
                          parseInt(e.target.value) || 1
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Terlihat di Views:</Label>
                    <div className="grid grid-cols-3 gap-x-2 gap-y-3">
                      {VIEW_OPTIONS.map((view) => (
                        <div
                          key={view}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`view-edit-${part.material}-${view}`}
                            checked={part.views.includes(view)}
                            onCheckedChange={(checked) =>
                              handlePartViewChange(
                                part.material,
                                view,
                                !!checked
                              )
                            }
                          />
                          <Label
                            htmlFor={`view-edit-${part.material}-${view}`}
                            className="font-light text-sm capitalize"
                          >
                            {view}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {actualParts.length === 0 && (
                <p className="text-sm text-center text-muted-foreground py-4">
                  Belum ada part ditambahkan.
                </p>
              )}
            </div>
          </ScrollArea>

          <div className="flex gap-2">
            <Input
              placeholder="Ketik nama part baru..."
              value={newPartName}
              onChange={(e) => setNewPartName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddPart();
              }}
            />
            <Button onClick={handleAddPart} size="icon" className="flex-shrink-0">
              <PackagePlus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => setIsOpen(false)}>
          Batal
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}