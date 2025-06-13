'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Tooltip, Button } from "@material-tailwind/react";
import { useRouter } from 'next/navigation';
import config from '../common/config';

// Update interfaces with proper type definitions
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

interface Batch {
  batchJobId: number;
  hrpsDateTime: string;
  pickupDate: string;
  totalCSVFiles: number;
  status: string;
  createdDate: string;
  lastUpdatedDate: string;
}

interface ActionType {
  type: string;
  count: number;
}

interface BatchResponse {
  transactions: {
    data: Batch[];
    total: number;
  };
  error?: string;
}

const HRPS_API_BASE_URL = '/hrps-api/HRP';  

interface BatchProps {
  defaultTab?: 'Overview' | 'Batch' | 'Processes';
}

// Add proper type for event handlers
type TabType = 'Overview' | 'Batch' | 'Processes';

const getStatusText = (status: string): string => {
  return status;
};

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

interface Transaction {
  batchJobId: number;
  hrpsDateTime: string;
  pickupDate: string;
  totalCSVFiles: number;
  status: string;
  createdDate: string;
  lastUpdatedDate: string;
}



// Add type for sortable columns
type SortableColumn = 'hrpsDateTime' | 'pickupDate' | 'totalCSVFiles' | 'status' | 'batchJobId';

// Add a date formatting function
function formatDate(dateString: string | null | undefined) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '-';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// Add a date formatting function
function updateFormatDate(dateString: string | null | undefined) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '-';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// Add interface for optional parameters
interface FetchBatchOptions {
  page?: number;
  limit?: number;
  dateRange?: string;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  searchTerm?: string;
}

