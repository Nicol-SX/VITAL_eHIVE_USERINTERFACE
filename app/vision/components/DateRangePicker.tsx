'use client';

import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';

type Props = {
  onDateChange?: (dates: { startDate: string | null; endDate: string | null }) => void;
};

const DateRangePicker: React.FC<Props> = ({ onDateChange }) => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const emitChange = (start: Date | null, end: Date | null) => {
    if (onDateChange) {
      onDateChange({
        startDate: start ? format(start, 'yyyy-MM-dd') : null,
        endDate: end ? format(end, 'yyyy-MM-dd') : null,
      });
    }
  };

  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date);
    if (date && endDate && endDate < date) {
      setEndDate(null);
    }
    emitChange(date, endDate);
  };

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
    emitChange(startDate, date);
  };

  const clearDates = () => {
    setStartDate(null);
    setEndDate(null);
    emitChange(null, null);
  };

  return (
    <div className="flex gap-4 p-4 bg-white rounded-lg w-full items-center">
      <div className="flex justify-between items-center">
        <label className="mb-1 text-sm font-medium text-gray-700 pr-2">Start Date</label>
        <div className="relative flex-1 sm:flex-none">
        <DatePicker
          selected={startDate}
          onChange={handleStartDateChange}
          dateFormat="dd/MM/yyyy"
          placeholderText="Select start date"
          maxDate={endDate || undefined}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {startDate && (
          <button
          onClick={() => handleStartDateChange(null)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label="Clear start date"
      >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
        </div>

        
      </div>
      <div className="flex justify-between items-center">
        <label className="mb-1 text-sm font-medium text-gray-700 pr-2">End Date</label>
        <div className="relative flex-1 sm:flex-none">

        
        <DatePicker
          selected={endDate}
          onChange={handleEndDateChange}
          dateFormat="dd/MM/yyyy"
          placeholderText="Select end date"
          minDate={startDate || undefined}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {endDate && (
          <button
          onClick={() => handleEndDateChange(null)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label="Clear end date"
      >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        </div>
      </div>
      <div className="flex justify-between items-center">
      <button
        onClick={clearDates}
        className="self-start px-4 py-2 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 flex items-center justify-center rounded-md"
      >
        Clear Filter
      </button>
      </div>
      
    </div>
  );
};

export default DateRangePicker;
