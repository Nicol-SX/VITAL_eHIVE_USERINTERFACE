export interface Batch {
    id: string;
    creationDate: string;
    srCount: number;
    status: string;
    description: string;
    batchFolderPath: string;
}

export interface ServiceRequest {
    id: number;
    caseId: number;
    batchId: string;
    agency: string;
    siteAgency: string;
    function: string;
    losTaskCode: string;
    srNumber: string;
    srSubDate: string;
    reqEmail: string;
    customerEmail: string;
    attachmentCount: number;
    status: string;
    errorMessage: string;
}

interface AttachmentAction{
    id: number;
    attachId: number;
    srNumber: string;
    status: number;
    comment: string;
}

export interface Attachment {
    id: number;
    attachmentId: number;
    caseId: number;
    batchId: string;
    srNumber: string;
    nric: string;
    attachmentName: string;
    checksum: string;
    uploadDate: string;
    fileSize: number;
    fileType: string;
    status: string;
    errorMessage: string;
    action: AttachmentAction;
}

// Mock data
export const mockBatches: Batch[] = [
    {
        id: "20250403_VE01",
        creationDate: "2024-03-15T10:00:00",
        srCount: 3,
        status: "COMPLETED",
        description: "-",
        batchFolderPath: "/batches/20250403_VE01"
    },
    {
        id: "20250401_VE01",
        creationDate: "2024-03-16T14:30:00",
        srCount: 5,
        status: "FAIL",
        description: "Number of SR folders does not match with XML file",
        batchFolderPath: "/batches/20250403_VE01"
    },
    {
        id: "20250330_VE01",
        creationDate: "2024-03-17T09:15:00",
        srCount: 2,
        status: "PENDING",
        description: "XML file failed to parse. Might be corrupted or invalid format",
        batchFolderPath: "/batches/20250330_VE01"
    },
    {
        id: "20250329_VE01",
        creationDate: "2024-03-15T10:00:00",
        srCount: 1,
        status: "COMPLETED",
        description: "-",
        batchFolderPath: "/batches/20250329_VE01"
    },
    {
        id: "20250303_VE01",
        creationDate: "2024-03-15T10:00:00",
        srCount: 3,
        status: "COMPLETED",
        description: "-",
        batchFolderPath: "/batches/20250303_VE01"
    },
    {
        id: "20250301_VE01",
        creationDate: "2024-03-15T10:00:00",
        srCount: 3,
        status: "COMPLETED",
        description: "-",
        batchFolderPath: "/batches/20250301_VE01"
    },
    {
        id: "20250228_VE01",
        creationDate: "2024-03-15T10:00:00",
        srCount: 1,
        status: "PENDING",
        description: "-",
        batchFolderPath: "/batches/20250228_VE01"
    },
    {
        id: "20250227_VE01",
        creationDate: "2024-03-15T10:00:00",
        srCount: 3,
        status: "FAIL",
        description: "-",
        batchFolderPath: "/batches/20250227_VE01"
    },
    {
        id: "20250219_VE01",
        creationDate: "2024-03-15T10:00:00",
        srCount: 3,
        status: "COMPLETED",
        description: "-",
        batchFolderPath: "/batches/20250219_VE01"
    },
];

