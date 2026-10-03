'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, FileEdit, Clock, Trash2, Loader2 } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { formatDistanceToNow } from 'date-fns';
import { ProfileService } from '@/lib/services/profile-service';

interface DraftProfile {
  id: string;
  created_at: string;
  updated_at: string;
  gender?: string;
  personal_information?: {
    full_name?: string;
  } | {
    full_name?: string;
  }[];
}

interface DraftsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DraftsDialog({ isOpen, onClose }: DraftsDialogProps) {
  const [drafts, setDrafts] = useState<DraftProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [draftToDelete, setDraftToDelete] = useState<DraftProfile | null>(null);
  const [deleteInput, setDeleteInput] = useState('');
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (isOpen) {
      fetchDrafts();
    }
  }, [isOpen]);

  const fetchDrafts = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, 
          created_at, 
          updated_at,
          gender,
          personal_information(full_name)
        `)
        .eq('status', 'DRAFT')
        .eq('created_by', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }
      setDrafts(data || []);
    } catch (err) {
      console.error('Error fetching drafts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResume = (id: string) => {
    onClose();
    router.push(`/add-profile?draftId=${id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, draft: DraftProfile) => {
    e.stopPropagation();
    setDraftToDelete(draft);
    setDeleteInput('');
  };

  const confirmDelete = async () => {
    if (!draftToDelete) return;
    if (deleteInput.toLowerCase() !== 'delete') return;
    
    setDeletingId(draftToDelete.id);
    try {
      await ProfileService.deleteProfile(draftToDelete.id);
      setDrafts(prev => prev.filter(d => d.id !== draftToDelete.id));
      setDraftToDelete(null);
    } catch (err) {
      console.error('Error deleting draft:', err);
      alert('Failed to delete draft');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-[#4E473D] flex items-center gap-2">
            <FileEdit size={18} className="text-[#064e3b]" />
            Saved Drafts
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-2 sm:p-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#064e3b]"></div>
            </div>
          ) : drafts.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              <p>No drafts found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {drafts.map((draft) => {
                const pi = draft.personal_information;
                const info = (Array.isArray(pi) ? pi[0] : pi) || {};
                const name = info.full_name || 'Unknown Name';
                const gender = draft.gender || 'Unknown Gender';
                
                return (
                  <div 
                    key={draft.id}
                    onClick={() => handleResume(draft.id)}
                    className="p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-[#F4ECE1]/50 hover:border-[#D9CDB8] transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-[#4E473D] group-hover:text-[#064e3b] transition-colors">
                        {name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                          {gender}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteClick(e, draft)}
                          disabled={deletingId === draft.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                        >
                          {deletingId === draft.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Clock size={12} />
                      <span>Last updated {formatDistanceToNow(new Date(draft.updated_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {draftToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDraftToDelete(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 overflow-hidden">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Draft</h3>
            <p className="text-sm text-gray-600 mb-4">
              To confirm, type <strong>DELETE</strong> below to permanently delete the draft for <strong>{(Array.isArray(draftToDelete.personal_information) ? draftToDelete.personal_information[0]?.full_name : draftToDelete.personal_information?.full_name) || 'Unknown Name'}</strong>.
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="Type DELETE"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 mb-6"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDraftToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={deletingId === draftToDelete.id}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteInput.toLowerCase() !== 'delete' || deletingId === draftToDelete.id}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deletingId === draftToDelete.id && <Loader2 size={14} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
