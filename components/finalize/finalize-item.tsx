"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

type ShortageItem = { partName: string; shortage: number };
type UnlistedItem = { partName: string; surplus: number };
type ComparisonResult = { shortageItems?: ShortageItem[]; surplusItems?: UnlistedItem[] };

interface FinalizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  comparisonResult: ComparisonResult | null;
  bomCode: string | null;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081" || "http://localhost:8080";

export default function FinalizeModal({
  isOpen,
  onClose,
  onSaveSuccess,
  comparisonResult,
  bomCode,
}: FinalizeModalProps) {
  const [checkedShortage, setCheckedShortage] = React.useState<Record<string, boolean>>({});
  const [checkedUnlisted, setCheckedUnlisted] = React.useState<Record<string, boolean>>({});
  const [shortageQuantities, setShortageQuantities] = React.useState<Record<string, number>>({});
  const [surplusQuantities, setSurplusQuantities] = React.useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = React.useState(false);

  const normalizedShortage = comparisonResult?.shortageItems ?? [];
  const normalizedSurplus = comparisonResult?.surplusItems ?? [];

  React.useEffect(() => {
    if (comparisonResult) {
      const initialShortageCheck = normalizedShortage.reduce(
        (acc, item) => ({ ...acc, [item.partName]: true }),
        {}
      );
      const initialUnlistedCheck = normalizedSurplus.reduce(
        (acc, item) => ({ ...acc, [item.partName]: true }),
        {}
      );
      setCheckedShortage(initialShortageCheck);
      setCheckedUnlisted(initialUnlistedCheck);

      const initialShortageQty = normalizedShortage.reduce(
        (acc, item) => ({ ...acc, [item.partName]: item.shortage }),
        {}
      );
      const initialUnlistedQty = normalizedSurplus.reduce(
        (acc, item) => ({ ...acc, [item.partName]: item.surplus }),
        {}
      );
      setShortageQuantities(initialShortageQty);
      setSurplusQuantities(initialUnlistedQty);
    }
  }, [comparisonResult]);

  const handleSave = async () => {
    if (!comparisonResult || !bomCode) return;
    setIsSaving(true);

    const finalizedItems: any[] = [];

    for (const item of normalizedShortage) {
      if (checkedShortage[item.partName]) {
        const quantity = shortageQuantities[item.partName] || 0;
        if (quantity > 0) {
          finalizedItems.push({
            bomCode,
            partName: item.partName,
            itemType: "SHORTAGE",
            quantityDiff: -quantity,
          });
        }
      }
    }

    for (const item of normalizedSurplus) {
      if (checkedUnlisted[item.partName]) {
        const quantity = surplusQuantities[item.partName] || 0;
        if (quantity > 0) {
          finalizedItems.push({
            bomCode,
            partName: item.partName,
            itemType: "UNLISTED",
            quantityDiff: quantity,
          });
        }
      }
    }

    try {
      const response = await fetch(`${API_URL}/api/action-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: finalizedItems }),
      });

      if (!response.ok) {
        throw new Error("Failed to save finalized items.");
      }

      onClose();
      onSaveSuccess();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShortageQtyChange = (partName: string, value: string) => {
    setShortageQuantities(prev => ({
        ...prev,
        [partName]: parseInt(value, 10) || 0
    }));
  };
  
  const handleSurplusQtyChange = (partName: string, value: string) => {
    setSurplusQuantities(prev => ({
        ...prev,
        [partName]: parseInt(value, 10) || 0
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Finalize Detection Results</DialogTitle>
          <DialogDescription>
            Review the detected items below. Adjust quantities as needed or uncheck
            items to exclude them before saving.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto p-2">
          <div>
            <h3 className="font-semibold mb-2">Shortage Items</h3>
            <div className="space-y-2">
              {normalizedShortage.length > 0 ? (
                normalizedShortage.map((item) => (
                  <div
                    key={item.partName}
                    className="flex items-center justify-between space-x-2 p-2 rounded-md border"
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`shortage-${item.partName}`}
                        checked={checkedShortage[item.partName] || false}
                        onCheckedChange={(checked) =>
                          setCheckedShortage((prev) => ({
                            ...prev,
                            [item.partName]: !!checked,
                          }))
                        }
                      />
                      <label
                        htmlFor={`shortage-${item.partName}`}
                        className="text-sm font-medium leading-none"
                      >
                        {item.partName}
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Label htmlFor={`qty-short-${item.partName}`} className="text-sm text-muted-foreground">Missing:</Label>
                        <Input
                            id={`qty-short-${item.partName}`}
                            type="number"
                            min="0"
                            className="h-8 w-20"
                            value={shortageQuantities[item.partName] || 0}
                            onChange={(e) => handleShortageQtyChange(item.partName, e.target.value)}
                            disabled={!checkedShortage[item.partName]}
                        />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No shortage items found.</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Unlisted Items</h3>
            <div className="space-y-2">
              {normalizedSurplus.length > 0 ? (
                normalizedSurplus.map((item) => (
                  <div
                    key={item.partName}
                    className="flex items-center justify-between space-x-2 p-2 rounded-md border"
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`unlisted-${item.partName}`}
                        checked={checkedUnlisted[item.partName] || false}
                        onCheckedChange={(checked) =>
                          setCheckedUnlisted((prev) => ({
                            ...prev,
                            [item.partName]: !!checked,
                          }))
                        }
                      />
                      <label
                        htmlFor={`unlisted-${item.partName}`}
                        className="text-sm font-medium leading-none"
                      >
                        {item.partName}
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <Label htmlFor={`qty-surplus-${item.partName}`} className="text-sm text-muted-foreground">Found:</Label>
                        <Input
                            id={`qty-surplus-${item.partName}`}
                            type="number"
                            min="0"
                            className="h-8 w-20"
                            value={surplusQuantities[item.partName] || 0}
                            onChange={(e) => handleSurplusQtyChange(item.partName, e.target.value)}
                            disabled={!checkedUnlisted[item.partName]}
                        />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No unlisted items found.</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Confirm & Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}