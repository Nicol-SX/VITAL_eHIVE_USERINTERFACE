export type TabType = 'Overview' | 'Batch' | 'Processes';

export type BatchSortableColumn = 'batchJobId' | 'hrpsDateTime' | 'pickupDate' | 'totalCSVFiles' | 'status';

export interface FetchBatchOptions {
  page?: number;
  limit?: number;
  dateRange?: string;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  searchTerm?: string;
}

export interface Batch {
  batchJobId: number;
  hrpsDateTime: string;
  pickupDate: string;
  totalCSVFiles: number;
  status: string;
  createdDate: string;
  lastUpdatedDate: string;
}

export interface ActionType {
  type: string;
  count: number;
}

export interface BatchProps {
  defaultTab?: 'Overview' | 'Batch' | 'Processes';
}

export type SortableColumn = 'hrpsDateTime' | 'pickupDate' | 'totalCSVFiles' | 'status' | 'batchJobId';

export interface Transaction {
  batchJobId: number;
  hrpsDateTime: string;
  pickupDate: string;
  totalCSVFiles: number;
  status: string;
  createdDate: string;
  lastUpdatedDate: string;
}