'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // adjust path as needed
import config from '../../common/config';
import toLocalISOString from '../../common/to-local-iso-string';
import { mockAttachments } from '../data/mockData';

interface MakeCommentProps {
  viewComment?: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (rawComment?: string) => void;
  attachmentId?: number;
}

export default function MakeComment({
  viewComment,
  isOpen,
  onClose,
  onSubmit,
  attachmentId
}: MakeCommentProps) {
  // Local state, only used in EDIT MODE:
  //const [selectedStatus, setSelectedStatus] = React.useState<'Reviewed' | 'Others' | ''>('');
  const [comments, setComments] = React.useState<string>('');

  const isViewMode = viewComment != null;

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!onSubmit) return;
    onSubmit(comments.trim());
    setComments('');
  };

  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-60 z-[1003] overflow-auto">
     
     {/* VIEW COMMENT */}
     <div className="bg-white rounded-lg p-6 w-full max-w-md">
        {isViewMode ? (
          // VIEW
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">View Comment</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-lg"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <div className="bg-gray-100 p-4 rounded-md text-gray-800 whitespace-pre-wrap">
              {mockAttachments.find(attachment => attachment.id === attachmentId)?.action.comment}
            </div>
          </>
        ) : (
          //make comment
          <>
            <div className="flex justify-end items-center mb-4">
              {/* <h2 className="text-xl font-semibold">Status Pop-Up</h2> */}
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-lg"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className="mb-4">
              <h3 className="font-medium mb-2">Make Comment</h3>
            </div>

            <div className="mb-4">
                {/* <label className="block font-medium mb-2">Comments</label> */}
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full border rounded-lg p-2 focus:outline-none focus:ring focus:border-blue-300"
                  rows={3}
                  placeholder="Type comment here..."
                />
            </div>

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
                  comments.trim() === ''
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
