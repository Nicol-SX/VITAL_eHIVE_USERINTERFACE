'use client';

import React from 'react';

interface StatusPopupProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * onSubmit will be called with two arguments:
   *   status: the status string (“Reviewed” or “Others”)
   *   comments: a string of the form "UserName (DD/MM/YYYY HH:MM:SS): actual comment text"
   */
  onSubmit: (status: string, comments?: string) => void;

  /**
   * The name of the user who is typing the comment.
   * e.g. "Joanne Mok"
   */
  userName: string;
}

export default function StatusPopup({
  isOpen,
  onClose,
  onSubmit,
  userName,
}: StatusPopupProps) {
  const [selectedStatus, setSelectedStatus] = React.useState('');
  const [comments, setComments] = React.useState('');

  if (!isOpen) return null;

  // Helper to format a Date object as "DD/MM/YYYY HH:MM:SS"
  const formatDateTime = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');

    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();

    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  const handleSubmit = () => {
    if (selectedStatus === 'Others' && comments.trim() !== '') {
      // Prepend the comment with "UserName (DD/MM/YYYY HH:MM:SS): "
      const now = new Date();
      const timestamp = formatDateTime(now);
      const fullComment = `${userName} (${timestamp}): ${comments.trim()}`;

      onSubmit(selectedStatus, fullComment);
    } else {
      // No comment required for "Reviewed", or empty comment if user didn't type anything
      onSubmit(selectedStatus, undefined);
    }

    // Reset local state
    setSelectedStatus('');
    setComments('');
  };

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
              placeholder="Type your comment here..."
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
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            disabled={!selectedStatus || (selectedStatus === 'Others' && comments.trim() === '')}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
