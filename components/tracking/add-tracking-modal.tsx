"use client";

import { useState } from "react";
import {
  useAuthStore,
  Project,
  ProjectTrackingPayload,
  ActualPart,
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
import { Trash2, PackagePlus } from "lucide-react";
import { DatePicker } from "../ui/date-picker";
import { toast } from "sonner";

interface AddTrackingModalProps {
  setIsOpen: (open: boolean) => void;
  onTrackingAdded: (newTracking: any) => void;
  projects: Project[];
}

const VIEW_OPTIONS = ["top", "bottom", "side", "behind", "front", "other"];

export function AddTrackingModal({
  setIsOpen,
  onTrackingAdded,
  projects,
}: AddTrackingModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const role = useAuthStore((state) => state.role);
  const username = useAuthStore((state) => state.username);

  const [projectId, setProjectId] = useState<string>("");
  const [switchboardName, setSwitchboardName] = useState("");
  const [compartmentNumber, setCompartmentNumber] = useState("");
  const [mechAssemblyBy, setMechAssemblyBy] = useState("");
  const [wiringType, setWiringType] = useState("");
  const [wiringBy, setWiringBy] = useState("");
  const [statusTest, setStatusTest] =
    useState<"Waiting" | "Tested" | "Already Compared with BOM">("Waiting");
  const [testedBy, setTestedBy] = useState("");
  const [dateTested, setDateTested] = useState<Date | undefined>();
  const [actualParts, setActualParts] = useState<ActualPart[]>([]);
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

  const handleStatusChange = (value: string) => {
    const newStatus = value as
      | "Waiting"
      | "Tested"
      | "Already Compared with BOM";
    setStatusTest(newStatus);

    if (newStatus === "Tested" || newStatus === "Already Compared with BOM") {
      if (!testedBy) setTestedBy(username || "");
      if (!dateTested) setDateTested(new Date());
    }
    if (newStatus === "Waiting") {
      setTestedBy("");
      setDateTested(undefined);
    }
  };

  const handleSubmit = async () => {
    if (!projectId || !switchboardName || !compartmentNumber) {
      alert("Project, Switchboard Name, dan Compartment No. wajib diisi.");
      return;
    }
    setIsLoading(true);

    try {
      const numericProjectId = parseInt(projectId, 10);
      const projectIdPayload =
        !isNaN(numericProjectId) && numericProjectId > 0
          ? { Int64: numericProjectId, Valid: true }
          : null;

      const payload: ProjectTrackingPayload = {
        projectId: projectIdPayload,
        switchboardName,
        compartmentNumber,
        mechAssemblyBy:
          mechAssemblyBy
            ? { String: mechAssemblyBy, Valid: true }
            : null,
        wiringType:
          wiringType ? { String: wiringType, Valid: true } : null,
        wiringBy: wiringBy ? { String: wiringBy, Valid: true } : null,
        statusTest,
        actualParts: actualParts.length > 0 ? actualParts : null,
        testedBy: testedBy ? { String: testedBy, Valid: true } : null,
        dateTested: dateTested
          ? { Time: dateTested.toISOString(), Valid: true }
          : null,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/tracking/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Role": role || "",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal menambah data tracking.");
      }

      const newTracking = await response.json();
      onTrackingAdded(newTracking);
      setIsOpen(false);
    } catch (error) {
      console.error("Error adding tracking:", error);
      alert(error instanceof Error ? error.message : "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-4xl max-h-[90vh]">
      <DialogHeader>
        <DialogTitle>Tambah Data Progress Tracking</DialogTitle>
        <DialogDescription>
          Isi detail progress per kompartemen di bawah ini.
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 py-4 overflow-hidden">
        <ScrollArea className="pr-4 md:h-[65vh]">
          <div className="space-y-4">
            <h4 className="font-medium text-lg">Detail Project</h4>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project" className="text-left col-span-1">
                Project
              </Label>
              <Select onValueChange={setProjectId} value={projectId}>
                <SelectTrigger id="project" className="col-span-3">
                  <SelectValue placeholder="Pilih WBS / Project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.projectName} ({p.wbsNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="switchboard" className="text-left col-span-1">
                Switchboard
              </Label>
              <Input
                id="switchboard"
                value={switchboardName}
                onChange={(e) => setSwitchboardName(e.target.value)}
                className="col-span-3"
                placeholder="Misal: SWB-01A"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="compartment" className="text-left col-span-1">
                Compartment
              </Label>
              <Input
                id="compartment"
                value={compartmentNumber}
                onChange={(e) => setCompartmentNumber(e.target.value)}
                className="col-span-3"
                placeholder="Misal: C-01"
              />
            </div>

            <h4 className="font-medium text-lg pt-4">Progress Manufaktur</h4>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mechAssemblyBy" className="text-left col-span-1">
                Mech. Assembly
              </Label>
              <Input
                id="mechAssemblyBy"
                value={mechAssemblyBy}
                onChange={(e) => setMechAssemblyBy(e.target.value)}
                className="col-span-3"
                placeholder="Nama PIC/Vendor"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="wiringBy" className="text-left col-span-1">
                Wiring By
              </Label>
              <Input
                id="wiringBy"
                value={wiringBy}
                onChange={(e) => setWiringBy(e.target.value)}
                className="col-span-3"
                placeholder="Nama PIC/Vendor"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="wiringType" className="text-left col-span-1">
                Wiring Type
              </Label>
              <Input
                id="wiringType"
                value={wiringType}
                onChange={(e) => setWiringType(e.target.value)}
                className="col-span-3"
                placeholder="Misal: Direct, Indirect"
              />
            </div>

            <h4 className="font-medium text-lg pt-4">Progress Test</h4>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="statusTest" className="text-left col-span-1">
                Status
              </Label>
              <Select onValueChange={handleStatusChange} value={statusTest}>
                <SelectTrigger id="statusTest" className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Waiting">Waiting</SelectItem>
                  <SelectItem value="Tested">Tested</SelectItem>
                  <SelectItem value="Already Compared with BOM">
                    Already Compared with BOM
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="testedBy" className="text-left col-span-1">
                Tested By
              </Label>
              <Input
                id="testedBy"
                value={testedBy}
                onChange={(e) => setTestedBy(e.target.value)}
                className="col-span-3"
                placeholder="Nama PIC Tester"
                disabled={statusTest === "Waiting"}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dateTested" className="text-left col-span-1">
                Date Tested
              </Label>
              <div className="col-span-3">
                <DatePicker
                  value={dateTested}
                  onValueChange={setDateTested}
                  disabled={statusTest === "Waiting"}
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="space-y-4 flex flex-col md:h-[65vh] overflow-hidden">
          <h4 className="font-medium text-lg">List Part Detected (Actual)</h4>

          <ScrollArea className="flex-grow border rounded-md p-4">
            <div className="space-y-4">
              {actualParts.map((part) => (
                <div
                  key={part.material}
                  className="p-3 border rounded-lg space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <Label className="font-medium">{part.material}</Label>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-600"
                      onClick={() => handleRemovePart(part.material)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-4">
                    <Label htmlFor={`qty-${part.material}`}>Qty</Label>
                    <Input
                      id={`qty-${part.material}`}
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
                    <Label>Terlihat di Views:</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {VIEW_OPTIONS.map((view) => (
                        <div
                          key={view}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`view-${part.material}-${view}`}
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
                            htmlFor={`view-${part.material}-${view}`}
                            className="font-normal capitalize"
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
            <Button onClick={handleAddPart} size="icon">
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
          {isLoading ? "Menyimpan..." : "Simpan Data"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}