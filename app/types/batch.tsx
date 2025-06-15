export type TabType = 'Overview' | 'Batch' | 'Processes';

// export interface ProcessAction {
//   id: number;
//   dataID: number;
//   status: number;
//   type: number;
//   comment: string;
//   insertDate: string;
//   effectiveDate: string;
//   updateDate: string;
// }

// export interface Process {
//   dataID: number;
//   insertDate: string;
//   updateDate: string;
//   effectiveDate: string;
//   nric: string;
//   actionType: string;
//   resultData: string;
//   personnelArea: string;
//   processFlags: number;
//   personnelNumber: string;
//   status: string;
//   errorMessage: string;
//   name: string;
//   batchId: string;
//   action: ProcessAction;
// }

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