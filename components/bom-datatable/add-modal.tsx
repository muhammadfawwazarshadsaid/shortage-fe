"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081" || "http://localhost:8080";

interface BomAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type PartEntry = {
  partName: string;
  partReference: string;
  quantity: string;
  partDescription: string;
};

const initialPartState: PartEntry = {
  partName: "",
  partReference: "",
  quantity: "1",
  partDescription: "",
};

export default function BomAddModal({ isOpen, onClose, onSuccess }: BomAddModalProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [bomCode, setBomCode] = React.useState("");
  const [parts, setParts] = React.useState<PartEntry[]>([initialPartState]);

  React.useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setBomCode("");
        setParts([initialPartState]);
        setError(null);
        setIsSaving(false);
      }, 200);
    }
  }, [isOpen]);

  const handlePartChange = (index: number, field: keyof PartEntry, value: string) => {
    const newParts = [...parts];
    newParts[index][field] = value;
    setParts(newParts);
  };

  const handleAddPart = () => {
    setParts([...parts, { ...initialPartState }]);
  };

  const handleRemovePart = (index: number) => {
    if (parts.length <= 1) return;
    setParts(parts.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    if (!bomCode.trim()) {
      setError("BOM Code is required.");
      setIsSaving(false);
      return;
    }

    const payload = parts
      .map(part => ({
        bomCode: bomCode.trim(),
        partName: part.partName.trim(),
        partReference: part.partReference.trim(),
        partDescription: part.partDescription.trim(),
        quantity: parseInt(part.quantity, 10) || 0,
      }))
      .filter(part => part.partName && part.quantity > 0);

    if (payload.length === 0) {
      setError("You must add at least one valid part (with Part Name and Quantity > 0).");
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/boms/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to add BOM entries.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add New BOM (Multiple Parts)</DialogTitle>
          <DialogDescription>
            Enter one BOM Code and add one or more parts associated with it.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bomCode" className="text-right">BOM Code</Label>
              <Input
                id="bomCode"
                name="bomCode"
                className="col-span-3"
                value={bomCode}
                onChange={(e) => setBomCode(e.target.value)}
                required
              />
            </div>
          </div>
          
          <hr className="my-4" />

          <h4 className="font-medium mb-2">Parts</h4>
          <div className="space-y-4">
            {parts.map((part, index) => (
              <div key={index} className="p-3 border rounded-lg space-y-3">
                
                <div className="flex flex-col md:flex-row gap-x-3 gap-y-2">
                  <div className="flex-1 space-y-1">
                    <Label htmlFor={`partName-${index}`}>Part Name</Label>
                    <Input id={`partName-${index}`} value={part.partName} onChange={(e) => handlePartChange(index, 'partName', e.target.value)} required />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label htmlFor={`partReference-${index}`}>Part Ref.</Label>
                    <Input id={`partReference-${index}`} value={part.partReference} onChange={(e) => handlePartChange(index, 'partReference', e.target.value)} />
                  </div>
                  <div className="w-full md:w-32 space-y-1">
                    <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                    <Input id={`quantity-${index}`} type="number" min="1" value={part.quantity} onChange={(e) => handlePartChange(index, 'quantity', e.target.value)} required />
                  </div>
                  
                  <div className="flex items-center md:items-start pt-5 md:pt-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleRemovePart(index)}
                      disabled={parts.length <= 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor={`partDescription-${index}`}>Description (Optional)</Label>
                  <Textarea id={`partDescription-${index}`} value={part.partDescription} onChange={(e) => handlePartChange(index, 'partDescription', e.target.value)} className="h-16" />
                </div>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" size="sm" className="mt-4" onClick={handleAddPart}>
            <Plus className="mr-2 h-4 w-4" />
            Add Another Part
          </Button>

          {error && <p className="mt-4 text-sm text-destructive text-center">{error}</p>}
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : `Save ${parts.length} ${parts.length > 1 ? "Entries" : "Entry"}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}