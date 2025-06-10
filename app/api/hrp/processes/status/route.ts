import { NextRequest, NextResponse } from 'next/server';

const HRPS_API_BASE_URL = 'http://192.168.1.185/hrps-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { status, comment, type, dataID } = body;

    // Validate required fields
    if (status === undefined || dataID === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Prepare the request payload
    const payload = {
      status: status, // 0 for Reviewed, 1 for Others
      comment: comment || '',
      type: type || 1,
      dataID: dataID,
      insertDate: new Date().toISOString(),
      effectiveDate: new Date().toISOString(),
      updateDate: new Date().toISOString()
    };

    // Make API call to HRPS
    const response = await fetch(`${HRPS_API_BASE_URL}/HRP/Processes/Status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HRPS API error: ${response.status} - ${errorText || response.statusText}`);
    }

    const apiResponse = await response.json();

    // Check for API-level error message
    if (apiResponse.message !== "SUCCESS" || apiResponse.errorMessage !== null) {
      throw new Error(apiResponse.errorMessage || 'API returned an unsuccessful response');
    }

    return NextResponse.json(apiResponse);
  } catch (error) {
    console.error('Error updating process status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update process status', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 