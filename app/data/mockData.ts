export interface ActionType {
  type: string;
  count: number;
}

export interface Transaction {
  id: string;
  hrpsDateTime: string;
  pickupDate: string;
  xmlFileCount: number;
  status: 'Success' | 'Fail' | 'Pending';
  actionTypes: ActionType[];
}

export interface Process {
  id: string;
  processDateTime: string;
  batchId: string;
  processType: string;
  status: 'Success' | 'Fail' | 'Pending';
  errorMessage: string;
  duration: string;
}