export const mockServiceRequests: ServiceRequest[] = [
    {
        id: 1,
        caseId: 1001,
        batchId: "20250401_VE01",
        agency: "HRPS",
        siteAgency: "HQ",
        function: "HR",
        losTaskCode: "HR001",
        srNumber: "SR2024001",
        srSubDate: "2024-03-15T10:30:00",
        reqEmail: "john.doe@example.com",
        customerEmail: "customer1@example.com",
        attachmentCount: 2,
        status: "COMPLETED",
        errorMessage: "XML file failed to parse. Might be corrupted or invalid format"
    },
    {
        id: 2,
        caseId: 1002,
        batchId: "20250401_VE01",
        agency: "HRPS",
        siteAgency: "Branch1",
        function: "Payroll",
        losTaskCode: "PAY001",
        srNumber: "SR2024002",
        srSubDate: "2024-03-15T11:00:00",
        reqEmail: "jane.smith@example.com",
        customerEmail: "customer2@example.com",
        attachmentCount: 1,
        status: "IN_PROGRESS",
        errorMessage: "Number of SR folders does not match with XML file"
    },
    {
        id: 3,
        caseId: 1003,
        batchId: "20250401_VE01",
        agency: "HRPS",
        siteAgency: "HQ",
        function: "HR",
        losTaskCode: "HR001",
        srNumber: "SR2024003",
        srSubDate: "2024-03-15T10:30:00",
        reqEmail: "john.doe@example.com",
        customerEmail: "customer1@example.com",
        attachmentCount: 2,
        status: "COMPLETED",
        errorMessage: "XML file failed to parse. Might be corrupted or invalid format"
    },
    {
        id: 4,
        caseId: 1004,
        batchId: "20250401_VE01",
        agency: "HRPS",
        siteAgency: "HQ",
        function: "HR",
        losTaskCode: "HR001",
        srNumber: "SR2024004",
        srSubDate: "2024-03-15T10:30:00",
        reqEmail: "john.doe@example.com",
        customerEmail: "customer1@example.com",
        attachmentCount: 2,
        status: "COMPLETED",
        errorMessage: "XML file failed to parse. Might be corrupted or invalid format"
    },
    {
        id: 5,
        caseId: 1005,
        batchId: "20250401_VE01",
        agency: "HRPS",
        siteAgency: "HQ",
        function: "HR",
        losTaskCode: "HR001",
        srNumber: "SR2024005",
        srSubDate: "2024-03-15T10:30:00",
        reqEmail: "john.doe@example.com",
        customerEmail: "customer1@example.com",
        attachmentCount: 2,
        status: "COMPLETED",
        errorMessage: "XML file failed to parse. Might be corrupted or invalid format"
    },
    {
        id: 6,
        caseId: 1006,
        batchId: "20250227_VE01",
        agency: "HRPS",
        siteAgency: "HQ",
        function: "Benefits",
        losTaskCode: "BEN001",
        srNumber: "SR2024006",
        srSubDate: "2024-03-16T15:00:00",
        reqEmail: "mike.johnson@example.com",
        customerEmail: "customer3@example.com",
        attachmentCount: 3,
        status: "PENDING",
        errorMessage: "Number of SR folders does not match with XML file"
    },
    {
        id: 7,
        caseId: 1007,
        batchId: "20250227_VE01",
        agency: "HRPS",
        siteAgency: "HQ",
        function: "Benefits",
        losTaskCode: "BEN001",
        srNumber: "SR2024007",
        srSubDate: "2024-03-16T15:00:00",
        reqEmail: "mike.johnson@example.com",
        customerEmail: "customer3@example.com",
        attachmentCount: 3,
        status: "PENDING",
        errorMessage: "Number of SR folders does not match with XML file"
    },
    {
        id: 8,
        caseId: 1008,
        batchId: "20250227_VE01",
        agency: "HRPS",
        siteAgency: "HQ",
        function: "Benefits",
        losTaskCode: "BEN001",
        srNumber: "SR2024008",
        srSubDate: "2024-03-16T15:00:00",
        reqEmail: "mike.johnson@example.com",
        customerEmail: "customer3@example.com",
        attachmentCount: 3,
        status: "PENDING",
        errorMessage: "Number of SR folders does not match with XML file"
    }
];

