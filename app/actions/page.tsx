"use client";
import * as React from "react";

import { getActionItemColumns } from "@/components/action-items-datatable/columns";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { ActionItem } from "@/lib/models"; 
import { DataTable } from "@/components/action-items-datatable/data-table";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081" || "http://localhost:8080";

export default function ActionItemsPage() {
    const [data, setData] = React.useState<ActionItem[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    const fetchData = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/api/action-items`);
            if (!response.ok) {
                throw new Error("Failed to fetch data.");
            }
            const result = await response.json();
            
            setData(result || []);

        } catch (error: any) {
            console.error("Failed to fetch action items", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, []);
    
    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    const memoizedColumns = React.useMemo(() => getActionItemColumns(fetchData), [fetchData]);

    return (
        <div className="container mx-auto">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-semibold">Actionable Items</h1>
                    <p className="text-muted-foreground text-sm">
                        List of shortages and unlisted items that require follow-up.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>
            
            {error && <p className="text-red-500">Error: {error}</p>}
            
            {loading ? (
                <p>Loading...</p> 
            ) : (
                <DataTable columns={memoizedColumns} data={data} />
            )}
        </div>
    );
}