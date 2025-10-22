"use client";

import { columns } from "@/components/bom-datatable/columns";
import { DataTable } from "@/components/bom-datatable/data-table";
import { BOMEntry } from "@/lib/models";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Download, Plus, Upload } from "lucide-react";
import BomAddModal from "@/components/bom-datatable/add-modal";
import BomImportModal from "@/components/bom-datatable/import-modal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081" || "http://localhost:8080";

function aggregateBomData(entries: BOMEntry[]): BOMEntry[] {
  const aggregationMap = new Map<string, BOMEntry>();

  for (const entry of entries) {
    const key = `${entry.bomCode}|${entry.partReference}|${entry.partName}`;

    if (aggregationMap.has(key)) {
      const existingEntry = aggregationMap.get(key)!;
      existingEntry.quantity += entry.quantity;
    } else {
      aggregationMap.set(key, { ...entry });
    }
  }

  return Array.from(aggregationMap.values());
}

export default function BomPage() {
  const [data, setData] = React.useState<BOMEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/api/boms`);
      if (!response.ok) {
        throw new Error(`Failed to fetch BOM data: ${response.statusText}`);
      }
      
      const rawBomData: BOMEntry[] = await response.json();
      const aggregatedData = aggregateBomData(rawBomData);
      setData(aggregatedData);

    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const memoizedColumns = React.useMemo(() => columns, []);

  if (loading && data.length === 0) { 
    return <div className="container mx-auto p-4">Loading BOM data from server...</div>;
  }
  
  if (error) {
    return <div className="container mx-auto p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <>
      <BomAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchData} 
      />
      <BomImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchData} 
      />

      <div className="container mx-auto">
        <div className="flex justify-between items-center py-4">
          <div>
            <h1 className="text-2xl font-semibold">Bill of Materials (BOM)</h1>
            <p className="text-muted-foreground text-sm">
              A list of materials from the database, grouped by BOM code.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImportModalOpen(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild 
            >
              <a href={`${API_URL}/api/boms/export`} download>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </a>
            </Button>
            <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Entry
            </Button>
          </div>
        </div>
        <DataTable columns={memoizedColumns} data={data} />
      </div>
    </>
  );
}