'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mockServiceRequests, mockAttachments } from '../data/mockData';
import AttachmentPopUp from './AttachmentPopUp';

interface ServiceRequest {
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

interface ServiceRequestProps {
    defaultTab: 'Overview' | 'Batch' | 'Service Requests';
    defaultServiceRequestId?: string;
}

// Update getStatusText function
const getStatusText = (status: string): string => {
    return status;
};

// Update getStatusStyle function
const getStatusStyle = (status: string): { bgColor: string; textColor: string; dotColor: string } => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return { bgColor: 'bg-green-100', textColor: 'text-green-800', dotColor: 'bg-green-600' };
      case 'FAIL':
        return { bgColor: 'bg-red-100', textColor: 'text-red-800', dotColor: 'bg-red-600' };
      case 'PENDING':
        return { bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', dotColor: 'bg-yellow-600' };
      case 'IN_PROGRESS':
        return { bgColor: 'bg-blue-100', textColor: 'text-blue-800', dotColor: 'bg-blue-600' };
      case 'CANCELLED':
        return { bgColor: 'bg-gray-100', textColor: 'text-gray-800', dotColor: 'bg-gray-600' };
      case 'REVIEWED':
        return { bgColor: 'bg-purple-100', textColor: 'text-purple-800', dotColor: 'bg-purple-600' };
      case 'OTHERS':
        return { bgColor: 'bg-gray-100', textColor: 'text-gray-800', dotColor: 'bg-gray-600' };
      default:
        return { bgColor: 'bg-gray-100', textColor: 'text-gray-800', dotColor: 'bg-gray-600' };
    }
};

type DateRangeOption = 'Last 7 days' | 'Last 30 days' | 'Last 3 months' | 'Last 6 months' | 'Last 1 year';

