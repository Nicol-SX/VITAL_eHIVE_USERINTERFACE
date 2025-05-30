'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Add new Process interface
interface ProcessAction {
  id: number;
  dataID: number;
  status: number;
  type: number;
  comment: string;
  insertDate: string;
  effectiveDate: string;
  updateDate: string;
}

// Update ProcessStatus enum
// enum ProcessStatus { ... }

interface Process {
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
  batchId: string;
  action: ProcessAction;
}

interface ProcessResponse {
  message: string;
  errorMessage: string;
  data: {
    currentPage: number;
    totalPage: number;
    dataPerPage: number;
    data: Process[];
  };
}

// Add Batch interface
interface Batch {
  batchJobId: number;
  hrpsDateTime: string;
  pickupDate: string;
  totalCSVFiles: number;
  status: 'Success' | 'Pending' | 'Fail';
  createdDate: string;
  lastUpdatedDate: string;
}

interface BatchResponse {
  message: string;
  errorMessage: string | null;
  data: {
    currentPage: number;
    totalPage: number;
    dataPerPage: number;
    data: Batch[];
  };
}

// Update base API URL to use the proxied endpoint
const HRPS_API_BASE_URL = '/hrps-api/HRP';  

// Update StatusMonitoringProps interface
interface StatusMonitoringProps {
  defaultTab: 'Overview' | 'Batch' | 'Processes';
  selectedBatchId?: string;
}

// Update getStatusText function
const getStatusText = (status: string): string => {
  return status;
};

