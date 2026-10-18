'use client';

import React, { useState } from 'react';
import { Trash2, AlertTriangle, Loader2, X } from 'lucide-react';
import { deleteProfileViaRpc } from '@/lib/actions/profiles';

interface DeleteProfileDialogProps {
  isOpen: boolean;
  profileId: string;
  profileName: string;
  cnic?: string;
  onClose: () => void;
  onSuccess: () => void;
  onToast: (msg: string) => void;
}

export default function DeleteProfileDialog({
  isOpen,
  profileId,
  profileName,
  cnic,
  onClose,
  onSuccess,
  onToast,
}: DeleteProfileDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isConfirmed = confirmText.trim().toLowerCase() === 'delete';

  const handleDelete = async () => {
    if (!isConfirmed || isDeleting) return;

    setIsDeleting(true);
    try {
      // Execute deletion via PostgreSQL RPC
      const rpcResult = await deleteProfileViaRpc(profileId);

      if (!rpcResult.success) {
        throw new Error(rpcResult.error || 'Failed to delete profile');
      }

      onToast('Profile and all associated data permanently deleted.');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error deleting profile:', err);
      const msg = err.message || 'An unexpected error occurred';
      setError(msg);
      onToast(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (isDeleting) return;
    setConfirmText('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={handleClose} 
      />

      {/* Modal Dialog Card */}
      <div 
        className="relative bg-white w-full max-w-md rounded-[28px] shadow-[0_24px_64px_rgba(0,0,0,0.22)] border border-black/[0.08] p-6 md:p-7 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          disabled={isDeleting}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-50"
        >
          <X size={16} />
        </button>

        {/* Header Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0">
            <Trash2 size={22} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-[11px] font-bold uppercase tracking-wider mb-0.5">
              <span>Stage: New Data</span>
            </div>
            <h3 className="text-[19px] font-bold text-gray-900 leading-tight">
              Delete Profile
            </h3>
          </div>
        </div>

        {/* Warning & Target Details */}
        <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-3.5 mb-4 text-[13px] text-amber-900/90 flex gap-2.5 items-start">
          <AlertTriangle size={17} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-snug">
            <span className="font-semibold">Irreversible Action:</span> Deleting{' '}
            <strong className="text-gray-900">{profileName}</strong>
            {cnic ? ` (CNIC: ${cnic})` : ''} will permanently remove all personal information, physical details, education, family records, and partner preferences from the system.
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Confirmation Input Prompt */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-700 mb-2">
            To confirm deletion, type <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-red-600 font-bold">delete</span> below:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            disabled={isDeleting}
            placeholder='Type "delete" to confirm'
            autoFocus
            className="w-full h-[42px] px-3.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 placeholder:text-gray-400 transition-all"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            className="h-[38px] px-5 rounded-full text-[13px] font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
            className={`h-[38px] px-5 rounded-full text-[13px] font-semibold text-white flex items-center gap-2 shadow-sm transition-all duration-200 ${
              isConfirmed && !isDeleting
                ? 'bg-red-600 hover:bg-red-700 hover:shadow-md cursor-pointer'
                : 'bg-red-300 cursor-not-allowed opacity-60'
            }`}
          >
            {isDeleting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 size={15} />
                <span>Permanently Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
