"use client"

import type React from "react"
import { useState, useRef } from "react"
import Image from "next/image"
import {
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Settings,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"

interface UploadedFile {
  id: string
  file: File
  preview: string
  progress: number
  status: "pending" | "uploading" | "success" | "error"
  error?: string
}

interface ImageUploaderProps {
  confidence: number
  onConfidenceChange: (value: number) => void
  iou: number
  onIouChange: (value: number) => void
}

export function ImageUploader({
  confidence,
  onConfidenceChange,
  iou,
  onIouChange,
}: ImageUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return

    const validFiles = Array.from(newFiles).filter((file) => {
      if (!file.type.startsWith("image/")) {
        return false
      }
      if (file.size > 10 * 1024 * 1024) {
        return false
      }
      return true
    })

    const uploadedFiles: UploadedFile[] = validFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: "pending",
    }))

    setFiles((prev) => [...prev, ...uploadedFiles])

    uploadedFiles.forEach((uploadFile) => {
      simulateUpload(uploadFile.id)
    })
  }

  const simulateUpload = (fileId: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, status: "uploading", progress: 0 } : f
      )
    )

    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 30
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, status: "success", progress: 100 } : f
          )
        )
      } else {
        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, progress } : f))
        )
      }
    }, 300)
  }

  const removeFile = (fileId: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === fileId)
      if (file) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter((f) => f.id !== fileId)
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(e.dataTransfer.files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div
      className={`space-y-4 border-2 border-dashed rounded-lg p-4 transition-colors ${
        isDragging
          ? "border-primary bg-primary/5"
          : "border-transparent"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground">
            Upload Images
          </h3>
          <p className="text-sm text-muted-foreground">
            Drag files here or click select
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Detection Settings</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="space-y-3">
                  <Label
                    htmlFor="confidence"
                    className="flex justify-between mb-2"
                  >
                    <span>Confidence</span>
                    <span className="text-primary font-medium">
                      {confidence.toFixed(2)}
                    </span>
                  </Label>
                  <Slider
                    id="confidence"
                    defaultValue={[confidence]}
                    min={0}
                    max={1}
                    step={0.05}
                    onValueChange={(val) => onConfidenceChange(val[0])}
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="iou" className="flex justify-between mb-2">
                    <span>IoU</span>
                    <span className="text-primary font-medium">
                      {iou.toFixed(2)}
                    </span>
                  </Label>
                  <Slider
                    id="iou"
                    defaultValue={[iou]}
                    min={0}
                    max={1}
                    step={0.05}
                    onValueChange={(val) => onIouChange(val[0])}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" onClick={() => (document.querySelector('[data-state="open"] [aria-label="Close"]') as HTMLElement)?.click()}>
                  Done
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button onClick={handleClick} size="lg">
            <Upload className="h-4 w-4 mr-2" />
            Select Images
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {files.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <Card key={file.id} className="overflow-hidden group">
              <div className="relative aspect-video bg-muted">
                <Image
                  src={file.preview || "/placeholder.svg"}
                  alt={file.file.name}
                  fill
                  className="object-cover"
                />

                {file.status === "uploading" && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                    <div className="text-center">
                      <div className="w-10 h-10 rounded-full border-4 border-white/20 border-t-white animate-spin mb-2" />
                      <p className="text-white text-sm font-medium">
                        {Math.round(file.progress)}%
                      </p>
                    </div>
                  </div>
                )}

                {file.status === "success" && (
                  <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  </div>
                )}

                {file.status === "error" && (
                  <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1">
                    <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                )}

                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => removeFile(file.id)}
                  className="absolute top-2 left-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="p-3">
                <p className="text-sm font-medium text-foreground truncate">
                  {file.file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(file.file.size / 1024 / 1024).toFixed(2)} MB
                </p>

                {file.status === "uploading" && (
                  <div className="mt-2 w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed rounded-md">
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No images uploaded
          </h3>
          <p className="text-sm text-muted-foreground">
            Drag and drop files here, or use the "Select Images" button.
          </p>
        </div>
      )}
    </div>
  )
}