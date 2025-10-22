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
import { UploadCloud } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081" || "http://localhost:8080";

interface BomImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; 
}

export default function BomImportModal({ isOpen, onClose, onSuccess }: BomImportModalProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file first.");
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`${API_URL}/api/boms/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to upload file.");
      }
      
      const result = await response.json();
      console.log(result.message); 
      
      onSuccess(); 
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
      if(fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import BOM from File</DialogTitle>
          <DialogDescription>
            Upload an Excel (.xlsx) or CSV (.csv) file to bulk-add BOM entries.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/60"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="w-8 h-8 text-muted-foreground" />
            <p className="mt-2 font-medium">
              {selectedFile ? selectedFile.name : "Click to select file"}
            </p>
            <p className="text-sm text-muted-foreground">Excel or CSV files</p>
          </div>
          <Input
            id="file"
            name="file"
            type="file"
            ref={fileInputRef}
            className="sr-only"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
          />
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={isUploading || !selectedFile}>
            {isUploading ? "Uploading..." : "Upload & Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}