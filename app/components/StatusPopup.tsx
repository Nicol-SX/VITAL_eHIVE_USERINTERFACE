'use client';

import React from 'react';

interface StatusPopupProps {
  viewComment?: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (status: 'Reviewed' | 'Others', rawComment?: string) => void;
}

export default function StatusPopup({
  viewComment,
  isOpen,
  onClose,
  onSubmit,
}: StatusPopupProps) {
  // Local state, only used in EDIT MODE:
  const [selectedStatus, setSelectedStatus] = React.useState<'Reviewed' | 'Others' | ''>('');
  const [comments, setComments] = React.useState<string>('');

  const isViewMode = viewComment != null;

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!onSubmit) return;
    if (selectedStatus === 'Others') {
      onSubmit('Others', comments.trim());
    } else {
      onSubmit('Reviewed', undefined);
    }
    setSelectedStatus('Reviewed');
    setComments('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-60 z-50 overflow-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        {isViewMode ? (
          // VIEW
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Comment</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-lg"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <div className="bg-gray-100 p-4 rounded-md text-gray-800 whitespace-pre-wrap">
              {viewComment}
            </div>
          </>
        ) : (
          // EDIT 
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Status Pop-Up</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-lg"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className="mb-4">
              <h3 className="font-medium mb-2">Select Status</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="status"
                    value="Reviewed"
                    checked={selectedStatus === 'Reviewed'}
                    onChange={() => setSelectedStatus('Reviewed')}
                    className="form-radio h-4 w-4"
                  />
                  <span>Reviewed</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="status"
                    value="Others"
                    checked={selectedStatus === 'Others'}
                    onChange={() => setSelectedStatus('Others')}
                    className="form-radio h-4 w-4"
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
                  className="w-full border rounded-lg p-2 focus:outline-none focus:ring focus:border-blue-300"
                  rows={3}
                  placeholder="Type comment here..."
                />
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                disabled={
                  selectedStatus === 'Others' && comments.trim() === ''
                }
              >
                Submit
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
