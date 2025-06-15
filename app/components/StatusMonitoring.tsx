 'use client';

  import React, { useState, useEffect } from 'react';
  import { useRouter } from 'next/navigation';
  import StatusPopup from './StatusPopup'; // adjust path as needed
  import config from '../common/config';
  import toLocalISOString from '../common/to-local-iso-string';
  import { DateRangeOption, dateRangeOptions } from '../types/general';
  import { Process } from '../types/Process';
import { getStatusStyle, getStatusText } from '../utils/Status';


  // Update StatusMonitoringProps interface
  interface StatusMonitoringProps {
    defaultTab: 'Overview' | 'Batch' | 'Processes';
    selectedBatchId?: string;
  }

 
  function formatDate(dateString: string) {
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
  type ProcessSortableColumn = 'batchJobId' |'personnelNumber' | 'insertDate' |'nric' |'personnelNumber' | 'actionType' | 'personnelArea' | 'status' | 'errorMessage';

  // Add sorting function for process data
  const sortProcessData = (data: Process[], currentSortColumn: ProcessSortableColumn, currentSortDirection: 'asc' | 'desc') => {
    // console.log('🔄 SORTING PROCESS DATA:', { currentSortColumn, currentSortDirection });
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
    const [activeTab, setActiveTab] = useState<'Overview' | 'Batch' | 'Processes'>(defaultTab || 'Batch');

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [searchDate, setSearchDate] = useState('');
    const [showDateRangeDropdown, setShowDateRangeDropdown] = useState(false);
    const [selectedDateRange, setSelectedDateRange] = useState<DateRangeOption>('Last 7 days');

    const [sortColumn, setSortColumn] = useState<ProcessSortableColumn>('insertDate');
const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const [selectedBatchId, setSelectedBatchId] = useState<string | null>(initialBatchId || null);

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalTransactions, setTotalTransactions] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Main Data Fetch
    const [processes, setProcesses] = useState<Process[]>([]);
    // Total No. of Data(s)
    const [totalProcesses, setTotalProcesses] = useState(0);

    const totalRecords = activeTab === 'Processes' ? totalProcesses : totalTransactions;
    const totalPages = Math.ceil(totalRecords / rowsPerPage); 

    // checkbox functions
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
    const [selectAll, setSelectAll] = useState(false);
    const allIds = activeTab === 'Processes' ? processes.map(p => p.dataID) : transactions.map(t => t.id);

    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
    // Add useEffect to get batchId from URL
    useEffect(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const batchId = urlParams.get('batchId');
      if (batchId) {
        setSelectedBatchId(batchId);
        // console.log('🔍 Setting batchId from URL:', batchId);
      }
    }, []);

    useEffect(() => {
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

      const fetchData = async () => {
        setIsLoading(true);
        const dateSelected = getDateRangeDays(selectedDateRange).toString();

        try {
          const url = new URL(`${config.API_URL}/hrp/processes`);
          url.searchParams.set('page', page.toString());
          url.searchParams.set('limit', rowsPerPage.toString());
          url.searchParams.set('dateRange', dateSelected);
          url.searchParams.set('sortColumn', sortColumn);
          url.searchParams.set('sortDirection', sortDirection);
          if (selectedBatchId) url.searchParams.set('batchId', selectedBatchId);

          const res = await fetch(url.toString());
          const json = await res.json();

          if (json.error || json.errorMessage) {
            setError(json.error || json.errorMessage);
            setProcesses([]);
            setTotalProcesses(0);
          } else {
            setProcesses(json.data.data);
            setTotalProcesses(json.data.totalRecords);
            setError(null);
          }
        } catch (err) {
          setError("Failed to fetch data");
        } finally {
          setIsLoading(false);
        }
      };

      if (activeTab === 'Processes') fetchData();

    }, [page,rowsPerPage,searchDate,sortColumn,sortDirection,selectedBatchId, activeTab,selectedDateRange
    ]);


