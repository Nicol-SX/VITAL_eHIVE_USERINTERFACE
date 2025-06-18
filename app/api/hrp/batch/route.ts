import { NextRequest, NextResponse } from 'next/server';

// Update base API URL to use the complete URL (.env)
const HRPS_API_BASE_URL = 'http://192.168.1.185/hrps-api';

// Force dynamic rendering and specify runtime
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// Define interfaces based on the API response
interface BatchData {
  batchJobId: number;
  hrpsDateTime: string;
  pickupDate: string;
  totalCSVFiles: number;
  status: 'Success' | 'Pending' | 'Fail';
  createdDate: string;
  lastUpdatedDate: string;
}

interface ApiResponse {
  message: string;
  errorMessage: string | null;
  data: {
    currentPage: number;
    totalPage: number;
    totalRecords: number;
    dataPerPage: number;
    data: BatchData[];
  }
}

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

export async function GET(request: NextRequest) {
  try {
    let page = 0;
    let limit = 50;
    let sortColumn = 'hrpsDateTime';
    let sortDirection = 'desc';
    let searchDate = '';

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const dateRange = searchParams.get('dateRange') || 'Last 7 days';
    sortColumn = searchParams.get('sortColumn') || 'hrpsDateTime';
    sortDirection = searchParams.get('sortDirection') || 'desc';
    searchDate = searchParams.get('searchDate') || '';

    console.log('🚀 API CALL - Request params:', {
      page,
      limit,
      dateRange,
      sortColumn,
      sortDirection
    });

    // Calculate date range
    const endDate = new Date();
    let startDate = new Date();
    switch (dateRange) {
      case 'Last 30 days': startDate.setDate(endDate.getDate() - 30); break;
      case 'Last 3 months': startDate.setMonth(endDate.getMonth() - 3); break;
      case 'Last 6 months': startDate.setMonth(endDate.getMonth() - 6); break;
      case 'Last 1 year': startDate.setFullYear(endDate.getFullYear() - 1); break;
      default: startDate.setDate(endDate.getDate() - 7);
    }

    const apiQueryParams = new URLSearchParams({
      currentPage: (page + 1).toString(),
      dataPerPage: limit.toString(),
      fromDate: startDate.toISOString(),
      toDate: endDate.toISOString(),
      sortBy: sortColumn,
      sortDirection: sortDirection.toUpperCase()
    });

    if (search) {
      apiQueryParams.append('searchTerm', search);
    }

    // Add searchDate if it exists
    if (searchDate) {
      apiQueryParams.append('searchDate', searchDate);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds

    try {
      const response = await fetch(`${HRPS_API_BASE_URL}/HRP/Batches?${apiQueryParams.toString()}`, {
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
          url: `${HRPS_API_BASE_URL}/HRP/Batches?${apiQueryParams.toString()}`,
          errorText
        });
        throw new Error(`HRPS API error: ${response.status} - ${errorText || response.statusText}`);
      }

      const apiResponse: ApiResponse = await response.json();
      
      // Log the first few items before and after sorting
      console.log('📦 First few items before processing:', 
        apiResponse.data.data.slice(0, 3).map(item => ({
          hrpsDateTime: item.hrpsDateTime,
          pickupDate: item.pickupDate,
          totalCSVFiles: item.totalCSVFiles,
          status: item.status,
          createdDate: item.createdDate
        }))
      );

      // Sort the data if needed (as a fallback)
      if (apiResponse.data.data.length > 0) {
        apiResponse.data.data.sort((a, b) => {
          const aValue = a[sortColumn as keyof BatchData];
          const bValue = b[sortColumn as keyof BatchData];
          
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortDirection === 'asc' 
              ? aValue.localeCompare(bValue)
              : bValue.localeCompare(aValue);
          }
          
          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortDirection === 'asc'
              ? aValue - bValue
              : bValue - aValue;
          }
          
          return 0;
        });
      }

      console.log('📦 First few items after processing:', 
        apiResponse.data.data.slice(0, 3).map(item => ({
          hrpsDateTime: item.hrpsDateTime,
          pickupDate: item.pickupDate,
          totalCSVFiles: item.totalCSVFiles,
          status: item.status,
          createdDate: item.createdDate
        }))
      );

      console.log('📦 HRPS API Response:', {
        status: response.status,
        message: apiResponse.message,
        errorMessage: apiResponse.errorMessage,
        dataCount: apiResponse.data.data.length,
        totalPages: apiResponse.data.totalPage,
        dataPerPage: apiResponse.data.dataPerPage,
        sortColumn,
        sortDirection,
        requestUrl: `${HRPS_API_BASE_URL}/HRP/Batches?${apiQueryParams.toString()}`,
        queryParams: Object.fromEntries(apiQueryParams.entries())
      });

      // Check for API-level error message
      if (apiResponse.message !== "SUCCESS" || apiResponse.errorMessage !== null) {
        console.error('❌ API Error:', {
          message: apiResponse.message,
          errorMessage: apiResponse.errorMessage
        });
        throw new Error(apiResponse.errorMessage || 'API returned an unsuccessful response');
      }

      // Transform the response to match the expected format
      const transformedData = {
        transactions: {
          data: apiResponse.data.data.map((item: BatchData) => {
            console.log('🔄 Processing item:', item); // Log each item being processed
            return {
              batchJobId: item.batchJobId,
              hrpsDateTime: item.hrpsDateTime,
              pickupDate: item.pickupDate,
              totalCSVFiles: item.totalCSVFiles,
              status: item.status,
              createdDate: item.createdDate,
              lastUpdatedDate: item.lastUpdatedDate
            };
          }),
          //Fix later!
          total: apiResponse.data.totalRecords,
          totalPage: apiResponse.data.totalPage,
          dataPerPage: apiResponse.data.dataPerPage,
          currentPage: apiResponse.data.currentPage,
           // Use total records from API
        }
      };

      console.log('✅ Transformed Data:', transformedData);
      return NextResponse.json(transformedData);
    } catch (error) {
      console.error('❌ Error fetching batch data:', error);
      return NextResponse.json(
        { 
          error: 'Failed to fetch batch data', 
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error fetching batch data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch batch data', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 