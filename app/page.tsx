"use client";

import { columns } from "@/components/bom-datatable/columns";
import { DataTable } from "@/components/bom-datatable/data-table";
import { BOMEntry } from "@/lib/models";
import * as React from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081" || "http://localhost:8080";

export default function BomPage() {
  const [data, setData] = React.useState<BOMEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_URL}/api/boms`);
        if (!response.ok) {
          throw new Error(`Failed to fetch BOM data: ${response.statusText}`);
        }
        const bomData = await response.json();
        setData(bomData);
      } catch (err: any) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const memoizedColumns = React.useMemo(() => columns, []);

  if (loading) {
    return <div className="container mx-auto p-4">Loading BOM data from server...</div>;
  }
  
  if (error) {
    return <div className="container mx-auto p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto">
      <div>
        <h1 className="text-2xl font-semibold">Bill of Materials (BOM)</h1>
        <p className="text-muted-foreground text-sm">
          A list of materials from the database, grouped by BOM code.
        </p>
      </div>
      <DataTable columns={memoizedColumns} data={data} />
    </div>
  );
}