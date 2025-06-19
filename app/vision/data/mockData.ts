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
}

export interface Attachment {
    id: number;
    attachmentId: number;
    caseId: number;
    attachmentName: string;
    checksum: string;
    uploadDate: string;
    fileSize: number;
    fileType: string;
}

// Mock data
export const mockBatches: Batch[] = [
    {
        id: "BATCH001",
        creationDate: "2024-03-15T10:00:00",
        srCount: 3,
        status: "COMPLETED",
        description: "Q1 2024 Batch Processing",
        batchFolderPath: "/batches/BATCH001"
    },
    {
        id: "BATCH002",
        creationDate: "2024-03-16T14:30:00",
        srCount: 5,
        status: "IN_PROGRESS",
        description: "March 2024 Service Requests",
        batchFolderPath: "/batches/BATCH002"
    },
    {
        id: "BATCH003",
        creationDate: "2024-03-17T09:15:00",
        srCount: 2,
        status: "PENDING",
        description: "Emergency Processing Batch",
        batchFolderPath: "/batches/BATCH003"
    }
];

export const mockServiceRequests: ServiceRequest[] = [
    {
        id: 1,
        caseId: 1001,
        batchId: "BATCH001",
        agency: "HRPS",
        siteAgency: "HQ",
        function: "HR",
        losTaskCode: "HR001",
        srNumber: "SR2024001",
        srSubDate: "2024-03-15T10:30:00",
        reqEmail: "john.doe@example.com",
        customerEmail: "customer1@example.com",
        attachmentCount: 2,
        status: "COMPLETED"
    },
    {
        id: 2,
        caseId: 1002,
        batchId: "BATCH001",
        agency: "HRPS",
        siteAgency: "Branch1",
        function: "Payroll",
        losTaskCode: "PAY001",
        srNumber: "SR2024002",
        srSubDate: "2024-03-15T11:00:00",
        reqEmail: "jane.smith@example.com",
        customerEmail: "customer2@example.com",
        attachmentCount: 1,
        status: "IN_PROGRESS"
    },
    {
        id: 3,
        caseId: 1003,
        batchId: "BATCH002",
        agency: "HRPS",
        siteAgency: "HQ",
        function: "Benefits",
        losTaskCode: "BEN001",
        srNumber: "SR2024003",
        srSubDate: "2024-03-16T15:00:00",
        reqEmail: "mike.johnson@example.com",
        customerEmail: "customer3@example.com",
        attachmentCount: 3,
        status: "PENDING"
    }
];

export const mockAttachments: Attachment[] = [
    {
        id: 1,
        attachmentId: 2001,
        caseId: 1001,
        attachmentName: "document1.pdf",
        checksum: "abc123",
        uploadDate: "2024-03-15T10:35:00",
        fileSize: 1024,
        fileType: "application/pdf"
    },
    {
        id: 2,
        attachmentId: 2002,
        caseId: 1001,
        attachmentName: "image1.jpg",
        checksum: "def456",
        uploadDate: "2024-03-15T10:36:00",
        fileSize: 2048,
        fileType: "image/jpeg"
    },
    {
        id: 3,
        attachmentId: 2003,
        caseId: 1002,
        attachmentName: "document2.pdf",
        checksum: "ghi789",
        uploadDate: "2024-03-15T11:05:00",
        fileSize: 1536,
        fileType: "application/pdf"
    }
]; 