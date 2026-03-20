export interface Place {
  id: string;
  name: string;
  address: string;
  category: string;
  tags: string[];
  memo: string;
  url: string; // Google Maps URL
  lat?: number;
  lng?: number;
  createdAt: string;
  updatedAt: string;
}

export type SortKey = 'name' | 'category' | 'createdAt';
