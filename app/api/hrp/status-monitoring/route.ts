import { NextRequest, NextResponse } from 'next/server';

const HRPS_API_BASE_URL = 'http://192.168.1.185/hrps-api';

// Configure route for dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// Prevent static generation
export const generateStaticParams = async () => {
  return [];
};

export async function GET(request: NextRequest) {
  let page = 0;
  let limit = 50;
  let search = '';
  let dateRange = 'Last 7 days';
  let sortColumn = 'hrpsDateTime';
  let sortDirection = 'desc';

  try {
    const searchParams = request.nextUrl.searchParams;
    page = parseInt(searchParams.get('page') || '0');
    limit = parseInt(searchParams.get('limit') || '50');
    search = searchParams.get('search') || '';
    dateRange = searchParams.get('dateRange') || 'Last 7 days';
    sortColumn = searchParams.get('sortColumn') || 'hrpsDateTime';
    sortDirection = searchParams.get('sortDirection') || 'desc';

    // Calculate date range
    const endDate = new Date();
    let startDate = new Date();
    switch (dateRange) {
      case 'Last 7 days':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'Last 30 days':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case 'Last 3 months':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'Last 6 months':
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case 'Last 1 year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    // Build query parameters for HRPS API
    const apiQueryParams = new URLSearchParams({
      currentPage: (page + 1).toString(), // API uses 1-based indexing
      dataPerPage: limit.toString(),
      fromDate: startDate.toISOString(),
      toDate: endDate.toISOString(),
      sortBy: sortColumn,
      sortDirection: sortDirection.toUpperCase(),
    });

    if (search) {
      apiQueryParams.append('searchTerm', search);
    }

    // Call the HRPS API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(`${HRPS_API_BASE_URL}/HRP/Batches?${apiQueryParams}`, {
        headers: {
          'Accept': 'text/plain', // API expects text/plain as shown in the curl command
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HRPS API error: ${response.status} - ${errorText || response.statusText}`);
      }

      const apiResponse = await response.json();

      // Check for API-level error message
      if (apiResponse.message !== "SUCCESS" || apiResponse.errorMessage !== null) {
        throw new Error(apiResponse.errorMessage || 'API returned an unsuccessful response');
      }

      // Transform the data to match our frontend structure
      const transformedData = {
        transactions: {
          data: (apiResponse.data?.data || []).map((batch: any) => ({
            id: batch.batchJobId?.toString() || crypto.randomUUID(),
            hrpsDateTime: formatDateTime(batch.hrpsDateTime || ''),
            pickupDate: formatDateTime(batch.pickupDate || ''),
            xmlFileCount: batch.totalCSVFiles || 0,
            status: mapStatus(batch.status),
            actionTypes: [], // Add action types if available in the API response
          })),
          total: apiResponse.data?.totalPage * apiResponse.data?.dataPerPage || 0,
          page: (apiResponse.data?.currentPage || 1) - 1, // Convert to 0-based indexing for frontend
          limit: apiResponse.data?.dataPerPage || limit
        }
      };

      return NextResponse.json(transformedData);
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error) {
    console.error('Error fetching from HRPS API:', error);
    
    let errorMessage = 'Failed to fetch data from HRPS API';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout - HRPS API took too long to respond';
        statusCode = 504;
      } else if (error.message.includes('API returned an unsuccessful response')) {
        errorMessage = error.message;
        statusCode = 502;
      } else if (error.message.includes('HRPS API error')) {
        errorMessage = error.message;
        statusCode = 502;
      }
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        timestamp: new Date().toISOString(),
        requestParams: {
          pageNumber: page,
          pageSize: limit,
          searchTerm: search,
          dateRangeFilter: dateRange,
          sortByColumn: sortColumn,
          sortByDirection: sortDirection
        }
      },
      { status: statusCode }
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

// Helper function to format date to yyyy/mm/dd hh:mm:ss
function formatDateTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
} 

