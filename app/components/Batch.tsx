'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import config from '../common/config';
import { ActionType, Batch, BatchProps, BatchSortableColumn, SortableColumn, TabType, Transaction } from '../types/batch';
import { getDateRangeDays } from '../utils/Date';
import { Process } from '../types/Process';
import { DateRangeOption, dateRangeOptions } from '../types/general';


// Add a date formatting function
function updateFormatDate(dateString: string | null | undefined) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '-';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function sortBatchData(
  data: Transaction[],
  column: BatchSortableColumn,
  direction: 'asc' | 'desc'
): Transaction[] {
  return [...data].sort((a, b) => {
    const aVal = a[column];
    const bVal = b[column];

    // Handle date comparison
    if (column === 'hrpsDateTime' || column === 'pickupDate') {
      const aDate = new Date(aVal ?? '').getTime();
      const bDate = new Date(bVal ?? '').getTime();
      return direction === 'asc' ? aDate - bDate : bDate - aDate;
    }

    // Handle numeric comparison
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return direction === 'asc' ? aVal - bVal : bVal - aVal;
    }

    // Default string comparison
    const strA = String(aVal ?? '').toLowerCase();
    const strB = String(bVal ?? '').toLowerCase();
    return direction === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
  });
}

export default function BatchComponent({ defaultTab = 'Batch' }: BatchProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('Batch');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [searchDate, setSearchDate] = useState('');
  const [showDateRangeDropdown, setShowDateRangeDropdown] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRangeOption>('Last 7 days');
  const [sortColumn, setSortColumn] = useState<SortableColumn>('hrpsDateTime');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionTypesLoading, setIsActionTypesLoading] = useState(true);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalPage, setTotalPage] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const handleDateRangeChange = (range: DateRangeOption) => {
    setSelectedDateRange(range);
    setShowDateRangeDropdown(false);
    setPage(0);
  };

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

  const fetchBatchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const days = getDateRangeDays(selectedDateRange);
      const queryParams = new URLSearchParams({
        page: String(page + 1),
        limit: String(rowsPerPage),
        sortColumn,
        sortDirection,
        Search: searchDate,
        daysRange: String(days)
      });

    
      const response = await fetch(`${config.API_URL}/hrp/batches?${queryParams.toString()}`);
      const result = await response.json();

      if (result.data?.data) {
        setTransactions(result.data.data);
        setTotalTransactions(result.data.totalRecords);
        setTotalPage(result.data.totalPage);
        setCurrentPage(result.data.currentPage);
      } else {
        setTransactions([]);
        setTotalTransactions(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setTransactions([]);
      setTotalTransactions(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBatchData();
  }, [page, rowsPerPage, selectedDateRange, sortColumn, sortDirection, searchDate]);
    

  // Update the filtered transactions to use both filter and sort
  const filteredTransactions = sortBatchData(transactions, sortColumn, sortDirection);
  const handleActionTypes = (processes: Process[]) => {
    const actionTypeMap: { [key: string]: number } = {};
    processes.forEach((process) => {
      actionTypeMap[process.actionType] = (actionTypeMap[process.actionType] || 0) + 1;
    });
    const result = Object.entries(actionTypeMap).map(([type, count]) => ({ type, count }));
    // console.log("Batch Action Types: ", result);
    return result;
  }

  //Processes is Transaction
  const handleViewTransactionDetails = (batchJobId: number) => {
    router.push(`/processes?BatchJobId=${batchJobId}`);
  };

  const handleSearch = (searchTerm: string) => {
    setSearchDate(searchTerm);
    setPage(0); // Reset to first page when filtering
  };

  const handleSort = (column: BatchSortableColumn) => {
      // console.log('🔄 HANDLING SORT:', { column, currentSort: sortColumn, currentDirection: sortDirection });
      if (column === sortColumn) {
        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
      } else {
        setSortColumn(column);
        setSortDirection('desc');
      }
    };

  // Update pagination section
  const startItem = page * rowsPerPage + 1;
  const endItem = Math.min((page + 1) * rowsPerPage, totalTransactions);

  const dateButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });


  const handleDateButtonClick = () => {
    if (dateButtonRef.current) {
      const rect = dateButtonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
    setShowDateRangeDropdown((prev) => !prev);
  };

  const downloadCSV = async () => {
    try {
      const days = getDateRangeDays(selectedDateRange);
      const queryParams = new URLSearchParams({
        page: '1',
        limit: '9999',
        sortColumn,
        sortDirection,
        Search: searchDate,
        daysRange: String(days),
      });
  
      const response = await fetch(`${config.API_URL}/hrp/batches?${queryParams.toString()}`);
      const json = await response.json();
  
      if (!json.data?.data?.length) {
        alert('No data available to download');
        return;
      }
  
      const batches: Batch[] = json.data.data;
      const headers = ['BATCH ID', 'HRPS DATE TIME', 'PICKUP DATE TIME', 'TOTAL CSV FILE', 'STATUS'];
      const rows = batches.map(batch => [
        String(batch.batchJobId),
        `="${updateFormatDate(batch.hrpsDateTime)}"`,
        `="${updateFormatDate(batch.pickupDate)}"`,
        String(batch.totalCSVFiles),
        batch.status ?? '',
      ]);
  
      const escapeCell = (cell: string) => `"${cell.replace(/"/g, '""')}"`;
      const csvContent = [
        headers.map(escapeCell).join(','),
        ...rows.map(row => row.map(escapeCell).join(','))
      ].join('\r\n');
  
      // Get current date in YYYY-MM-DD format
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `batch_table_${currentDate}.csv`;
  
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('CSV Download Error:', error);
      alert('Error downloading CSV');
    }
  };

  // Add new state for hovered and modal batch action types
  const [hoveredBatchId, setHoveredBatchId] = useState<number | null>(null);
  const [hoveredActionTypes, setHoveredActionTypes] = useState<ActionType[]>([]);
  const [isHoveredActionTypesLoading, setIsHoveredActionTypesLoading] = useState(false);
  const [hoveredActionTypesError, setHoveredActionTypesError] = useState<string | null>(null);

  const [modalBatchId, setModalBatchId] = useState<number | null>(null);
  const [modalActionTypes, setModalActionTypes] = useState<ActionType[]>([]);
  const [isModalActionTypesLoading, setIsModalActionTypesLoading] = useState(false);
  const [modalActionTypesError, setModalActionTypesError] = useState<string | null>(null);

  // Fetch action types for a batch (used for both tooltip and modal)
  const fetchActionTypesForBatch = async (batch: Batch, forModal: boolean = false) => {
    const setLoading = forModal ? setIsModalActionTypesLoading : setIsHoveredActionTypesLoading;
    const setError = forModal ? setModalActionTypesError : setHoveredActionTypesError;
    const setActionTypes = forModal ? setModalActionTypes : setHoveredActionTypes;
  
    setLoading(true);
    setError(null);
  
    try {
      const response = await fetch(`${config.API_URL}/HRP/Processes?BatchJobId=${batch.batchJobId}`);
      const data = await response.json();
  
      if (data.error || data.errorMessage) {
        setError(data.error || data.errorMessage);
        setActionTypes([]);
      } else {
        setActionTypes(handleActionTypes(data.data.data));
      }
    } catch (e) {
      setError('Failed to fetch action types');
      setActionTypes([]);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex h-screen w-full">
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
      <div className="flex-1 flex flex-col h-screen relative">
        {/* Header Section - Sticky top */}
        <div className="sticky top-0 z-10 bg-white">
          <div className="border-b">
            <div className="px-4 sm:px-6 py-4">
              <h1 className="text-lg sm:text-xl font-medium">HRPS</h1>
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
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b bg-white space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <span className="text-sm whitespace-nowrap">Search</span>
              <div className="relative flex-1 sm:flex-none">
                <input
                  type="text"
                  id="search-input"
                  name="search"
                  value={searchDate}
                  onChange={(e) =>handleSearch(e.target.value)}
                  // placeholder={`Search ${activeTab.toLowerCase()}...`}
                  placeholder={`search by date yyyy/mm/dd `}
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
            <div className="flex items-center space-x-4 w-full sm:w-auto justify-end">
              <div className="relative">
                <button 
                  ref={dateButtonRef}
                  onClick={handleDateButtonClick}
                  className="flex items-center space-x-2 hover:bg-gray-50 px-3 py-2 rounded-md text-sm"
                  aria-label="Select date range"
                  aria-expanded={showDateRangeDropdown}
                  aria-haspopup="listbox"
                >
                  <span className="text-sm whitespace-nowrap">{selectedDateRange}</span>
                  <svg className={`w-4 h-4 transition-transform ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              <div className="relative">
                <button 
                  onClick={downloadCSV}
                  className="flex items-center space-x-2 text-sm text-[#1a4f82] hover:bg-blue-50 px-3 py-2 rounded-md whitespace-nowrap"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dropdowns rendered here, as siblings to table container */}
        {showDateRangeDropdown && (
          <div
            className="absolute mt-2 bg-white rounded-md shadow-lg z-50 border max-h- overflow-y-auto min-w-[10rem]"
            style={{
              position:'-moz-initial',
              top: dropdownPos.top,
              left: dropdownPos.left -140,
              minWidth: 160, // 12re
            }}
            role="listbox"
            aria-label="Date range options"
          >
            {dateRangeOptions.map((option) => (
              <button
                key={option}
                onClick={() => handleDateRangeChange(option as DateRangeOption)}
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
        

        {/* Table Container - Only this scrolls */}
        <div className="flex-1 min-h-0 relative w-full">
          <div className="h-full overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#1a4f82] sticky top-0 z-10">
                <tr>
                  <th 
                    scope="col" 
                    className="w-[10%] px-4 sm:px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c] whitespace-nowrap"
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="w-[15%] px-4 sm:px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c] whitespace-nowrap"
                    onClick={() => handleSort('hrpsDateTime')}
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
                    className="w-[15%] px-4 sm:px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c] whitespace-nowrap"
                    onClick={() => handleSort('pickupDate')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Pickup Date Time</span>
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
                    className="w-[15%] px-4 sm:px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c] whitespace-nowrap"
                    onClick={() => handleSort('totalCSVFiles')}
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
                    className="w-[15%] px-4 sm:px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c] whitespace-nowrap"
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
                  
                  <th scope="col" className="w-[10%] px-4 sm:px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 sm:px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a4f82]"></div>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="px-4 sm:px-6 py-4 text-center text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : filteredTransactions && filteredTransactions.length > 0 ? (
                  filteredTransactions.map((batch) => ( 
                    <tr key={batch.batchJobId} 
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"> 
                    
                      <td className="w-[10%] px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">
                        {batch.batchJobId}
                      </td>
                      <td className="w-[15%] px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">
                        {updateFormatDate(batch.hrpsDateTime)}
                      </td>
                      <td className="w-[15%] px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">
                        {updateFormatDate(batch.pickupDate)}
                      </td>


                      <td className="w-[15%] px-4 sm:px-6 py-4 whitespace-nowrap text-sm border border-gray-200 relative">
                        <button
                          className="text-[#1a4f82] hover:text-blue-700 font-medium relative"
                          onClick={() => {
                            setModalBatchId(batch.batchJobId);
                            fetchActionTypesForBatch(batch, true);
                          }}
                          onMouseEnter={() => {
                            setHoveredBatchId(batch.batchJobId);
                            fetchActionTypesForBatch(batch, false);
                          }}
                          onMouseLeave={() => {
                            setHoveredBatchId(null);
                            setHoveredActionTypes([]);
                            setHoveredActionTypesError(null);
                          }}
                        >
                          {batch.totalCSVFiles || 0}
                        </button>
                        {/* Tooltip for this batch */}
                        {hoveredBatchId === batch.batchJobId && (
                          <div className="absolute z-50 left-1/2 -translate-x-1/2 mt-2 w-56 rounded bg-white text-gray-700 p-2 text-xs shadow-lg">
                            <div className="font-semibold mb-1">Action Types:</div>
                            {isHoveredActionTypesLoading ? (
                              <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              </div>
                            ) : hoveredActionTypesError ? (
                              <div>{hoveredActionTypesError}</div>
                            ) : hoveredActionTypes.length > 0 ? (
                              hoveredActionTypes.map((actionType) => (
                                <div key={actionType.type}>{actionType.type}: {actionType.count}</div>
                              ))
                            ) : (
                              <div>No data available</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="w-[15%] px-4 sm:px-6 py-4 whitespace-nowrap border border-gray-200">
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
                            {batch.status || 'Pending'}
                          </span>
                        </div>
                      </td>
                      
                      <td className="w-[10%] px-4 sm:px-6 py-4 whitespace-nowrap border border-gray-200">
                        {batch.status === 'Fail' && (
                          <button
                            onClick={() => handleViewTransactionDetails(batch.batchJobId)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Detailed Transaction
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 sm:px-6 py-4 text-center text-gray-500">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
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
                Total Records: {totalTransactions}
              </span>
            </div>

            <div className="flex items-center">
              <span className="text-sm text-gray-700 mr-4">
                Showing {startItem}-{endItem} of {totalTransactions}
              </span>
              <nav className="flex items-center space-x-1">
                <button
                  onClick={() => setPage(0)}
                  disabled={page === 0}
                  className={`px-2 py-1 text-sm rounded-md ${
                    page === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  aria-label="First page"
                >
                  &lt;&lt;
                </button>
                
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

                {Array.from({ length: totalPage }).map((_, idx) => (
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
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPage - 1))}
                  disabled={page + 1 >= totalPage}
                  className={`px-2 py-1 text-sm rounded-md ${
                    page + 1 >= totalPage ? 'text-gray-300 cursor-not-allowed': 'text-gray-700 hover:bg-gray-100'
                  }`}
                  aria-label="Next page"
                >
                  &gt;
                </button>

                <button
                  onClick={() => setPage(totalPage - 1)}
                  disabled={page === totalPage - 1}
                  className={`px-2 py-1 text-sm rounded-md ${
                    page === totalPage - 1 ? 'text-gray-300 cursor-not-allowed': 'text-gray-700 hover:bg-gray-100'
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

      {/* Modal for action types */}
      {modalBatchId !== null && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[9999]"
          onClick={() => {
            setModalBatchId(null);
            setModalActionTypes([]);
            setModalActionTypesError(null);
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl p-6 w-96 relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Action Types:</h3>
              <button 
                onClick={() => {
                  setModalBatchId(null);
                  setModalActionTypes([]);
                  setModalActionTypesError(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="text-sm text-gray-600">
              {isModalActionTypesLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a4f82]"></div>
                </div>
              ) : modalActionTypesError ? (
                <div>{modalActionTypesError}</div>
              ) : modalActionTypes.length > 0 ? (
                <div>
                  {modalActionTypes.map((actionType) => (
                    <div key={actionType.type}>{actionType.type}: {actionType.count}</div>
                  ))}
                </div>
              ) : (
                <div>No data available</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 