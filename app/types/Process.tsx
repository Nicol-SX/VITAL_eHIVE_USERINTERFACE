 // Add type for sortable columns
 export type ProcessSortableColumn = 'batchJobId' |'personnelNumber' | 'insertDate' |'nric' |'personnelNumber' | 'actionType' | 'personnelArea' | 'status' | 'errorMessage';

// Update StatusMonitoringProps interface
export interface StatusMonitoringProps {
    defaultTab: 'Overview' | 'Batch' | 'Processes';
    selectedBatchId?: string;
  }

export interface ProcessAction {
    id: number;
    dataID: number;
    status: number;
    type: number;
    comment: string;
    insertDate: string;
    effectiveDate: string;
    updateDate: string;
  }

 export interface Process {
    dataID: number;
    insertDate: string;
    updateDate: string;
    effectiveDate: string;
    nric: string;
    actionType: string;
    resultData: string;
    personnelArea: string;
    processFlags: number;
    personnelNumber: string;
    status: string;
    errorMessage: string;
    name: string;
    batchJobId: number
    action: ProcessAction;
  }
    
  // Update Transaction interface
  export interface Transaction {
    id: number;
    batchJobId: number;
    hrpsDateTime: string;
    pickupDate: string;
    xmlFileCount: number;
    status: 'Success' | 'Pending' | 'Fail';
    createdDate: string;
    lastUpdatedDate: string;
  }
