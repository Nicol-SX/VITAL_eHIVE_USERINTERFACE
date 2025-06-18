import { NextRequest, NextResponse } from 'next/server';

const HRPS_API_BASE_URL = 'http://192.168.1.185/hrps-api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export const generateStaticParams = async () => {
  return [];
};

// Define response interface based on actual backend data
interface BatchRecord {
  batchJobId: number;
  hrpsDateTime: string;
  pickupDate: string;
  totalCSVFiles: number;
  status: string;
}

interface HRPSBatchApiResponse {
  message: string;
  errorMessage: string | null;
  data: {
    currentPage: number;
    totalPage: number;
    totalRecords: number;
    dataPerPage: number;
    data: BatchRecord[];
  };
}

export async function GET(request: NextRequest) {
  let page = 0;
  let limit = 9999;
  let search = '';
  let dateRange = 'Last 7 days';
  let sortColumn = 'hrpsDateTime';
  let sortDirection = 'desc';
  let batchJobId = '';

  try {
    const searchParams = request.nextUrl.searchParams;
    page = parseInt(searchParams.get('page') || '0');
    limit = parseInt(searchParams.get('limit') || '9999');
    search = searchParams.get('search') || '';
    dateRange = searchParams.get('dateRange') || 'Last 7 days';
    sortColumn = searchParams.get('sortColumn') || 'hrpsDateTime';
    sortDirection = searchParams.get('sortDirection') || 'desc';
    batchJobId = searchParams.get('BatchJobId') || '';

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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds

    try {
      const apiUrl = `${HRPS_API_BASE_URL}/HRP/Processes?DaysRange=${dateRange}${batchJobId ? `&BatchJobId=${batchJobId}` : ''}`;
      const response = await fetch(apiUrl, {
        headers: { 'Accept': 'application/json' }, // ✅ fixed from text/plain
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HRPS API error: ${response.status} - ${errorText || response.statusText}`);
      }

      const apiResponse: HRPSBatchApiResponse = await response.json();

      if (apiResponse.message !== 'SUCCESS' || apiResponse.errorMessage !== null) {
        throw new Error(apiResponse.errorMessage || 'API returned an unsuccessful response');
      }

      const transformedData = {
        transactions: {
          data: apiResponse.data.data.map((batch) => ({
            id: batch.batchJobId?.toString() || crypto.randomUUID(),
            hrpsDateTime: formatDateTime(batch.hrpsDateTime),
            pickupDate: formatDateTime(batch.pickupDate),
            xmlFileCount: batch.totalCSVFiles,
            status: mapStatus(batch.status),
            actionTypes: [] // Extend this if backend includes it
          })),
          total: apiResponse.data.totalRecords,
          page: (apiResponse.data.currentPage || 1) - 1, 
          limit: apiResponse.data.dataPerPage
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

    return NextResponse.json({
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
    }, { status: statusCode });
  }
}

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

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
