'use client';

import React from 'react';

interface StatusPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (status: string, comments?: string) => void;
}

export default function StatusPopup({ isOpen, onClose, onSubmit }: StatusPopupProps) {
  const [selectedStatus, setSelectedStatus] = React.useState('');
  const [comments, setComments] = React.useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-xl font-semibold mb-4">Status Pop Up</h2>
        
        <div className="mb-4">
          <h3 className="font-medium mb-2">Select Status</h3>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="status"
                value="Reviewed"
                checked={selectedStatus === 'Reviewed'}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="form-radio"
              />
              <span>Reviewed</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="status"
                value="Others"
                checked={selectedStatus === 'Others'}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="form-radio"
              />
              <span>Others</span>
            </label>
          </div>
        </div>

        {selectedStatus === 'Others' && (
          <div className="mb-4">
            <label className="block font-medium mb-2">Comments</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full border rounded-lg p-2"
              rows={3}
            />
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(selectedStatus, comments)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
} 