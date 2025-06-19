'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // adjust path as needed
import config from '../../common/config';
import toLocalISOString from '../../common/to-local-iso-string';
import MakeComment from './MakeComment';

interface AttachmentAction{
    id: number;
    attachId: number;
    srNumber: string;
    status: number;
    comment: string;
}

interface Attachment {
    id: number;
    srNumber: string;
    status: number;
    description: string;
    attachmentCount: number;
    action: AttachmentAction;
}

type DateRangeOption = 'Last 7 days' | 'Last 30 days' | 'Last 3 months' | 'Last 6 months' | 'Last 1 year';

const VISION_API_BASE_URL = '/vision-api/Vision';

interface AttachmentProps {
  viewComment?: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (rawComment?: string) => void;
  defaultTab: 'Overview' | 'Batch' | 'Service Requests' | 'Attachments';
  defaultAttachmentId?: string;
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

export default function Attachment({ viewComment, isOpen, onClose, onSubmit, defaultTab }: AttachmentProps) {
    const router = useRouter();
    //const [activeTab, setActiveTab] = useState<'Overview' | 'Batch' | 'Service Requests'>(defaultTab || 'Batch');
    const [activeTab, setActiveTab] = useState<'Overview' | 'Batch' | 'Service Requests' | 'Attachments'>(defaultTab || 'Attachments');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [searchDate, setSearchDate] = useState('');
    const [dateRange, setDateRange] = useState<DateRangeOption>('Last 7 days');
    //const [selectedBatchId, setSelectedBatchId] = useState<string | undefined>(defaultBatchId);
    //const [selectedServiceRequestId, setSelectedServiceRequestId] = useState<string | undefined>(defaultServiceRequestId);
    //const [selectedAttachmentId, setSelectedAttachmentId] = useState<string | undefined>(defaultAttachmentId);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDateRange, setSelectedDateRange] = useState<DateRangeOption>('Last 7 days');
    const [showDateRangeDropdown, setShowDateRangeDropdown] = useState(false);
    const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
    const [isViewCommentModalOpen, setIsViewCommentModalOpen] = useState(false);


    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    //const totalRecords = activeTab === 'Batch' ? totalProcesses : totalTransactions;
    const totalRecords = 70;
    const totalPages = Math.ceil(totalRecords / rowsPerPage);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

    const dateRangeOptions = [
        'Last 7 days',
        'Last 30 days',
        'Last 3 months',
        'Last 6 months',
        'Last 1 year'
      ] as const;

    const handleSideMenu = (tab: 'HRPS' | 'Vision') => {
        // if (tab === activeTab) return;
        // setActiveTab(tab);
    };

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

    const [comments, setComments] = React.useState<string>('');

    const isViewMode = viewComment != null;

    if (!isOpen) return null;

    const handleSubmit = () => {
      if (!onSubmit) return;
      onSubmit(comments.trim())
      setComments('');
    };

    const handleSelectAll = () => {
      setSelectAll(!selectAll);
      setSelectedRows(new Set(attachments.map(batch => batch.id)));
    };

  const handleCheckboxChange = (id: string) => {
      const newSelectedRows = new Set(selectedRows);
      if (newSelectedRows.has(id)) {
          newSelectedRows.delete(id);
      } else {
          newSelectedRows.add(id);
      }
      setSelectedRows(newSelectedRows);
  };

    const onPopupSubmit = (rawComment?: string) => {
      // Batch update
      // if (!selectedProcess && selectedRows.size > 0) {
      //   Array.from(selectedRows).forEach((id) => {
      //     const proc = processes.find((p) => p.dataID === id);
      //     if (proc) {
      //       handleStatusUpdate(status, rawComment ?? '', proc.dataID, proc.processFlags);
      //     }
      //   });
      //   setSelectedRows(new Set());
      //   setIsStatusModalOpen(false);
      //   return;
      // }
      // // Single row update
      // if (selectedProcess) {
      //   handleStatusUpdate(status, rawComment ?? '', selectedProcess.dataID, selectedProcess.processFlags);
      //   setIsStatusModalOpen(false);
      //   setSelectedProcess(null);
      // }
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
                          // Overview tab is greyed out and disabled
                          onClick={() => handleTabChange('Attachments')}
                          className={
                          'py-4 px-2 relative text-gray-400 cursor-not-allowed bg-gray-100'
                          }
                      >
                          Attachments
                          {/* No underline for Overview since it's disabled */}
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
                          aria-label="Search attachments"
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
                              //setSelectedProcess(null); // batch mode, not single process
                              //setIsStatusModalOpen(true);
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
                                              {sortColumn === 'id' && (
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
                                              <span>DESCRIPTION</span>
                                              {sortColumn === 'description' && (
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
                                              <span>CREATED DATE</span>
                                              {sortColumn === 'creationDate' && (
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
                                              <span>SR COUNT</span>
                                              {sortColumn === 'srCount' && (
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
                                          <td colSpan={7} className="px-4 sm:px-6 py-4 text-center">
                                              <div className="flex justify-center items-center">
                                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a4f82]"></div>
                                              </div>
                                          </td>
                                      </tr>
                                  ) : error ? (
                                      <tr>
                                          <td colSpan={7} className="px-4 sm:px-6 py-4 text-center text-red-600">
                                              {error}
                                          </td>
                                      </tr>
                                  ) : attachments.length === 0 ? (
                                      <tr>
                                          <td colSpan={7} className="px-4 sm:px-6 py-4 text-center text-gray-500">
                                              No attachments found
                                          </td>
                                      </tr>
                                  ) : (
                                      attachments.map((attachment) => (
                                          <tr key={attachment.id} className="hover:bg-gray-50">
                                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap border border-gray-200">
                                                  <input
                                                      type="checkbox"
                                                      checked={selectedRows.has(attachment.id)}
                                                      onChange={() => handleCheckboxChange(attachment.id)}
                                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                  />
                                              </td>
                                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap border border-gray-200">
                                                  {attachment.id}
                                              </td>
                                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap border border-gray-200">
                                                  {attachment.description}
                                              </td>
                                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap border border-gray-200">
                                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(attachment.status).bgColor} ${getStatusStyle(attachment.status).textColor}`}>
                                                      <span className={`w-2 h-2 rounded-full ${getStatusStyle(attachment.status).dotColor} mr-1.5`}></span>
                                                      {attachment.status}
                                                  </span>
                                              </td>
                                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap border border-gray-200">
                                                  {formatDate(attachment.creationDate)}
                                              </td>
                                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap border border-gray-200">
                                                  {attachment.srCount}
                                              </td>
                                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap border border-gray-200">
                                                  <div className="flex space-x-2">
                                                      <button
                                                          onClick={() => handleViewDetails(attachment.id)}
                                                          className="text-blue-600 hover:text-blue-900 font-medium"
                                                      >
                                                          View Details
                                                      </button>
                                                  </div>
                                              </td>
                                          </tr>
                                      ))
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
  );
  //   return (
  //     <div>
  //          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-[3rem] z-[1001] w-screen h-screen overflow-auto">
  //       <div className="bg-white rounded-lg p-6 min-w-[40rem] h-full"> 
  //       {/* <div className="bg-white rounded-lg p-6 w-full h-full min-w-[40rem]"></div> */}
  //         <div className='flex flex-col h-full w-full'>
  //               {/*Content*/}
  //               <div className="flex-1 flex flex-col h-full w-full">
                    
  //                   {/*Top*/}
  //                   <div className="sticky top-0 z-[100] bg-white">
  //                     <div className="flex justify-between items-center w-full">
  //                       <div className="flex items-center">
  //                         <div className="border-b">
  //                             <div className="px-6 py-4">
  //                                 <h1 className="text-xl font-medium">View Attachments</h1>
  //                             </div>
  //                         </div>

  //                         <div className="">
  //                           <button className="bg-blue-500 text-white px-4 py-2 rounded-md"
  //                           onClick={() => {
  //                             setIsCommentModalOpen(true);
  //                             //setIsAttachmentModalOpen(false);
  //                           }}>
  //                             <span className="text-white">Make Comments</span>
  //                           </button>
  //                         </div>

  //                         <div className="">
  //                           <button className="bg-blue-500 text-white px-4 py-2 rounded-md"
  //                           onClick={() => {
  //                             setIsViewCommentModalOpen(true);
  //                             //setIsAttachmentModalOpen(false);
  //                           }}>
  //                             <span className="text-white">View Comment</span>
  //                           </button>
  //                         </div>
  //                       </div>
                        

  //                       <div className="h-full">
  //                           <button
  //                             onClick={onClose}
  //                             className="text-gray-500 hover:text-gray-700 text-lg"
  //                             aria-label="Close"
  //                           >
  //                             &times;
  //                           </button>
  //                       </div>

  //                     </div>

                      
                        

                        
  //                   </div>

  //                   {/*Content*/}
  //                   <div className="flex-1 flex flex-col h-full w-full">
  //                     <div className="flex flex-col justify-between items-center h-full w-full">
                        
  //                         {/* Table Container - Scrollable area */}
  //                       <div className="flex-1 overflow-y-scroll overflow-x-auto">
  //                         {/* {activeTab === 'Service Requests'*/ true && (
  //                           <div className="h-full w-full">
  //                             <div className="relative h-full w-full">
  //                               <table className="w-full divide-y divide-gray-200">
  //                                 <thead className="sticky top-0 bg-[#1a4f82] z-10">
  //                                   <tr>
  //                                     <th className="w-24 px-4 py-2 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c]">                     
  //                                       <label className="flex items-center space-x-2">
  //                                         <input 
  //                                           type="checkbox"
  //                                           className="flex h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 transition-all duration-150"
  //                                         //   checked={selectAll} 
  //                                         //   onChange={handleSelectAll}
  //                                         />
  //                                       </label> 
  //                                     </th>
  //                                     <th
  //                                       scope="col"
  //                                       className="w-20 px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c]"
  //                                       //onClick={() => handleSort('batchJobId')}
  //                                     >
  //                                       <div className="flex items-center space-x-1">
  //                                         <span>NAME</span>
  //                                         {/* {sortColumn === 'batchJobId' && (
  //                                           <svg
  //                                             className={`w-4 h-4 transition-transform ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`}
  //                                             fill="none"
  //                                             stroke="currentColor"
  //                                             viewBox="0 0 24 24"
  //                                           >
  //                                             <path
  //                                               strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
  //                                           </svg>
  //                                         )} */}
  //                                         <svg
  //                                             className={`w-4 h-4 `}
  //                                             fill="none"
  //                                             stroke="currentColor"
  //                                             viewBox="0 0 24 24"
  //                                           >
  //                                             <path
  //                                               strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
  //                                         </svg>
  //                                       </div>
  //                                     </th>
  //                                     <th 
  //                                       scope="col" 
  //                                       className="w-28 px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c]"
  //                                       //onClick={() => handleSort('status')}
  //                                     >
  //                                       <div className="flex items-center space-x-1">
  //                                         <span>STATUS</span>
  //                                         {/*sortColumn === 'status'*/ true && (
  //                                           <svg 
  //                                             className={`w-4 h-4 transition-transform ${/*sortDirection === 'asc'*/ true ? 'transform rotate-180' : ''}`}
  //                                             fill="none" 
  //                                             stroke="currentColor" 
  //                                             viewBox="0 0 24 24"
  //                                           >
  //                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  //                                           </svg>
  //                                         )}
  //                                       </div>
  //                                     </th>
  //                                     <th 
  //                                       scope="col" 
  //                                       className="w-48 px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 cursor-pointer hover:bg-[#15406c]"
  //                                       //onClick={() => handleSort('errorMessage')}
  //                                     >
  //                                       <div className="flex items-center space-x-1">
  //                                         <span>DESCRIPTION</span>
  //                                         {/* {sortColumn === 'errorMessage'*/ true && ( 
  //                                           <svg 
  //                                             className={`w-4 h-4 transition-transform ${/*sortDirection === 'asc'*/ true ? 'transform rotate-180' : ''}`}
  //                                             fill="none" 
  //                                             stroke="currentColor" 
  //                                             viewBox="0 0 24 24"
  //                                           >
  //                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  //                                           </svg>
  //                                         )}
  //                                       </div>
  //                                     </th>
  //                                     <th className="w-48 px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border border-gray-200 hover:bg-[#15406c]">
  //                                       Actions
  //                                     </th>
  //                                   </tr>
  //                                 </thead>
  //                                 <tbody className="bg-white divide-y divide-gray-200">
  //                                   {isLoading ? (
  //                                     <tr>
  //                                       <td colSpan={9} className="px-6 py-4 text-center">
  //                                         <div className="flex items-center justify-center">
  //                                           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a4f82]"></div>
  //                                         </div>
  //                                       </td>
  //                                     </tr>
  //                                   ) : error ? (
  //                                     <tr>
  //                                       <td colSpan={9} className="px-6 py-3 text-center text-red-500">
  //                                         {error}
  //                                       </td>
  //                                     </tr>
  //                                   ) /*: processes && processes.length > 0 ? (
  //                                     sortProcessData(processes, sortColumn, sortDirection).slice(page * rowsPerPage, (page + 1) * rowsPerPage ).map((process) => (
  //                                       <tr key={process.dataID} className={`border-b border-gray-200 transition-colors ${selectedRows.has(process.dataID) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>                            
  //                                         <td className="w-[2%] px-4 py-2">
  //                                           {process.status === 'Fail' && (
  //                                           <input
  //                                             type="checkbox"
  //                                             checked={selectedRows.has(process.dataID)}
  //                                             onChange={() => handleCheckboxChange(process.dataID)}
  //                                             className="form-checkbox h-4 w-4 text-[#1a4f82] focus:ring-[#1a4f82] border-gray-300 rounded"
  //                                           />)}
  //                                         </td>
  //                                         <td className="w-[8%] px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 border-l border-gray-200">
  //                                           {process.batchJobId ?? ''}
  //                                         </td>
  //                                         <td className="w-[10%] px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-x border-gray-200">
  //                                           {formatDate(process.insertDate)}
  //                                         </td>
  //                                         <td className="w-[10%] px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
  //                                           {process.nric}
  //                                         </td>
  //                                         <td className="w-[10%] px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
  //                                           {process.personnelNumber}
  //                                         </td>
  //                                         <td className="w-[10%] px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
  //                                           {process.actionType}
  //                                         </td>
  //                                         <td className="w-[5%] px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
  //                                           {process.personnelArea}
  //                                         </td>
  //                                         <td className="w-[8%] px-6 py-4 whitespace-nowrap border-r border-gray-200">
  //                                           <span className={`px-2.5 py-1 text-sm rounded-full inline-flex items-center ${getStatusStyle(process.status).bgColor} ${getStatusStyle(process.status).textColor}`}>
  //                                             <span className={`w-1.5 h-1.5 rounded-full mr-2 ${getStatusStyle(process.status).dotColor}`}></span>
  //                                             {getStatusText(process.status)}
  //                                           </span>
  //                                         </td>
  //                                         <td className="w-[15%] px-6 py-4 text-sm text-gray-900 break-words border-r border-gray-200">
  //                                           {process.errorMessage || '-'}
  //                                         </td>
  //                                         <td className="w-[15%] px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
  //                                           {process.status === 'Others' && process.action && process.action.comment && (
  //                                             <div className="text-sm text-gray-500 whitespace-normal break-words">
  //                                               ({formatDate(process.action.insertDate)}):&nbsp;{process.action.comment}
  //                                             </div>
  //                                           )}

  //                                           //{/* if there’s no action yet and status is FAIL, show Update button }
  //                                           {(!process.action || !process.action.insertDate) && process.status.toUpperCase() === 'FAIL' && (
  //                                             <button
  //                                               onClick={() => {
  //                                                 setSelectedProcess(process);
  //                                                 setIsStatusModalOpen(true);
  //                                               }}
  //                                               className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md text-white text-sm font-medium"
  //                                             >
  //                                               Update Status
  //                                             </button>
  //                                           )}
  //                                         </td>         
  //                                       </tr>
  //                                     ))
  //                                   )*/ : (
  //                                     <tr>
  //                                       <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
  //                                         No data available
  //                                       </td>
  //                                     </tr>
  //                                   )}
  //                                 </tbody>
  //                               </table>
  //                             </div>
  //                           </div>
  //                         )}
  //                       </div>

  //                       {/* Pagination - Sticky bottom */}
  //                       <div className="sticky bottom-0 bg-white border-t border-gray-200">
  //                         <div className="flex items-center justify-between px-6 py-4">
  //                           <div className="flex items-center space-x-4">
  //                             <span className="text-sm text-gray-700">Rows per page:</span>
  //                             <select
  //                               value={rowsPerPage}
  //                               onChange={(event) => {
  //                                 setRowsPerPage(parseInt(event.target.value, 10));
  //                                 setPage(0);
  //                               }}
  //                               className="border-0 bg-transparent text-sm text-gray-700 focus:ring-0 cursor-pointer"
  //                             >
  //                               {[2, 50, 100].map((size) => (
  //                                 <option key={size} value={size}>
  //                                   {size}
  //                                 </option>
  //                               ))}
  //                             </select>
  //                             <span className="text-sm font-medium text-gray-900">
  //                               {/*Total Records: {activeTab === 'Batch' ? totalTransactions : totalProcesses}*/}
  //                               Total Records: 70
  //                             </span>
  //                           </div>

  //                           <div className="flex items-center">
  //                             {/* <span className="text-sm text-gray-700 mr-4">
  //                               Showing {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, activeTab === 'Batch' ? totalTransactions : totalProcesses)} of {activeTab === 'Batch' ? totalTransactions : totalProcesses}
  //                             </span> */}
  //                             <span className="text-sm text-gray-700 mr-4">
  //                               Showing 1-50 of 70
  //                             </span>
  //                             <nav className="flex items-center space-x-1">
  //                               <button
  //                                 onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
  //                                 disabled={page === 0}
  //                                 className={`px-2 py-1 text-sm rounded-md ${
  //                                   page === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'
  //                                 }`}
  //                                 aria-label="Previous page"
  //                               >
  //                                 &lt;
  //                               </button>

  //                               {/* {Array.from({ length: totalPages }).map((_, idx) => ( */}
  //                               {Array.from({ length: 2 }).map((_, idx) => (
  //                                 <button
  //                                   key={idx}
  //                                   onClick={() => setPage(idx)}
  //                                   className={`px-2 py-1 text-sm rounded-md ${
  //                                     page === idx ? 'bg-[#1a4f82] text-white' : 'text-gray-700 hover:bg-gray-100'
  //                                   }`}
  //                                   aria-label={`Page ${idx + 1}`}
  //                                 >
  //                                   {idx + 1}
  //                                 </button>
  //                               ))}

  //                               <button
  //                                 onClick={() =>
  //                                   setPage((prev) => Math.min(prev + 1, totalPages - 1))
  //                                 }
  //                                 disabled={page + 1 >= totalPages}
  //                                 className={`px-2 py-1 text-sm rounded-md ${
  //                                   page + 1 >= totalPages ? 'text-gray-300 cursor-not-allowed': 'text-gray-700 hover:bg-gray-100'
  //                                 }`}
  //                                 aria-label="Next page"
  //                               >
  //                                 &gt;
  //                               </button>

  //                               <button
  //                                 onClick={() => setPage(totalPages - 1)}
  //                                 disabled={page === totalPages - 1}
  //                                 className={`px-2 py-1 text-sm rounded-md ${
  //                                   page === totalPages - 1 ? 'text-gray-300 cursor-not-allowed': 'text-gray-700 hover:bg-gray-100'
  //                                 }`}
  //                                 aria-label="Last page"
  //                               >
  //                                 &gt;&gt;
  //                               </button>
  //                             </nav>
  //                           </div>
  //                         </div>
  //                       </div>
                        
  //                   </div>

                    
                
  //               </div>
                

  //           </div>
  //         </div>
  //       </div>
        
  //     </div>
        
  //     {isCommentModalOpen && /*selectedProcess !== null*/ true && (
  //       <MakeComment
  //         isOpen={true}
  //         onClose={() => {
  //           setIsCommentModalOpen(false);
  //         }}
  //         onSubmit={handleSubmit}
  //       />
  //     )}

  //     {isViewCommentModalOpen && /*selectedProcess !== null*/ true && (
  //       <MakeComment
  //         viewComment='This is a test comment'
  //         isOpen={true}
  //         onClose={() => {
  //           setIsViewCommentModalOpen(false);
  //         }}
  //         onSubmit={handleSubmit}
  //       />
  //     )}
  //     </div>
      
  // );

  

}