// Update getStatusStyle function
const getStatusStyle = (status: string): { bgColor: string; textColor: string; dotColor: string } => {
  switch (status.toUpperCase()) {
    case 'SUCCESS':
      return { bgColor: 'bg-green-100', textColor: 'text-green-800', dotColor: 'bg-green-600' };
    case 'FAILED':
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

// Add helper function to convert date range to days
const getDateRangeDays = (dateRange: string): number => {
  switch (dateRange) {
    case 'Last 7 days':
      return 7;
    case 'Last 30 days':
      return 30;
    case 'Last 3 months':
      return 90;
    case 'Last 6 months':
      return 180;
    case 'Last 1 year':
      return 365;
    default:
      return 7;
  }
};

// Update Transaction interface
interface Transaction {
  id: number;
  batchJobId: number;
  hrpsDateTime: string;
  pickupDate: string;
  xmlFileCount: number;
  status: 'Success' | 'Pending' | 'Fail';
  createdDate: string;
  lastUpdatedDate: string;
}

export default function StatusMonitoring({ defaultTab, selectedBatchId }: StatusMonitoringProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Overview' | 'Batch' | 'Processes'>(defaultTab);
  const [showActionTypes, setShowActionTypes] = useState(false);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [searchDate, setSearchDate] = useState('');
  const [showDateRangeDropdown, setShowDateRangeDropdown] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState('Last 7 days');
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [sortColumn, setSortColumn] = useState<'hrpsDateTime' | 'pickupDate'>('hrpsDateTime');
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [processes, setProcesses] = useState<Process[]>([]);
  const [totalProcesses, setTotalProcesses] = useState(0);
  const [processSortColumn, setProcessSortColumn] = useState<'processDateTime'>('processDateTime');
  const [processSortDirection, setProcessSortDirection] = useState<'asc' | 'desc'>('desc');

  const [openStatusDropdown, setOpenStatusDropdown] = useState<number | null>(null);

  const statusOptions = ['Success', 'Failed', 'Pending'];

  const dateRangeOptions = [
    'Last 7 days',
    'Last 30 days',
    'Last 3 months',
    'Last 6 months',
    'Last 1 year'
  ];

  const downloadOptions = [
    { id: 'batch', label: 'Batch Table' },
    { id: 'process', label: 'Process Table' }
  ];

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedProcessId, setSelectedProcessId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [comments, setComments] = useState('');
  const [processComments, setProcessComments] = useState<{[key: number]: { status: string; comments: string }}>({});

  const [batchProcesses, setBatchProcesses] = useState<Process[]>([]);
  const [isBatchProcessesLoading, setIsBatchProcessesLoading] = useState(false);

  const [batchDate, setBatchDate] = useState<string | null>(null);

  // Navigation handler
  const handleTabChange = (tab: 'Overview' | 'Batch' | 'Processes') => {
    if (tab === activeTab) return;
    
    switch (tab) {
      case 'Overview':
        router.push('/');
        break;
      case 'Batch':
        router.push('/batch');
        break;
      case 'Processes':
        router.push('/processes');
        break;
    }
  };

  // Handle view transaction details
  const handleViewTransactionDetails = (batchId: string) => {
    router.push(`/processes?batchId=${batchId}`);
  };

  // Fetch batch data
  const fetchBatchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/batch?page=${page}&limit=${rowsPerPage}&dateRange=${selectedDateRange}&sortColumn=${sortColumn}&sortDirection=${sortDirection}`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setTransactions(data.transactions.data);
        setTotalTransactions(data.transactions.total);
      }
    } catch (error) {
      setError('Failed to fetch batch data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch processes for a specific batch
  const fetchProcessesByBatchId = async (batchId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/processes?batchId=${batchId}&page=${page}&limit=${rowsPerPage}`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setProcesses(data.data.data);
        setTotalProcesses(data.data.total);
      }
    } catch (error) {
      setError('Failed to fetch process data');
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new function to fetch all processes
  const fetchAllProcesses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/processes?page=${page}&limit=${rowsPerPage}&dateRange=${selectedDateRange}&sortColumn=${processSortColumn}&sortDirection=${processSortDirection}`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setProcesses(data.data.data);
        setTotalProcesses(data.data.total);
      }
    } catch (error) {
      setError('Failed to fetch process data');
    } finally {
      setIsLoading(false);
    }
  };

  // Force fetch when date range changes
  useEffect(() => {
    if (activeTab === 'Batch') {
      fetchBatchData();
    } else if (activeTab === 'Processes') {
      fetchAllProcesses();
    }
  }, [selectedDateRange]);

  useEffect(() => {
    if (selectedBatchId) {
      fetchProcessesByBatchId(selectedBatchId);
    } else if (activeTab === 'Processes') {
      fetchAllProcesses();
    } else {
      fetchBatchData();
    }
  }, [page, rowsPerPage, selectedDateRange, sortColumn, sortDirection, selectedBatchId, activeTab, processSortColumn, processSortDirection]);

  // Search bar component
  const SearchBar = () => (
    <div className="flex items-center space-x-2">
      <span className="text-sm">Search</span>
      <div className="relative">
        <input
          type="text"
          value={searchDate}
          onChange={(e) => setSearchDate(e.target.value)}
          placeholder={`Search ${activeTab.toLowerCase()}...`}
          className="border rounded px-3 py-1 text-sm w-64 focus:outline-none focus:border-[#1a4f82] pr-8"
        />
        {searchDate && (
          <button
            onClick={() => {
              setSearchDate('');
              setBatchDate(null);
            }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );

  // Download CSV handler
  const handleDownloadCSV = async () => {
    for (const table of selectedTables) {
      let endpoint = '';
      let filename = '';
      if (table === 'batch') {
        endpoint = '/hrps-api/HRP/Batches/Download';
        filename = 'batch_table.csv';
      } else if (table === 'process') {
        endpoint = '/hrps-api/HRP/Processes/Download';
        filename = 'process_table.csv';
      }
      if (endpoint) {
        try {
          const response = await fetch(endpoint, {
            method: 'GET',
          });
          if (!response.ok) throw new Error('Failed to download CSV');
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        } catch (err) {
          alert('Error downloading CSV: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
      }
    }
  };

  // Add this function inside the StatusMonitoring component, before the return statement
  const handleStatusUpdate = async () => {
    if (!selectedProcessId || !selectedStatus) return;

    try {
      const response = await fetch('/api/processes/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: selectedStatus === 'REVIEWED' ? 0 : 1,
          comment: comments,
          type: 1,
          dataID: selectedProcessId
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Close modal and refresh data
      setIsStatusModalOpen(false);
      setSelectedStatus(null);
      setComments('');
      setSelectedProcessId(null);

      // Refresh the processes list
      if (selectedBatchId) {
        fetchProcessesByBatchId(selectedBatchId);
      } else {
        fetchAllProcesses();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <div>
      <div className="flex min-h-screen bg-gray-50">
        <div className=''>
            {/* Left Sidebar */}
        <div className="w-24 bg-[#1a4f82] text-white fixed top-0 left-0 h-screen">
          <div className="p-4 flex flex-col items-center space-y-8">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-2">
                <span className="text-[#1a4f82] font-bold">H</span>
              </div>
              <span className="text-xs">HRPS</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 ml-24">
          {/* Fixed Header and Controls */}
          <div className="fixed top-0 right-0 left-24 bg-white z-0">
            {/* Header */}
            <div className="border-b">
              <div className="px-6 py-4">
                <h1 className="text-xl font-medium">Status Monitoring</h1>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-6 border-b">
              <div className="flex space-x-8">
                <button
                  onClick={() => handleTabChange('Overview')}
                  className={`py-4 px-2 relative ${
                    activeTab === 'Overview'
                      ? 'text-[#1a4f82] font-medium'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Overview
                  {activeTab === 'Overview' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1a4f82]"></div>
                  )}
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
                  onClick={() => handleTabChange('Processes')}
                  className={`py-4 px-2 relative ${
                    activeTab === 'Processes'
                      ? 'text-[#1a4f82] font-medium'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Processes
                  {activeTab === 'Processes' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1a4f82]"></div>
                  )}
                </button>
              </div>
            </div>

            {/* Search Bar and Controls */}
            <div className="p-6 flex items-center justify-between border-b bg-white">
              <SearchBar />
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <button 
                    onClick={() => setShowDateRangeDropdown(!showDateRangeDropdown)}
                    className="flex items-center space-x-2 hover:bg-gray-50 px-3 py-2 rounded-md"
                  >
                    <span className="text-sm">{selectedDateRange}</span>
                    <svg className={`w-4 h-4 transition-transform ${showDateRangeDropdown ? 'transform rotate-180' : ''}`} 
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showDateRangeDropdown && (
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-2 border">
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
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button 
                    onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
                    className="flex items-center space-x-2 text-sm text-[#1a4f82] hover:bg-blue-50 px-3 py-2 rounded-md"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download CSV</span>
                  </button>
                  {showDownloadDropdown && (
                    <div className="absolute right-0 mt-1 w-64 bg-white rounded-md shadow-lg z-50 border">
                      <div className="p-3">
                        <div className="mb-3">
                          <h3 className="text-sm font-medium text-gray-700 mb-2">Select table to download:</h3>
                          {downloadOptions.map((option) => (
                            <label key={option.id} className="flex items-center space-x-2 py-1">
                              <input
                                type="checkbox"
                                checked={selectedTables.includes(option.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedTables([...selectedTables, option.id]);
                                  } else {
                                    setSelectedTables(selectedTables.filter(id => id !== option.id));
                                  }
                                }}
                                className="rounded border-gray-300 text-[#1a4f82] focus:ring-[#1a4f82]"
                              />
                              <span className="text-sm text-gray-700">{option.label}</span>
                            </label>
                          ))}
                        </div>
                        <div className="flex justify-end border-t pt-3">
                          <button
                            onClick={handleDownloadCSV}
                            disabled={selectedTables.length === 0}
                            className={`px-3 py-1.5 text-sm rounded-md ${
                              selectedTables.length === 0
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-[#1a4f82] text-white hover:bg-[#15406c]'
                            }`}
                          >
                            Download Selected
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a4f82]" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="fixed top-32 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {/* Content Area */}
          <div>
            {/* Changed Main to Div */}
            <div className="pt-44 flex flex-col h-[calc(100vh-180px)]">
              {/* Overview Tab */}
              {activeTab === 'Overview' && (
                <div className="p-6 flex-1 flex flex-col h-full">
                  <div className="bg-white rounded-lg shadow flex flex-col flex-1">
                    {/* Overview content */}
                  </div>
                </div>
              )}

              {/* Batch Tab */}
              {activeTab === 'Batch' && (
                <div className="p-6 flex-1 flex flex-col h-full">
                  <div className="bg-white rounded-lg shadow flex flex-col flex-1">
                    <div className="flex-1 overflow-auto">
                      <table className="min-w-full table-fixed">
                        <thead className="bg-white sticky top-0 z-10">
                          <tr className="border-b-2 border-gray-300">
                            <th className="w-[20%] px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border border-gray-300 bg-gray-50">
                              HRPS Date & Time {sortColumn === 'hrpsDateTime' && (sortDirection === 'desc' ? '▼' : '▲')}
                            </th>
                            <th className="w-[20%] px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border border-gray-300 bg-gray-50">
                              Pickup Date {sortColumn === 'pickupDate' && (sortDirection === 'desc' ? '▼' : '▲')}
                            </th>
                            <th className="w-[15%] px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border border-gray-300 bg-gray-50">
                              No. of CSV Files
                            </th>
                            <th className="w-[15%] px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border border-gray-300 bg-gray-50">
                              Status
                            </th>
                            <th className="w-[15%] px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border border-gray-300 bg-gray-50">
                              Created Date
                            </th>
                            <th className="w-[15%] px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border border-gray-300 bg-gray-50">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {transactions.map((batch) => (
                            <tr key={batch.batchJobId} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                              <td className="w-[20%] px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">
                                {batch.hrpsDateTime}
                              </td>
                              <td className="w-[20%] px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">
                                {batch.pickupDate}
                              </td>
                              <td className="w-[15%] px-6 py-4 whitespace-nowrap text-sm border border-gray-200">
                                <button
                                  className="text-[#1a4f82] hover:text-blue-700 font-medium"
                                  onClick={() => {
                                    setSelectedRow(batch.batchJobId);
                                    setShowActionTypes(true);
                                  }}
                                >
                                  {batch.xmlFileCount}
                                </button>
                              </td>
                              <td className="w-[15%] px-6 py-4 whitespace-nowrap border border-gray-200">
                                <div className="relative">
                                  <span className={`px-3 py-1 text-sm rounded-full inline-flex items-center ${
                                    batch.status === 'Success' ? 'bg-green-100 text-green-800' :
                                    batch.status === 'Fail' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                                      batch.status === 'Success' ? 'bg-green-600' :
                                      batch.status === 'Fail' ? 'bg-red-600' :
                                      'bg-yellow-600'
                                    }`}></span>
                                    {batch.status}
                                  </span>
                                </div>
                              </td>
                              <td className="w-[15%] px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">
                                {batch.createdDate}
                              </td>
                              <td className="w-[15%] px-6 py-4 whitespace-nowrap border border-gray-200">
                                <button
                                  className="text-[#1a4f82] hover:text-blue-700 font-medium"
                                  onClick={() => handleViewTransactionDetails(batch.batchJobId.toString())}
                                >
                                  View Detailed Transaction
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Process Tab */}
              {activeTab === 'Processes' && (
                <div className="p-6 flex-1 flex flex-col h-full">
                  <div className="bg-white rounded-lg shadow flex flex-col flex-1">
                    <div className="flex-1 overflow-auto">
                      <table className="min-w-full table-fixed">
                        <thead className="bg-white sticky top-0 z-10">
                          <tr className="border-b-2 border-gray-300">
                            <th className="w-[15%] px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-x border-gray-200 bg-gray-50">
                              Insert Date
                            </th>
                            <th className="w-[10%] px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-gray-50">
                              NRIC
                            </th>
                            <th className="w-[15%] px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-gray-50">
                              Name
                            </th>
                            <th className="w-[15%] px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-gray-50">
                              Action Type
                            </th>
                            <th className="w-[15%] px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-gray-50">
                              Personnel Area
                            </th>
                            <th className="w-[10%] px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-gray-50">
                              Status
                            </th>
                            <th className="w-[10%] px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-gray-50">
                              Error Message
                            </th>
                            <th className="w-[10%] px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-gray-50">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {processes.map((process) => (
                            <tr key={process.dataID} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                              <td className="w-[15%] px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-x border-gray-200">
                                {process.insertDate}
                              </td>
                              <td className="w-[10%] px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                {process.nric}
                              </td>
                              <td className="w-[15%] px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                {process.name}
                              </td>
                              <td className="w-[15%] px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                {process.actionType}
                              </td>
                              <td className="w-[15%] px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                {process.personnelArea}
                              </td>
                              <td className="w-[10%] px-6 py-4 whitespace-nowrap border-r border-gray-200">
                                <div className="relative">
                                  <span className={`px-3 py-1 text-sm rounded-full inline-flex items-center ${getStatusStyle(process.status).bgColor} ${getStatusStyle(process.status).textColor}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full mr-2 ${getStatusStyle(process.status).dotColor}`}></span>
                                    {getStatusText(process.status)}
                                  </span>
                                </div>
                              </td>
                              <td className="w-[10%] px-6 py-4 text-sm text-gray-900 truncate border-r border-gray-200">
                                {process.errorMessage || '-'}
                              </td>
                              <td className="w-[10%] px-6 py-4 whitespace-nowrap text-sm border-r border-gray-200">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => {
                                      setSelectedProcessId(process.dataID);
                                      setIsStatusModalOpen(true);
                                    }}
                                    className="inline-flex items-center text-black font-normal focus:outline-none bg-transparent border-0 p-0 m-0 hover:underline"
                                    style={{ boxShadow: 'none' }}
                                  >
                                    Status
                                    <span className="ml-1 text-xs">▼</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          

          {/* Pagination */}
          <div className="fixed bottom-0 right-0 left-24 bg-white border-t border-gray-200">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center">
                <span className="text-sm text-gray-700">Rows per page:</span>
                <select
                  value={rowsPerPage}
                  onChange={(event) => {
                    setRowsPerPage(parseInt(event.target.value, 10));
                    setPage(0);
                  }}
                  className="ml-2 border-0 bg-transparent text-sm text-gray-700 focus:ring-0 cursor-pointer"
                >
                  {[50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <span className="text-sm text-gray-700 mr-4">
                  {activeTab === 'Batch'
                    ? `${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, totalTransactions)} of ${totalTransactions}`
                    : `${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, totalProcesses)} of ${totalProcesses}`}
                </span>
                <nav className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      if (page > 0) {
                        setPage(page - 1);
                      }
                    }}
                    disabled={page === 0}
                    className={`p-1 rounded-full ${
                      page === 0 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {(activeTab === 'Batch'
                    ? Array.from({ length: Math.ceil(totalTransactions / rowsPerPage) })
                    : Array.from({ length: Math.ceil(totalProcesses / rowsPerPage) })
                  ).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setPage(idx);
                      }}
                      className={`px-3 py-1 text-sm rounded-full ${
                        page === idx
                          ? 'bg-[#1a4f82] text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => {
                      if ((page + 1) * rowsPerPage < (activeTab === 'Batch' ? totalTransactions : totalProcesses)) {
                        setPage(page + 1);
                      }
                    }}
                    disabled={(page + 1) * rowsPerPage >= (activeTab === 'Batch' ? totalTransactions : totalProcesses)}
                    className={`p-1 rounded-full ${
                      (page + 1) * rowsPerPage >= (activeTab === 'Batch' ? totalTransactions : totalProcesses)
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* Action Types Modal */}
        {showActionTypes && selectedRow !== null && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center"
            onClick={() => setShowActionTypes(false)}
          >
            <div 
              className="bg-white rounded-lg shadow-xl p-6 w-96"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">CSV Files</h3>
                <button 
                  onClick={() => setShowActionTypes(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="text-sm text-gray-600">
                Total CSV Files: {transactions.find(t => t.batchJobId === selectedRow)?.xmlFileCount}
              </div>
            </div>
          </div>
        )}

        {/* Status Modal */}
        {isStatusModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-[500px] max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Select Status</h3>
                <button
                  onClick={() => {
                    setIsStatusModalOpen(false);
                    setSelectedStatus(null);
                    setComments('');
                    setSelectedProcessId(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio text-blue-600"
                      checked={selectedStatus === 'REVIEWED'}
                      onChange={() => setSelectedStatus('REVIEWED')}
                    />
                    <span className="ml-2">Reviewed</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio text-blue-600"
                      checked={selectedStatus === 'OTHERS'}
                      onChange={() => setSelectedStatus('OTHERS')}
                    />
                    <span className="ml-2">Others</span>
                  </label>
                </div>

                {/* Only show comments box for OTHERS */}
                {selectedStatus === 'OTHERS' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Comments <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Enter your comments here..."
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setIsStatusModalOpen(false);
                    setSelectedStatus(null);
                    setComments('');
                    setSelectedProcessId(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  disabled={!selectedStatus || (selectedStatus === 'OTHERS' && !comments.trim())}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                    !selectedStatus || (selectedStatus === 'OTHERS' && !comments.trim())
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
        
      </div>
    </div>
    
  );
} 