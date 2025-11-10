"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  useAuthStore,
  ComparisonDetailView,
  DetectionResult,
  CompareItemDetail,
  BOM,
  BomMaterialItem,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Save,
  Loader2,
  Image as ImageIcon,
  ArrowLeft,
  Pencil,
  AlertTriangle,
  FilePlus,
} from "lucide-react";
import { TrackingAuthSkeleton } from "../tracking/tracking-skeleton";
import { EditBomModal } from "../boms/edit-bom-modal";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const GO_API_URL = process.env.NEXT_PUBLIC_API_URL;
const TASK_STATUS_OPTIONS = ["Belum Ada Status", "Follow Up", "Done"];

type MappedDetection = {
  [material: string]: {
    views: Map<
      string,
      {
        fullAnnotatedImage: string;
        crops: string[];
      }
    >;
  };
};

export function CompareDetailPage() {
  const router = useRouter();
  const params = useParams();
  const comparisonId = params.id as string;
  const role = useAuthStore((state) => state.role);

  const [data, setData] = useState<ComparisonDetailView | null>(null);
  const [boms, setBoms] = useState<BOM[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const [isBomModalOpen, setIsBomModalOpen] = useState(false);
  const [selectedVersionForEdit, setSelectedVersionForEdit] = useState<{
    bomCode: string;
    versionTag: string;
    materials: BomMaterialItem[];
  } | null>(null);

  const [shortageExcessStatus, setShortageExcessStatus] =
    useState("Belum Ada Status");
  const [shortageExcessPIC, setShortageExcessPIC] = useState("");
  const [unlistedStatus, setUnlistedStatus] = useState("Belum Ada Status");
  const [unlistedPIC, setUnlistedPIC] = useState("");

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    if (!role || !comparisonId) return;

    const getInitialData = async () => {
      setIsLoadingData(true);
      try {
        const headers = { "X-User-Role": role };
        const [compareRes, bomsRes] = await Promise.all([
          fetch(`${GO_API_URL}/api/comparisons/${comparisonId}`, { headers }),
          fetch(`${GO_API_URL}/api/boms/`, { headers }),
        ]);

        if (!compareRes.ok) throw new Error("Gagal mengambil data perbandingan");
        if (!bomsRes.ok) throw new Error("Gagal mengambil data BOM");

        const compareData = await compareRes.json();
        setData(compareData);
        setBoms(await bomsRes.json());

        const shortageItem = compareData.comparison.shortageItems?.[0];
        const excessItem = compareData.comparison.excessItems?.[0];
        const seFirstItem = shortageItem || excessItem;
        if (seFirstItem) {
          setShortageExcessStatus(seFirstItem.status);
          setShortageExcessPIC(seFirstItem.pic);
        }

        const unlistedFirstItem = compareData.comparison.unlistedItems?.[0];
        if (unlistedFirstItem) {
          setUnlistedStatus(unlistedFirstItem.status);
          setUnlistedPIC(unlistedFirstItem.pic);
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast.error("Gagal memuat data: " + (error as Error).message);
      } finally {
        setIsLoadingData(false);
      }
    };
    getInitialData();
  }, [role, comparisonId]);

  const mappedDetections = useMemo((): MappedDetection => {
    if (!data?.detectionResults) return {};
    const map: MappedDetection = {};
    for (const result of data.detectionResults) {
      const viewName = result.view;
      const fullImage = result.originalImage;

      for (const summary of result.summary) {
        const partName = summary.class_name;
        if (!map[partName]) {
          map[partName] = { views: new Map() };
        }

        map[partName].views.set(viewName, {
          fullAnnotatedImage: fullImage,
          crops: summary.crops,
        });
      }
    }
    return map;
  }, [data?.detectionResults]);

  const handleGroupTaskChange = (
    listName: "shortageExcess" | "unlisted",
    field: "status" | "pic",
    value: string
  ) => {
    setData((prevData) => {
      if (!prevData) return null;

      const updateAllItems = (item: CompareItemDetail) => ({
        ...item,
        [field]: value,
      });

      if (listName === "shortageExcess") {
        setShortageExcessStatus(
          field === "status" ? value : shortageExcessStatus
        );
        setShortageExcessPIC(field === "pic" ? value : shortageExcessPIC);
        return {
          ...prevData,
          comparison: {
            ...prevData.comparison,
            shortageItems:
              prevData.comparison.shortageItems?.map(updateAllItems) || [],
            excessItems:
              prevData.comparison.excessItems?.map(updateAllItems) || [],
          },
        };
      } else {
        setUnlistedStatus(field === "status" ? value : unlistedStatus);
        setUnlistedPIC(field === "pic" ? value : unlistedPIC);
        return {
          ...prevData,
          comparison: {
            ...prevData.comparison,
            unlistedItems:
              prevData.comparison.unlistedItems?.map(updateAllItems) || [],
          },
        };
      }
    });
  };

  const handleSaveChanges = async () => {
    if (!data || !role) return;

    setIsSaving(true);
    try {
      const payload = {
        shortageItems: data.comparison.shortageItems,
        excessItems: data.comparison.excessItems,
        unlistedItems: data.comparison.unlistedItems,
      };

      const response = await fetch(
        `${GO_API_URL}/api/comparisons/${comparisonId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-User-Role": role,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal menyimpan perubahan.");
      }
      toast.success("Perubahan task berhasil disimpan!");
    } catch (error) {
      console.error("Error saving changes:", error);
      toast.error((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const openBomEdit = (material: string) => {
    if (!data) return;

    const bomCode = data.comparison.bomCode;
    const versionTag = data.comparison.versionTag || "default";

    const materialsForVersion: BomMaterialItem[] = boms
      .filter(
        (b) =>
          b.bomCode === bomCode && (b.versionTag || "default") === versionTag
      )
      .map((b) => ({
        id: b.id,
        material: b.material,
        materialDescription: b.materialDescription,
        partReference: b.partReference,
        qty: b.qty,
      }));

    setSelectedVersionForEdit({
      bomCode: bomCode,
      versionTag: versionTag,
      materials: materialsForVersion,
    });
    setIsBomModalOpen(true);
  };

  const openImageModal = (url: string) => {
    setSelectedImageUrl(url);
    setIsImageModalOpen(true);
  };

  if (!isClient || isLoadingData || !data) {
    return <TrackingAuthSkeleton />;
  }

  const { comparison } = data;
  const combinedShortageExcess = [
    ...(comparison.shortageItems || []),
    ...(comparison.excessItems || []),
  ];

  return (
    <>
      <Dialog open={isBomModalOpen} onOpenChange={setIsBomModalOpen}>
        {selectedVersionForEdit && (
          <EditBomModal
            versionData={selectedVersionForEdit}
            setIsOpen={setIsBomModalOpen}
            onBomGroupUpdated={() => {
              toast.success("BOM Diperbarui!");
              
              if (role && comparisonId) {
                const refetchBoms = async () => {
                    try {
                      const headers = { "X-User-Role": role };
                      const bomsRes = await fetch(`${GO_API_URL}/api/boms/`, { headers });
                      if (!bomsRes.ok) throw new Error("Gagal refresh data BOM");
                      setBoms(await bomsRes.json());
                    } catch (error) {
                      toast.error((error as Error).message);
                    }
                };
                refetchBoms();
              }
            }}
          />
        )}
      </Dialog>

      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="sm:max-w-[80vw] h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          <div className="flex-1 relative">
            {selectedImageUrl && (
              <Image
                src={selectedImageUrl}
                alt="Enlarged preview"
                layout="fill"
                objectFit="contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/compare")}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke List
            </Button>
            <h1 className="text-3xl">Detail Perbandingan</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="secondary" className="font-light">
                BOM: {comparison.bomCode} (v: {comparison.versionTag || 'default'})
              </Badge>
              <Badge variant="secondary" className="font-light">
                WBS: {comparison.wbsNumber?.String || "-"}
              </Badge>
              <Badge variant="secondary" className="font-light">
                {comparison.switchboardName}
              </Badge>
              <Badge variant="secondary" className="font-light">
                {comparison.compartmentNumber}
              </Badge>
            </div>
          </div>
          <Button size="lg" onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Simpan Perubahan Task
          </Button>
        </div>

        <Tabs defaultValue="shortage_excess" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="shortage_excess">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Shortage & Excess ({combinedShortageExcess?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="unlisted">
              <FilePlus className="h-4 w-4 mr-2" />
              Unlisted in BOM ({comparison.unlistedItems?.length ?? 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shortage_excess">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Tugas Pengecekan Ulang</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    value={shortageExcessStatus}
                    onValueChange={(value) =>
                      handleGroupTaskChange(
                        "shortageExcess",
                        "status",
                        value
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="PIC..."
                    value={shortageExcessPIC}
                    onChange={(e) =>
                      handleGroupTaskChange(
                        "shortageExcess",
                        "pic",
                        e.target.value
                      )
                    }
                  />
                </div>
              </CardContent>
            </Card>
            <ScrollArea className="h-[60vh] p-1">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {combinedShortageExcess.map((item) => (
                  <ItemCard
                    key={item.material}
                    item={item}
                    detection={mappedDetections[item.material]}
                    onImageClick={openImageModal}
                  />
                ))}
                {combinedShortageExcess.length === 0 && (
                  <p className="text-center text-muted-foreground col-span-full py-16">
                    Tidak ada item shortage atau excess.
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="unlisted">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Tugas Pengecekan Ulang</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    value={unlistedStatus}
                    onValueChange={(value) =>
                      handleGroupTaskChange("unlisted", "status", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="PIC..."
                    value={unlistedPIC}
                    onChange={(e) =>
                      handleGroupTaskChange("unlisted", "pic", e.target.value)
                    }
                  />
                </div>
              </CardContent>
            </Card>
            <ScrollArea className="h-[60vh] p-1">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {comparison.unlistedItems?.map((item) => (
                  <ItemCard
                    key={item.material}
                    item={item}
                    detection={mappedDetections[item.material]}
                    onEditBom={openBomEdit}
                    onImageClick={openImageModal}
                  />
                ))}
                {(!comparison.unlistedItems ||
                  comparison.unlistedItems.length === 0) && (
                  <p className="text-center text-muted-foreground col-span-full py-16">
                    Tidak ada item unlisted.
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

interface ItemCardProps {
  item: CompareItemDetail;
  detection: MappedDetection[string];
  onEditBom?: (material: string) => void;
  onImageClick: (url: string) => void;
}

function ItemCard({ item, detection, onEditBom, onImageClick }: ItemCardProps) {
  const isShortage = item.difference < 0;
  const isUnlisted = item.bomQty === 0;

  const cardColor = isShortage
    ? "border-red-600 bg-red-50"
    : isUnlisted
    ? "border-blue-600 bg-blue-50"
    : "border-yellow-600 bg-yellow-50";

  const statusColor = isShortage
    ? "text-red-700"
    : isUnlisted
    ? "text-blue-700"
    : "text-yellow-700";

  const detectedViews = detection ? Array.from(detection.views.entries()) : [];

  return (
    <Card className={cardColor}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">{item.material}</CardTitle>
          {isUnlisted ? (
            <Badge variant="outline">Unlisted in BOM</Badge>
          ) : isShortage ? (
            <Badge variant="destructive">Shortage</Badge>
          ) : (
            <Badge>Excess</Badge>
          )}
        </div>
        <CardDescription className={`text-lg ${statusColor}`}>
          BOM: {item.bomQty} | Actual: {item.actualQty}
          <span className="font-medium ml-2">
            ({item.difference > 0 ? "+" : ""}
            {item.difference})
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Hasil Deteksi</Label>
          {detectedViews.length > 0 ? (
            <Tabs defaultValue={detectedViews[0][0]} className="w-full">
              <TabsList className="h-auto p-1 justify-start overflow-x-auto">
                {detectedViews.map(([viewName, data]) => (
                  <TabsTrigger
                    key={viewName}
                    value={viewName}
                    className="capitalize"
                  >
                    {viewName} (Qty: {data.crops.length})
                  </TabsTrigger>
                ))}
              </TabsList>

              {detectedViews.map(([viewName, data]) => (
                <TabsContent key={viewName} value={viewName} className="mt-2">
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Gambar Anotasi Penuh
                      </Label>
                      <div
                        className="relative h-40 w-full rounded-md border bg-white overflow-hidden cursor-pointer"
                        onClick={() => onImageClick(data.fullAnnotatedImage)}
                      >
                        {data.fullAnnotatedImage && (
                          <Image
                            src={data.fullAnnotatedImage}
                            alt={`Full anotasi ${viewName}`}
                            layout="fill"
                            objectFit="contain"
                          />
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Potongan Part (Crops)
                      </Label>
                      <ScrollArea className="h-28 w-full p-2 border rounded-md bg-white">
                        <div className="flex flex-wrap gap-2">
                          {data.crops.length > 0 ? (
                            data.crops
                              .filter((crop) => crop)
                              .map((crop, index) => (
                                <Image
                                  key={index}
                                  src={crop}
                                  alt={`Crop ${index + 1}`}
                                  width={64}
                                  height={64}
                                  className="h-16 w-16 object-cover rounded-md border cursor-pointer"
                                  onClick={() => onImageClick(crop)}
                                />
                              ))
                          ) : (
                            <div className="flex flex-col items-center justify-center w-full h-24 text-muted-foreground">
                              <ImageIcon className="h-6 w-6" />
                              <p className="text-xs">Tidak ada crops</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-40 text-muted-foreground border rounded-md bg-white">
              <ImageIcon className="h-8 w-8" />
              <p className="text-sm">Part ini tidak terdeteksi</p>
            </div>
          )}
        </div>

        {onEditBom && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onEditBom(item.material)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Perbarui Master BOM
          </Button>
        )}
      </CardContent>
    </Card>
  );
}