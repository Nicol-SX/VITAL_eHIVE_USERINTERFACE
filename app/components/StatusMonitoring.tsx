  'use client';

  import React, { useState, useEffect } from 'react';
  import Link from 'next/link';
  import { useRouter } from 'next/navigation';
  import StatusPopup from './StatusPopup'; // adjust path as needed

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
      case 'All Time':
        return 3650; // 10 years
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
      case 'Last 2 years':
        return 365 * 2;
      case 'Last 3 years':
        return 365 * 3;
      case 'Last 5 years':
        return 365 * 5;
      case 'Last 10 years':
        return 365 * 10;
      default:
        return 7;
    }
  };

  function formatDate(dateString: string | null | undefined) {
    if (!dateString) return '-';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    const pad = (n: number) => n.toString().padStart(2, '0');
    // Prepend an apostrophe so Excel won’t re‐parse it as a date:
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
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
  type ProcessSortableColumn = 'batchId' |'personnelNumber' | 'insertDate' |'nric' |'personnelNumber' | 'actionType' | 'personnelArea' | 'status' | 'errorMessage';
  type TabType = 'Overview' | 'Processes' | 'Batch';
  type DateRangeOption = 'Last 7 days' | 'Last 30 days' | 'Last 3 months' | 'Last 6 months' | 'Last 1 year';

  // Add sorting function for process data
  const sortProcessData = (data: Process[], currentSortColumn: ProcessSortableColumn, currentSortDirection: 'asc' | 'desc') => {
    console.log('🔄 SORTING PROCESS DATA:', { currentSortColumn, currentSortDirection });
    return [...data].sort((a, b) => {
      const aValue = a[currentSortColumn];
      const bValue = b[currentSortColumn];

      // Handle date fields
      if (currentSortColumn === 'insertDate') {
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

  export default function StatusMonitoring({ defaultTab, selectedBatchId: initialBatchId }: StatusMonitoringProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>(defaultTab || 'Batch');

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [searchDate, setSearchDate] = useState('');
    const [showDateRangeDropdown, setShowDateRangeDropdown] = useState(false);
    const [selectedDateRange, setSelectedDateRange] = useState<DateRangeOption>('Last 7 days');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [sortColumn, setSortColumn] = useState<ProcessSortableColumn>('insertDate');
    const [selectedBatchId, setSelectedBatchId] = useState<string | null>(initialBatchId || null);
    
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalTransactions, setTotalTransactions] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const [processes, setProcesses] = useState<Process[]>([]);
    const [totalProcesses, setTotalProcesses] = useState(0);
    const [processSortColumn, setProcessSortColumn] = useState<ProcessSortableColumn>('insertDate');
    const [processSortDirection, setProcessSortDirection] = useState<'asc' | 'desc'>('desc');

    const totalRecords = activeTab === 'Processes' ? totalProcesses : totalTransactions;
    const totalPages = Math.ceil(totalRecords / rowsPerPage); 

    const dateRangeOptions = [
      'Last 7 days',
      'Last 30 days',
      'Last 3 months',
      'Last 6 months',
      'Last 1 year'
    ] as const;

    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedProcessId, setSelectedProcessId] = useState<number | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [initialStatus, setInitialStatus] = useState<string | null>(null);
    const [comments, setComments] = useState('');
    const [processComments, setProcessComments] = useState<{[key: number]: { status: string; comments: string }}>({});

    // Add useEffect to get batchId from URL
    useEffect(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const batchId = urlParams.get('batchId');
      if (batchId) {
        setSelectedBatchId(batchId);
        console.log('🔍 Setting batchId from URL:', batchId);
      }
    }, []);

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
    const handleViewTransactionDetails = (batchJobId: string) => {
      router.push(`/processes?processDate=${batchJobId}`);
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
          setProcesses([]);
          setTotalProcesses(0);
        } else {
          setProcesses(data.data.data);
          setTotalProcesses(data.data.total);
          // Set error message if provided
          if (data.data.error) {
            setError(data.data.error);
          } else {
            setError(null);
          }
        }
      } catch (error) {
        setError('Failed to fetch process data');
        setProcesses([]);
        setTotalProcesses(0);
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

    // Add filter handlers
    const handleSearch = (searchTerm: string) => {
      setSearchDate(searchTerm);
      setPage(0); // Reset to first page when filtering
    };

    const handleDateRangeChange = (range: DateRangeOption) => {
      setSelectedDateRange(range);
      setPage(0); // Reset to first page when changing date range
    };

    // Add batch filter function
    const filterTransactions = (transactions: Transaction[]) => {
      return transactions.filter(transaction => {
        // Search filter
        const searchTerm = searchDate.toLowerCase();
        const matchesSearch = searchTerm === '' || 
          transaction.hrpsDateTime.toLowerCase().includes(searchTerm) ||
          transaction.pickupDate.toLowerCase().includes(searchTerm) ||
          transaction.status.toLowerCase().includes(searchTerm) ||
          transaction.createdDate.toLowerCase().includes(searchTerm);

        // Date range filter
        const transactionDate = new Date(transaction.hrpsDateTime);
        const now = new Date();
        const days = getDateRangeDays(selectedDateRange);
        const startDate = new Date(now.setDate(now.getDate() - days));
        const matchesDateRange = transactionDate >= startDate;

        return matchesSearch && matchesDateRange;
      });
    };

    // Add process filter function
    const filterProcesses = (processes: Process[]) => {
      return processes.filter(process => {
        // Search filter
        const searchTerm = searchDate.toLowerCase();
        const matchesSearch = searchTerm === '' || 
          process.insertDate.toLowerCase().includes(searchTerm) ||
          process.nric.toLowerCase().includes(searchTerm) ||
          process.name.toLowerCase().includes(searchTerm) ||
          process.actionType.toLowerCase().includes(searchTerm) ||
          process.personnelArea.toLowerCase().includes(searchTerm) ||
          process.status.toLowerCase().includes(searchTerm) ||
          process.errorMessage.toLowerCase().includes(searchTerm);

        // Date range filter
        const processDate = new Date(process.insertDate);
        const now = new Date();
        const days = getDateRangeDays(selectedDateRange);
        const startDate = new Date(now.setDate(now.getDate() - days));
        const matchesDateRange = processDate >= startDate;

        return matchesSearch && matchesDateRange;
      });
    };

    // Update useEffect to handle filtering
    useEffect(() => {
      const fetchData = async () => {
        try {
          setIsLoading(true);
          if (activeTab === 'Batch') {
            const response = await fetch(`/api/batch?page=${page}&limit=${rowsPerPage}&dateRange=${selectedDateRange}&sortColumn=${sortColumn}&sortDirection=${sortDirection}`);
            const data = await response.json();
            
            if (data.error) {
              setError(data.error);
            } else {
              // Apply filters to the fetched data
              const filteredData = filterTransactions(data.transactions.data);
              setTransactions(filteredData);
              setTotalTransactions(filteredData.length);
            }
          } else if (activeTab === 'Processes') {
            const response = await fetch(`/api/processes?page=${page}&limit=${rowsPerPage}&dateRange=${selectedDateRange}&sortColumn=${processSortColumn}&sortDirection=${processSortDirection}`);
            const data = await response.json();
            
            if (data.error) {
              setError(data.error);
            } else {
              // Apply filters to the fetched data
              const filteredData = filterProcesses(data.data.data);
              setProcesses(filteredData);
              setTotalProcesses(filteredData.length);
            }
          }
        } catch (error) {
          setError('Failed to fetch data');
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }, [page, rowsPerPage, selectedDateRange, sortColumn, sortDirection, processSortColumn, processSortDirection, searchDate, activeTab]);

    // Update the search input handler
    const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      handleSearch(e.target.value);
    };

    // Update the date range handler
    const handleDateRangeSelect = (range: string) => {
      handleDateRangeChange(range as DateRangeOption);
      setShowDateRangeDropdown(false);
    };


    // Download CSV handler
    function downloadCSV(processes: Process[], filename = 'process_table.csv') {
      if (!processes || processes.length === 0) return;
      const headers = [
        'BATCH ID',
        'PROCESS DATE TIME',
        'NRIC',
        'PERNR NUMBER',
        'ACTION TYPE',
        'AGENCY',
        'STATUS',
        'ERROR MESSAGE'
      ];

      const rows = processes.map((proc) => {
        const formattedDate = formatDate(proc.insertDate);
        const excelDate = `="${formattedDate}"`; 
        const batch = proc.batchId != null ? String(proc.batchId) : '';
        const errMsg = proc.errorMessage?.trim() !== '' ? proc.errorMessage : '';

        return [
          batch,
          excelDate,
          proc.nric,
          proc.personnelNumber,
          proc.actionType,
          proc.personnelArea,
          proc.status,
          errMsg
        ];
      });

      const escapeCell = (cell: string) => `"${cell.replace(/"/g, '""')}"`;
      const headerLine = headers.map(escapeCell).join(',');
      const dataLines = rows.map(row => row.map(escapeCell).join(','));
      const csvContent = [headerLine, ...dataLines].join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }


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

    // Add sorting function for processes
    const handleProcessSort = (column: ProcessSortableColumn) => {
      if (processSortColumn === column) {
        setProcessSortDirection(processSortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setProcessSortColumn(column);
        setProcessSortDirection('desc');
      }
    };

    // Add handleSort function
    const handleSort = (column: ProcessSortableColumn) => {
      console.log('🔄 HANDLING SORT:', { column, currentSort: sortColumn, currentDirection: sortDirection });
      if (column === sortColumn) {
        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
      } else {
        setSortColumn(column);
        setSortDirection('desc');
      }
    };

    // Update useEffect to include sorting
    useEffect(() => {
      const fetchProcessData = async () => {
        try {
          setIsLoading(true);
          const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: rowsPerPage.toString(),
            dateRange: selectedDateRange,
            sortColumn,
            sortDirection,
            ...(selectedBatchId && { batchId: selectedBatchId })
          });

          console.log('🔍 Fetching processes with params:', Object.fromEntries(queryParams.entries()));

          const response = await fetch(`/api/processes?${queryParams.toString()}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          
          if (data.error) {
            setError(data.error);
          } else {
            console.log('📦 Received process data:', {
              total: data.data.total,
              count: data.data.data.length,
              batchId: selectedBatchId
            });
            const sortedData = sortProcessData(data.data.data, sortColumn, sortDirection);
            setProcesses(sortedData);
            setTotalProcesses(data.data.total);
          }
        } catch (error) {
          console.error('❌ Error fetching process data:', error);
          setError('Failed to fetch process data');
        } finally {
          setIsLoading(false);
        }
      };

      if (activeTab === 'Processes') {
        fetchProcessData();
      }
    }, [page, rowsPerPage, selectedDateRange, sortColumn, sortDirection, activeTab, selectedBatchId]);

    // Add a clear filter button when batchId is selected
    const handleClearBatchFilter = () => {
      setSelectedBatchId(null);
      setError(null);
      // Remove batchId from URL without refreshing the page
      const url = new URL(window.location.href);
      url.searchParams.delete('batchId');
      window.history.pushState({}, '', url);
    };

    // Add this section in the JSX where you want to show the batch filter
    const renderBatchFilter = () => {
      if (selectedBatchId) {
        return (
          <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-md">
            <span className="text-sm text-blue-700">
              Filtered by Batch ID: {selectedBatchId}
            </span>
            <button
              onClick={handleClearBatchFilter}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Clear Filter
            </button>
          </div>
        );
      }
      return null;
    };

    return (
        <div className="flex h-screen w-full">
        {/* Sidebar - Fixed on left */}
        <div className="w-24 bg-[#1a4f82] text-white flex top-0 left-0 h-screen">
          <div className="p-4 flex flex-col items-center space-y-8">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-2">
                <span className="text-[#1a4f82] font-bold">H</span>
              </div>
              <span className="text-xs">HRPS</span>
            </div>
          </div>
        </div>

        {/* Main Content Area - Flex column layout */}
        <div className="flex-1 flex flex-col h-screen">
          {/* Header Section - Sticky top */}
          <div className="sticky top-0 z-[100] bg-white">
            <div className="border-b">
              <div className="px-6 py-4">
                <h1 className="text-xl font-medium">Status Monitoring</h1>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-6 border-b">
              <div className="flex space-x-8">
                <button
                  /*onClick={() => handleTabChange('Overview')} */
                  disabled
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
                  Processed
                  {activeTab === 'Processes' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1a4f82]"></div>
                  )}
                </button>
              </div>
            </div>

            {/* Search and Controls */}
            <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4 w-full">
                {renderBatchFilter()}
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
                      aria-label="Search transactions"
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
                </div>
              </div>
              <div className="flex items-center space-x-4 w-full sm:w-auto justify-end">
                <div className="relative">
                  <button 
                    onClick={() => setShowDateRangeDropdown(!showDateRangeDropdown)}
                    className="flex items-center space-x-2 hover:bg-gray-50 px-3 py-2 rounded-md whitespace-nowrap"
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
                    onClick={() => {
                      downloadCSV(processes, 'process_table.csv');
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

          {/* Dropdowns - Outside of table container */}
          {showDateRangeDropdown && (
            <div 
              className="fixed top-[200px] right-[180px] w-48 bg-white rounded-md shadow-lg border max-h-[400px] overflow-y-auto z-[999999] "
              role="listbox"
              aria-label="Date range options"
            >
              {dateRangeOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => handleDateRangeSelect(option as DateRangeOption)}
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

          {/* Table Container - Scrollable area */}
          <div className="flex-1 overflow-auto">
            {activeTab === 'Processes' && (
              <div className="h-full">
                <div className="relative">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-[#1a4f82] sticky top-0 z-10">
                      <tr>
                        <th
                          scope="col"
                          className="w-[10%] px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c]"
                          onClick={() => handleSort('batchId')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Batch ID</span>
                            {sortColumn === 'personnelNumber' && (
                              <svg
                                className={`w-4 h-4 transition-transform ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                              </svg>
                            )}
                          </div>
                        </th>
                        <th 
                          scope="col" 
                          className="w-[15%] px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c]"
                          onClick={() => handleSort('insertDate')}
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
                          onClick={() => handleSort('nric')}
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
                          onClick={() => handleSort('personnelNumber')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>PERNR NUMBER</span>
                            {sortColumn === 'personnelNumber' && (
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
                          onClick={() => handleSort('actionType')}
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
                          onClick={() => handleSort('personnelArea')}
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
                          onClick={() => handleSort('status')}
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
                          onClick={() => handleSort('errorMessage')}
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
                        <th className="w-[10%] px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 hover:bg-[#15406c]">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {isLoading ? (
                        <tr>
                          <td colSpan={9} className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a4f82]"></div>
                            </div>
                          </td>
                        </tr>
                      ) : error ? (
                        <tr>
                          <td colSpan={9} className="px-6 py-4 text-center text-red-500">
                            {error}
                          </td>
                        </tr>
                      ) : processes && processes.length > 0 ? (
                        sortProcessData(processes, sortColumn, sortDirection).slice(page * rowsPerPage, (page + 1) * rowsPerPage ).map((process) => (
                          <tr key={process.dataID} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                            <td className="w-[10%] px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-l border-gray-200">
                              {process.batchId ?? ''}
                            </td>
                            <td className="w-[15%] px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-x border-gray-200">
                              {formatDate(process.insertDate)}
                            </td>
                            <td className="w-[10%] px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                              {process.nric}
                            </td>
                            <td className="w-[15%] px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                              {process.personnelNumber}
                            </td>
                            <td className="w-[15%] px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                              {process.actionType}
                            </td>
                            <td className="w-[15%] px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                              {process.personnelArea}
                            </td>
                            <td className="w-[10%] px-6 py-4 whitespace-nowrap border-r border-gray-200">
                              <span className={`px-3 py-1 text-sm rounded-full inline-flex items-center ${getStatusStyle(process.status).bgColor} ${getStatusStyle(process.status).textColor}`}>
                                <span className={`w-1.5 h-1.5 rounded-full mr-2 ${getStatusStyle(process.status).dotColor}`}></span>
                                {getStatusText(process.status)}
                              </span>
                            </td>
                            <td className="w-[20%] px-6 py-4 text-sm text-gray-900 truncate border-r border-gray-200">
                              {process.errorMessage || ''}
                            </td>
                            <td className="w-[10%] px-6 py-4 whitespace-nowrap text-sm border-r border-gray-200">
                              {process.status.toUpperCase() === 'FAIL' && (
                                <button
                                  onClick={() => {
                                    setSelectedProcessId(process.dataID);
                                    setInitialStatus(process.status);
                                    setIsStatusModalOpen(true);
                                  }}
                                  className="bg-blue-600 bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded-md text-white text-sm font-medium"
                                  aria-label="Update Status"
                                >
                                  Update Status
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                            No data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Pagination - Sticky bottom */}
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
                  {[50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                <span className="text-sm font-medium text-gray-900">
                  Total Records: {activeTab === 'Batch' ? totalTransactions : totalProcesses}
                </span>
              </div>

              <div className="flex items-center">
                <span className="text-sm text-gray-700 mr-4">
                  Showing {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, activeTab === 'Batch' ? totalTransactions : totalProcesses)} of {activeTab === 'Batch' ? totalTransactions : totalProcesses}
                </span>
                <nav className="flex items-center space-x-1">
                  <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                    disabled={page === 0}
                    className={`px-2 py-1 text-sm rounded-md ${
                      page === 0
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    aria-label="Previous page"
                  >
                    &lt;
                  </button>

                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPage(idx)}
                      className={`px-2 py-1 text-sm rounded-md ${
                        page === idx
                          ? 'bg-[#1a4f82] text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      aria-label={`Page ${idx + 1}`}
                    >
                      {idx + 1}
                    </button>
                  ))}

                  <button
                    onClick={() =>
                      setPage((prev) => Math.min(prev + 1, totalPages - 1))
                    }
                    disabled={page + 1 >= totalPages}
                    className={`px-2 py-1 text-sm rounded-md ${
                      page + 1 >= totalPages
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    aria-label="Next page"
                  >
                    &gt;
                  </button>

                  <button
                    onClick={() => setPage(totalPages - 1)}
                    disabled={page === totalPages - 1}
                    className={`px-2 py-1 text-sm rounded-md ${
                      page === totalPages - 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    aria-label="Last page"
                  >
                    &gt;&gt;
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* Modal for Status */}
        {isStatusModalOpen && selectedProcessId !== null && (
          <StatusPopup
            isOpen={true}                        
            userName="John Doe"                  
            onClose={() => {
              setIsStatusModalOpen(false);
              setSelectedProcessId(null);
              setInitialStatus(null);
            }}
            onSubmit={(newStatus: string, comments?: string) => {
              // 1) call your POST endpoint
              fetch('/api/processes/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  dataID: selectedProcessId,
                  status: newStatus === 'Reviewed' ? 0 : 1,
                  comment: comments ?? '',
                  type: 1,
                }),
              })
                .then((res) => {
                  if (!res.ok) throw new Error('Failed to update status');
                  return res.json();
                })
                .then(() => {
                  // 2) close popup
                  setIsStatusModalOpen(false);
                  setSelectedProcessId(null);
                  setInitialStatus(null);
                  // 3) refresh your table
                  if (selectedBatchId) {
                    fetchProcessesByBatchId(selectedBatchId);
                  } else {
                    fetchAllProcesses();
                  }
                })
                .catch((err) => {
                  console.error('Error updating status:', err);
                });
            }}
          />
        )}
      </div>
    );
  }