import { NextRequest, NextResponse } from 'next/server';

// Update base API URL to use the complete URL
const HRPS_API_BASE_URL = 'http://192.168.1.185/hrps-api';

// Force dynamic rendering and specify runtime
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// Define interfaces based on the API response
interface ProcessData {
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
  action: string | null;
  batchJobId?: number;
}

interface ApiResponse {
  message: string;
  errorMessage: string | null;
  data: {
    currentPage: number;
    totalPage: number;
    totalRecords: number;
    dataPerPage: number;
    data: ProcessData[];
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') || '0';
    const limit = searchParams.get('limit') || '50';
    const dateRange = searchParams.get('dateRange') || 'Last 7 days';
    const sortColumn = searchParams.get('sortColumn') || 'effectiveDate';
    const sortDirection = searchParams.get('sortDirection') || 'desc';
    const batchJobId = searchParams.get('BatchJobId');



    console.log('Process API Request Params:', {
      page,
      limit,
      dateRange,
      sortColumn,
      sortDirection,
      batchJobId
    });

    // Calculate date range
    const today = new Date();
    let startDate = new Date();
    
    // Ensure we're working with the current date
    console.log('Current date:', today.toISOString());
    
    switch (dateRange) {
      case 'Last 7 days':
        startDate.setDate(today.getDate() - 7);
        break;
      case 'Last 30 days':
        startDate.setDate(today.getDate() - 30);
        break;
      case 'Last 3 months':
        startDate.setMonth(today.getMonth() - 3);
        break;
      case 'Last 6 months':
        startDate.setMonth(today.getMonth() - 6);
        break;
      case 'Last 1 year':
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      default:
        startDate.setDate(today.getDate() - 7);
    }

    // Format dates for API
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = today.toISOString().split('T')[0];

    console.log('Date range:', {
      startDate: formattedStartDate,
      endDate: formattedEndDate
    });

    // Construct API query parameters
    const apiQueryParams = new URLSearchParams({
      currentPage: (parseInt(page) + 1).toString(), // API uses 1-based indexing
      dataPerPage: limit,
      fromDate: formattedStartDate,
      toDate: formattedEndDate,
      sortBy: sortColumn,
      sortDirection: sortDirection.toUpperCase(),
      includeBatchId: 'true' // Add this parameter to request batchId
    });

    // Add batchId if provided
    if (batchJobId) {
      apiQueryParams.append('batchJobId', batchJobId);
      console.log('🔍 Filtering by batchJobId:', batchJobId);
    }

    // Ensure we have a valid URL
    const apiUrl = new URL(`${HRPS_API_BASE_URL}/HRP/Processes`);
    apiUrl.search = apiQueryParams.toString();

    console.log('🌐 Calling HRPS API:', apiUrl.toString());
    console.log('🔍 Query Parameters:', Object.fromEntries(apiQueryParams.entries()));

    // Make API call to HRPS
    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ HRPS API Error:', {
        status: response.status,
        statusText: response.statusText,
        url: apiUrl.toString(),
        errorText
      });
      throw new Error(`HRPS API error: ${response.status} - ${errorText || response.statusText}`);
    }

    const apiResponse: ApiResponse = await response.json();
    
    // Log the raw API response to see its structure
    console.log('📦 Raw API Response:', JSON.stringify(apiResponse, null, 2));
    
    // Log the first few items with all their fields
    console.log('📦 Sample API Response Items:', apiResponse.data.data.slice(0, 2).map(item => ({
      allFields: item,
      dataID: item.dataID,
      batchId: item.batchJobId,
      status: item.status,
      actionType: item.actionType,
      resultData: item.resultData
    })));
    
    console.log('📦 HRPS API Response:', {
      status: response.status,
      message: apiResponse.message,
      errorMessage: apiResponse.errorMessage,
      dataCount: apiResponse.data.data.length,
      totalPages: apiResponse.data.totalPage,
      dataPerPage: apiResponse.data.dataPerPage,
      sortColumn,
      sortDirection,
      batchJobId,
      sampleData: apiResponse.data.data.slice(0, 2).map(item => ({
        dataID: item.dataID,
        batchJobId: item.batchJobId,
        status: item.status,
        rawItem: item // Log the entire item to see all available fields
      }))
    });

    // Check for API-level error message
    if (apiResponse.message !== "SUCCESS" || apiResponse.errorMessage !== null) {
      throw new Error(apiResponse.errorMessage || 'API returned an unsuccessful response');
    }

    // // Filter data by batchId if provided
    // let filteredData = apiResponse.data.data;
    // if (batchId) {
    //   console.log('🔍 Before filtering - Total items:', filteredData.length);
      
    //   filteredData = filteredData.filter((item: ProcessData) => {
    //     const itemBatchId = item.batchJobId?.toString();
    //     return itemBatchId === batchId;
    //   });
      
    //   console.log('📊 After filtering - Total items:', filteredData.length);

    //   if (filteredData.length === 0) {
    //     return NextResponse.json({
    //       data: {
    //         data: [],
    //         total: 0,
    //         error: `No records found for Batch ID: ${batchId}`
    //       }
    //     });
    //   }
    // }

    // Transform the response to match the expected format
    const transformedData = {
      data: {
        data: apiResponse.data.data.map((item: ProcessData) => ({
          dataID: item.dataID,
          insertDate: item.insertDate,
          updateDate: item.updateDate,
          effectiveDate: item.effectiveDate,
          nric: item.nric,
          actionType: item.actionType,
          resultData: item.resultData,
          personnelArea: item.personnelArea,
          processFlags: item.processFlags,
          personnelNumber: item.personnelNumber,
          status: item.status,
          errorMessage: item.errorMessage,
          name: item.name,
          action: item.action,
          batchId: item.batchJobId ?? null,
        })),
        total: apiResponse.data.totalRecords
      }
    };



    console.log('Transformed data:', {
      totalRecords: transformedData.data.total,
      currentPageRecords: transformedData.data.data.length,
      totalPages: apiResponse.data.totalPage,
      dataPerPage: apiResponse.data.dataPerPage
    });

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error fetching process data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch process data', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Helper function to map HRPS API status to our frontend status
function mapStatus(hrpsStatus: string): 'Success' | 'Fail' | 'Pending' {
  const statusMap: { [key: string]: 'Success' | 'Fail' | 'Pending' } = {
    'Success': 'Success',
    'Failed': 'Fail',
    'Pending': 'Pending',
    'IN_PROGRESS': 'Pending',
    'PROCESSING': 'Pending'
  };
  return statusMap[hrpsStatus] || 'Pending';
}

