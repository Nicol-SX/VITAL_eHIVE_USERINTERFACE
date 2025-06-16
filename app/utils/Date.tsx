 // Add helper function to convert date range to days
  export const getDateRangeDays = (dateRange: string): number => {
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

