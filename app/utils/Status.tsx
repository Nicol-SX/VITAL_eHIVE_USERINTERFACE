export const getStatusStyle = (status: string): { bgColor: string; textColor: string; dotColor: string } => {
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

  
  // Update getStatusText function
  export const getStatusText = (status: string): string => {
    return status;
  };