export default function ServiceRequest({ defaultTab, defaultServiceRequestId }: ServiceRequestProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'Overview' | 'Batch' | 'Service Requests' | 'Attachments'>(defaultTab || 'Service Requests');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [searchDate, setSearchDate] = useState('');
    const [dateRange, setDateRange] = useState<DateRangeOption>('Last 7 days');
    const [selectedServiceRequestId, setSelectedServiceRequestId] = useState<string | undefined>(defaultServiceRequestId);
    const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDateRange, setSelectedDateRange] = useState<DateRangeOption>('Last 7 days');
    const [showDateRangeDropdown, setShowDateRangeDropdown] = useState(false);
    const [sortColumn, setSortColumn] = useState<keyof ServiceRequest | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
    const [selectAll, setSelectAll] = useState(false);

    const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
    //const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);


    const totalRecords = mockServiceRequests.length;
    const totalPages = Math.ceil(totalRecords / rowsPerPage);

    const dateRangeOptions = [
        'Last 7 days',
        'Last 30 days',
        'Last 3 months',
        'Last 6 months',
        'Last 1 year'
    ] as const;

    // Navigation handler
    const handleTabChange = (tab: 'Overview' | 'Batch' | 'Service Requests' | 'Attachments') => {
        if (tab === activeTab) return;

        switch (tab) {
            case 'Overview':
                router.push('/vision');
                break;
            case 'Batch':
                router.push('/vision/batch');
                break;
            case 'Service Requests':
                router.push('/vision/service-requests');
                break;
            case 'Attachments':
                router.push('/vision/attachments');
                break;
        }
    };

    const handleSearch = (searchTerm: string) => {
        setSearchDate(searchTerm);
        setPage(0); // Reset to first page when filtering
    };

    const handleDateRangeChange = (range: DateRangeOption) => {
        setSelectedDateRange(range);
        setPage(0); // Reset to first page when changing date range
    };

    const handleSelectAll = () => {
        setSelectAll(!selectAll);
        setSelectedRows(new Set(serviceRequests.map(sr => sr.id)));
    };

    const handleCheckboxChange = (id: number) => {
        const newSelectedRows = new Set(selectedRows);
        if (newSelectedRows.has(id)) {
            newSelectedRows.delete(id);
        } else {
            newSelectedRows.add(id);
        }
        setSelectedRows(newSelectedRows);
    };

    useEffect(() => {
        // Simulate API call with mock data
        setIsLoading(true);
        try {
            // Filter service requests based on search term
            const filteredServiceRequests = mockServiceRequests.filter(sr => 
                sr.srNumber.toLowerCase().includes(searchDate.toLowerCase()) ||
                sr.agency.toLowerCase().includes(searchDate.toLowerCase()) ||
                sr.customerEmail.toLowerCase().includes(searchDate.toLowerCase())
            );
            setServiceRequests(filteredServiceRequests);
            setError(null);
        } catch (err) {
            setError('Failed to fetch service requests');
        } finally {
            setIsLoading(false);
        }
    }, [searchDate, dateRange, page, rowsPerPage]);

    const handleUpdateStatus = (id: number) => {
        // Implement the logic to update the status of a service request
        console.log(`Updating status for service request with id: ${id}`);
    };

    // const onPopupSubmit = (status: 'Reviewed' | 'Others', rawComment?: string) => {
    //     // // Batch update
    //     // if (!selectedProcess && selectedRows.size > 0) {
    //     //   Array.from(selectedRows).forEach((id) => {
    //     //     const proc = processes.find((p) => p.dataID === id);
    //     //     if (proc) {
    //     //       handleStatusUpdate(status, rawComment ?? '', proc.dataID, proc.processFlags);
    //     //     }
    //     //   });
    //     //   setSelectedRows(new Set());
    //     //   setIsStatusModalOpen(false);
    //     //   return;
    //     // }
    //     // // Single row update
    //     // if (selectedProcess) {
    //     //   handleStatusUpdate(status, rawComment ?? '', selectedProcess.dataID, selectedProcess.processFlags);
    //     //   setIsStatusModalOpen(false);
    //     //   setSelectedProcess(null);
    //     // }
    //   };

    const handleViewAttachments = (id: number) => {
        // Implement the logic to view attachments of a service request
        
        console.log(`Viewing attachments for service request with id: ${id}`);
    };

    return (
        <div>
            <div className="flex h-screen w-screen">
            {/* Sidebar - Fixed on left */}
            <div className="w-24 bg-[#1a4f82] text-white sticky top-0 left-0 h-screen z-[1000]">
                <div className="p-4 flex flex-col items-center space-y-8">
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-2">
                            <span className="text-[#1a4f82] font-bold">H</span>
                        </div>
                        <span className="text-xs">HRPS</span>
                    </div>

                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-2">
                            <span className="text-[#1a4f82] font-bold">V</span>
                        </div>
                        <span className="text-xs">VISION</span>
                    </div>
                </div>
            </div>

            {/* Main Content Area - Flex column layout */}
            <div className="flex-1 flex flex-col h-screen relative">
                {/* Header Section - Sticky top */}
                <div className="sticky top-0 z-10 bg-white">
                    <div className="border-b">
                        <div className="px-4 sm:px-6 py-4">
                            <h1 className="text-lg sm:text-xl font-medium">Service Requests</h1>
                        </div>
                    </div>

                                        {/* Tabs */}
                                        <div className="px-4 sm:px-6 border-b">
                        <div className="flex flex-wrap sm:flex-nowrap space-x-4 sm:space-x-8">
                        <button
                            // Overview tab is greyed out and disabled
                            disabled
                            className={
                            'py-4 px-2 relative text-gray-400 cursor-not-allowed bg-gray-100'
                            }
                        >
                            Overview
                            {/* No underline for Overview since it's disabled */}
                        </button>
                        <button
                            onClick={() => handleTabChange('Batch')}
                            className={`py-4 px-2 relative ${
                            activeTab === 'Batch'
                                ? 'text-[#1a4f82] font-medium'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Batch
                            {activeTab === 'Batch' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1a4f82]"></div>
                            )}
                        </button>
                        <button
                            onClick={() => handleTabChange('Service Requests')}
                            className={`py-4 px-2 relative ${
                            activeTab === 'Service Requests'
                                ? 'text-[#1a4f82] font-medium'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Service Requests
                            {activeTab === 'Service Requests' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1a4f82]"></div>
                            )}
                        </button>
                        <button
                            onClick={() => handleTabChange('Attachments')}
                            className={`py-4 px-2 relative ${
                            activeTab === 'Attachments'
                                ? 'text-[#1a4f82] font-medium'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Attachments
                            {activeTab === 'Attachments' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1a4f82]"></div>
                            )}
                        </button>
                        </div>
                    </div>


                    {/* Search and Controls */}
                    <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-4 w-full">
                        {/* {renderBatchFilter()} */}
                        <div className="flex items-center space-x-2">
                        <span className="text-sm whitespace-nowrap">Search</span>
                        <div className="relative flex-1 sm:flex-none">
                            <input
                            type="text"
                            id="search-input"
                            name="search"
                            value={searchDate}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder={`Search ${activeTab.toLowerCase()}...`}
                            className="border rounded px-3 py-1 text-sm w-full sm:w-64 focus:outline-none focus:border-[#1a4f82] pr-8"
                            aria-label="Search service request"
                            />
                            {searchDate && (
                            <button
                                onClick={() => handleSearch('')}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                aria-label="Clear search"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            )}
                        </div>
                        <div className="relative flex items-center">
                        {selectedRows.size > 0 && (
                            <div className="flex items-center ">
                            {/* <button
                                onClick={() => {
                                //setSelectedProcess(null); // batch mode, not single process
                                //setIsStatusModalOpen(true);
                                }}
                                className="bg-[#1a4f82] hover:bg-[#15406c] px-3 py-1 rounded-md text-white text-sm font-medium flex items-center"
                            >
                                Update Status
                                <div></div>
                            </button> */}
                            <button
                                onClick={() => {
                                setSelectedRows(new Set());
                                setSelectAll(false);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                                aria-label="Clear selected rows"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                            </div>
                        )}
                        </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4 w-full sm:w-auto justify-end">
                        <div className="relative">
                        <button
                            onClick={() => setShowDateRangeDropdown((prev) => !prev)}
                            className="flex items-center space-x-2 hover:bg-gray-50 px-3 py-2 rounded-md whitespace-nowrap"
                        >
                            <span className="text-sm">{selectedDateRange}</span>
                            <svg className={`w-4 h-4 transition-transform ${showDateRangeDropdown ? 'transform rotate-180' : ''}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {showDateRangeDropdown && (
                            <div
                            className="absolute right-0 mt-2 bg-white rounded-md shadow-lg z-50 border max-h-96 overflow-y-auto min-w-[10rem]"
                            role="listbox"
                            aria-label="Date range options"
                            >
                            {dateRangeOptions.map((option) => (
                                <button
                                key={option}
                                onClick={() => {
                                    setSelectedDateRange(option);
                                    setShowDateRangeDropdown(false);
                                }}
                                className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                                    selectedDateRange === option ? 'bg-gray-50 text-[#1a4f82]' : 'text-gray-700'
                                }`}
                                role="option"
                                aria-selected={selectedDateRange === option}
                                >
                                {option}
                                </button>
                            ))}
                            </div>
                        )}
                        </div>
                        <div className="relative">
                        <button 
                            onClick={() => {
                            //downloadCSV(processes, 'process_table.csv');
                            }}
                            className="flex items-center space-x-2 text-sm text-[#1a4f82] hover:bg-blue-50 px-3 py-2 rounded-md whitespace-nowrap"
                            aria-label="Download CSV"
                        >
                            <svg 
                            className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                            </svg>
                            <span>Download CSV</span>
                        </button>
                        </div>
                    </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="flex-1 overflow-auto">
                    <div className="min-w-full">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-[#1a4f82]">
                                    <tr>
                                        <th scope="col" className="w-[5%] px-4 sm:px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200">
                                            <input
                                                type="checkbox"
                                                checked={selectAll}
                                                onChange={handleSelectAll}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                        </th>
                                        <th scope="col" className="w-[15%] px-4 sm:px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c] whitespace-nowrap">
                                            <div className="flex items-center space-x-1">
                                                <span>BATCH ID</span>
                                                {sortColumn === 'batchId' && (
                                                    <svg 
                                                        className={`w-4 h-4 transition-transform ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`}
                                                        fill="none" 
                                                        stroke="currentColor" 
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                )}
                                            </div>
                                        </th>
                                        <th scope="col" className="w-[15%] px-4 sm:px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c] whitespace-nowrap">
                                            <div className="flex items-center space-x-1">
                                                <span>SR NUMBER</span>
                                                {sortColumn === 'srNumber' && (
                                                    <svg 
                                                        className={`w-4 h-4 transition-transform ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`}
                                                        fill="none" 
                                                        stroke="currentColor" 
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                )}
                                            </div>
                                        </th>

                                        <th scope="col" className="w-[15%] px-4 sm:px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c] whitespace-nowrap">
                                            <div className="flex items-center space-x-1">
                                                <span>EMAIL</span>
                                                {sortColumn === 'customerEmail' && (
                                                    <svg 
                                                        className={`w-4 h-4 transition-transform ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`}
                                                        fill="none" 
                                                        stroke="currentColor" 
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                )}
                                            </div>
                                        </th>

                                        <th scope="col" className="w-[15%] px-4 sm:px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c] whitespace-nowrap">
                                            <div className="flex items-center space-x-1">
                                                <span>AGENCY</span>
                                                {sortColumn === 'agency' && (
                                                    <svg 
                                                        className={`w-4 h-4 transition-transform ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`}
                                                        fill="none" 
                                                        stroke="currentColor" 
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                )}
                                            </div>
                                        </th>
                                        <th scope="col" className="w-[15%] px-4 sm:px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c] whitespace-nowrap">
                                            <div className="flex items-center space-x-1">
                                                <span>FUNCTION</span>
                                                {sortColumn === 'function' && (
                                                    <svg 
                                                        className={`w-4 h-4 transition-transform ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`}
                                                        fill="none" 
                                                        stroke="currentColor" 
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                )}
                                            </div>
                                        </th>
                                        <th scope="col" className="w-[10%] px-4 sm:px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c] whitespace-nowrap">
                                            <div className="flex items-center space-x-1">
                                                <span>STATUS</span>
                                                {sortColumn === 'status' && (
                                                    <svg 
                                                        className={`w-4 h-4 transition-transform ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`}
                                                        fill="none" 
                                                        stroke="currentColor" 
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                )}
                                            </div>
                                        </th>
                                        <th scope="col" className="w-[15%] px-4 sm:px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c] whitespace-nowrap">
                                            <div className="flex items-center space-x-1">
                                                <span>ERROR MESSAGE</span>
                                                {sortColumn === 'errorMessage' && (
                                                    <svg 
                                                        className={`w-4 h-4 transition-transform ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`}
                                                        fill="none" 
                                                        stroke="currentColor" 
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                )}
                                            </div>
                                        </th>
                                        <th scope="col" className="w-[10%] px-4 sm:px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c] whitespace-nowrap">
                                            <div className="flex items-center space-x-1">
                                                <span>ATTACHMENTS</span>
                                                {sortColumn === 'attachmentCount' && (
                                                    <svg 
                                                        className={`w-4 h-4 transition-transform ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`}
                                                        fill="none" 
                                                        stroke="currentColor" 
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                )}
                                            </div>
                                        </th>
                                        
                                        <th scope="col" className="w-[10%] px-4 sm:px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 whitespace-nowrap">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={9} className="px-4 sm:px-6 py-4 text-center">
                                                <div className="flex justify-center items-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a4f82]"></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : error ? (
                                        <tr>
                                            <td colSpan={9} className="px-4 sm:px-6 py-4 text-center text-red-600">
                                                {error}
                                            </td>
                                        </tr>
                                    ) : serviceRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="px-4 sm:px-6 py-4 text-center text-gray-500">
                                                No service requests found
                                            </td>
                                        </tr>
                                    ) : (
                                        serviceRequests.map((request) => {
                                            const attachments = mockAttachments.filter(a => a.caseId === request.caseId);
                                            return (
                                                <tr key={request.id} className="hover:bg-gray-50">
                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap border border-gray-200">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedRows.has(request.id)}
                                                            onChange={() => handleCheckboxChange(request.id)}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                        />
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap border border-gray-200">
                                                        {request.batchId}
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap border border-gray-200">
                                                        {request.srNumber}
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap border border-gray-200">
                                                        {request.customerEmail}
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap border border-gray-200">
                                                        {request.agency}
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap border border-gray-200">
                                                        {request.function}
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap border border-gray-200">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(request.status).bgColor} ${getStatusStyle(request.status).textColor}`}>
                                                            <span className={`w-2 h-2 rounded-full ${getStatusStyle(request.status).dotColor} mr-1.5`}></span>
                                                            {request.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap border border-gray-200">
                                                        {request.errorMessage}
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap border border-gray-200">
                                                        {attachments.length}
                                                    </td>
                                                    
                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap border border-gray-200">
                                                        <div className="flex space-x-2">
                                                            {/* <button
                                                                onClick={() => handleUpdateStatus(request.id)}
                                                                className="text-blue-600 hover:text-blue-900"
                                                            >
                                                                Update Status
                                                            </button> */}
                                                            <button
                                                                onClick={() => setIsAttachmentModalOpen(true)}
                                                                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md text-white text-sm font-medium"
                                                            >
                                                                View Attachments
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Pagination Section */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200">
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-700">Rows per page:</span>
                            <select
                                value={rowsPerPage}
                                onChange={(event) => {
                                    setRowsPerPage(parseInt(event.target.value, 10));
                                    setPage(0);
                                }}
                                className="border-0 bg-transparent text-sm text-gray-700 focus:ring-0 cursor-pointer"
                            >
                                {[10, 25, 50, 100].map((size) => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                            <span className="text-sm font-medium text-gray-900">
                                Total Records: {totalRecords}
                            </span>
                        </div>

                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setPage(0)}
                                disabled={page === 0}
                                className="px-3 py-1 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                First
                            </button>
                            <button
                                onClick={() => setPage(page - 1)}
                                disabled={page === 0}
                                className="px-3 py-1 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const pageNumber = page - 2 + i;
                                if (pageNumber >= 0 && pageNumber < totalPages) {
                                    return (
                                        <button
                                            key={pageNumber}
                                            onClick={() => setPage(pageNumber)}
                                            className={`px-3 py-1 rounded-md text-sm font-medium ${
                                                page === pageNumber
                                                    ? 'bg-[#1a4f82] text-white'
                                                    : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            {pageNumber + 1}
                                        </button>
                                    );
                                }
                                return null;
                            })}
                            <button
                                onClick={() => setPage(page + 1)}
                                disabled={page >= totalPages - 1}
                                className="px-3 py-1 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                            <button
                                onClick={() => setPage(totalPages - 1)}
                                disabled={page >= totalPages - 1}
                                className="px-3 py-1 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Last
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {
            isAttachmentModalOpen && (
                <AttachmentPopUp
                    isOpen={true}
                    onClose={() => setIsAttachmentModalOpen(false)}
                    onSubmit={() => {}}
                    defaultTab="Attachments"
                />
            )
        }
        </div>
        
    );
}




