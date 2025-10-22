"use client";

import * as React from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { X, Bot, UploadCloud, FileWarning, CheckCircle, FileUp, ImageIcon, Download, PackageMinus, Info, AlertCircle, Send, Eye, RotateCcw } from "lucide-react";
import ResultList from "./result-list";
import FinalizeModal from "../finalize/finalize-item";

type ShortageItem = { partName: string; required: number; detected: number; shortage: number; };
type UnlistedItem = { partName: string; detected: number; required: number; surplus: number; };
type ComparisonResult = { 
  shortageItems: ShortageItem[]; 
  surplusItems: UnlistedItem[]; 
  originalImage: string;
  annotatedImage: string; 
  isFinalized?: boolean;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081" || "http://localhost:8080";

export default function ImageImporter({ bomCode: propBomCode }: { bomCode: string | null }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bomCodeFromUrl = searchParams.get('bomCode');
  const viewMode = searchParams.get('view');
  
  const bomCode = propBomCode || bomCodeFromUrl;

  const [preview, setPreview] = React.useState<{ url: string; name: string; } | null>(null);
  const [historyOriginalImage, setHistoryOriginalImage] = React.useState<string | null>(null);
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [modelFile, setModelFile] = React.useState<File | null>(null);
  const [confidence, setConfidence] = React.useState(0.25);
  const [iou, setIou] = React.useState(0.7);
  const [agnosticNms, setAgnosticNms] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isPredicting, setIsPredicting] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);
  const [comparisonResult, setComparisonResult] = React.useState<ComparisonResult | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isLoadingResult, setIsLoadingResult] = React.useState(false);
  const [isFinalized, setIsFinalized] = React.useState(false);
  
  const [isImageViewerOpen, setIsImageViewerOpen] = React.useState(false);
  const [imageViewerSrc, setImageViewerSrc] = React.useState<string | null>(null);
  const [imageViewerTitle, setImageViewerTitle] = React.useState<string>("");

  const imageInputRef = React.useRef<HTMLInputElement | null>(null);
  const modelInputRef = React.useRef<HTMLInputElement | null>(null);

  const isReadOnly = viewMode === 'result';

  React.useEffect(() => {
    if (isReadOnly && bomCode) {
      const fetchResult = async () => {
        setIsLoadingResult(true);
        setError(null);
        setHistoryOriginalImage(null);
        setIsFinalized(false);
        try {
          const response = await fetch(`${API_URL}/api/detect/${bomCode}`);
          if (!response.ok) throw new Error("Result not found for this BOM code.");
          const data: ComparisonResult = await response.json();
          setComparisonResult(data);
          setHistoryOriginalImage(data.originalImage); 
          setIsFinalized(data.isFinalized || false);
        } catch (err: any) {
          setError(err.message);
          setComparisonResult(null);
        } finally {
          setIsLoadingResult(false);
        }
      };
      fetchResult();
    }
  }, [bomCode, isReadOnly, viewMode]); 

  React.useEffect(() => { return () => { if (preview) URL.revokeObjectURL(preview.url); }; }, [preview]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setComparisonResult(null);
    setError(null);
    setImageFile(file);
    setPreview({ url: URL.createObjectURL(file), name: file.name });
  };
  
  const handleModelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.pt')) {
      setError("Invalid model file. Must be a '.pt' file.");
      return;
    }
    setModelFile(file);
  };

  const handlePredict = async () => {
    if (!imageFile) { setError("Please select an image first."); return; }
    if (!bomCode) { setError("No BOM Code selected. Cannot run detection."); return; }

    const formData = new FormData();
    formData.append("file", imageFile);
    if (modelFile) formData.append("model", modelFile);
    formData.append("conf", String(confidence));
    formData.append("iou", String(iou));
    formData.append("agnostic_nms", String(agnosticNms));

    setIsPredicting(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/detect/${bomCode}`, { method: "POST", body: formData });
      const data: ComparisonResult = await response.json();
      
      setComparisonResult(data);
      setHistoryOriginalImage(data.originalImage); 
      setIsFinalized(false); 

      router.push(`/detector?bomCode=${bomCode}&view=result`);

    } catch (err: any) {
      console.error("Comparison failed:", err);
      setError(`Failed to get comparison result: ${err.message}`);
      setComparisonResult(null); 
    } finally {
      setIsPredicting(false);
    }
  };
  
  const handleReset = async () => {
    if (!bomCode || !window.confirm(`Are you sure you want to reset all detection data for ${bomCode}? This action cannot be undone.`)) {
      return;
    }
    setIsResetting(true);
    try {
      const response = await fetch(`${API_URL}/api/detect/${bomCode}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset data.');
      }
      alert(`Detection data for ${bomCode} has been reset successfully.`);
      router.push('/bom');
    } catch (error: any) {
      console.error(error);
      alert(`An error occurred: ${error.message}`);
      setIsResetting(false);
    }
  };

  const handleFinalizeSuccess = () => {
    router.push('/actions');
  };
  
  const openImageViewer = (src: string, title: string) => {
    setImageViewerSrc(src);
    setImageViewerTitle(title);
    setIsImageViewerOpen(true);
  };
  
  const hasItemsToFinalize =
    comparisonResult &&
    ((comparisonResult.shortageItems?.length ?? 0) > 0 ||
    (comparisonResult.surplusItems?.length ?? 0) > 0);

  return (
    <>
      <FinalizeModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveSuccess={handleFinalizeSuccess}
        comparisonResult={comparisonResult}
        bomCode={bomCode}
      />

      <Dialog open={isImageViewerOpen} onOpenChange={setIsImageViewerOpen}>
        <DialogContent className="sm:max-w-[90vw] h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>{imageViewerTitle}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto flex items-center justify-center p-2">
            {imageViewerSrc && (
              <img
                src={imageViewerSrc}
                alt={imageViewerTitle}
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
          <DialogFooter className="p-4 border-t flex justify-between items-center">
            {imageViewerSrc && (
                <Button variant="outline" size="sm" asChild>
                    <a href={imageViewerSrc} download={`${imageViewerTitle.toLowerCase().replace(/\s/g, '_')}.jpg`}>
                        <Download className="mr-2 h-4 w-4" /> Download
                    </a>
                </Button>
            )}
            <Button variant="secondary" onClick={() => setIsImageViewerOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-8 mt-4">
        {error && (
            <Alert variant="destructive">
            <FileWarning className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1 flex flex-col gap-8">
              <Card className={cn(isReadOnly && "bg-muted/50")}>
                  <CardHeader>
                    <CardTitle>1. Configuration</CardTitle>
                    <CardDescription>{isReadOnly ? "Configuration used for this result." : "Adjust model parameters."}</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <div>
                          <Label htmlFor="confidence" className="flex justify-between mb-2"><span>Confidence Threshold</span><span className="text-primary font-medium">{confidence.toFixed(2)}</span></Label>
                          <Slider id="confidence" defaultValue={[confidence]} min={0} max={1} step={0.05} onValueChange={(val) => setConfidence(val[0])} disabled={isReadOnly} />
                      </div>
                      <div className="h-6"></div>
                      <div>
                          <Label htmlFor="iou" className="flex justify-between mb-2"><span>IoU Threshold</span><span className="text-primary font-medium">{iou.toFixed(2)}</span></Label>
                          <Slider id="iou" defaultValue={[iou]} min={0} max={1} step={0.05} onValueChange={(val) => setIou(val[0])} disabled={isReadOnly} />
                      </div>
                      <div className="h-6"></div>
                      <div className="flex items-center space-x-2 pt-2">
                          <Switch id="agnostic-nms" checked={agnosticNms} onCheckedChange={setAgnosticNms} disabled={isReadOnly} />
                          <Label htmlFor="agnostic-nms">Agnostic NMS</Label>
                      </div>
                      <div className="p-3 text-sm rounded-md bg-muted my-4"><strong>Default Model:</strong> best.pt</div>
                      <Button variant="outline" className="w-full" onClick={() => modelInputRef.current?.click()} disabled={isReadOnly}><FileUp className="mr-2 h-4 w-4"/> Upload Custom Model (.pt)</Button>
                      <Input ref={modelInputRef} type="file" accept=".pt" className="sr-only" onChange={handleModelFileChange} disabled={isReadOnly}/>
                      {modelFile && (
                          <div className="mt-4 flex items-center justify-between p-2 text-sm rounded-md border border-green-200 bg-green-50 text-green-800">
                              <span className="font-medium truncate" title={modelFile.name}>Using: {modelFile.name}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {setModelFile(null); if (modelInputRef.current) modelInputRef.current.value = ""}} disabled={isReadOnly}>
                                  <X className="h-4 w-4"/>
                              </Button>
                          </div>
                      )}
                  </CardContent>
              </Card>
              
              <Card className={cn(isReadOnly && "bg-muted/50")}>
                  <CardHeader>
                      <CardTitle>2. Image Uploader</CardTitle>
                      <CardDescription>{isReadOnly ? "Image used for this result." : "Select an image to analyze."}</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <div role="button" className={cn("flex items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors", isReadOnly ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:border-primary/60")} onClick={isReadOnly ? undefined : () => imageInputRef.current?.click()}>
                        <UploadCloud className="w-8 h-8 text-muted-foreground mr-4" />
                        <div className="text-center">
                            <p className="font-medium truncate">{imageFile ? imageFile.name : (isReadOnly ? "Viewing History" : "Click to upload Image")}</p>
                            <p className="text-muted-foreground text-sm mt-1">PNG, JPG, WEBP</p>
                        </div>
                      </div>
                      <Input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleImageFileChange} disabled={isReadOnly} />
                  </CardContent>
                  {!isReadOnly && (
                    <CardFooter className="flex justify-end">
                        <Button size="lg" onClick={handlePredict} disabled={!imageFile || isPredicting || !bomCode}>
                            {isPredicting ? "Analyzing..." : `Compare with ${bomCode || 'BOM'}`}
                        </Button>
                    </CardFooter>
                  )}
              </Card>
          </div>
        
          <div className="h-full lg:col-span-2">
              <Card className="h-full flex flex-col">
              <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle>3. Comparison Results</CardTitle>
                    <CardDescription>
                        Analysis of the detected objects compared to <span className="font-bold">{bomCode || 'the selected BOM'}</span>.
                    </CardDescription>
                  </div>
                  {isReadOnly && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleReset}
                      disabled={isResetting}
                    >
                      <RotateCcw className={`mr-2 h-4 w-4 ${isResetting ? 'animate-spin' : ''}`} />
                      {isResetting ? 'Resetting...' : 'Reset'}
                    </Button>
                  )}
              </CardHeader>
              <CardContent className="flex flex-col gap-8 grow"> 
                  
                  {(historyOriginalImage || comparisonResult?.annotatedImage) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-6">
                      <div>
                        <Label className="text-muted-foreground">Original Image</Label>
                        <div className="mt-2 border rounded-md overflow-hidden aspect-video flex items-center justify-center bg-muted">
                          {historyOriginalImage ? (
                            <div
                              onClick={() => openImageViewer(historyOriginalImage, "Original Image")}
                              className="w-full h-full cursor-zoom-in flex items-center justify-center"
                            >
                              <img
                                src={historyOriginalImage}
                                alt="Original Upload"
                                className="object-contain max-w-full max-h-full" 
                              />
                            </div>
                          ) : (
                            <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Annotated Result</Label>
                        <div className="mt-2 border rounded-md overflow-hidden aspect-video flex items-center justify-center bg-muted">
                          {comparisonResult?.annotatedImage ? (
                            <div
                              onClick={() => openImageViewer(comparisonResult.annotatedImage, "Annotated Result")}
                              className="w-full h-full cursor-zoom-in flex items-center justify-center"
                            >
                              <img
                                src={comparisonResult.annotatedImage}
                                alt="Annotated Result"
                                className="object-contain max-w-full max-h-full" 
                              />
                            </div>
                          ) : (
                            <Bot className="h-12 w-12 text-muted-foreground/50" />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-6 grow">
                    <ResultList
                      title="Shortage (Required in BOM)"
                      icon="shortage"
                      items={comparisonResult?.shortageItems}
                      isLoading={isLoadingResult}
                      isPredicting={isPredicting}
                    />
                    <ResultList
                      title="Unlisted Items (Needs BOM Revision)"
                      icon="surplus"
                      items={comparisonResult?.surplusItems}
                      isLoading={isLoadingResult}
                      isPredicting={isPredicting}
                    />
                  </div>
              </CardContent>
              {hasItemsToFinalize && (
                <CardFooter className="border-t pt-6 justify-end">
                    <Button onClick={() => setIsModalOpen(true)} disabled={isFinalized}>
                        <Send className="mr-2 h-4 w-4" />
                        {isFinalized ? "Already Finalized" : "Finalize & Create Action Items"}
                    </Button>
                </CardFooter>
              )}
              </Card>
          </div>
        </div>
    </div>
    </>
  );
}