function filterData<T extends { hrpsDateTime?: string; insertDate?: string; status: string; createdDate?: string }>(
  list: T[],
  search: string,
  dateRange: DateRangeOption
): T[] {
  // console.log ("start filter data .....")
  // const searchTerm = search.toLowerCase();
  const days = getDateRangeDays(dateRange);
  const startDate = new Date(new Date().setDate(new Date().getDate() - days));

  console.log (`check SEARCH TERM date --> ${days}`)

  return list.filter(item => {
    const dateStr = item.insertDate || item.hrpsDateTime || item.createdDate || '';
    const date = new Date(dateStr);
    const matchesDate = date >= startDate;

    const values = Object.values(item).map(val => String(val).toLowerCase());
    // const matchesSearch = search === '' || values.some(val => val.includes(searchTerm));

    
    return matchesDate ;
    // && matchesSearch;
    
  });
}

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

    // Add a new function to fetch all processes
    const fetchAllProcesses = async () => {
      try {
        setIsLoading(true);
        // ?page=${page}&limit=${rowsPerPage}&dateRange=${selectedDateRange}&sortColumn=${processSortColumn}&sortDirection=${processSortDirection}
        const response = await fetch(`${config.API_URL}/hrp/processes?page=${page}&limit=${rowsPerPage}`);
        const data = await response.json();
        console.log("data here --->", data)

        if (data.error) {
          setError(data.error);
        } else {
          setProcesses(data.data.data);
          setTotalProcesses(data.data.totalRecords);
        }
      } catch (error) {
        setError('Failed to fetch process data');
      } finally {
        setIsLoading(false);
      }
    };


    // Add filter handlers
    const handleSearch = (searchTerm: string) => {
      setSearchDate(searchTerm);
      setPage(0); // Reset to first page when filtering
    };

    const handleDateRangeChange = (range: DateRangeOption) => {
      setSelectedDateRange(range);
      setShowDateRangeDropdown(false);
      
      setPage(0); // Reset to first page when changing date range
    };

    //Checkbox handlers
    const handleSelectAll = () => {
      const failIds = processes.filter(p => p.status.toUpperCase() === "FAIL").map(p => p.dataID);
      if (selectAll) {
        setSelectedRows(new Set());
        setSelectAll(false);
      } else {
        setSelectedRows(new Set(failIds));
        setSelectAll(true);
      }
    };

    const handleCheckboxChange = (id: number) => {
      setSelectedRows((prev) => {
        const updated = new Set(prev);
        if (updated.has(id)) {
          updated.delete(id);
        } else {
          updated.add(id);
        }
        setSelectAll(updated.size === allIds.length);
        return updated;
      });
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
        const batch = proc.batchJobId != null ? String(proc.batchJobId) : '';
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
    const handleStatusUpdate = async (
      newStatus: 'Reviewed' | 'Others',
      rawComment: string,
      dataID: number,
      type: number 
    ) => {
      try {
        const isoTimestamp = toLocalISOString(new Date());
        const response = await fetch(`${config.API_URL}/hrp/processes/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: newStatus === 'Reviewed' ? 0 : 1,
            comment: newStatus === 'Others' ? rawComment : '',
            insertDate: isoTimestamp, 
            type,
            dataID,
          }),
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        const returnAction = data.action || {
          insertDate: isoTimestamp,
          comment: rawComment.trim(),
          type,
          dataID,
          status: newStatus === 'Reviewed'?0:1
        };

        setProcesses(prev =>
          prev.map(p =>
            p.dataID === dataID ? { ...p, status: newStatus, action: newStatus === 'Others'
              ? returnAction
              :undefined
            } : p
          )
        );

        setIsStatusModalOpen(false);
        setSelectedProcess(null);

      } catch (error) {
        console.error('Error updating status:', error);
      }
    };

    const onPopupSubmit = (status: 'Reviewed' | 'Others', rawComment?: string) => {
      // Batch update
      if (!selectedProcess && selectedRows.size > 0) {
        Array.from(selectedRows).forEach((id) => {
          const proc = processes.find((p) => p.dataID === id);
          if (proc) {
            handleStatusUpdate(status, rawComment ?? '', proc.dataID, proc.processFlags);
          }
        });
        setSelectedRows(new Set());
        setIsStatusModalOpen(false);
        return;
      }
      // Single row update
      if (selectedProcess) {
        handleStatusUpdate(status, rawComment ?? '', selectedProcess.dataID, selectedProcess.processFlags);
        setIsStatusModalOpen(false);
        setSelectedProcess(null);
      }
    };

    // Add handleSort function
    const handleSort = (column: ProcessSortableColumn) => {
      // console.log('🔄 HANDLING SORT:', { column, currentSort: sortColumn, currentDirection: sortDirection });
      if (column === sortColumn) {
        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
      } else {
        setSortColumn(column);
        setSortDirection('desc');
      }
    };

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
                  <div className="relative flex items-center">
                  {selectedRows.size > 0 && (
                    <div className="flex items-center ">
                      <button
                        onClick={() => {
                          setSelectedProcess(null); // batch mode, not single process
                          setIsStatusModalOpen(true);
                        }}
                        className="bg-[#1a4f82] hover:bg-[#15406c] px-3 py-1 rounded-md text-white text-sm font-medium flex items-center"
                      >
                        Update Status
                        <div></div>
                      </button>
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
                            handleDateRangeChange(option);
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
          
          {/* Table Container - Scrollable area */}
          <div className="flex-1 overflow-y-scroll overflow-x-auto">
            {activeTab === 'Processes' && (
              <div className="h-full ">
                <div className="relative">
                  <table className="w-full divide-y divide-gray-200">
                    <thead className="sticky top-0 bg-[#1a4f82] z-10">
                      <tr>
                        <th className="w-24 px-4 py-2 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c]">                     
                          <label className="flex items-center space-x-2">
                            <input 
                              type="checkbox"
                              className="flex h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 transition-all duration-150"
                              checked={selectAll} 
                              onChange={handleSelectAll}
                            />
                          </label> 
                        </th>
                        <th
                          scope="col"
                          className="w-20 px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c]"
                          onClick={() => handleSort('batchJobId')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Batch ID</span>
                            {sortColumn === 'batchJobId' && (
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
                          className="w-36 px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c]"
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
                          className="w-24 px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c]"
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
                          className="w-28 px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c]"
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
                          className="w-28 px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c]"
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
                          className="w-20 px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c]"
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
                          className="w-28 px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c]"
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
                          className="w-48 px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c]"
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
                        <th className="w-48 px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 hover:bg-[#15406c]">
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
                          <td colSpan={9} className="px-6 py-3 text-center text-red-500">
                            {error}
                          </td>
                        </tr>
                      ) : processes && processes.length > 0 ? (
                        sortProcessData(processes, sortColumn, sortDirection).slice(page * rowsPerPage, (page + 1) * rowsPerPage ).map((process) => (
                          <tr key={process.dataID} className={`border-b border-gray-200 transition-colors ${selectedRows.has(process.dataID) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>                            
                            <td className="w-[2%] px-4 py-2">
                              {process.status === 'Fail' && (
                              <input
                                type="checkbox"
                                checked={selectedRows.has(process.dataID)}
                                onChange={() => handleCheckboxChange(process.dataID)}
                                className="form-checkbox h-4 w-4 text-[#1a4f82] focus:ring-[#1a4f82] border-gray-300 rounded"
                              />)}
                            </td>
                            <td className="w-[8%] px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 border-l border-gray-200">
                              {process.batchJobId ?? ''}
                            </td>
                            <td className="w-[10%] px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-x border-gray-200">
                              {formatDate(process.insertDate)}
                            </td>
                            <td className="w-[10%] px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                              {process.nric}
                            </td>
                            <td className="w-[10%] px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                              {process.personnelNumber}
                            </td>
                            <td className="w-[10%] px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                              {process.actionType}
                            </td>
                            <td className="w-[5%] px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                              {process.personnelArea}
                            </td>
                            <td className="w-[8%] px-6 py-4 whitespace-nowrap border-r border-gray-200">
                              <span className={`px-2.5 py-1 text-sm rounded-full inline-flex items-center ${getStatusStyle(process.status).bgColor} ${getStatusStyle(process.status).textColor}`}>
                                <span className={`w-1.5 h-1.5 rounded-full mr-2 ${getStatusStyle(process.status).dotColor}`}></span>
                                {getStatusText(process.status)}
                              </span>
                            </td>
                            <td className="w-[15%] px-6 py-4 text-sm text-gray-900 break-words border-r border-gray-200">
                              {process.errorMessage || '-'}
                            </td>
                            <td className="w-[15%] px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                              {process.status === 'Others' && process.action && process.action.comment && (
                                <div className="text-sm text-gray-500 whitespace-normal break-words">
                                  ({formatDate(process.action.insertDate)}):&nbsp;{process.action.comment}
                                </div>
                              )}

                              {/* if there’s no action yet and status is FAIL, show Update button */}
                              {(!process.action || !process.action.insertDate) && process.status.toUpperCase() === 'FAIL' && (
                                <button
                                  onClick={() => {
                                    setSelectedProcess(process);
                                    setIsStatusModalOpen(true);
                                  }}
                                  className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md text-white text-sm font-medium"
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
                  {[2, 50, 100].map((size) => (
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
                      page === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'
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
                        page === idx ? 'bg-[#1a4f82] text-white' : 'text-gray-700 hover:bg-gray-100'
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
                      page + 1 >= totalPages ? 'text-gray-300 cursor-not-allowed': 'text-gray-700 hover:bg-gray-100'
                    }`}
                    aria-label="Next page"
                  >
                    &gt;
                  </button>

                  <button
                    onClick={() => setPage(totalPages - 1)}
                    disabled={page === totalPages - 1}
                    className={`px-2 py-1 text-sm rounded-md ${
                      page === totalPages - 1 ? 'text-gray-300 cursor-not-allowed': 'text-gray-700 hover:bg-gray-100'
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

        {isStatusModalOpen && selectedProcess !== null && (
          <StatusPopup
            isOpen={true}
            onClose={() => {
              setIsStatusModalOpen(false);
              setSelectedProcess(null);
            }}
            onSubmit={onPopupSubmit}
          />
        )}
      </div>
    );
    }