export default function Batch({ defaultTab = 'Batch' }: BatchProps) {
  console.log('🚀 BATCH COMPONENT MOUNTING');
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('Batch');
  console.log('📌 Initial activeTab:', activeTab);
  
  // Add immediate effect to verify component lifecycle
  useEffect(() => {
    console.log('🔄 BATCH COMPONENT MOUNTED');
    return () => {
      console.log('👋 BATCH COMPONENT UNMOUNTING');
    };
  }, []);

  const [showActionTypes, setShowActionTypes] = useState(false);
  const [showActionTypesTooltip, setShowActionTypesTooltip] = useState(false);

  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const [searchDate, setSearchDate] = useState('');
  const [showDateRangeDropdown, setShowDateRangeDropdown] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState<typeof dateRangeOptions[number]>('Last 7 days');
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<SortableColumn>('hrpsDateTime');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  //Batches
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionTypesLoading, setIsActionTypesLoading] = useState(true);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalPage, setTotalPage] = useState(0);
  const [dataPerPage, setDataPerPage] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [processes, setProcesses] = useState<Process[]>([]);
  const [totalProcesses, setTotalProcesses] = useState(0);
  const [processSortColumn, setProcessSortColumn] = useState<'processDateTime'>('processDateTime');
  const [processSortDirection, setProcessSortDirection] = useState<'asc' | 'desc'>('desc');

  const [openStatusDropdown, setOpenStatusDropdown] = useState<number | null>(null);
  const [getActionTypes, setGetActionTypes] = useState<boolean>(false);
  //const [actionTypes, setActionTypes] = useState<string[]>([]);
  const [batchActionType, setBatchActionType] = useState<ActionType[]>([]);

  const [appointments, setAppointments] = useState<number>(0);
  const [posting, setPosting] = useState<number>(0);
  const [transfer, setTransfer] = useState<number>(0);
  const [other, setOther] = useState<number>(0);

  
  
  const statusOptions = ['Success', 'Failed', 'Pending'] as const;
  type StatusOption = typeof statusOptions[number];

  const dateRangeOptions = [
    // 'All Time',
    'Last 7 days',
    'Last 30 days',
    'Last 3 months',
    'Last 6 months',
    'Last 1 year',

  ] as const;
  type DateRangeOption = typeof dateRangeOptions[number];


  const downloadOptions = [
    { id: 'batch', label: 'Batch Table' }
  ] as const;

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedProcessId, setSelectedProcessId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<StatusOption | null>(null);
  const [comments, setComments] = useState('');
  const [processComments, setProcessComments] = useState<Record<number, { status: string; comments: string }>>({});


  const [batchProcesses, setBatchProcesses] = useState<Process[]>([]);
  const [isBatchProcessesLoading, setIsBatchProcessesLoading] = useState(false);

  const [batchDate, setBatchDate] = useState<string | null>(null);

  // Add debug logging for initial render
  useEffect(() => {
    console.log('Initial render - defaultTab:', defaultTab);
    console.log('Initial render - activeTab:', activeTab);
  }, [defaultTab, activeTab]);

  // Single declaration of handlers with proper types
  const handleTabChange = (tab: TabType): void => {
    console.log('Tab change requested:', tab);
    console.log('Current activeTab:', activeTab);
    
    if (tab === activeTab) return;
    
    setActiveTab(tab);
    console.log('New activeTab set to:', tab);
    
    switch (tab) {
      case 'Overview':
        //window.location.href = '/';
        router.push('/');
        break;
      case 'Batch':
        //window.location.href = '/batch';
        router.push('/batch');
        break;
      case 'Processes':
        //window.location.href = '/processes';
        router.push('/processes');
        break;
      default:
        break;
    }
  };

  function handleUpdateSelectedRow(batch: Batch){
    setSelectedRow(formatDate(batch.hrpsDateTime));
    setSelectedBatchId(batch.batchJobId)
    setShowActionTypes(true);
  }
  
  function handleClearSelectedRow(){
    setShowActionTypes(false);
    setBatchActionType([]);
    setGetActionTypes(false);
    setSelectedRow(null);
    setSelectedBatchId(null);
  }

  function handleUpdateActionType(batch: Batch){
    setSelectedRow(formatDate(batch.hrpsDateTime));
    setSelectedBatchId(batch.batchJobId)
    setShowActionTypesTooltip(true);
  }
  
  function handleClearActionType(){
    setShowActionTypesTooltip(false);
    setBatchActionType([]);
    setGetActionTypes(false);
    setSelectedRow(null);
    setSelectedBatchId(null);
  }

   // Update fetchProcessData to load saved changes after fetching
  const fetchProcessTypes = async (hrpsDate: string) => {
    try {
      setIsActionTypesLoading(true);
      const queryParams = new URLSearchParams({
        apiSearch: hrpsDate
      });

      const response = await fetch(`${config.API_URL}/hrp/processes?${queryParams.toString()}`);
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



        setGetActionTypes(true);

      }
    } catch (error) {
      console.error('❌ Error fetching process data:', error);
      setError('Failed to fetch process data');
      setProcesses([]);
      setTotalProcesses(0);
    } finally {
      setIsActionTypesLoading(false);
      
    }
  };

  useEffect(() => {
    if (getActionTypes) {
        setBatchActionType(handleActionTypes(processes));
    }
    
  }, [getActionTypes]);

  const handleActionTypes = (processes: Process[]) => {
    const actionTypeMap: { [key: string]: number } = {};
    processes.forEach((process) => {
      actionTypeMap[process.actionType] = (actionTypeMap[process.actionType] || 0) + 1;
    });
    const result = Object.entries(actionTypeMap).map(([type, count]) => ({ type, count }));
    console.log("Batch Action Types: ", result);
    return result;
  }

  const handleSearch = (searchTerm: string): void => {
    setSearchDate(searchTerm);
    setPage(0);
  };

  const handleDateRangeChange = (range: DateRangeOption): void => {
    setSelectedDateRange(range);
     setPage(0);
  };

  const handleDateRangeSelect = (range: DateRangeOption): void => {
    handleDateRangeChange(range);
    setShowDateRangeDropdown(false);
  };

  const handleProcessSearch = (searchTerm: string): void => {
    setSearchDate(searchTerm);
    setPage(0);
  };

  const handleProcessDateRangeChange = (range: DateRangeOption): void => {
    setSelectedDateRange(range);
    setPage(0);
  };

  const handleProcessDateRangeSelect = (range: DateRangeOption): void => {
    handleProcessDateRangeChange(range);
    setShowDateRangeDropdown(false);
  };

  // Add sorting function
  const handleSort = (column: SortableColumn) => {
    console.log('🔄 HANDLING SORT:', { column, currentSort: sortColumn, currentDirection: sortDirection });
    if (column === sortColumn) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Add sorting function for the data
  const sortData = (data: Transaction[]) => {
    console.log('🔄 SORTING DATA:', { sortColumn, sortDirection });
    return [...data].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      // Handle date fields
      if (sortColumn === 'hrpsDateTime' || sortColumn === 'pickupDate') {
        const dateA = new Date(aValue || '').getTime();
        const dateB = new Date(bValue || '').getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }

      // Handle numeric fields
      if (sortColumn === 'totalCSVFiles' || sortColumn === 'batchJobId') {
        const numA = Number(aValue) || 0;
        const numB = Number(bValue) || 0;
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }

      // Handle string fields
      const strA = String(aValue || '').toLowerCase();
      const strB = String(bValue || '').toLowerCase();
      return sortDirection === 'asc' 
        ? strA.localeCompare(strB)
        : strB.localeCompare(strA);
    });
  };

  // Update filter function for transactions to search formatted dates
  const filterTransactions = (transactions: Transaction[]) => {
    const searchTerm = searchDate.toLowerCase();

    const days = getDateRangeDays(selectedDateRange);
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    return transactions.filter((transaction) => {
      
      // Date range filter (using hrpsDateTime)
      const transactionDate = new Date(transaction.hrpsDateTime);
      const inDateRange = selectedDateRange === 'Last 7 days' || (transactionDate >= startDate);
      
      // Search filter
      const matchesSearch =
        searchTerm === '' ||
        (transaction.batchJobId && (
          transaction.batchJobId.toString().toLowerCase().includes(searchTerm) ||
          updateFormatDate(transaction.batchJobId.toString()).toLowerCase().includes(searchTerm)
        ))
        ||
        (transaction.hrpsDateTime && (
          transaction.hrpsDateTime.toLowerCase().includes(searchTerm) ||
          updateFormatDate(transaction.hrpsDateTime).toLowerCase().includes(searchTerm)
        )) ||
        (transaction.pickupDate && (
          transaction.pickupDate.toLowerCase().includes(searchTerm) ||
          updateFormatDate(transaction.pickupDate).toLowerCase().includes(searchTerm)
        )) ||
        (transaction.createdDate && (
          transaction.createdDate.toLowerCase().includes(searchTerm) ||
          updateFormatDate(transaction.createdDate).toLowerCase().includes(searchTerm)
        )) ||
        (transaction.status && transaction.status.toLowerCase().includes(searchTerm));
      
      return inDateRange && matchesSearch;
        

    });
  };

  // Update fetchBatchData function to accept optional parameters
  const fetchBatchData = async (options: FetchBatchOptions = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 FETCHING DATA FOR BATCH TAB');
      console.log('🔍 FETCHING DATA - Params:', {
        page: options.page ?? page,
        limit: options.limit ?? rowsPerPage,
        dateRange: options.dateRange ?? selectedDateRange,
        sortColumn: options.sortColumn ?? sortColumn,
        sortDirection: options.sortDirection ?? sortDirection,
        search: options.searchTerm ?? searchDate
      });

      const queryParams = new URLSearchParams({
        page: (options.page ?? page).toString(),
        limit: (options.limit ?? rowsPerPage).toString(),
        dateRange: options.dateRange ?? selectedDateRange,
        sortColumn: options.sortColumn ?? sortColumn,
        sortDirection: (options.sortDirection ?? sortDirection).toLowerCase()
      });

      // Add search term if provided
      if (options.searchTerm) {
        queryParams.append('search', options.searchTerm);
      }

      const response = await fetch(`${config.API_URL}/hrp/batches?${queryParams.toString()}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      console.log('📦 RECEIVED DATA:', result);

      if (result.transactions?.data) {
        console.log('✅ SETTING TRANSACTIONS:', result.transactions.data);
        const sortedData = sortData(result.transactions.data);
        setTransactions(sortedData);
        setTotalTransactions(result.transactions.total);
        setTotalPage(result.transactions.totalPage);
        setDataPerPage(result.transactions.dataPerPage);
        setCurrentPage(result.transactions.currentPage);
      } else {
        console.log('❌ NO VALID TRANSACTIONS DATA');
        setTransactions([]);
        setTotalTransactions(0);
      }
    } catch (err) {
      console.error('❌ ERROR:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setTransactions([]);
      setTotalTransactions(0);
    } finally {
      setIsLoading(false);
    }
  };


  // When the user changes rows per page, reset page to 0
  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  // When the user changes page
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Centralized effect to fetch data when any filter or pagination changes
  useEffect(() => {
    fetchBatchData({
      page,
      limit: rowsPerPage,
      dateRange: selectedDateRange,
      sortColumn,
      sortDirection,
      searchTerm: searchDate
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, selectedDateRange, sortColumn, sortDirection, searchDate, activeTab]);

  useEffect(() => {
    if (selectedRow) {
      fetchProcessTypes(selectedRow);

    }
  }, [selectedRow]);
    

  // Update the filtered transactions to use both filter and sort
  const filteredTransactions = sortData(filterTransactions(transactions));

  // Add a debug effect to monitor state changes
  useEffect(() => {
    console.log('Current transactions state:', transactions);
    console.log('Current loading state:', isLoading);
    console.log('Current error state:', error);
  }, [transactions, isLoading, error]);

  // Add process filter function
  const filterProcesses = (processes: Process[]): Process[] => {
    return processes.filter(process => {
      const searchTerm = searchDate.toLowerCase();
      const matchesSearch = searchTerm === '' || 
        process.insertDate.toLowerCase().includes(searchTerm) ||
        process.nric.toLowerCase().includes(searchTerm) ||
        process.name.toLowerCase().includes(searchTerm) ||
        process.actionType.toLowerCase().includes(searchTerm) ||
        process.personnelArea.toLowerCase().includes(searchTerm) ||
        process.status.toLowerCase().includes(searchTerm) ||
        process.errorMessage.toLowerCase().includes(searchTerm);

      const processDate = new Date(process.insertDate);
      const now = new Date();
      const days = getDateRangeDays(selectedDateRange);
      const startDate = new Date(now.setDate(now.getDate() - days));
      const matchesDateRange = processDate >= startDate;

      return matchesSearch && matchesDateRange;
    });
  };

  /* Update useEffect to handle process filtering
  useEffect(() => {
    const fetchProcessData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${config.API_URL}/hrp/processes?batchId=${batchId}&page=${page}&limit=${rowsPerPage}`);
        const data = await response.json();
        
        if (data.error) {
          setError(data.error);
        } else {
          // Apply filters to the fetched data
          const filteredData = filterProcesses(data.data.data);
          console.log('Fetched processes:', filteredData);
          //setProcesses(filteredData)
          setProcesses(Array.isArray(filteredData) ? filteredData : [])
          setTotalProcesses(filteredData.length);
        }
      } catch (error) {
        setError('Failed to fetch process data');
      } finally {
        setIsLoading(false);
      }
    };

    if (activeTab === 'Processes') {
      //fetchProcessData();
    }
  }, [page, rowsPerPage, selectedDateRange, processSortColumn, processSortDirection, searchDate, activeTab]); */

  // Add debug logging for render
  console.log('🎨 RENDERING - Current state:', {
    activeTab,
    transactions: transactions.length,
    isLoading,
    error,
    totalTransactions
  });

  const handleViewDetails = (hrpsDate: string) => {
    setSelectedRow(formatDate(hrpsDate));
    setShowActionTypes(true);
  };
  

  //Processes is Transaction
  const handleViewTransactionDetails = (hrpsDateTime: string) => {
    const formattedDate = formatDate(hrpsDateTime);
    // Redirect to processes page with batch ID
    //window.location.href = `/processes?batchId=${batchJobId}`;
    //window.location.href = `/processes?apiSearch=${encodeURIComponent(formattedDate)}`;
    router.push(`/processes?apiSearch=${encodeURIComponent(formattedDate)}`);
  };

  const showAllProcesses = () => {
    // Redirect to processes page without any search parameters
    //window.location.href = '/processes';
    router.push('/processes');
  };

  // Update pagination section
  const totalPages = totalPage
  const startItem = page * rowsPerPage + 1;
  const endItem = Math.min((page + 1) * rowsPerPage, totalTransactions);

  const dateButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  const downloadButtonRef = useRef<HTMLButtonElement>(null);
  //const [downloadDropdownPos, setDownloadDropdownPos] = useState({ top: 0, left: 0, width: 0 });

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

  /* const handleDownloadButtonClick = () => {
    if (downloadButtonRef.current) {
      const rect = downloadButtonRef.current.getBoundingClientRect();
      setDownloadDropdownPos({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
    setShowDownloadDropdown((prev) => !prev);
  };*/

  // Download CSV handler for batch
  const handleDownloadCSV = async () => {
    const endpoint = '/hrps-api/HRP/Batches/Download';
    const filename = 'batch_table.csv';
    const removeColumns = ['createddate', 'lastupdateddate']; // all lowercase
    const dateColumns = ['hrpsdatetime', 'pickupdate']; // all lowercase for case-insensitive match

    try {
      const response = await fetch(endpoint, { method: 'GET' });
      if (!response.ok) throw new Error('Failed to download CSV');

      const csvtext = await response.text();
      const rows = csvtext.split('\n');
      if (rows.length === 0) throw new Error('CSV is empty');

      const header = rows[0].split(',');
      const headerLowerMap = header.map(col => col.trim().toLowerCase());
      const filteredHeader = header.filter(
        column => !removeColumns.includes(column.trim().toLowerCase())
      );

      console.log('Filtered header:', filteredHeader);

      const filteredRows = rows.slice(1).map(row => {
        const values = row.split(',');
        return filteredHeader.map(column => {
          const originalIndex = headerLowerMap.indexOf(column.trim().toLowerCase());
          let value = values[originalIndex];
          if (dateColumns.includes(column.trim().toLowerCase()) && value) {
            value = updateFormatDate(value);
          }
          return value;
        }).join(',');
      });

      const csvContent = [filteredHeader.join(','), ...filteredRows].join('\n');  
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
      const queryParams = new URLSearchParams({ apiSearch: formatDate(batch.hrpsDateTime) });
      const response = await fetch(`${config.API_URL}/hrp/processes?${queryParams.toString()}`);
      const data = await response.json();
      if (data.error) {
        setError(data.error);
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
              <h1 className="text-lg sm:text-xl font-medium">Batch Monitoring</h1>
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
                  {/* <svg className="w-4 h-4 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7-7 7-7" />
                  </svg> */}
                  <svg 
                          className={`w-4 h-4 transition-transform ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                </button>
              </div>
              <div className="relative">
                <button 
                  onClick={handleDownloadCSV}
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
            className="bg-white rounded-md shadow-lg z-[99999] border max-h-[400px] overflow-y-auto"
            style={{
              position: 'absolute',
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
              minWidth: 192, // 12rem
            }}
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
        

        {/* Table Container - Only this scrolls */}
        <div className="flex-1 min-h-0 relative w-full">
          <div className="h-full overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#1a4f82] sticky top-0 z-10">
                <tr>
                  <th 
                    scope="col" 
                    className="w-[15%] px-4 sm:px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c] whitespace-nowrap"
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
                    
                      <td className="w-[15%] px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">
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
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
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
                            onClick={() => handleViewTransactionDetails(formatDate(batch.hrpsDateTime))}
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
        <div className="sticky bottom-0 right-0 left-24 bg-white border-t border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(event) => {
                  const newRowsPerPage = parseInt(event.target.value, 10);
                  handleRowsPerPageChange(newRowsPerPage);
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
                Showing {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, totalTransactions)} of {totalTransactions}
              </span>
              <nav className="flex items-center space-x-1">
                <button
                  onClick={() => {
                    if (page > 0) {
                      handlePageChange(0);
                    }
                  }}
                  disabled={page === 0}
                  className={`p-1 rounded-full ${
                    page === 0 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="inline-flex items-center m-0 p-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <svg className="w-5 h-5 -ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </span>
                </button>

                <button
                  onClick={() => {
                    if (page > 0) {
                      handlePageChange(page - 1);
                    }
                  }}
                  disabled={page === 0}
                  className={`p-1 rounded-full ${
                    page === 0 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="inline-flex items-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    
                  </span>
                </button>

                <div className="flex flex-wrap justify-center gap-1">
                  {totalPages > 0 && Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        handlePageChange(idx);
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

                <button
                  onClick={() => {
                    if (page < totalPages - 1) {
                      handlePageChange(page + 1);
                    }
                  }}
                  disabled={page >= totalPages - 1}
                  className={`p-1 rounded-full ${
                    page >= totalPages - 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                <span className="inline-flex items-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </span>
                  
                  
                </button>

                <button
                  onClick={() => {
                    if (page < totalPages - 1) {
                      handlePageChange(totalPages - 1);
                    }
                  }}
                  disabled={page >= totalPages - 1}
                  className={`p-1 rounded-full ${
                    page >= totalPages - 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="inline-flex items-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <svg className="w-5 h-5 -ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
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