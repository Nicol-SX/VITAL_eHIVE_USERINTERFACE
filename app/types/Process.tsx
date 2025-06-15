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