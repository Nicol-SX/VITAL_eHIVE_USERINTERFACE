'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusPopup from './StatusPopup';

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

// Add helper function to convert date range to days
const getDateRangeDays = (dateRange: string): number => {
  switch (dateRange) {
    // case 'All Time':
    //   return 3650; // 10 years
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

// Add type for sortable columns
type ProcessSortableColumn = 'insertDate' | 'updateDate' | 'effectiveDate' | 'nric' | 'actionType' | 'personnelArea' | 'status' | 'name' | 'errorMessage';
type BatchSortableColumn = 'batchJobId' | 'hrpsDateTime' | 'pickupDate' | 'totalCSVFiles' | 'status' | 'createdDate' | 'lastUpdatedDate';
type SortableColumn = ProcessSortableColumn | BatchSortableColumn;
type TabType = 'Overview' | 'Processes' | 'Batch';
type DateRangeOption = 'Last 7 days' | 'Last 30 days' | 'Last 3 months' | 'Last 6 months' | 'Last 1 year' ;

// Add sorting function for process data
const sortProcessData = (data: Process[], currentSortColumn: ProcessSortableColumn, currentSortDirection: 'asc' | 'desc') => {
  console.log('🔄 SORTING PROCESS DATA:', { currentSortColumn, currentSortDirection });
  return [...data].sort((a, b) => {
    const aValue = a[currentSortColumn];
    const bValue = b[currentSortColumn];

    // Handle date fields
    if (currentSortColumn === 'insertDate' || currentSortColumn === 'updateDate' || currentSortColumn === 'effectiveDate') {
      const dateA = new Date(aValue || '').getTime();
      const dateB = new Date(bValue || '').getTime();
      return currentSortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    }

    // Handle string fields
    const strA = String(aValue || '').toLowerCase();
    const strB = String(bValue || '').toLowerCase();
    return currentSortDirection === 'asc' 
      ? strA.localeCompare(strB)
      : strB.localeCompare(strA);
  });
};

// Add a date formatting function
function formatDate(dateString: string | null | undefined) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '-';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function StatusMonitoring({ defaultTab, selectedBatchId: initialBatchId }: StatusMonitoringProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab || 'Overview');
  const [showActionTypes, setShowActionTypes] = useState(false);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [showDateRangeDropdown, setShowDateRangeDropdown] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRangeOption>('Last 7 days');
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [sortColumn, setSortColumn] = useState<SortableColumn>('insertDate');

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [processes, setProcesses] = useState<Process[]>([]);
  const [totalProcesses, setTotalProcesses] = useState(0);
  const [processSortColumn, setProcessSortColumn] = useState<ProcessSortableColumn>('insertDate');
  const [processSortDirection, setProcessSortDirection] = useState<'asc' | 'desc'>('desc');

  const [openStatusDropdown, setOpenStatusDropdown] = useState<number | null>(null);

  const statusOptions = ['Success', 'Failed', 'Pending'];

  const dateRangeOptions = [
    'All Time',
    'Last 7 days',
    'Last 30 days',
    'Last 3 months',
    'Last 6 months',
    'Last 1 year'
  ] as const;

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

  const [hrpsDate, setHrpsDate] = useState<string | null>(null);

  // Add back searchDate state
  const [searchDate, setSearchDate] = useState('');

  // Add state for action buttons and comments
  const [actionStates, setActionStates] = useState<{ [key: number]: { status: 'status' | 'viewed' | 'reviewed' | null, comment?: string } }>({});
  const [popupRowId, setPopupRowId] = useState<number | null>(null);
  const [viewComment, setViewComment] = useState<{ rowId: number, comment: string } | null>(null);

  // 1. Sync hrpsDate from URL only once, on mount
  useEffect(() => {
    if (activeTab === 'Processes') {
      const urlParams = new URLSearchParams(window.location.search);
      const apiSearch = urlParams.get('apiSearch');
      if (apiSearch && hrpsDate !== apiSearch) {
        setHrpsDate(apiSearch);
      }
    }
    // Only run when activeTab changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // 2. Fetch data when dependencies change
  useEffect(() => {
    if (activeTab === 'Batch') {
      fetchBatchData();
    }
    if (activeTab === 'Processes') {
      // Only fetch if hrpsDate is set, or if there is no apiSearch in the URL
      const urlParams = new URLSearchParams(window.location.search);
      const apiSearch = urlParams.get('apiSearch');
      if (apiSearch) {
        if (hrpsDate === apiSearch) {
          fetchProcessData();
      }
        // else: wait for hrpsDate to be set by the other useEffect
      } else {
      fetchProcessData();
      }
    }
  }, [activeTab, page, rowsPerPage, selectedDateRange, sortColumn, sortDirection, hrpsDate]);

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
  const handleViewTransactionDetails = (hrpsDateTime: string) => {
    // Format the HRPS date time to yyyy/mm/dd hh:mm:ss
    const formattedDate = formatDate(hrpsDateTime);
    // Redirect to processes page with the formatted date as a search parameter for API call
    router.push(`/processes?apiSearch=${encodeURIComponent(formattedDate)}`);
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

  // Update fetchProcessData to load saved changes after fetching
  const fetchProcessData = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: rowsPerPage.toString(),
        dateRange: selectedDateRange,
        sortColumn: processSortColumn,
        sortDirection: processSortDirection
      });

      if (hrpsDate) {
        queryParams.append('apiSearch', hrpsDate);
      }

      if (searchDate) {
        queryParams.append('searchDate', searchDate);
      }

      const response = await fetch(`/api/processes?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        setProcesses([]);
        setTotalProcesses(0);
      } else {
        setProcesses(data.data.data);
        setTotalProcesses(data.data.total);
        setError(null);
        
        // Load saved status changes after setting processes
        const savedChanges = localStorage.getItem(STORAGE_KEY);
        if (savedChanges) {
          const parsedChanges = JSON.parse(savedChanges);
          // Update processes with saved statuses
          setProcesses(prev => 
            prev.map(proc => ({
              ...proc,
              status: parsedChanges[proc.dataID]?.status || proc.status
            }))
          );
          // Update action states with saved comments
          setActionStates(parsedChanges);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching process data:', error);
      setError('Failed to fetch process data');
      setProcesses([]);
      setTotalProcesses(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Update the filteredProcesses logic to handle both API search and local search
  const filteredProcesses = React.useMemo(() => {
    let filtered = processes;

    // First apply API search filter if searchDate is '2025/05/25 22:09:55'
    // if (searchDate === '2025/05/25 22:09:55') {
    //   filtered = filtered.filter(proc => ['225', '222', '221'].includes(String(proc.dataID)));
    // }

    // Then apply local search filter if there's a search term
    if (searchDate) {
      const searchTerm = searchDate.toLowerCase();
      filtered = filtered.filter(process => {
        return (
          process.nric.toLowerCase().includes(searchTerm) ||
          process.name.toLowerCase().includes(searchTerm) ||
          process.actionType.toLowerCase().includes(searchTerm) ||
          process.personnelArea.toLowerCase().includes(searchTerm) ||
          process.status.toLowerCase().includes(searchTerm) ||
          process.errorMessage.toLowerCase().includes(searchTerm) ||
          formatDate(process.insertDate).toLowerCase().includes(searchTerm) ||
          process.personnelNumber.toLowerCase().includes(searchTerm)
        );
      });
    }


    return filtered;
  }, [processes, searchDate]);

  // Update the search input handler to only affect local search
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchDate(value);
  };

  // Update the clear search handler
  const handleClearLocalSearch = () => {
    setSearchDate('');
  };

  // Update clearApiSearch to only clear API search
  const clearApiSearch = () => {
    setHrpsDate('');
    setPage(0); // Reset to first page
    // Remove apiSearch from URL without refreshing the page
    const url = new URL(window.location.href);
    url.searchParams.delete('apiSearch');
    window.history.pushState({}, '', url);
  };

  // Remove unnecessary filter handlers
  const handleDateRangeChange = (range: DateRangeOption) => {
    setSelectedDateRange(range);
    setPage(0); // Reset to first page when changing date range
  };

  // Update the renderHrpsFilter section to show API search
  const renderHrpsFilter = () => {
    if (hrpsDate) {
      return (
        <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-md">
          {/* <span className="text-sm text-gray-600">
            Showing processes for HRPS Date Time: {searchDate}
          </span> */}
          <button
            onClick={() => {
              setHrpsDate('');
              const url = new URL(window.location.href);
              url.searchParams.delete('apiSearch');
              window.history.pushState({}, '', url);
            }}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Show All Processes
          </button>
        </div>
      );
    }
    return null;
  };

  // Update the renderPagination function with comments
  const renderPagination = () => {
    const totalPages = Math.ceil(totalProcesses / rowsPerPage);
    const startItem = page * rowsPerPage + 1;
    const endItem = Math.min((page + 1) * rowsPerPage, totalProcesses);
    const currentPageRecords = processes.length;

    return (
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
            {[50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <div className="flex flex-col">
            {/* Display total count of processes linked to the batch's HRPS Date Time */}
            <span className="text-sm font-medium text-gray-900">
              Total Records: {totalProcesses}
            </span>
            {/* Display number of processes in current page */}
            <span className="text-sm text-gray-600">
              Currently Displayed: {currentPageRecords}
            </span>
          </div>
        </div>

        <div className="flex items-center">
          {/* Show range of processes being displayed */}
          <span className="text-sm text-gray-700 mr-4">
            Showing {startItem}-{endItem} of {totalProcesses}
          </span>
          {/* Pagination controls */}
          <nav className="flex items-center space-x-1">
            {/* Previous page button */}
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

            {/* Page number buttons */}
            <div className="flex flex-wrap justify-center gap-1">
              {totalPages > 0 && Array.from({ length: totalPages }).map((_, idx) => (
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
            </div>

            {/* Next page button */}
            <button
              onClick={() => {
                if (page < totalPages - 1) {
                  setPage(page + 1);
                }
              }}
              disabled={page >= totalPages - 1}
              className={`p-1 rounded-full ${
                page >= totalPages - 1
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
    );
  };

  // Add back necessary functions
  const handleSort = (column: SortableColumn) => {
    if (column === sortColumn) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const handleProcessSort = (column: ProcessSortableColumn) => {
    if (processSortColumn === column) {
      setProcessSortDirection(processSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setProcessSortColumn(column);
      setProcessSortDirection('desc');
    }
  };

  const handleDateRangeSelect = (range: string) => {
    handleDateRangeChange(range as DateRangeOption);
    setShowDateRangeDropdown(false);
  };

  const handleDownloadCSV = async () => {
    let endpoint = '';
    let filename = '';
    
    // Determine which table to download based on active tab
    if (activeTab === 'Batch') {
      endpoint = '/hrps-api/HRP/Batches/Download';
      filename = 'batch_table.csv';
    } else if (activeTab === 'Processes') {
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
  };

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
      fetchProcessData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Add these functions near the top of the component, after the state declarations
  const STORAGE_KEY = 'process_status_changes';

  // Function to load saved status changes from localStorage
  const loadSavedStatusChanges = () => {
    try {
      const savedChanges = localStorage.getItem(STORAGE_KEY);
      if (savedChanges) {
        const parsedChanges = JSON.parse(savedChanges);
        // Update processes with saved statuses
        setProcesses(prev => 
          prev.map(proc => ({
            ...proc,
            status: parsedChanges[proc.dataID]?.status || proc.status
          }))
        );
        // Update action states with saved comments
        setActionStates(parsedChanges);
      }
    } catch (err) {
      console.error('Error loading saved status changes:', err);
    }
  };

  // Update the saveStatusChanges function to ensure proper data structure
  const saveStatusChanges = (processId: number, status: string, comment?: string) => {
    try {
      const savedChanges = localStorage.getItem(STORAGE_KEY);
      const existingChanges = savedChanges ? JSON.parse(savedChanges) : {};
      
      const newChanges = {
        ...existingChanges,
        [processId]: {
          status: status === 'Reviewed' ? 'Reviewed' : 'Others',
          comment: comment || '',
          timestamp: new Date().toISOString()
        }
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newChanges));
      
      // Immediately update the UI state
      setProcesses(prev =>
        prev.map(proc =>
          proc.dataID === processId
            ? {
                ...proc,
                status: status === 'Reviewed' ? 'Reviewed' : 'Others'
              }
            : proc
        )
      );
      
      setActionStates(prev => ({
        ...prev,
        [processId]: {
          status: status === 'Reviewed' ? 'reviewed' : 'viewed',
          comment: comment || ''
        }
      }));
    } catch (err) {
      console.error('Error saving status changes:', err);
    }
  };

  // Function to clear saved status changes
  const clearSavedStatusChanges = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  // Add useEffect to load saved changes when component mounts
  useEffect(() => {
    loadSavedStatusChanges();
  }, []);

  // Update handleStatusPopupSubmit to use localStorage
  const handleStatusPopupSubmit = async (selectedStatus: string, comment: string) => {
    if (popupRowId === null) return;

    try {
      // Update local process list
      setProcesses(prev =>
        prev.map(proc =>
          proc.dataID === popupRowId
            ? {
                ...proc,
                status: selectedStatus === 'Reviewed' ? 'Reviewed' : 'Others'
              }
            : proc
        )
      );

      // Update actionStates for button logic
      setActionStates(prev => {
        if (selectedStatus === 'Others') {
          return { ...prev, [popupRowId]: { status: 'viewed', comment } };
        } else if (selectedStatus === 'Reviewed') {
          return { ...prev, [popupRowId]: { status: 'reviewed' } };
        }
        return prev;
      });

      // Save changes to localStorage
      saveStatusChanges(popupRowId, selectedStatus, comment);

      // Close the popup
      setPopupRowId(null);
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  };

  // Add a cleanup function to handle development server restarts
  const cleanupOnServerRestart = () => {
    // Clear localStorage when the component unmounts
    return () => {
      localStorage.removeItem(STORAGE_KEY);
    };
  };

  // Add useEffect for cleanup
  useEffect(() => {
    // This will run when the component unmounts (including server restarts)
    return cleanupOnServerRestart();
  }, []);

  const [hoveredBatch, setHoveredBatch] = useState<string | null>(null);

  return (
    <div className="w-full min-h-screen flex flex-col">
      {/* Parent wrapper for side menu and content */}
      <div className="flex flex-row w-full h-screen">
        {/* HRPS Side Menu */}
        <div className="w-24 bg-[#1a4f82] text-white sticky top-0 left-0 h-screen z-[1000] flex-shrink-0">
          <div className="p-4 flex flex-col items-center space-y-8">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-2">
                <span className="text-[#1a4f82] font-bold">H</span>
              </div>
              <span className="text-xs">HRPS</span>
            </div>
          </div>
        </div>
        {/* Status Monitoring Content */}
        <div className="flex-1 flex flex-col min-w-[600px] bg-white">
          {/* Header */}
          <div className="sticky top-0 z-[100] bg-white flex-shrink-0">
            <div className="border-b">
              <div className="px-6 py-4">
                <h1 className="text-xl font-medium">Status Monitoring</h1>
              </div>
            </div>
            {/* Tabs and Controls (keep as is) */}
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
                  className={`py-4 px-2 relative text-[#1a4f82] ${
                    activeTab === 'Batch'
                      ? 'font-bold'
                      : 'font-medium'
                  }`}
                >
                  Batch
                  {activeTab === 'Batch' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1a4f82]"></div>
                  )}
                </button>
                <button
                  onClick={() => handleTabChange('Processes')}
                  className={`py-4 px-2 relative text-[#1a4f82] ${
                    activeTab === 'Processes'
                      ? 'font-bold'
                      : 'font-medium'
                  }`}
                >
                  Processes
                  {activeTab === 'Processes' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1a4f82]"></div>
                  )}
                </button>
              </div>
            </div>

            {/* Search and Controls */}
            <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b bg-white space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4 w-full">
                {renderHrpsFilter()}
                <div className="flex items-center space-x-2">
                  <span className="text-sm whitespace-nowrap">Search</span>
                  <div className="relative flex-1 sm:flex-none">
                    <input
                      type="text"
                      id="search-input"
                      name="search"
                      value={searchDate}
                      onChange={handleSearchInputChange}
                      placeholder={`Search ${activeTab.toLowerCase()}...`}
                      className="border rounded px-3 py-1 text-sm w-full sm:w-64 focus:outline-none focus:border-[#1a4f82] pr-8"
                      aria-label="Search processes"
                    />
                    {searchDate && (
                      <button
                        onClick={handleClearLocalSearch}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        aria-label="Clear search"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4 w-full sm:w-auto justify-end">
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
                </div>
                <div className="relative">
                  <button 
                    onClick={handleDownloadCSV}
                    className="flex items-center space-x-2 text-sm text-[#1a4f82] hover:bg-blue-50 px-3 py-2 rounded-md"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download CSV</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Dropdowns - Outside of table container */}
          {showDateRangeDropdown && (
            <div 
              className="fixed top-[120px] right-[20px] w-48 bg-white rounded-md shadow-lg border max-h-[400px] overflow-y-auto z-[999999]"
              role="listbox"
              aria-label="Date range options"
            >
              {dateRangeOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => handleDateRangeSelect(option)}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                    selectedDateRange === option ? 'bg-gray-50 text-[#1a4f82]' : 'text-gray-700'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {showDownloadDropdown && (
            <div 
              className="fixed top-[120px] right-[20px] w-64 bg-white rounded-md shadow-lg border z-[999999]"
              role="listbox"
              aria-label="Download options"
            >
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

          {/* Table Section */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Table Container - Scrollable area, sticky header */}
            <div className="flex-1 min-h-0 w-full overflow-auto">
              {activeTab === 'Processes' && (
                <div className="flex flex-col h-full">
                  {/* Table Container with Scroll */}
                  <div className="flex-1 overflow-auto">
                    <div className="inline-block min-w-full align-middle">
                      <div className="overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-[#1a4f82] sticky top-0 z-10">
                            <tr>
                              <th 
                                scope="col" 
                                className="w-[15%] px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c]"
                                onClick={() => handleSort('insertDate' as SortableColumn)}
                              >
                                <div className="flex items-center space-x-1">
                                  <span>Process Date Time</span>
                                  {sortColumn === 'insertDate' && (
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
                              <th 
                                scope="col" 
                                className="w-[10%] px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c]"
                                onClick={() => handleSort('nric' as SortableColumn)}
                              >
                                <div className="flex items-center space-x-1">
                                  <span>NRIC</span>
                                  {sortColumn === 'nric' && (
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
                              <th 
                                scope="col" 
                                className="w-[15%] px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c]"
                                onClick={() => handleSort('name' as SortableColumn)}
                              >
                                <div className="flex items-center space-x-1">
                                  <span>PERNR Number</span>
                                  {sortColumn === 'name' && (
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
                              <th 
                                scope="col" 
                                className="w-[15%] px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c]"
                                onClick={() => handleSort('actionType' as SortableColumn)}
                              >
                                <div className="flex items-center space-x-1">
                                  <span>Action Type</span>
                                  {sortColumn === 'actionType' && (
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
                              <th 
                                scope="col" 
                                className="w-[15%] px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c]"
                                onClick={() => handleSort('personnelArea' as SortableColumn)}
                              >
                                <div className="flex items-center space-x-1">
                                  <span>Agency</span>
                                  {sortColumn === 'personnelArea' && (
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
                              <th 
                                scope="col" 
                                className="w-[10%] px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c]"
                                onClick={() => handleSort('status' as SortableColumn)}
                              >
                                <div className="flex items-center space-x-1">
                                  <span>Status</span>
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
                              <th 
                                scope="col" 
                                className="w-[20%] px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c]"
                                onClick={() => handleSort('errorMessage' as SortableColumn)}
                              >
                                <div className="flex items-center space-x-1">
                                  <span>Error Message</span>
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
                              <th className="w-[10%] px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200">Action</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                              <tr>
                                <td colSpan={8} className="px-6 py-4 text-center">
                                  <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a4f82]"></div>
                                  </div>
                                </td>
                              </tr>
                            ) : error ? (
                              <tr>
                                <td colSpan={8} className="px-6 py-4 text-center text-red-500">
                                  <div className="max-h-40 overflow-y-auto inline-block w-full">
                                    {error}
                                  </div>
                                </td>
                              </tr>
                            ) : filteredProcesses && filteredProcesses.length > 0 ? (
                              sortProcessData(filteredProcesses, processSortColumn, processSortDirection).map((process) => (
                                <tr key={process.dataID} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                  <td className="w-[15%] px-6 py-4 text-sm text-gray-900 border-x border-gray-200">
                                    <div className="whitespace-nowrap">{formatDate(process.insertDate)}</div>
                                  </td>
                                  <td className="w-[10%] px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                                    <div className="whitespace-nowrap">{process.nric}</div>
                                  </td>
                                  <td className="w-[15%] px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                                    <div className="whitespace-nowrap">{process.personnelNumber}</div>
                                  </td>
                                  <td className="w-[15%] px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                                    <div className="whitespace-nowrap">{process.actionType}</div>
                                  </td>
                                  <td className="w-[15%] px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                                    <div className="whitespace-nowrap">{process.personnelArea}</div>
                                  </td>
                                  <td className="w-[10%] px-6 py-4 border-r border-gray-200">
                                    <div className="relative">
                                      <span className={`px-3 py-1 text-sm rounded-full inline-flex items-center ${getStatusStyle(process.status).bgColor} ${getStatusStyle(process.status).textColor}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${getStatusStyle(process.status).dotColor}`}></span>
                                        {getStatusText(process.status)}
                                      </span>

                                      {/* <span className={`px-3 py-1 text-sm rounded-full inline-flex items-center ${
                            batch.status === 'Success' ? 'bg-green-100 text-green-800' :
                            batch.status === 'Fail' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-2 `}></span>
                            {batch.status || 'Pending'}
                          </span> */}


                                    </div>
                                  </td>
                                  <td className="w-[20%] px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                                    <div className="whitespace-nowrap">{process.errorMessage || '-'}</div>
                                  </td>
                                  <td className="w-[10%] px-6 py-4 text-sm border-r border-gray-200">
                                    {(() => {
                                      const actionState = actionStates[process.dataID]?.status;
                                      const processStatus = process.status;
                                      
                                      if (processStatus === 'Others' && actionState === 'viewed') {
                                        return (
                                          <button
                                            className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                                            onClick={() => setViewComment({ rowId: process.dataID, comment: actionStates[process.dataID]?.comment ?? '' })}
                                          >
                                            View
                                          </button>
                                        );
                                      } else if ((processStatus === 'Fail' || processStatus === 'Error') && !actionState) {
                                        return (
                                          <button
                                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                            onClick={() => setPopupRowId(process.dataID)}
                                          >
                                            Status
                                          </button>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                                  No data available
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'Batch' && (
                <div className="flex flex-col h-full">
                  {/* Table Container with Scroll */}
                  <div className="flex-1 overflow-auto">
                    <div className="inline-block min-w-full align-middle">
                      <div className="overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-[#1a4f82] sticky top-0 z-10">
                            <tr>
                              <th 
                                scope="col" 
                                className="w-[15%] px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c]"
                                onClick={() => handleSort('hrpsDateTime' as SortableColumn)}
                              >
                                <div className="flex items-center space-x-1">
                                  <span>HRPS Date Time</span>
                                  {sortColumn === 'hrpsDateTime' && (
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
                              <th 
                                scope="col" 
                                className="w-[15%] px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c]"
                                onClick={() => handleSort('pickupDate' as SortableColumn)}
                              >
                                <div className="flex items-center space-x-1">
                                  <span>Pickup Date</span>
                                  {sortColumn === 'pickupDate' && (
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
                              <th 
                                scope="col" 
                                className="w-[10%] px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c]"
                                onClick={() => handleSort('totalCSVFiles' as SortableColumn)}
                              >
                                <div className="flex items-center space-x-1">
                                  <span>Total CSV Files</span>
                                  {sortColumn === 'totalCSVFiles' && (
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
                              <th 
                                scope="col" 
                                className="w-[10%] px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c]"
                                onClick={() => handleSort('status' as SortableColumn)}
                              >
                                <div className="flex items-center space-x-1">
                                  <span>Status</span>
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
                              <th 
                                scope="col" 
                                className="w-[15%] px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c]"
                                onClick={() => handleSort('createdDate' as SortableColumn)}
                              >
                                <div className="flex items-center space-x-1">
                                  <span>Created Date</span>
                                  {sortColumn === 'createdDate' && (
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
                              <th 
                                scope="col" 
                                className="w-[15%] px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c]"
                                onClick={() => handleSort('lastUpdatedDate' as SortableColumn)}
                              >
                                <div className="flex items-center space-x-1">
                                  <span>Last Updated Date</span>
                                  {sortColumn === 'lastUpdatedDate' && (
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
                              <th className="w-[10%] px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200">Action</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                              <tr>
                                <td colSpan={7} className="px-6 py-4 text-center">
                                  <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a4f82]"></div>
                                  </div>
                                </td>
                              </tr>
                            ) : error ? (
                              <tr>
                                <td colSpan={7} className="px-6 py-4 text-center text-red-500">
                                  <div className="max-h-40 overflow-y-auto inline-block w-full">
                                    {error}
                                  </div>
                                </td>
                              </tr>
                            ) : transactions && transactions.length > 0 ? (
                              transactions.map((transaction) => (
                                <tr key={transaction.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                  <td className="w-[15%] px-6 py-4 text-sm text-gray-900 border-x border-gray-200">
                                    <div className="whitespace-nowrap">{formatDate(transaction.hrpsDateTime)}</div>
                                  </td>
                                  <td className="w-[15%] px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                                    <div className="whitespace-nowrap">{formatDate(transaction.pickupDate)}</div>
                                  </td>
                                  <td className="w-[10%] px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                                    <div className="whitespace-nowrap">{transaction.xmlFileCount}</div>
                                  </td>
                                  <td className="w-[10%] px-6 py-4 border-r border-gray-200">
                                    <div className="relative">
                                      <span className={`px-3 py-1 text-sm rounded-full inline-flex items-center ${getStatusStyle(transaction.status).bgColor} ${getStatusStyle(transaction.status).textColor}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${getStatusStyle(transaction.status).dotColor}`}></span>
                                        {getStatusText(transaction.status)}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="w-[15%] px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                                    <div className="whitespace-nowrap">{formatDate(transaction.createdDate)}</div>
                                  </td>
                                  <td className="w-[15%] px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                                    <div className="whitespace-nowrap">{formatDate(transaction.lastUpdatedDate)}</div>
                                  </td>
                                  <td className="w-[10%] px-6 py-4 text-sm border-r border-gray-200">
                                    <button
                                      onClick={() => handleViewTransactionDetails(transaction.hrpsDateTime)}
                                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                      View
                                    </button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                                  No data available
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pagination - Sticky bottom */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200">
            {renderPagination()}
          </div>
        </div>
      </div>

      {/* Popups/modal overlays remain outside and above all */}
      {popupRowId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999]">
          <StatusPopup
            isOpen={true}
            onClose={() => setPopupRowId(null)}
            onSubmit={(status, comments) => {
              if (status === 'Others' && (!comments || comments.trim() === '')) {
                alert('Comment is required for Others.');
                return;
              }
              handleStatusPopupSubmit(status, comments ?? '');
            }}
          />
        </div>
      )}

      {viewComment && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[9999999]">
          <div className="bg-white rounded-lg shadow-xl p-6 w-[400px] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Comment</h3>
              <button
                onClick={() => setViewComment(null)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="text-gray-800 whitespace-pre-line">{viewComment && viewComment.comment}</div>
          </div>
        </div>
      )}
      
    </div>
  );
}