export const mockAttachments: Attachment[] = [
    {
        id: 1,
        attachmentId: 2001,
        caseId: 1001,
        batchId: "20250401_VE01",
        srNumber: "SR2024001",
        nric: "S1234567A",
        attachmentName: "document1.pdf",
        checksum: "abc123",
        uploadDate: "2024-03-15T10:35:00",
        fileSize: 1024,
        fileType: "application/pdf",
        status: "COMPLETED",
        errorMessage: "-",
        action: {
            id: 1,
            attachId: 2001,
            srNumber: "SR2024001",
            status: 1,
            comment: ""
        }
    },
    {
        id: 2,
        attachmentId: 2002,
        caseId: 1001,
        batchId: "20250401_VE01",
        srNumber: "SR2024001",
        nric: "S1234599C",
        attachmentName: "image1.jpg",
        checksum: "def456",
        uploadDate: "2024-03-15T10:36:00",
        fileSize: 2048,
        fileType: "image/jpeg",
        status: "PENDING",
        errorMessage: "XML file failed to parse. Might be corrupted or invalid format",
        action:{
            id: 2,
            attachId: 2002,
            srNumber: "SR2024001",
            status: 0,
            comment: "XML file failed to parse. Might be corrupted or invalid format"
        }
    },
    {
        id: 3,
        attachmentId: 2003,
        caseId: 1002,
        batchId: "20250401_VE01",
        srNumber: "SR2024002",
        nric: "S1234500A",
        attachmentName: "document2.pdf",
        checksum: "ghi789",
        uploadDate: "2024-03-15T11:05:00",
        fileSize: 1536,
        fileType: "application/pdf",
        status: "FAIL",
        errorMessage: "XML file failed to parse. Might be corrupted or invalid format",
        action:{
            id: 3,
            attachId: 2003,
            srNumber: "SR2024002",
            status: 1,
            comment: "XML file failed to parse. Might be corrupted or invalid format"
        }
    },
    {
        id: 4,
        attachmentId: 2004,
        caseId: 1003,
        batchId: "20250401_VE01",
        srNumber: "SR2024003",
        nric: "S1234567A",
        attachmentName: "document1.pdf",
        checksum: "abc123",
        uploadDate: "2024-03-15T10:35:00",
        fileSize: 1024,
        fileType: "application/pdf",
        status: "FAIL",
        errorMessage: "-",
        action: {
            id: 4,
            attachId: 2004,
            srNumber: "SR2024003",
            status: 1,
            comment: ""
        }
    },
    {
        id: 5,
        attachmentId: 2005,
        caseId: 1003,
        batchId: "20250401_VE01",
        srNumber: "SR2024003",
        nric: "S1234567A",
        attachmentName: "document1.pdf",
        checksum: "abc123",
        uploadDate: "2024-03-15T10:35:00",
        fileSize: 1024,
        fileType: "application/pdf",
        status: "COMPLETED",
        errorMessage: "-",
        action: {
            id: 5,
            attachId: 2005,
            srNumber: "SR2024003",
            status: 1,
            comment: ""
        }
    },
    {
        id: 6,
        attachmentId: 2006,
        caseId: 1004,
        batchId: "20250401_VE01",
        srNumber: "SR2024004",
        nric: "S1234567A",
        attachmentName: "document1.pdf",
        checksum: "abc123",
        uploadDate: "2024-03-15T10:35:00",
        fileSize: 1024,
        fileType: "application/pdf",
        status: "COMPLETED",
        errorMessage: "-",
        action: {
            id: 6,
            attachId: 2006,
            srNumber: "SR2024004",
            status: 1,
            comment: ""
        }
    },
    {
        id: 7,
        attachmentId: 2007,
        caseId: 1004,
        batchId: "20250401_VE01",
        srNumber: "SR2024004",
        nric: "S1234567A",
        attachmentName: "document1.pdf",
        checksum: "abc123",
        uploadDate: "2024-03-15T10:35:00",
        fileSize: 1024,
        fileType: "application/pdf",
        status: "COMPLETED",
        errorMessage: "-",
        action: {
            id: 1,
            attachId: 2007,
            srNumber: "SR2024004",
            status: 1,
            comment: ""
        }
    },
    {
        id: 8,
        attachmentId: 2008,
        caseId: 1005,
        batchId: "20250401_VE01",
        srNumber: "SR2024005",
        nric: "S1234567A",
        attachmentName: "document1.pdf",
        checksum: "abc123",
        uploadDate: "2024-03-15T10:35:00",
        fileSize: 1024,
        fileType: "application/pdf",
        status: "FAIL",
        errorMessage: "-",
        action: {
            id: 8,
            attachId: 2008,
            srNumber: "SR2024005",
            status: 1,
            comment: ""
        }
    },
    {
        id: 9,
        attachmentId: 2009,
        caseId: 1005,
        batchId: "20250401_VE01",
        srNumber: "SR2024005",
        nric: "S1234567A",
        attachmentName: "document1.pdf",
        checksum: "abc123",
        uploadDate: "2024-03-15T10:35:00",
        fileSize: 1024,
        fileType: "application/pdf",
        status: "COMPLETED",
        errorMessage: "-",
        action: {
            id: 9,
            attachId: 2009,
            srNumber: "SR2024005",
            status: 1,
            comment: ""
        }
    },
    {
        id: 10,
        attachmentId: 2010,
        caseId: 1006,
        batchId: "20250227_VE01",
        srNumber: "SR2024006",
        nric: "S1234567A",
        attachmentName: "document1.pdf",
        checksum: "abc123",
        uploadDate: "2024-03-15T10:35:00",
        fileSize: 1024,
        fileType: "application/pdf",
        status: "OTHERS",
        errorMessage: "-",
        action: {
            id: 1,
            attachId: 2010,
            srNumber: "SR2024006",
            status: 1,
            comment: "Will review in the future"
        }
    },{
        id: 11,
        attachmentId: 2011,
        caseId: 1006,
        batchId: "20250227_VE01",
        srNumber: "SR2024006",
        nric: "S1234567A",
        attachmentName: "document1.pdf",
        checksum: "abc123",
        uploadDate: "2024-03-15T10:35:00",
        fileSize: 1024,
        fileType: "application/pdf",
        status: "OTHERS",
        errorMessage: "-",
        action: {
            id: 11,
            attachId: 2011,
            srNumber: "SR2024006",
            status: 1,
            comment: "Issue settled"
        }
    },{
        id: 12,
        attachmentId: 2012,
        caseId: 1006,
        batchId: "20250227_VE01",
        srNumber: "SR2024006",
        nric: "S1234567A",
        attachmentName: "document1.pdf",
        checksum: "abc123",
        uploadDate: "2024-03-15T10:35:00",
        fileSize: 1024,
        fileType: "application/pdf",
        status: "COMPLETED",
        errorMessage: "-",
        action: {
            id: 1,
            attachId: 2012,
            srNumber: "SR2024006",
            status: 1,
            comment: ""
        }
    },{
        id: 13,
        attachmentId: 2013,
        caseId: 1007,
        batchId: "20250227_VE01",
        srNumber: "SR2024007",
        nric: "S1234567A",
        attachmentName: "document1.pdf",
        checksum: "abc123",
        uploadDate: "2024-03-15T10:35:00",
        fileSize: 1024,
        fileType: "application/pdf",
        status: "COMPLETED",
        errorMessage: "-",
        action: {
            id: 1,
            attachId: 2013,
            srNumber: "SR2024007",
            status: 1,
            comment: ""
        }
    },{
        id: 14,
        attachmentId: 2014,
        caseId: 1007,
        batchId: "20250227_VE01",
        srNumber: "SR2024007",
        nric: "S1234567A",
        attachmentName: "document1.pdf",
        checksum: "abc123",
        uploadDate: "2024-03-15T10:35:00",
        fileSize: 1024,
        fileType: "application/pdf",
        status: "COMPLETED",
        errorMessage: "-",
        action: {
            id: 1,
            attachId: 2014,
            srNumber: "SR2024007",
            status: 1,
            comment: ""
        }
    },{
        id: 15,
        attachmentId: 2015,
        caseId: 1007,
        batchId: "20250227_VE01",
        srNumber: "SR2024007",
        nric: "S1234567A",
        attachmentName: "document1.pdf",
        checksum: "abc123",
        uploadDate: "2024-03-15T10:35:00",
        fileSize: 1024,
        fileType: "application/pdf",
        status: "FAIL",
        errorMessage: "-",
        action: {
            id: 1,
            attachId: 2015,
            srNumber: "SR20240017",
            status: 1,
            comment: ""
        }
    },{
        id: 16,
        attachmentId: 2016,
        caseId: 1008,
        batchId: "20250227_VE01",
        srNumber: "SR2024008",
        nric: "S1234567A",
        attachmentName: "document1.pdf",
        checksum: "abc123",
        uploadDate: "2024-03-15T10:35:00",
        fileSize: 1024,
        fileType: "application/pdf",
        status: "COMPLETED",
        errorMessage: "-",
        action: {
            id: 1,
            attachId: 2016,
            srNumber: "SR2024008",
            status: 1,
            comment: ""
        }
    },
    {
        id: 17,
        attachmentId: 2017,
        caseId: 1008,
        batchId: "20250227_VE01",
        srNumber: "SR2024008",
        nric: "S1234567A",
        attachmentName: "document1.pdf",
        checksum: "abc123",
        uploadDate: "2024-03-15T10:35:00",
        fileSize: 1024,
        fileType: "application/pdf",
        status: "REVIEWED",
        errorMessage: "-",
        action: {
            id: 17,
            attachId: 2017,
            srNumber: "SR2024008",
            status: 1,
            comment: ""
        }
    },
    {
        id: 18,
        attachmentId: 2018,
        caseId: 1008,
        batchId: "20250227_VE01",
        srNumber: "SR2024008",
        nric: "S1234567A",
        attachmentName: "document1.pdf",
        checksum: "abc123",
        uploadDate: "2024-03-15T10:35:00",
        fileSize: 1024,
        fileType: "application/pdf",
        status: "FAIL",
        errorMessage: "-",
        action: {
            id: 18,
            attachId: 2018,
            srNumber: "SR2024008",
            status: 1,
            comment: ""
        }
    },
]; 