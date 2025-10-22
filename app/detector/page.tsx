"use client";

import ImageImporter from "@/components/image-importer/image-importer";
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

function DetectorContent() {
  const searchParams = useSearchParams();
  const bomCode = searchParams.get('bomCode');

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-semibold">Object Detector</h1>
      {bomCode ? (
        <p className="text-muted-foreground text-sm pb-4">
          Comparing uploaded image against <span className="font-bold text-primary">{bomCode}</span>.
        </p>
      ) : (
         <Card className="mt-4 border-yellow-500/50 bg-yellow-50/50">
            <CardContent className="p-4">
                <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-3 text-yellow-600"/>
                    <div>
                        <p className="font-semibold text-yellow-800">No BOM Selected</p>
                        <p className="text-sm text-yellow-700">
                            Please go back and select a BOM to start the detection process.
                        </p>
                    </div>
                </div>
            </CardContent>
         </Card>
      )}
      <ImageImporter bomCode={bomCode} />
    </div>
  );
}

export default function DetectorPage() {
  return (
    <Suspense fallback={<div className="container mx-auto">Loading...</div>}>
      <DetectorContent />
    </Suspense>
  );
}