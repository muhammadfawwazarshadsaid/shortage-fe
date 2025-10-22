export interface BOMEntry {
  id: number;
  bomCode: string;
  partReference: string;
  partName: string;
  partDescription: string;
  quantity: number;
  hasDetectionResult: boolean; 
  isFinalized: boolean;       
}

export interface ActionItem {
    id: number;
    bomCode: string;
    partName: string;
    itemType: 'SHORTAGE' | 'UNLISTED';
    quantityDiff: number;
    status: 'BARU_MASUK' | 'DITINDAKLANJUTI' | 'SELESAI';
    createdAt: string; 
    updatedAt: string; 
}
