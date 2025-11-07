import { DetailTrackingPage } from "@/components/tracking/tracking-detail-page";
import { TrackingAuthSkeleton } from "@/components/tracking/tracking-skeleton";
import { Suspense } from "react";

export default function TrackingDetailPage() {
  return (
    <Suspense fallback={<TrackingAuthSkeleton />}>
      <DetailTrackingPage />
    </Suspense>
  );
}