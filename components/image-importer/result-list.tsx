"use client";

import { CheckCircle, PackageMinus, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ResultListProps {
  title: string;
  icon: "shortage" | "surplus";
  items?: { partName: string; shortage?: number; surplus?: number }[];
  isLoading: boolean;
  isPredicting: boolean;
}

const ResultListSkeleton = () => (
  <div className="space-y-2 w-full animate-pulse">
    {[...Array(3)].map((_, i) => (
      <div
        key={i}
        className="loading-skeleton-gradient h-10 w-full rounded-md"
      />
    ))}
  </div>
);

export default function ResultList({ title, icon, items = [], isLoading, isPredicting }: ResultListProps) {
  const Icon = icon === "shortage" ? PackageMinus : AlertCircle;
  const isEmpty = !items?.length;

  return (
    <div className="space-y-2 flex flex-col">
      <Label className="text-muted-foreground flex items-center">
        <Icon className="h-5 w-5 mr-2 text-muted-foreground" />
        {title}
      </Label>
      <div className="border rounded-lg p-4 max-h-64 overflow-y-auto flex flex-col justify-center grow">
        {isPredicting || isLoading ? (
          <ResultListSkeleton />
        ) : isEmpty ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
            <CheckCircle className="h-4 w-4" />
            <span>{icon === "shortage" ? "No shortage detected." : "No unlisted items found."}</span>
          </div>
        ) : (
          <ul className="space-y-2 w-full">
            {items.map(item => (
              <li
                key={item.partName}
                className={cn(
                  "flex justify-between items-center text-sm p-2 rounded-md",
                  icon === "shortage" ? "bg-red-50" : "bg-yellow-50"
                )}
              >
                <span className="font-medium">{item.partName}</span>
                <span className="text-muted-foreground">
                  {icon === "shortage" ? (
                    <>Missing: <strong>{item.shortage}</strong></>
                  ) : (
                    <>Found: <strong>{item.surplus}</strong></>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}